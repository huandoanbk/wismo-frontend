import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { Chat, CreateChatResponse } from '@/types/api'

interface UseCreateChatReturn {
  createChat: (openingText?: string) => Promise<Chat | null>
  isCreating: boolean
}

/**
 * Creates a new chat shell via POST /api/chat.
 * Returns the created Chat on success, null on failure.
 * openingText is optional — omitting it creates a blank shell.
 */
export function useCreateChat(): UseCreateChatReturn {
  const [isCreating, setIsCreating] = useState(false)

  const createChat = useCallback(async (openingText?: string): Promise<Chat | null> => {
    setIsCreating(true)
    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify(openingText ? { opening_input_text: openingText } : {}),
      })
      if (!res.ok) return null
      const data: CreateChatResponse = await res.json()
      return data.chat
    } catch {
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  return { createChat, isCreating }
}
