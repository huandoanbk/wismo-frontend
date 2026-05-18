import { NextRequest, NextResponse } from 'next/server'
import { csrfToken, forwardSetCookies } from '@/lib/bff'

const beUrl = () => process.env.BACKEND_URL

/**
 * BFF proxy for POST /api/chat/message/.
 *
 * Gate errors (4xx/5xx before stream opens) are returned as JSON.
 * On gate pass, backend returns 200 text/event-stream — the response body
 * is piped directly to the browser. No buffering.
 *
 * FE must read via fetch() + res.body.getReader(), not EventSource.
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const cookieHeader = req.headers.get('cookie') ?? ''

  const beRes = await fetch(`${beUrl()}/api/chat/message/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'X-CSRFToken': csrfToken(cookieHeader),
    },
    body,
  })

  // Gate error — return JSON as-is
  if (!beRes.ok) {
    const data = await beRes.text()
    return new NextResponse(data, {
      status: beRes.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Gate pass — pipe SSE stream through
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  })

  // Backend may clear wismo_guest cookie via max-age=0 in SSE response headers
  forwardSetCookies(beRes.headers, headers)

  return new NextResponse(beRes.body, { status: 200, headers })
}
