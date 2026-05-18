import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVerifyEmail } from './useVerifyEmail'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '@/lib/api'
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useVerifyEmail', () => {
  it('test_verify_success_sets_verified_true', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ email: 'a@b.com', email_verified: true, next_action: 'login' }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.verifyEmail({ email: 'a@b.com', otp: '123456' })
    })

    expect(result.current.verified).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.isVerifying).toBe(false)
  })

  it('test_verify_invalid_otp_sets_error', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'invalid_otp' }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.verifyEmail({ email: 'a@b.com', otp: '000000' })
    })

    expect(result.current.error).toBe('invalid_otp')
    expect(result.current.verified).toBe(false)
  })

  it('test_verify_otp_expired_sets_error', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'otp_expired' }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.verifyEmail({ email: 'a@b.com', otp: '111111' })
    })

    expect(result.current.error).toBe('otp_expired')
    expect(result.current.verified).toBe(false)
  })

  it('test_resend_success_sets_resend_success_true', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          email: 'a@b.com',
          email_verification_required: true,
          otp_expires_at: '2026-05-03T12:00:00Z',
          next_action: 'verify_email',
        }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.resendOtp('a@b.com')
    })

    expect(result.current.resendSuccess).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('test_verify_user_not_found_sets_error', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'user_not_found' }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.verifyEmail({ email: 'ghost@b.com', otp: '123456' })
    })

    expect(result.current.error).toBe('user_not_found')
  })

  it('test_resend_cooldown_sets_error', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'otp_resend_cooldown' }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.resendOtp('a@b.com')
    })

    expect(result.current.error).toBe('otp_resend_cooldown')
  })

  it('test_resend_limit_exceeded_sets_error', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'otp_resend_limit_exceeded' }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.resendOtp('a@b.com')
    })

    expect(result.current.error).toBe('otp_resend_limit_exceeded')
  })

  it('test_resend_email_already_verified_sets_error', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'email_already_verified' }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.resendOtp('a@b.com')
    })

    expect(result.current.error).toBe('email_already_verified')
  })

  it('test_resend_user_not_found_sets_error', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'user_not_found' }),
    } as Response)

    const { result } = renderHook(() => useVerifyEmail())

    await act(async () => {
      await result.current.resendOtp('ghost@b.com')
    })

    expect(result.current.error).toBe('user_not_found')
  })
})
