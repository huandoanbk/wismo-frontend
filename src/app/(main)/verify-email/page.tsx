'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useVerifyEmail } from '@/hooks/useVerifyEmail'
export default function VerifyEmailPage() {
  const t = useTranslations('verify_email')
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [otp, setOtp] = useState('')
  const { isVerifying, isResending, error, resendSuccess, verified, verifyEmail, resendOtp } =
    useVerifyEmail()

  // Navigate to /login after successful verification — BE auto-attaches guest chat via cookie.
  useEffect(() => {
    if (verified) {
      router.push('/login')
    }
  }, [router, verified])

  function handleOtpChange(value: string) {
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value)
    }
  }

  function handleVerify() {
    if (otp.length !== 6) return
    verifyEmail({ email, otp })
  }

  function handleResend() {
    resendOtp(email)
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-wismo-border p-6">
        <h1 className="text-xl font-bold text-wismo-text mb-2">{t('title')}</h1>
        <p className="text-sm text-wismo-text-muted mb-6">{t('sent_to')}</p>

        {/* OTP input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-wismo-text mb-2">
            {t('input_label')}
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder={t('input_placeholder')}
            value={otp}
            onChange={e => handleOtpChange(e.target.value)}
            className="w-full border border-wismo-border rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-wismo-text placeholder:text-wismo-text-light focus:outline-none focus:ring-2 focus:ring-wismo-primary/30 focus:border-wismo-primary"
          />
        </div>

        {/* Error messages — error codes map directly to verify_email i18n keys */}
        {error && (
          <p className="text-sm text-wismo-crisis mb-3">{t(error)}</p>
        )}
        {resendSuccess && (
          <p className="text-sm text-wismo-primary mb-3">{t('resend_success')}</p>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={otp.length !== 6 || isVerifying || isResending}
          className="w-full bg-wismo-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-wismo-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-3"
        >
          {isVerifying ? t('verifying') : t('verify')}
        </button>

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={isVerifying || isResending}
          className="w-full text-sm text-wismo-text-muted hover:text-wismo-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isResending ? t('resending') : t('resend')}
        </button>
      </div>
    </div>
  )
}
