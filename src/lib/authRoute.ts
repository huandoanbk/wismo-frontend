/**
 * Append query params to a relative route while preserving any existing query string.
 * Falsy values are skipped so callers can pass optional fields directly.
 */
export function withQueryParams(
  path: string,
  params: Record<string, string | null | undefined>,
): string {
  const [pathname, rawQuery = ''] = path.split('?')
  const searchParams = new URLSearchParams(rawQuery)

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value)
    }
  }

  const query = searchParams.toString()
  return query ? `${pathname}?${query}` : pathname
}


