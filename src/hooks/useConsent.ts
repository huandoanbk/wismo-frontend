import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { ConsentState, ConsentStatusResponse } from '@/types/api'

interface UseConsentReturn {
  /** Current consent state, null until checkConsent is called. */
  status: ConsentState | null
  isLoading: boolean
  /**
   * Fetch current consent state from the server.
   * Returns the full response for page-level routing decisions.
   */
  checkConsent: () => Promise<ConsentStatusResponse>
  /**
   * Submit consent accept. No request body — identity resolved from cookie.
   * @throws on API error — caller must handle and show error_retry.
   */
  grantConsent: () => Promise<void>
  /** Withdraw previously granted consent. Returns true on success, false on error. */
  withdrawConsent: () => Promise<boolean>
}

/**
 * Hook quản lý consent state: check, grant, withdraw.
 * API calls qua apiFetch — không có fetch trực tiếp trong components.
 */
export function useConsent(): UseConsentReturn {
  const [status, setStatus] = useState<ConsentState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkConsent = useCallback(async (): Promise<ConsentStatusResponse> => {
    setIsLoading(true)
    try {
      const res = await apiFetch('/api/consents/status')
      if (!res.ok) throw new Error('consent_check_failed')
      const data: ConsentStatusResponse = await res.json()
      setStatus(data.consent_state)
      return data
    } finally {
      setIsLoading(false)
    }
  }, [])

  const grantConsent = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      const res = await apiFetch('/api/consents/accept', { method: 'POST' })
      if (!res.ok) throw new Error('Consent grant failed')
      setStatus('accepted')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const withdrawConsent = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await apiFetch('/api/consents/withdraw', { method: 'POST' })
      if (!res.ok) return false
      setStatus('required')
      return true
    } catch {
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { status, isLoading, checkConsent, grantConsent, withdrawConsent }
}
