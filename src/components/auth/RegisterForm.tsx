'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { RegisterRequest } from '@/types/api'
import { GoogleOAuthButton } from './GoogleOAuthButton'

interface RegisterFormProps {
  /** Called when user submits the form — page/hook handles the API call. */
  onSubmit: (req: RegisterRequest) => void
  isLoading: boolean
  error: string | null
  /** Forwarded to GoogleOAuthButton so the credential reaches the page's useAuth instance. */
  onGoogleCredential: (credential: string) => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Register form: full name (optional) + email + password + confirm password + Google login button.
 * Client-side validation: email format, password min 6 chars, password match.
 * Does not call API directly — delegates to onSubmit prop.
 */
export function RegisterForm({ onSubmit, isLoading, error, onGoogleCredential }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const t = useTranslations('auth')

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!EMAIL_REGEX.test(email)) {
      errors.email = t('error_email_invalid')
    }
    if (password.length < 6) {
      errors.password = t('error_password_too_short')
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = t('error_passwords_mismatch')
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      email,
      password,
      ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && error !== 'UNDER_18' && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded" role="alert">
          {t(error)}
        </p>
      )}

      <div>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('placeholder_display_name')}
          className="w-full border border-wismo-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wismo-primary focus:outline-none"
        />
      </div>

      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }))
          }}
          placeholder={t('placeholder_email')}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wismo-primary focus:outline-none ${fieldErrors.email ? 'border-red-400' : 'border-wismo-border'}`}
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }))
          }}
          placeholder={t('placeholder_password')}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wismo-primary focus:outline-none ${fieldErrors.password ? 'border-red-400' : 'border-wismo-border'}`}
        />
        {fieldErrors.password && (
          <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
          }}
          placeholder={t('placeholder_confirm_password')}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wismo-primary focus:outline-none ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-wismo-border'}`}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-wismo-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-wismo-primary-hover disabled:opacity-50"
      >
        {isLoading ? t('register_loading') : t('register_submit')}
      </button>

      <div className="relative text-center text-xs text-wismo-text-muted py-1">
        <span>{t('or_separator')}</span>
      </div>

      <GoogleOAuthButton onCredential={onGoogleCredential} label={t('login_google')} />
    </form>
  )
}
