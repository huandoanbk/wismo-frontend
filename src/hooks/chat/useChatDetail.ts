import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import type { Chat, ChatTurn, GetChatDetailResponse } from '@/types/api'

interface UseChatDetailReturn {
  chat: Chat | null
  turns: ChatTurn[]
  isLoading: boolean
  /** 'chat_not_found' | 'chat_access_denied' | 'generic' */
  error: string | null
}

/**
 * Fetches a chat's metadata and full turn history from GET /api/chat/[id].
 * Re-fetches whenever chatId changes.
 */
export function useChatDetail(chatId: string): UseChatDetailReturn {
  const [chat, setChat] = useState<Chat | null>(null)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setChat(null)
    setTurns([])

    apiFetch(`/api/chat/${chatId}`)
      .then(async res => {
        if (cancelled) return
        if (res.status === 404) { setError('chat_not_found'); return }
        if (res.status === 403) { setError('chat_access_denied'); return }
        if (!res.ok) { setError('generic'); return }
        const data: GetChatDetailResponse = await res.json()
        setChat(data.chat)
        setTurns(data.turns)
      })
      .catch(() => { if (!cancelled) setError('generic') })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [chatId])

  return { chat, turns, isLoading, error }
}
