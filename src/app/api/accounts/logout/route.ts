import { NextRequest, NextResponse } from 'next/server'
import { csrfToken, forwardSetCookies } from '@/lib/bff'

const BACKEND_URL = process.env.BACKEND_URL

/** BFF proxy for POST /api/accounts/logout/ — relays Set-Cookie (clear session) back to browser. */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const backendRes = await fetch(`${BACKEND_URL}/api/accounts/logout/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'X-CSRFToken': csrfToken(cookieHeader),
    },
  })

  const data = await backendRes.json()
  const response = NextResponse.json(data, { status: backendRes.status })

  forwardSetCookies(backendRes.headers, response.headers)

  return response
}
