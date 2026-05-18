import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import type { ProfileResponse, UpdateDisplayNameResponse } from '@/types/api'

const MAX_DISPLAY_NAME_LENGTH = 255

interface UseProfileReturn {
  profile: ProfileResponse | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
  saveError: string | null
  /** Validate and PATCH display_name. Returns true on success. */
  updateDisplayName: (displayName: string) => Promise<boolean>
}

/**
 * Loads and manages the registered user's profile.
 * Fetches GET /api/accounts/me/ on mount; exposes updateDisplayName for PATCH.
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/accounts/me')
      .then(async res => {
        if (cancelled) return
        if (!res.ok) { setError('load_failed'); return }
        const data: ProfileResponse = await res.json()
        setProfile(data)
      })
      .catch(() => {
        if (!cancelled) setError('load_failed')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const updateDisplayName = useCallback(async (displayName: string): Promise<boolean> => {
    // Client-side validation before hitting the API
    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      setSaveError('display_name_too_long')
      return false
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const res = await apiFetch('/api/accounts/me', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: displayName }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const code = (body as { error?: string })?.error ?? 'save_failed'
        setSaveError(code)
        return false
      }

      const data: UpdateDisplayNameResponse = await res.json()
      setProfile(data)
      return true
    } catch {
      setSaveError('save_failed')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { profile, isLoading, error, isSaving, saveError, updateDisplayName }
}
