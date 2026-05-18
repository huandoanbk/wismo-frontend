'use client'

import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { AppShell, useAppShell } from '@/components/layout/AppShell'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { Under18Block } from '@/components/auth/Under18Block'
import { useChatDetail } from '@/hooks/chat/useChatDetail'
import { useSendMessage } from '@/hooks/chat/useSendMessage'
import { useDeleteChat } from '@/hooks/chat/useDeleteChat'

/* ─── Chat options menu (⋯ button + confirm modal) ─────────────── */

interface ChatMoreMenuProps {
  chatId: string
  onDeleted: () => void
  disabled?: boolean
}

function ChatMoreMenu({ chatId, onDeleted, disabled }: ChatMoreMenuProps) {
  const t = useTranslations('chat')
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { deleteChat, isDeleting, error } = useDeleteChat()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const handleConfirmDelete = async () => {
    const ok = await deleteChat(chatId)
    if (ok) {
      setShowConfirm(false)
      onDeleted()
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(v => !v)}
          disabled={disabled}
          className="p-1.5 rounded-lg text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={t('chat_options')}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-wismo-border py-1 z-50">
            <button
              onClick={() => { setIsOpen(false); setShowConfirm(true) }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              {t('delete_this_chat')}
            </button>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-base font-semibold text-wismo-text mb-2">
              {t('delete_confirm_title')}
            </h2>
            <p className="text-sm text-wismo-text-muted mb-4">
              {t('delete_confirm_body')}
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-3">
                {error === 'turn_in_progress'
                  ? t('delete_error_in_progress')
                  : t('delete_error')}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-wismo-text border border-wismo-border rounded-xl hover:bg-wismo-bg transition-colors disabled:opacity-50"
              >
                {t('delete_confirm_cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? t('delete_deleting') : t('delete_confirm_yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Main chat view ────────────────────────────────────────────── */

function ChatView() {
  const { isSidebarOpen, toggleSidebar } = useAppShell()
  const params = useParams<{ id: string }>()
  const chatId = params.id
  const router = useRouter()
  const t = useTranslations('chat')
  const searchParams = useSearchParams()
  const firstMessage = searchParams.get('first') ?? undefined

  const { chat, turns, isLoading, error: detailError } = useChatDetail(chatId)
  const {
    sendMessage,
    retryLastMessage,
    turnState,
    pendingTurn,
    completedTurns,
    error,
    quotaExhausted,
    chatDisplayName,
  } = useSendMessage(chatId)

  const chatNameUpdate = chatDisplayName ? { chatId, displayName: chatDisplayName } : undefined

  // Optimistic sidebar removal on delete
  const [deletedChatId, setDeletedChatId] = useState<string | undefined>()
  const handleChatDeleted = useCallback(() => {
    setDeletedChatId(chatId)
    router.push('/chat')
  }, [chatId, router])

  // blocked_minor control path → full-screen takeover per contract
  const isBlocked =
    completedTurns.some(t => t.responseKey === 'blocked_minor') ||
    pendingTurn?.responseKey === 'blocked_minor'

  // Prevent double auto-trigger in React StrictMode
  const hasSentRef = useRef(false)

  // Auto-trigger first message when entering a newly created chat
  useEffect(() => {
    if (
      !isLoading &&
      chat !== null &&
      !detailError &&
      chat.opening_input_text.trim() !== '' &&
      turns.length === 0 &&
      turnState === 'idle' &&
      !hasSentRef.current
    ) {
      hasSentRef.current = true
      sendMessage(chat.opening_input_text.trim(), chatId)
    }
  }, [isLoading, chat, detailError, turns.length, turnState, sendMessage, chatId])

  // Auto-open sidebar on desktop on first mount
  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches && !isSidebarOpen) {
      toggleSidebar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Display name: prefer live update from done event, fallback to fetched chat data
  const displayName = chatDisplayName ?? chat?.chat_display_name

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        chatNameUpdate={chatNameUpdate}
        chatIdToRemove={deletedChatId}
      />

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden bg-wismo-bg">
        {/* Top bar — all screen sizes */}
        <div className="flex items-center gap-2 px-3 border-b border-wismo-border bg-white flex-shrink-0 h-14">
          {/* Mobile: sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg transition-colors"
            aria-label={t('open_sidebar')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Mobile: logo */}
          <Image src="/logo.png" alt="WISMO" height={24} width={78} className="h-6 w-auto md:hidden" />
          {/* Desktop: chat name */}
          {displayName && (
            <p className="hidden md:block text-sm font-medium text-wismo-text truncate flex-1 ml-1">
              {displayName}
            </p>
          )}
          <div className="flex-1 md:hidden" />
          {/* ⋯ menu — always visible */}
          {!detailError && (
            <ChatMoreMenu
              chatId={chatId}
              onDeleted={handleChatDeleted}
              disabled={isLoading || turnState === 'sending' || turnState === 'streaming'}
            />
          )}
        </div>

        {isBlocked ? (
          <Under18Block />
        ) : detailError ? (
          <div className="flex-1 flex items-center justify-center text-wismo-text-light text-sm">
            {detailError === 'chat_not_found'
              ? t('error_not_found')
              : detailError === 'chat_access_denied'
                ? t('error_access_denied')
                : t('error_generic')}
          </div>
        ) : (
          <ChatPanel
            turns={turns}
            isLoading={isLoading}
            completedTurns={completedTurns}
            pendingTurn={pendingTurn}
            turnState={turnState}
            onSend={(msg) => sendMessage(msg, chatId)}
            onRetry={retryLastMessage}
            error={error}
            quotaExhausted={quotaExhausted}
            firstMessage={firstMessage}
          />
        )}
      </div>
    </div>
  )
}

export default function ChatIdPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <ChatView />
      </Suspense>
    </AppShell>
  )
}
