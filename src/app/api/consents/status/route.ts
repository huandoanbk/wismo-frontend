import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL

/** BFF proxy for GET /api/consents/status/ */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const backendRes = await fetch(`${BACKEND_URL}/api/consents/status/`, {
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  })

  const data = await backendRes.json()
  return NextResponse.json(data, { status: backendRes.status })
}
