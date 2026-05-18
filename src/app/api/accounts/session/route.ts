import { NextRequest, NextResponse } from 'next/server'
import { forwardSetCookies } from '@/lib/bff'

const BACKEND_URL = process.env.BACKEND_URL

/** BFF proxy for GET /api/accounts/session/ — returns canonical session/consent state.
 * When the backend returns session_expired, clears the stale session cookies so the
 * next visit starts unauthenticated (no redundant logout round-trip needed). */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const backendRes = await fetch(`${BACKEND_URL}/api/accounts/session/`, {
    method: 'GET',
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  })

  const data = await backendRes.json()
  const response = NextResponse.json(data, { status: backendRes.status })

  // Forward any Set-Cookie the backend sends
  forwardSetCookies(backendRes.headers, response.headers)

  // Clear stale session cookies so next request arrives unauthenticated
  if (data.session_state === 'session_expired') {
    response.headers.append('set-cookie', 'sessionid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax')
    response.headers.append('set-cookie', 'csrftoken=; Path=/; Max-Age=0; SameSite=Lax')
  }

  return response
}
