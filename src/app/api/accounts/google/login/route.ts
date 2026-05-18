import { NextRequest, NextResponse } from 'next/server'
import { csrfToken, forwardSetCookies } from '@/lib/bff'

/** Relay Google credential (ID token) to backend for server-side verification. */
export async function POST(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL
  const body = await req.text()
  const cookieHeader = req.headers.get('cookie') ?? ''

  const res = await fetch(`${backendUrl}/api/accounts/google/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'X-CSRFToken': csrfToken(cookieHeader),
    },
    body,
  })

  const data = await res.text()
  const response = new NextResponse(data, { status: res.status })
  response.headers.set('Content-Type', 'application/json')
  forwardSetCookies(res.headers, response.headers)
  return response
}
