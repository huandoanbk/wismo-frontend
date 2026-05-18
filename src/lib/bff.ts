/**
 * Extract the csrftoken cookie value from a Cookie header string.
 * Django's SessionAuthentication enforces CSRF for authenticated POST requests —
 * the BFF must forward it as X-CSRFToken when proxying mutating requests.
 */
export function csrfToken(cookieHeader: string | null): string {
  if (!cookieHeader) return ''
  const match = cookieHeader.match(/(?:^|;\s*)csrftoken=([^;]+)/)
  return match ? (match[1] ?? '') : ''
}

/**
 * Relay all Set-Cookie headers from an upstream response to a downstream response.
 * Uses getSetCookie() when available to preserve multiple cookies correctly.
 */
export function forwardSetCookies(sourceHeaders: Headers, targetHeaders: Headers): void {
  const headersWithGetSetCookie = sourceHeaders as Headers & { getSetCookie?: () => string[] }
  const cookies = headersWithGetSetCookie.getSetCookie?.()
  if (cookies && cookies.length > 0) {
    for (const cookie of cookies) {
      targetHeaders.append('set-cookie', cookie)
    }
    return
  }

  const single = sourceHeaders.get('set-cookie')
  if (single) {
    targetHeaders.append('set-cookie', single)
  }
}
