import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { Chat, ListChatsResponse } from '@/types/api'

interface UseChatsReturn {
  chats: Chat[]
  isLoading: boolean
  error: string | null
  /** Re-fetch the list (e.g. after creating a new chat). */
  refresh: () => void
  /** Optimistically update a single chat's display name without a re-fetch. */
  patchChatName: (chatId: string, displayName: string) => void
  /** Optimistically remove a chat from the list without a re-fetch. */
  removeChat: (chatId: string) => void
}

/**
 * Fetches the current identity's chat list from GET /api/chat.
 * Ordered by last_activity_at descending (backend guarantees ordering).
 */
export function useChats(): UseChatsReturn {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    apiFetch('/api/chat')
      .then(async res => {
        if (cancelled) return
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const code = (body as { error?: string })?.error ?? 'generic'
          setError(code)
          return
        }
        const data: ListChatsResponse = await res.json()
        setChats(data.chats)
      })
      .catch(() => { if (!cancelled) setError('generic') })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [tick])

  const patchChatName = useCallback((chatId: string, displayName: string) => {
    setChats(prev => prev.map(c => c.chat_id === chatId ? { ...c, chat_display_name: displayName } : c))
  }, [])

  const removeChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => c.chat_id !== chatId))
  }, [])

  return { chats, isLoading, error, refresh: () => setTick(t => t + 1), patchChatName, removeChat }
}
