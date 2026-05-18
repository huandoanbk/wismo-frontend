import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const VALID_LOCALES = ['en', 'fi'] as const
type Locale = (typeof VALID_LOCALES)[number]

function isValidLocale(value: string): value is Locale {
  return (VALID_LOCALES as readonly string[]).includes(value)
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get('WISMO_LOCALE')?.value ?? ''
  const locale: Locale = isValidLocale(cookieValue) ? cookieValue : 'en'

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
