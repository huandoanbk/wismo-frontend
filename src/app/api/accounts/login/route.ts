import { NextRequest, NextResponse } from 'next/server'
import { csrfToken, forwardSetCookies } from '@/lib/bff'

const BACKEND_URL = process.env.BACKEND_URL

/** BFF proxy for POST /api/accounts/login/ — relays Set-Cookie (session) back to browser. */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const body = await request.text()

  const backendRes = await fetch(`${BACKEND_URL}/api/accounts/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'X-CSRFToken': csrfToken(cookieHeader),
    },
    body,
  })

  const data = await backendRes.json()
  const response = NextResponse.json(data, { status: backendRes.status })

  // Relay session cookie set by backend
  forwardSetCookies(backendRes.headers, response.headers)

  return response
}
