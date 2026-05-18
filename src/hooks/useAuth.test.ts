import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from './useAuth'
import { AuthProvider } from '@/context/AuthContext'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '@/lib/api'
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

const registeredSessionRes = (consentState: 'accepted' | 'required') =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        session_state: 'registered',
        identity_type: 'user',
        user: { email: 'a@b.com', display_name: '', email_verified: true },
        consent_state: consentState,
      }),
  } as Response)

// Default session mock: unauthenticated (used by session restore useEffect)
const unauthenticatedSessionRes = () =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        session_state: 'unauthenticated',
        identity_type: 'none',
        consent_state: 'unknown',
      }),
  } as Response)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    href: '',
  } as Location)
})

describe('useAuth', () => {
  it('test_session_restore_sets_user_when_registered_and_accepted', async () => {
    mockApiFetch.mockImplementationOnce(() => registeredSessionRes('accepted'))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    expect(result.current.isLoadingSession).toBe(true)

    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    expect(result.current.user?.user_id).toBe('a@b.com')
    expect(result.current.user?.is_guest).toBe(false)
    expect(result.current.sessionState).toBe('registered')
    expect(result.current.consentState).toBe('accepted')
  })

  it('test_session_restore_redirects_to_login_when_session_expired', async () => {
    let capturedHref = ''
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      set href(v: string) { capturedHref = v },
    } as unknown as Location)

    mockApiFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            session_state: 'session_expired',
            identity_type: 'user',
            user: { email: 'a@b.com', display_name: '', email_verified: false },
            consent_state: 'unknown',
          }),
      } as Response)
    )

    renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(capturedHref).toBe('/login?reason=session_expired'))
  })

  it('test_session_restore_does_not_redirect_when_already_on_login', async () => {
    let capturedHref = ''
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/login',
      set href(v: string) { capturedHref = v },
    } as unknown as Location)

    mockApiFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            session_state: 'session_expired',
            identity_type: 'user',
            user: { email: 'a@b.com', display_name: '', email_verified: false },
            consent_state: 'unknown',
          }),
      } as Response)
    )

    renderHook(() => useAuth(), { wrapper: AuthProvider })

    await new Promise(r => setTimeout(r, 100))
    expect(capturedHref).toBe('')
  })

  it('test_session_restore_keeps_user_null_when_unauthenticated', async () => {
    mockApiFetch.mockImplementationOnce(unauthenticatedSessionRes)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    expect(result.current.user).toBeNull()
  })

  it('test_session_restore_keeps_user_null_when_consent_not_accepted', async () => {
    mockApiFetch.mockImplementationOnce(() => registeredSessionRes('required'))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    expect(result.current.user).toBeNull()
    expect(result.current.sessionState).toBe('registered')
    expect(result.current.consentState).toBe('required')
  })

  it('test_init_guest_sets_is_guest_true', async () => {
    // Session restore (unauthenticated) + initGuest
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          guest_token: 'tok',
          session_state: 'guest',
          identity_type: 'guest',
          guest: { id: 'g1' },
          consent_state: 'required',
          next_action: 'accept_consent',
        }),
      } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.initGuest()
    })

    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.is_guest).toBe(true)
    expect(result.current.user?.user_id).toBe('g1')
  })

  it('test_login_success_sets_user', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes) // session restore
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () =>
          Promise.resolve({
            session_state: 'registered',
            identity_type: 'user',
            user: { email: 'a@b.com', display_name: '', email_verified: true },
            consent_state: 'required',
          }),
      } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'pass' })
    })

    expect(result.current.user).toBeNull()
    expect(result.current.sessionState).toBe('registered')
    expect(result.current.consentState).toBe('required')
    expect(result.current.sessionUser?.email).toBe('a@b.com')
    expect(result.current.error).toBeNull()
  })

  it('test_login_401_sets_error_message', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({ status: 401 } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'wrong' })
    })

    expect(result.current.error).toBe('invalid_credentials')
    expect(result.current.user).toBeNull()
  })

  it('test_login_403_sets_email_verification_required_error', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({ status: 403 } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.login({ email: 'unverified@b.com', password: 'pass' })
    })

    expect(result.current.error).toBe('email_verification_required')
  })

  it('test_login_400_sets_invalid_request_error', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({ status: 400 } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: '' })
    })

    expect(result.current.error).toBe('invalid_request')
  })

  it('test_register_400_sets_invalid_request_error', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: () => Promise.resolve({ error: 'invalid_request' }),
      } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.register({ email: 'bad', password: 'pass' })
    })

    expect(result.current.error).toBe('invalid_request')
  })

  it('test_register_429_sets_cooldown_error', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({
        status: 429,
        ok: false,
        json: () => Promise.resolve({ error: 'otp_resend_cooldown' }),
      } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.register({ email: 'a@b.com', password: 'pass123' })
    })

    expect(result.current.error).toBe('otp_resend_cooldown')
  })

  it('test_register_400_forwards_specific_be_error_code', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: () => Promise.resolve({ error: 'password_too_common' }),
      } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.register({ email: 'a@b.com', password: 'password' })
    })

    expect(result.current.error).toBe('password_too_common')
  })

  it('test_register_409_sets_duplicate_email_error', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({ status: 409 } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.register({ email: 'dup@b.com', password: 'pass' })
    })

    expect(result.current.error).toBe('email_already_registered')
  })

  it('test_register_201_sets_registration_email', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes)
      .mockResolvedValueOnce({ status: 201, ok: true } as Response)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.register({ email: 'new@b.com', password: 'pass' })
    })

    expect(result.current.registrationEmail).toBe('new@b.com')
    expect(result.current.error).toBeNull()
  })

  it('test_logout_clears_user', async () => {
    mockApiFetch
      .mockImplementationOnce(unauthenticatedSessionRes) // session restore
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () =>
          Promise.resolve({
            session_state: 'registered',
            identity_type: 'user',
            user: { email: 'a@b.com', display_name: '', email_verified: true },
            consent_state: 'required',
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ session_state: 'unauthenticated', identity_type: 'none', consent_state: 'unknown' }),
      } as Response) // logout call

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isLoadingSession).toBe(false))

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'pass' })
    })
    expect(result.current.sessionState).toBe('registered')

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.sessionState).toBe('unauthenticated')
  })
})
