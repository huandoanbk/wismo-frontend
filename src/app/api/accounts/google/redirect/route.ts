import { NextResponse } from 'next/server'

/** Proxy the Google OAuth initiation redirect to the backend. */
export async function GET() {
  const backendUrl = process.env.BACKEND_URL
  return NextResponse.redirect(`${backendUrl}/api/accounts/google/redirect/`)
}
