import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConsent } from './useConsent'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '@/lib/api'
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useConsent', () => {
  it('test_check_consent_sets_status', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ identity_type: 'guest', consent_state: 'required' }),
    } as Response)

    const { result } = renderHook(() => useConsent())

    await act(async () => {
      await result.current.checkConsent()
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/consents/status')
    expect(result.current.status).toBe('required')
  })

  it('test_grant_consent_calls_api', async () => {
    mockApiFetch.mockResolvedValueOnce({ ok: true } as Response)

    const { result } = renderHook(() => useConsent())

    await act(async () => {
      await result.current.grantConsent()
    })

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/consents/accept',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.current.status).toBe('accepted')
  })

  it('test_withdraw_consent_calls_api', async () => {
    mockApiFetch.mockResolvedValueOnce({ ok: true } as Response)

    const { result } = renderHook(() => useConsent())

    await act(async () => {
      await result.current.withdrawConsent()
    })

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/consents/withdraw',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.current.status).toBe('required')
  })
})
