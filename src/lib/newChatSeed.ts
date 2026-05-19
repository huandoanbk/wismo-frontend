import type { Chat } from '@/types/api'

// Module-level store for passing a newly-created Chat to the chat detail page without
// a round-trip fetch. Cleared immediately after being read so it doesn't leak across
// navigations. Only meaningful for same-tab navigation.
let _pending: Chat | null = null

export function setNewChatSeed(chat: Chat): void {
  _pending = chat
}

/** Returns and clears the seed if it matches chatId; otherwise null. */
export function takeNewChatSeed(chatId: string): Chat | null {
  if (_pending?.chat_id === chatId) {
    const chat = _pending
    _pending = null
    return chat
  }
  return null
}
