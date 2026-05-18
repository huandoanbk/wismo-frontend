import { renderHook, act, waitFor } from '@testing-library/react'
import { useProfile } from './useProfile'

const MOCK_PROFILE = {
  email: 'test@example.com',
  display_name: 'Test User',
  email_verified: true,
  date_joined: '2026-01-01T00:00:00Z',
  has_usable_password: true,
}

describe('useProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads profile successfully on mount', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_PROFILE), { status: 200 })
    )

    const { result } = renderHook(() => useProfile())
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.profile).toEqual(MOCK_PROFILE)
    expect(result.current.error).toBeNull()
  })

  it('sets error on 403 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
    )

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.profile).toBeNull()
    expect(result.current.error).toBe('load_failed')
  })

  it('sets error on network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('load_failed')
  })

  it('updateDisplayName succeeds and updates profile', async () => {
    const updated = { ...MOCK_PROFILE, display_name: 'New Name' }
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(updated), { status: 200 }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.updateDisplayName('New Name')
    })

    expect(success).toBe(true)
    expect(result.current.profile?.display_name).toBe('New Name')
    expect(result.current.saveError).toBeNull()
  })

  it('updateDisplayName sets saveError on display_name_too_long from BE', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'display_name_too_long' }), { status: 400 })
      )

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.updateDisplayName('Some name')
    })

    expect(success).toBe(false)
    expect(result.current.saveError).toBe('display_name_too_long')
  })

  it('updateDisplayName validates client-side: >255 chars returns false without API call', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_PROFILE), { status: 200 })
    )

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const longName = 'a'.repeat(256)
    let success: boolean | undefined
    await act(async () => {
      success = await result.current.updateDisplayName(longName)
    })

    expect(success).toBe(false)
    expect(result.current.saveError).toBe('display_name_too_long')
    // fetch should have been called only once (the initial GET)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
