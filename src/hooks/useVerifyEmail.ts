import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { VerifyEmailRequest, VerifyEmailResponse, ResendOtpResponse } from '@/types/api'

export type VerifyError =
  | 'invalid_otp'
  | 'otp_expired'
  | 'user_not_found'
  | 'email_already_verified'
  | 'otp_resend_cooldown'
  | 'otp_resend_limit_exceeded'
  | 'generic'

interface UseVerifyEmailReturn {
  isVerifying: boolean
  isResending: boolean
  /** null when no error. */
  error: VerifyError | null
  /** True after successful resend. Cleared on next verify or resend attempt. */
  resendSuccess: boolean
  /** True after successful OTP verification. Page should navigate to /login. */
  verified: boolean
  verifyEmail: (req: VerifyEmailRequest) => Promise<void>
  resendOtp: (email: string) => Promise<void>
}

async function readErrorCode(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return (body as { error?: string })?.error ?? ''
}

/**
 * Manages OTP verification state for the verify-email page.
 * Independent of useAuth — verify-email is a transient pre-session step.
 */
export function useVerifyEmail(): UseVerifyEmailReturn {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<VerifyError | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [verified, setVerified] = useState(false)

  const verifyEmail = useCallback(async (req: VerifyEmailRequest) => {
    setIsVerifying(true)
    setError(null)
    setResendSuccess(false)
    try {
      const res = await apiFetch('/api/accounts/verify-email', {
        method: 'POST',
        body: JSON.stringify(req),
      })

      if (res.ok) {
        const data: VerifyEmailResponse = await res.json()
        if (data.email_verified) setVerified(true)
        return
      }

      if (res.status === 400) {
        const code = await readErrorCode(res)
        setError(code === 'otp_expired' ? 'otp_expired' : 'invalid_otp')
        return
      }

      if (res.status === 404) {
        setError('user_not_found')
        return
      }

      setError('generic')
    } catch {
      setError('generic')
    } finally {
      setIsVerifying(false)
    }
  }, [])

  const resendOtp = useCallback(async (email: string) => {
    setIsResending(true)
    setError(null)
    setResendSuccess(false)
    try {
      const res = await apiFetch('/api/accounts/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        const _data: ResendOtpResponse = await res.json()
        setResendSuccess(true)
        return
      }

      const code = await readErrorCode(res)
      if (res.status === 404) {
        setError('user_not_found')
      } else if (res.status === 409 && code === 'email_already_verified') {
        setError('email_already_verified')
      } else if (res.status === 429 && code === 'otp_resend_limit_exceeded') {
        setError('otp_resend_limit_exceeded')
      } else if (res.status === 429) {
        setError('otp_resend_cooldown')
      } else {
        setError('generic')
      }
    } catch {
      setError('generic')
    } finally {
      setIsResending(false)
    }
  }, [])

  return { isVerifying, isResending, error, resendSuccess, verified, verifyEmail, resendOtp }
}
