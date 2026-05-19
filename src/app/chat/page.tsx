'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { AppShell, useAppShell } from '@/components/layout/AppShell'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { useCreateChat } from '@/hooks/chat/useCreateChat'
import { setNewChatSeed } from '@/lib/newChatSeed'

function NewChatView() {
  const router = useRouter()
  const t = useTranslations('chat')
  const { isSidebarOpen, toggleSidebar } = useAppShell()
  const { createChat, isCreating } = useCreateChat()
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  async function handleSubmit() {
    const text = message.trim()
    if (!text || isCreating) return
    setError(false)
    const chat = await createChat(text)
    if (chat) {
      setNewChatSeed(chat)
      router.push(`/chat/${chat.chat_id}`)
    } else {
      setError(true)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <ChatSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden bg-wismo-bg">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 border-b border-wismo-border bg-white flex-shrink-0 h-14">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg transition-colors"
            aria-label={t('open_sidebar')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/logo.png" alt="WISMO" height={24} width={78} className="h-6 w-auto md:hidden" />
        </div>

        {/* Centered prompt area */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 gap-8">

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-wismo-text tracking-tight drop-shadow-sm">
              {t('new_chat_heading')}
            </h1>
            <p className="text-sm text-wismo-text-muted">
              {t('new_chat_subheading')}
            </p>
          </div>

          <div className="w-full max-w-2xl space-y-3">
            <div className="bg-white rounded-2xl border border-wismo-border shadow-sm px-4 py-3 flex items-center gap-3 focus-within:border-wismo-primary focus-within:ring-2 focus-within:ring-wismo-primary/20 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-sm text-wismo-text placeholder:text-wismo-text-light leading-relaxed min-h-[24px] max-h-48 overflow-y-auto"
                placeholder={t('composer_placeholder')}
                value={message}
                onChange={e => { setMessage(e.target.value); resize(e.target) }}
                onKeyDown={handleKeyDown}
                disabled={isCreating}
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || isCreating}
                className="flex-shrink-0 bg-wismo-primary text-white rounded-xl w-9 h-9 flex items-center justify-center hover:bg-wismo-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label={t('send')}
              >
                {isCreating ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{t('error_generic')}</p>
            )}

            <p className="text-xs text-wismo-text-light text-center">{t('disclaimer')}</p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <AppShell>
      <NewChatView />
    </AppShell>
  )
}
