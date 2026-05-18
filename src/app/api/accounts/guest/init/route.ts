import { NextRequest, NextResponse } from 'next/server'
import { csrfToken, forwardSetCookies } from '@/lib/bff'

const BACKEND_URL = process.env.BACKEND_URL

/**
 * BFF proxy for POST /api/accounts/guest/init/
 * Forwards browser cookies to backend and relays Set-Cookie back to browser
 * so the wismo_guest HttpOnly cookie is set correctly.
 */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const backendRes = await fetch(`${BACKEND_URL}/api/accounts/guest/init/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'X-CSRFToken': csrfToken(cookieHeader),
    },
    body: '{}',
  })

  const data = await backendRes.json()
  const response = NextResponse.json(data, { status: backendRes.status })

  // Relay Set-Cookie so the browser receives the wismo_guest HttpOnly cookie
  forwardSetCookies(backendRes.headers, response.headers)

  return response
}
