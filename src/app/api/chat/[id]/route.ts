import { NextRequest, NextResponse } from 'next/server'
import { csrfToken } from '@/lib/bff'

/** Get chat detail + ordered turns for a given chat_id. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const res = await fetch(`${process.env.BACKEND_URL}/api/chat/${id}/`, {
    headers: { Cookie: req.headers.get('cookie') ?? '' },
  })
  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Soft-delete (archive) a chat. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const cookieHeader = req.headers.get('cookie') ?? ''
  const res = await fetch(`${process.env.BACKEND_URL}/api/chat/${id}/`, {
    method: 'DELETE',
    headers: {
      Cookie: cookieHeader,
      'X-CSRFToken': csrfToken(cookieHeader),
    },
  })
  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
