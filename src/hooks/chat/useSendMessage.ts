import { useState, useRef, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import type { SSEResponseEvent, SSEDoneEvent, SSEErrorEvent } from '@/types/api'

export type TurnState = 'idle' | 'sending' | 'streaming' | 'done' | 'error'

export interface PendingTurn {
  userText: string
  assistantText: string | null
  responseKey?: string
}

export interface CompletedTurn {
  userText: string
  assistantText: string
  responseKey?: string
  /** BE-generated turn UUID from done event; null for non-persist control paths. */
  turnId: string | null
}

interface UseSendMessageReturn {
  sendMessage: (message: string, chatId: string) => Promise<void>
  retryLastMessage: () => Promise<void>
  turnState: TurnState
  pendingTurn: PendingTurn | null
  completedTurns: CompletedTurn[]
  error: string | null
  quotaExhausted: boolean
  /** turn_id from the last completed done event; null for non-persist control paths. */
  lastTurnId: string | null
  /** chat_display_name from the last done event — use to update sidebar title directly. */
  chatDisplayName: string | null
}

const QUOTA_GATE_ERRORS = new Set(['quota_exceeded', 'registration_required_by_quota'])

type ParsedSSEEvent = {
  eventType: string
  data: unknown
}

function parseSSEBlock(block: string): ParsedSSEEvent | null {
  const lines = block.trim().split('\n')
  const eventType = lines.find(l => l.startsWith('event: '))?.slice(7)
  const dataLines = lines
    .filter(l => l.startsWith('data:'))
    .map(l => {
      const raw = l.slice(5)
      return raw.startsWith(' ') ? raw.slice(1) : raw
    })
  if (!eventType || dataLines.length === 0) return null
  const dataLine = dataLines.join('\n')

  try {
    return { eventType, data: JSON.parse(dataLine) }
  } catch {
    return null
  }
}

/**
 * Manages the chat turn lifecycle: sends POST /api/chat/message, reads the
 * SSE stream response, and accumulates completed turns within the session.
 *
 * State transitions:
 *   sendMessage()      → 'sending'  (pendingTurn.userText set immediately)
 *   gate pass (200)    → 'streaming' (caller should clear Composer text here)
 *   event: response    → pendingTurn.assistantText set (state unchanged)
 *   event: done        → 'done', turn appended to completedTurns
 *   gate error/stream error/abrupt close → 'error'
 *
 * completedTurns resets when chatId changes.
 */
export function useSendMessage(chatId: string): UseSendMessageReturn {
  const [turnState, setTurnState] = useState<TurnState>('idle')
  const [pendingTurn, setPendingTurn] = useState<PendingTurn | null>(null)
  const [completedTurns, setCompletedTurns] = useState<CompletedTurn[]>([])
  const [error, setError] = useState<string | null>(null)
  const [quotaExhausted, setQuotaExhausted] = useState(false)
  const [lastTurnId, setLastTurnId] = useState<string | null>(null)
  const [chatDisplayName, setChatDisplayName] = useState<string | null>(null)

  // Prevents concurrent sendMessage calls (StrictMode safe)
  const inFlightRef = useRef(false)
  // Tracks last sent message for retry
  const lastMessageRef = useRef('')
  const lastChatIdRef = useRef('')
  // Tracks pending turn data synchronously during SSE loop to avoid stale closures
  const pendingRef = useRef<PendingTurn>({ userText: '', assistantText: null })

  // Reset session state when navigating to a different chat
  useEffect(() => {
    setCompletedTurns([])
    setTurnState('idle')
    setPendingTurn(null)
    setError(null)
    setQuotaExhausted(false)
    setLastTurnId(null)
    setChatDisplayName(null)
    inFlightRef.current = false
  }, [chatId])

  const sendMessage = useCallback(async (message: string, cid: string) => {
    if (inFlightRef.current) return
    inFlightRef.current = true

    lastMessageRef.current = message
    lastChatIdRef.current = cid

    const initial: PendingTurn = { userText: message, assistantText: null }
    pendingRef.current = initial
    setPendingTurn(initial)
    setError(null)
    setTurnState('sending')

    try {
      const res = await apiFetch('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, chat_id: cid }),
      })

      // Gate error — non-streaming JSON response
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const code = (body as { error?: string })?.error ?? 'generic'
        setError(code)
        if (QUOTA_GATE_ERRORS.has(code)) setQuotaExhausted(true)
        setTurnState('error')
        return
      }

      // Gate pass — begin reading SSE stream
      setTurnState('streaming')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let receivedDone = false
      let receivedError = false

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Flush trailing partial block when stream ends. Some servers close the stream
          // without appending the final "\n\n", so done/error can still be in buffer.
          const trailingEvent = parseSSEBlock(buffer)
          if (trailingEvent) {
            const { eventType, data } = trailingEvent
            if (eventType === 'response') {
              const evt = data as SSEResponseEvent
              pendingRef.current = {
                ...pendingRef.current,
                assistantText: evt.text ?? null,
                responseKey: evt.response_key,
              }
              setPendingTurn({ ...pendingRef.current })
            } else if (eventType === 'done') {
              const evt = data as SSEDoneEvent
              receivedDone = true
              const tid = evt.turn_id ?? null
              setLastTurnId(tid)
              setChatDisplayName(evt.chat_display_name)
              setCompletedTurns(prev => [
                ...prev,
                {
                  userText: pendingRef.current.userText,
                  assistantText: pendingRef.current.assistantText ?? '',
                  responseKey: pendingRef.current.responseKey,
                  turnId: tid,
                },
              ])
              setTurnState('done')
              if (evt.quota_exhausted_after_turn) setQuotaExhausted(true)
            } else if (eventType === 'error') {
              const evt = data as SSEErrorEvent
              receivedError = true
              setError(evt.error)
              setTurnState('error')
            }
          }

          // Stream closed — if we never got a terminal event, treat as abrupt close
          if (!receivedDone && !receivedError) {
            setError('stream_interrupted')
            setTurnState('error')
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Split on blank lines to get complete SSE blocks; keep last partial block
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''

        for (const block of blocks) {
          const parsed = parseSSEBlock(block)
          if (!parsed) continue
          const { eventType, data } = parsed

          if (eventType === 'response') {
            const evt = data as SSEResponseEvent
            pendingRef.current = {
              ...pendingRef.current,
              // Control paths have no text — assistantText stays null; responseKey drives rendering.
              assistantText: evt.text ?? null,
              responseKey: evt.response_key,
            }
            setPendingTurn({ ...pendingRef.current })
          } else if (eventType === 'done') {
            const evt = data as SSEDoneEvent
            receivedDone = true
            const tid = evt.turn_id ?? null
            setLastTurnId(tid)
            setChatDisplayName(evt.chat_display_name)
            setCompletedTurns(prev => [
              ...prev,
              {
                userText: pendingRef.current.userText,
                assistantText: pendingRef.current.assistantText ?? '',
                responseKey: pendingRef.current.responseKey,
                turnId: tid,
              },
            ])
            setTurnState('done')
            if (evt.quota_exhausted_after_turn) setQuotaExhausted(true)
          } else if (eventType === 'error') {
            const evt = data as SSEErrorEvent
            receivedError = true
            setError(evt.error)
            setTurnState('error')
          }
        }
      }
    } catch {
      setError('generic')
      setTurnState('error')
    } finally {
      inFlightRef.current = false
    }
  }, [])

  const retryLastMessage = useCallback(async () => {
    if (lastMessageRef.current && lastChatIdRef.current) {
      await sendMessage(lastMessageRef.current, lastChatIdRef.current)
    }
  }, [sendMessage])

  return {
    sendMessage,
    retryLastMessage,
    turnState,
    pendingTurn,
    completedTurns,
    error,
    quotaExhausted,
    lastTurnId,
    chatDisplayName,
  }
}
