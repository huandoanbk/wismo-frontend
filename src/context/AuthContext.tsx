'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import type { ConsentState, GoogleLoginRequest, GuestInitResponse, LoginRequest, RegisterRequest, SessionResponse, SessionUser, UserProfile } from '@/types/api'

interface AuthContextValue {
  user: UserProfile | null
  sessionUser: SessionUser | null
  sessionState: SessionResponse['session_state']
  consentState: ConsentState
  isLoading: boolean
  isLoadingSession: boolean
  error: string | null
  registrationEmail: string | null
  login: (req: LoginRequest) => Promise<void>
  register: (req: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  initGuest: () => Promise<void>
  googleLogin: (credential: string, attachChatId?: string | null) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [sessionState, setSessionState] = useState<SessionResponse['session_state']>('unauthenticated')
  const [consentState, setConsentState] = useState<ConsentState>('unknown')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registrationEmail, setRegistrationEmail] = useState<string | null>(null)

  const readErrorCode = useCallback(async (res: Response): Promise<string | null> => {
    try {
      const body = await res.json() as { error?: string }
      return typeof body.error === 'string' ? body.error : null
    } catch {
      return null
    }
  }, [])

  const applySessionResponse = useCallback((data: SessionResponse) => {
    setSessionState(data.session_state)
    setConsentState(data.consent_state)
    setSessionUser(data.user ?? null)

    if (data.session_state === 'guest' && data.guest) {
      setUser({ user_id: data.guest.id, language: 'en', is_guest: true })
      return
    }

    if (data.session_state === 'registered' && data.consent_state === 'accepted' && data.user) {
      setUser({
        user_id: data.user.email,
        email: data.user.email,
        display_name: data.user.display_name || undefined,
        language: 'en',
        is_guest: false,
      })
      return
    }

    setUser(null)
  }, [])

  // Restore session once on mount — single source of truth for auth state.
  useEffect(() => {
    let cancelled = false
    apiFetch('/api/accounts/session')
      .then(async res => {
        if (cancelled) return
        if (!res.ok) return
        const data: SessionResponse = await res.json()
        applySessionResponse(data)
        // Session expired — BFF already cleared the cookie in the response headers.
        // Redirect to login with reason flag for the notification banner.
        if (data.session_state === 'session_expired' && window.location.pathname !== '/login') {
          window.location.href = '/login?reason=session_expired'
        }
      })
      .catch(() => {
        // Session check failure is non-fatal — treat as unauthenticated.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSession(false)
      })
    return () => { cancelled = true }
  }, [applySessionResponse])

  const login = useCallback(async (req: LoginRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/accounts/login', {
        method: 'POST',
        body: JSON.stringify(req),
      })
      if (!res.ok) {
        const code = await readErrorCode(res)
        if (code === 'invalid_request' || code === 'invalid_credentials' || code === 'email_verification_required') {
          setError(code)
          return
        }
        if (res.status === 401) { setError('invalid_credentials'); return }
        if (res.status === 403) { setError('email_verification_required'); return }
        if (res.status === 400) { setError('invalid_request'); return }
      }
      if (!res.ok) { setError('generic'); return }
      const data: SessionResponse = await res.json()
      applySessionResponse(data)
    } catch {
      setError('generic')
    } finally {
      setIsLoading(false)
    }
  }, [applySessionResponse, readErrorCode])

  const register = useCallback(async (req: RegisterRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/accounts/register', {
        method: 'POST',
        body: JSON.stringify(req),
      })
      if (res.status === 400) {
        let code = 'invalid_request'
        try {
          const body = await res.json()
          code = (body as { error?: string })?.error ?? 'invalid_request'
        } catch { /* body not parseable — use fallback */ }
        setError(code)
        return
      }
      if (res.status === 409) { setError('email_already_registered'); return }
      if (res.status === 429) {
        const body = await res.json().catch(() => ({}))
        const code = (body as { error?: string })?.error ?? ''
        setError(code === 'otp_resend_limit_exceeded' ? 'otp_resend_limit_exceeded' : 'otp_resend_cooldown')
        return
      }
      if (!res.ok) { setError('generic'); return }
      setRegistrationEmail(req.email)
    } catch {
      setError('generic')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const initGuest = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiFetch('/api/accounts/guest/init', { method: 'POST' })
      if (!res.ok) return
      const data: GuestInitResponse = await res.json()
      applySessionResponse({
        session_state: data.session_state,
        identity_type: data.identity_type,
        guest: data.guest,
        consent_state: data.consent_state,
      })
    } finally {
      setIsLoading(false)
    }
  }, [applySessionResponse])

  const logout = useCallback(async () => {
    const res = await apiFetch('/api/accounts/logout', { method: 'POST' })
    if (res.ok) {
      const data: SessionResponse = await res.json()
      applySessionResponse(data)
    } else {
      setUser(null)
      setSessionUser(null)
      setSessionState('unauthenticated')
      setConsentState('unknown')
    }
    window.location.href = '/login'
  }, [applySessionResponse])

  const googleLogin = useCallback(async (credential: string, attachChatId?: string | null) => {
    setIsLoading(true)
    setError(null)
    try {
      const payload: GoogleLoginRequest = {
        credential,
        ...(attachChatId ? { attach_chat_id: attachChatId } : {}),
      }
      const res = await apiFetch('/api/accounts/google/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const code = await readErrorCode(res)
        if (
          code === 'invalid_request' ||
          code === 'invalid_credentials' ||
          code === 'google_account_conflict' ||
          code === 'google_auth_not_configured'
        ) {
          setError(code)
          return
        }
        setError('error_google_failed')
        return
      }
      const data: SessionResponse = await res.json()
      applySessionResponse(data)
    } catch {
      setError('error_google_failed')
    } finally {
      setIsLoading(false)
    }
  }, [applySessionResponse, readErrorCode])

  return (
    <AuthContext.Provider value={{
      user, sessionUser, sessionState, consentState, isLoading, isLoadingSession, error, registrationEmail,
      login, register, logout, initGuest, googleLogin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
