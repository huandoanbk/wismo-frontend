'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ChatTurn } from '@/types/api'
import type { TurnState, PendingTurn, CompletedTurn } from '@/hooks/chat/useSendMessage'
import { useAuth } from '@/hooks/useAuth'
import { withQueryParams } from '@/lib/authRoute'
import { TurnList } from './TurnList'
import { Composer } from './Composer'
import { ConsentModal } from '@/components/consent/ConsentModal'

interface ChatPanelProps {
  turns: ChatTurn[]
  isLoading: boolean
  completedTurns: CompletedTurn[]
  pendingTurn: PendingTurn | null
  turnState: TurnState
  onSend: (message: string) => void
  onRetry: () => void
  error: string | null
  quotaExhausted: boolean
  chatId: string
  firstMessage?: string
}

/** Maps gate/stream error codes to i18n keys and action config. */
function useErrorConfig(error: string | null, onRetry: () => void, chatId: string) {
  const t = useTranslations('chat')
  const router = useRouter()
  const { sessionState } = useAuth()

  if (!error) return null

  // Errors where we just show message with no button (or special handling)
  if (error === 'message_too_long' || error === 'payload_too_large') {
    return { message: t('send_error_message_too_long'), action: null }
  }
  if (error === 'turn_in_progress') {
    return { message: t('send_error_in_progress'), action: null, autoDismiss: true }
  }
  if (error === 'quota_exceeded') {
    return { message: t('send_error_quota'), action: null }
  }

  // Errors with action buttons
  if (error === 'identity_not_resolved' || error === 'guest_session_expired') {
    return {
      message: t('send_error_identity'),
      action: { label: t('send_action_restart'), onClick: () => router.push('/') },
    }
  }
  if (error === 'session_expired') {
    return {
      message: t('send_error_session_expired'),
      action: { label: t('send_action_login'), onClick: () => router.push('/login') },
    }
  }
  if (error === 'consent_required') {
    if (sessionState === 'registered') {
      return {
        message: t('send_error_consent'),
        action: null,
      }
    }
    return {
      message: t('send_error_consent'),
      action: { label: t('send_action_restart'), onClick: () => router.push('/consent') },
    }
  }
  if (error === 'chat_access_denied') {
    return {
      message: t('send_error_access_denied'),
      action: { label: t('send_action_go_chats'), onClick: () => router.push('/chat') },
    }
  }
  if (error === 'chat_not_found') {
    return {
      message: t('send_error_not_found'),
      action: { label: t('send_action_new_chat'), onClick: () => router.push('/chat') },
    }
  }
  if (error === 'registration_required_by_quota') {
    return {
      message: t('send_error_quota_guest'),
      action: { label: t('send_action_register'), onClick: () => router.push('/register') },
      secondAction: {
        label: t('quota_exhausted_login'),
        onClick: () => router.push(withQueryParams('/login', { return_to: `/chat/${chatId}`, attach_chat_id: chatId })),
      },
    }
  }

  // Stream errors, generic, and all other gate errors → retry
  return {
    message: t('send_error_service'),
    action: { label: t('send_action_retry'), onClick: onRetry },
  }
}

export function ChatPanel({
  turns,
  isLoading,
  completedTurns,
  pendingTurn,
  turnState,
  onSend,
  onRetry,
  error,
  quotaExhausted,
  chatId,
  firstMessage,
}: ChatPanelProps) {
  const t = useTranslations('chat')
  const router = useRouter()
  const { sessionState } = useAuth()
  const errorConfig = useErrorConfig(error, onRetry, chatId)
  const shouldShowQuotaAuthActions = sessionState !== 'registered'
  const quotaExhaustedConfig = quotaExhausted ? {
    message: t('quota_exhausted_message'),
    ...(shouldShowQuotaAuthActions && {
      registerAction: { label: t('send_action_register'), onClick: () => router.push('/register') },
      loginAction: {
        label: t('quota_exhausted_login'),
        onClick: () => router.push(withQueryParams('/login', { return_to: `/chat/${chatId}`, attach_chat_id: chatId })),
      },
    }),
  } : null
  const [showReconsentModal, setShowReconsentModal] = useState(false)
  const [reconsentDeclined, setReconsentDeclined] = useState(false)

  // Registered users re-consent in-place via modal, without leaving chat layout.
  useEffect(() => {
    if (error === 'consent_required' && sessionState === 'registered') {
      setShowReconsentModal(true)
      setReconsentDeclined(false)
    }
  }, [error, sessionState])

  // Auto-dismiss turn_in_progress error after 3s
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    if (error === 'turn_in_progress') {
      setDismissed(false)
      const timer = setTimeout(() => setDismissed(true), 3000)
      return () => clearTimeout(timer)
    } else {
      setDismissed(false)
    }
  }, [error])

  const composerDisabled = quotaExhausted || reconsentDeclined
  const composerProcessing = turnState === 'sending' || turnState === 'streaming'

  const showError = errorConfig && error !== 'turn_in_progress'
  const showInProgress = error === 'turn_in_progress' && !dismissed

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <TurnList
        turns={turns}
        isLoading={isLoading}
        completedTurns={completedTurns}
        pendingTurn={pendingTurn}
        turnState={turnState}
        errorConfig={showError ? errorConfig : null}
        quotaExhaustedConfig={quotaExhaustedConfig}
        firstMessage={firstMessage}
      />

      <div className="flex-shrink-0 bg-white border-t border-wismo-border px-4 sm:px-6 pt-3 pb-3">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Turn-in-progress transient notice */}
          {showInProgress && (
            <p className="text-sm text-wismo-text-muted text-center">
              {t('send_error_in_progress')}
            </p>
          )}

          {reconsentDeclined && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-3">
              <p>{t('reconsent_blocked_message')}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setReconsentDeclined(false)
                    setShowReconsentModal(true)
                  }}
                  className="rounded-lg bg-amber-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  {t('reconsent_review_action')}
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="rounded-lg border border-amber-300 bg-white text-amber-800 px-3 py-1.5 text-sm font-medium hover:bg-amber-100 transition-colors"
                >
                  {t('reconsent_leave_action')}
                </button>
              </div>
            </div>
          )}

          <Composer
            onSubmit={(message) => {
              if (reconsentDeclined) {
                setShowReconsentModal(true)
                return
              }
              onSend(message)
            }}
            disabled={composerDisabled}
            isProcessing={composerProcessing}
          />
          <p className="text-[11px] text-wismo-text-light text-center">{t('disclaimer')}</p>
        </div>
      </div>

      <ConsentModal
        isOpen={showReconsentModal}
        mode="reconsent"
        onConsented={() => {
          setReconsentDeclined(false)
          setShowReconsentModal(false)
          onRetry()
        }}
        onDeclined={() => {
          setShowReconsentModal(false)
          setReconsentDeclined(true)
        }}
      />
    </div>
  )
}
