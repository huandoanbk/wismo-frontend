import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'
import { GoogleScriptLoader } from '@/components/GoogleScriptLoader'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WISMO',
  description: 'AI Mental Health Companion',
}

const VALID_LOCALES = ['en', 'fi'] as const
type Locale = (typeof VALID_LOCALES)[number]

function isValidLocale(value: string): value is Locale {
  return (VALID_LOCALES as readonly string[]).includes(value)
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get('WISMO_LOCALE')?.value ?? ''
  const lang: Locale = isValidLocale(cookieValue) ? cookieValue : 'en'

  const messages = await getMessages()

  return (
    <html lang={lang}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && <GoogleScriptLoader />}
      </body>
    </html>
  )
}
