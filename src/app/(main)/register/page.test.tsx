import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterPage from './page'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    sessionUser: null,
    sessionState: 'unauthenticated',
    consentState: 'unknown',
    isLoading: false,
    isLoadingSession: false,
    error: null,
    registrationEmail: 'new@b.com',
    register: vi.fn(),
    logout: vi.fn(),
    initGuest: vi.fn(),
    googleLogin: vi.fn(),
    login: vi.fn(),
  }),
}))

vi.mock('@/components/auth/RegisterForm', () => ({
  RegisterForm: () => <div data-testid="register-form" />,
}))

vi.mock('@/components/auth/GoogleOneTap', () => ({
  GoogleOneTap: () => null,
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to verify-email with email after registration', async () => {
    render(<RegisterPage />)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/verify-email?email=new%40b.com')
    })
  })
})
