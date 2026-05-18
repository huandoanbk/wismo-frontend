import { NextRequest, NextResponse } from 'next/server'
import { csrfToken } from '@/lib/bff'

const BACKEND_URL = process.env.BACKEND_URL

/** BFF proxy for POST /api/accounts/contact/ — public, no auth required.
 * Relays name/email/subject/message to backend which sends email to admin. */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'validation_error', fields: {} }, { status: 400 })
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/accounts/contact/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      'X-CSRFToken': csrfToken(cookieHeader),
    },
    body: JSON.stringify(body),
  })

  const data = await backendRes.json()
  return NextResponse.json(data, { status: backendRes.status })
}
