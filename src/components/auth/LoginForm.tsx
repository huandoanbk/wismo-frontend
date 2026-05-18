'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { LoginRequest } from '@/types/api'
import { GoogleOAuthButton } from './GoogleOAuthButton'

interface LoginFormProps {
  /** Called when user submits the form — page/hook handles the API call. */
  onSubmit: (req: LoginRequest) => void
  isLoading: boolean
  error: string | null
  /** Forwarded to GoogleOAuthButton so the credential reaches the page's useAuth instance. */
  onGoogleCredential: (credential: string) => void
}

/**
 * Login form: email + password + Google OAuth button.
 * Does not call API directly — delegates to onSubmit prop.
 * All text via i18n.
 */
export function LoginForm({ onSubmit, isLoading, error, onGoogleCredential }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const t = useTranslations('auth')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    onSubmit({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && error !== 'UNDER_18' && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded" role="alert">
          {t(error)}
        </p>
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('placeholder_email')}
        required
        className="w-full border border-wismo-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wismo-primary focus:outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('placeholder_password')}
        required
        className="w-full border border-wismo-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wismo-primary focus:outline-none"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-wismo-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-wismo-primary-hover disabled:opacity-50"
      >
        {isLoading ? t('login_loading') : t('login_submit')}
      </button>

      <div className="relative text-center text-xs text-wismo-text-muted py-1">
        <span>{t('or_separator')}</span>
      </div>

      <GoogleOAuthButton onCredential={onGoogleCredential} label={t('login_google')} />
    </form>
  )
}
