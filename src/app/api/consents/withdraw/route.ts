import { NextRequest, NextResponse } from 'next/server'
import { csrfToken } from '@/lib/bff'

const BACKEND_URL = process.env.BACKEND_URL

/** BFF proxy for POST /api/consents/withdraw/ */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const backendRes = await fetch(`${BACKEND_URL}/api/consents/withdraw/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'X-CSRFToken': csrfToken(cookieHeader),
    },
    body: '{}',
  })

  const data = await backendRes.json()
  return NextResponse.json(data, { status: backendRes.status })
}
