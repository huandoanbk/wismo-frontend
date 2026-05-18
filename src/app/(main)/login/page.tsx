'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LoginForm } from '@/components/auth/LoginForm'
import { GoogleOneTap } from '@/components/auth/GoogleOneTap'
import { useAuth } from '@/hooks/useAuth'
import { withQueryParams } from '@/lib/authRoute'

/**
 * /login route. Redirects to /chat after successful login.
 * Accepts ?reason=session_expired to show a session-expiry notice.
 */
function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')
  const { user, sessionState, consentState, isLoading, isLoadingSession, error, login, googleLogin } = useAuth()

  const reason = searchParams.get('reason')

  useEffect(() => {
    if (sessionState !== 'registered') return

    if (consentState === 'accepted' || user) {
      router.replace('/chat')
      return
    }

    if (consentState === 'required') {
      router.replace(withQueryParams('/consent', { mode: 'reconsent' }))
    }
  }, [consentState, router, sessionState, user])

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-3">
        {reason === 'session_expired' && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{t('session_expired_banner')}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-wismo-border p-6">
          <LoginForm onSubmit={login} isLoading={isLoading} error={error} onGoogleCredential={googleLogin} />
        </div>
      </div>

      {!user && !isLoadingSession && (
        <GoogleOneTap onCredential={googleLogin} />
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
