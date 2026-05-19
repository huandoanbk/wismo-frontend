import { render, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from './page'

const { replace, searchParamsRef, mockLogin, mockGoogleLogin, loginFormPropsRef, oneTapPropsRef } = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParamsRef: { value: new URLSearchParams() },
  mockLogin: vi.fn(),
  mockGoogleLogin: vi.fn(),
  loginFormPropsRef: { current: null as Record<string, unknown> | null },
  oneTapPropsRef: { current: null as Record<string, unknown> | null },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({
    get: (key: string) => searchParamsRef.value.get(key),
  }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    sessionUser: { id: 'u1', email: 'a@b.com', display_name: '', email_verified: true },
    sessionState: 'registered',
    consentState: 'required',
    isLoading: false,
    isLoadingSession: false,
    error: null,
    registrationEmail: null,
    login: mockLogin,
    logout: vi.fn(),
    initGuest: vi.fn(),
    googleLogin: mockGoogleLogin,
  }),
}))

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: (props: Record<string, unknown>) => {
    loginFormPropsRef.current = props
    return <div data-testid="login-form" />
  },
}))

vi.mock('@/components/auth/GoogleOneTap', () => ({
  GoogleOneTap: (props: Record<string, unknown>) => {
    oneTapPropsRef.current = props
    return null
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchParamsRef.value = new URLSearchParams()
    loginFormPropsRef.current = null
    oneTapPropsRef.current = null
  })

  it('redirects to re-consent when session is registered and consent is required', async () => {
    render(<LoginPage />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/consent?mode=reconsent'))
  })

  it('passes attach_chat_id from query to password login submit', async () => {
    searchParamsRef.value = new URLSearchParams('attach_chat_id=chat-123')
    render(<LoginPage />)

    const onSubmit = loginFormPropsRef.current?.onSubmit as ((req: { email: string; password: string }) => void)
    expect(onSubmit).toBeTruthy()

    await act(async () => {
      onSubmit({ email: 'a@b.com', password: 'secret' })
    })

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
      attach_chat_id: 'chat-123',
    })
  })

  it('passes attach_chat_id from query to google login submit', async () => {
    searchParamsRef.value = new URLSearchParams('attach_chat_id=chat-456')
    render(<LoginPage />)

    const onGoogleCredential = loginFormPropsRef.current?.onGoogleCredential as ((credential: string) => void)
    expect(onGoogleCredential).toBeTruthy()

    await act(async () => {
      onGoogleCredential('google-cred')
    })

    expect(mockGoogleLogin).toHaveBeenCalledWith('google-cred', 'chat-456')
  })

  it('passes attach_chat_id from query to Google One Tap submit', async () => {
    searchParamsRef.value = new URLSearchParams('attach_chat_id=chat-789')
    render(<LoginPage />)

    const onCredential = oneTapPropsRef.current?.onCredential as ((credential: string) => void)
    expect(onCredential).toBeTruthy()

    await act(async () => {
      onCredential('one-tap-cred')
    })

    expect(mockGoogleLogin).toHaveBeenCalledWith('one-tap-cred', 'chat-789')
  })
})
