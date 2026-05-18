'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChatTurn } from '@/types/api'
import type { PendingTurn, CompletedTurn } from '@/hooks/chat/useSendMessage'
import { TurnBubble, CrisisBubble } from './TurnBubble'
import { ThinkingDots } from './ThinkingDots'

function Bubble({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl text-sm leading-relaxed animate-fade-in ${
          isUser
            ? 'bg-wismo-message-user text-wismo-text px-4 py-2.5'
            : 'bg-wismo-message-bot text-wismo-text border border-wismo-border shadow-sm px-4 py-3'
        }`}
      >
        {text}
      </div>
    </div>
  )
}

/**
 * Reveals `text` character-by-character over ~60 frames (~1s).
 * Animates once on mount; subsequent re-renders with same text are no-ops.
 * Scrolls the provided container to its bottom on each tick so the bubble stays visible.
 */
function TypingBubble({ text, scrollContainer }: { text: string; scrollContainer: React.RefObject<HTMLDivElement | null> }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!text) return
    // Complete in ~60 frames regardless of length; cap chars/tick at 20 for readability
    const charsPerTick = Math.max(1, Math.min(Math.ceil(text.length / 120), 10))
    let pos = 0

    const timer = setInterval(() => {
      pos += charsPerTick
      const done = pos >= text.length
      setDisplayed(done ? text : text.slice(0, pos))
      // Scroll the container directly — avoids scrollIntoView propagating to window
      if (scrollContainer.current) {
        scrollContainer.current.scrollTop = scrollContainer.current.scrollHeight
      }
      if (done) clearInterval(timer)
    }, 16)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]) // stable for completed turns; scrollContainer ref is stable

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl text-sm leading-relaxed animate-fade-in bg-wismo-message-bot text-wismo-text border border-wismo-border shadow-sm px-4 py-3 whitespace-pre-wrap">
        {displayed || ' '}
      </div>
    </div>
  )
}

/** Renders the assistant side of a control-path turn based on response_key. */
function ControlBubble({ responseKey }: { responseKey: string }) {
  const t = useTranslations('chat')
  if (responseKey === 'crisis_hotline_immediate') return <CrisisBubble />
  if (responseKey === 'hard_redirect') return <Bubble text={t('response_key_hard_redirect')} isUser={false} />
  if (responseKey === 'policy_bypass_refusal') return <Bubble text={t('response_key_policy_bypass_refusal')} isUser={false} />
  if (responseKey === 'spam_or_non_conversational') return <Bubble text={t('response_key_spam_or_non_conversational')} isUser={false} />
  return <Bubble text={t('response_key_fallback')} isUser={false} />
}

interface ErrorConfig {
  message: string
  action: { label: string; onClick: () => void } | null
}

interface TurnListProps {
  turns: ChatTurn[]
  isLoading: boolean
  completedTurns: CompletedTurn[]
  pendingTurn: PendingTurn | null
  turnState: 'idle' | 'sending' | 'streaming' | 'done' | 'error'
  errorConfig?: ErrorConfig | null
  /** Optimistic first message text for newly-created chats — shown immediately on navigation. */
  firstMessage?: string
}

export function TurnList({ turns, isLoading, completedTurns, pendingTurn, turnState, errorConfig, firstMessage }: TurnListProps) {
  const t = useTranslations('chat')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll the container directly — avoids scrollIntoView propagating to window/document
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [turns, completedTurns, pendingTurn])

  // firstMessage is the optimistically-displayed user text before pendingTurn is set
  const showFirstMessage = !!firstMessage && turns.length === 0 && completedTurns.length === 0 && pendingTurn === null
  const hasContent = turns.length > 0 || completedTurns.length > 0 || pendingTurn !== null || showFirstMessage

  if (!hasContent && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-wismo-text-light text-sm">
        {t('empty_state')}
      </div>
    )
  }

  // Show user bubble during active turn AND when an error occurs (so the failed message stays visible)
  const showPendingUser = pendingTurn !== null && (turnState === 'sending' || turnState === 'streaming' || turnState === 'error')
  const showPendingAssistant =
    pendingTurn !== null &&
    (turnState === 'sending' || turnState === 'streaming')

  return (
    <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-2">
        {/* History turns from server */}
        {turns.map(turn => (
          <TurnBubble key={turn.turn_id} turn={turn} />
        ))}

        {/* Turns completed this session (accumulated, not re-fetched).
            TypingBubble animates once on mount; stable key preserves state across re-renders. */}
        {completedTurns.map((turn, i) => (
          <div key={turn.turnId ?? 'session-' + i}>
            <Bubble text={turn.userText} isUser={true} />
            {turn.responseKey
              ? <ControlBubble responseKey={turn.responseKey} />
              : <TypingBubble text={turn.assistantText} scrollContainer={scrollContainerRef} />
            }
          </div>
        ))}

        {/* In-flight or failed turn: user bubble always visible; assistant varies by state.
            Always show ThinkingDots during pending — animation runs in completedTurns. */}
        {showPendingUser && (
          <div className="flex flex-col gap-2">
            <Bubble text={pendingTurn!.userText} isUser={true} />
            {showPendingAssistant && (
              pendingTurn!.responseKey !== undefined ? (
                <ControlBubble responseKey={pendingTurn!.responseKey} />
              ) : (
                <ThinkingDots />
              )
            )}
            {/* Error bubble inline with failed turn */}
            {turnState === 'error' && errorConfig && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl text-sm leading-relaxed bg-red-50 border border-red-200 px-4 py-3 flex flex-col gap-2">
                  <p className="text-red-700">{errorConfig.message}</p>
                  {errorConfig.action && (
                    <button
                      onClick={errorConfig.action.onClick}
                      className="self-start text-sm font-medium text-white bg-wismo-primary rounded-lg px-3 py-1.5 hover:bg-wismo-primary-hover transition-colors"
                    >
                      {errorConfig.action.label}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optimistic first message: shown from navigation until pendingTurn takes over */}
        {showFirstMessage && (
          <div className="flex flex-col gap-2">
            <Bubble text={firstMessage!} isUser={true} />
            <ThinkingDots />
          </div>
        )}

        {/* Initial load spinner — only when no optimistic message to show */}
        {isLoading && !showFirstMessage && <ThinkingDots />}
      </div>
    </div>
  )
}
