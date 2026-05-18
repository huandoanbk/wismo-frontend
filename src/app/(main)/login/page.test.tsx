import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from './page'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => null }),
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
    login: vi.fn(),
    logout: vi.fn(),
    initGuest: vi.fn(),
    googleLogin: vi.fn(),
  }),
}))

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form" />,
}))

vi.mock('@/components/auth/GoogleOneTap', () => ({
  GoogleOneTap: () => null,
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to re-consent when session is registered and consent is required', async () => {
    render(<LoginPage />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/consent?mode=reconsent'))
  })
})
