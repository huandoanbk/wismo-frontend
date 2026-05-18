import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface UseDeleteChatReturn {
  /** Returns true if the chat was deleted (or already gone). False on recoverable error. */
  deleteChat: (chatId: string) => Promise<boolean>
  isDeleting: boolean
  /** 'turn_in_progress' | 'generic' | null */
  error: string | null
}

/**
 * Calls DELETE /api/chat/{chatId} and returns whether the chat is gone.
 * Per contract: 403/404 → treat as already-gone (return true).
 * 409 turn_in_progress → return false with error.
 */
export function useDeleteChat(): UseDeleteChatReturn {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteChat = useCallback(async (chatId: string): Promise<boolean> => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/chat/${chatId}`, { method: 'DELETE' })
      if (res.ok) return true
      // Already gone — treat as success per contract
      if (res.status === 403 || res.status === 404) return true
      if (res.status === 409) {
        setError('turn_in_progress')
        return false
      }
      setError('generic')
      return false
    } catch {
      setError('generic')
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return { deleteChat, isDeleting, error }
}
