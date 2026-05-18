'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { GoogleOneTap } from '@/components/auth/GoogleOneTap'
import { useAuth } from '@/hooks/useAuth'
import { withQueryParams } from '@/lib/authRoute'

/**
 * /register route.
 * Navigates to /verify-email after successful registration.
 * One Tap handles the case where user already has a Google session — redirects to /chat.
 */
export default function RegisterPage() {
  const router = useRouter()
  const { user, sessionState, consentState, isLoading, isLoadingSession, error, registrationEmail, register, googleLogin } = useAuth()

  useEffect(() => {
    if (registrationEmail) {
      router.replace(withQueryParams('/verify-email', { email: registrationEmail }))
    }
  }, [registrationEmail, router])

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
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-wismo-border p-6">
        <RegisterForm onSubmit={register} isLoading={isLoading} error={error} onGoogleCredential={googleLogin} />
      </div>
      {!user && !isLoadingSession && (
        <GoogleOneTap onCredential={googleLogin} />
      )}
    </div>
  )
}
