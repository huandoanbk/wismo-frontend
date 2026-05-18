import { NextRequest, NextResponse } from 'next/server'
import { csrfToken, forwardSetCookies } from '@/lib/bff'

const beUrl = () => process.env.BACKEND_URL

/** List chats for the current identity. */
export async function GET(req: NextRequest) {
  const res = await fetch(`${beUrl()}/api/chat/`, {
    headers: { Cookie: req.headers.get('cookie') ?? '' },
  })
  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Create a new chat shell, optionally with opening_input_text. */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const cookieHeader = req.headers.get('cookie') ?? ''
  const res = await fetch(`${beUrl()}/api/chat/`, {
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
