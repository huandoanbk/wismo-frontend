import { NextRequest, NextResponse } from 'next/server'
import { csrfToken } from '@/lib/bff'

const BACKEND_URL = process.env.BACKEND_URL

/** BFF proxy for GET /api/accounts/me/ — returns profile for registered user. */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const backendRes = await fetch(`${BACKEND_URL}/api/accounts/me/`, {
    headers: { Cookie: cookieHeader },
  })

  const data = await backendRes.json()
  return NextResponse.json(data, { status: backendRes.status })
}

/** BFF proxy for PATCH /api/accounts/me/ — updates display_name. */
export async function PATCH(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const body = await request.text()

  const backendRes = await fetch(`${BACKEND_URL}/api/accounts/me/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'X-CSRFToken': csrfToken(cookieHeader),
    },
    body,
  })

  const data = await backendRes.json()
  return NextResponse.json(data, { status: backendRes.status })
}
