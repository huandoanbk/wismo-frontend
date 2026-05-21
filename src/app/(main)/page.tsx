'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { GoogleOneTap } from '@/components/auth/GoogleOneTap'
import { ConsentModal } from '@/components/consent/ConsentModal'
import { withQueryParams } from '@/lib/authRoute'
import type { GuestInitResponse, CreateChatResponse } from '@/types/api'

type PageStatus = 'idle' | 'loading' | 'consent' | 'declined' | 'error'

export default function LandingPage() {
  const t = useTranslations('landing')
  const router = useRouter()
  const { user, sessionState, consentState, isLoadingSession, googleLogin } = useAuth()

  // Registered users with accepted consent skip the landing page and go straight to chat.
  useEffect(() => {
    if (isLoadingSession) return
    if (user && !user.is_guest) {
      router.replace('/chat')
    }
  }, [isLoadingSession, user, router])
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<PageStatus>('idle')

  async function createChatAndNavigate() {
    const res = await apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ opening_input_text: message }),
    })
    if (!res.ok) {
      setStatus('error')
      return
    }
    const data: CreateChatResponse = await res.json()
    router.push(`/chat/${data.chat.chat_id}`)
  }

  async function handleSubmit() {
    if (!message.trim() || status === 'loading') return
    setStatus('loading')

    try {
      if (sessionState === 'registered' && consentState === 'required') {
        router.push(withQueryParams('/consent', { mode: 'reconsent' }))
        setStatus('idle')
        return
      }

      // Already have an active session — create chat directly
      const hasSession =
        (sessionState === 'registered' && consentState === 'accepted') ||
        (sessionState === 'guest' && consentState === 'accepted')

      if (hasSession) {
        await createChatAndNavigate()
        return
      }

      // No session — guest init first
      const res = await apiFetch('/api/accounts/guest/init', { method: 'POST' })
      if (!res.ok) {
        setStatus('error')
        return
      }
      const data: GuestInitResponse = await res.json()
      if (data.next_action === 'accept_consent') {
        setStatus('consent')
      } else {
        await createChatAndNavigate()
      }
    } catch {
      setStatus('error')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  async function handleConsented() {
    setStatus('loading')
    try {
      await createChatAndNavigate()
    } catch {
      setStatus('error')
    }
  }

  function handleDeclined() {
    setStatus('declined')
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24">
      {/* Hero */}
      <div className="text-center mb-10 max-w-xl">
        <h1 className="text-3xl sm:text-[2.75rem] font-bold text-wismo-text mb-4 leading-tight tracking-tight">
          {t('headline')}
        </h1>
        <p className="text-wismo-text-muted text-base sm:text-lg leading-relaxed">
          {t('subheadline')}
        </p>
      </div>

      {status === 'declined' ? (
        <div className="w-full max-w-xl text-center py-8 space-y-4">
          <p className="text-wismo-text text-base">{t('decline_notice')}</p>
          <button
            onClick={() => {
              setStatus('idle')
              setMessage('')
            }}
            className="text-sm text-wismo-primary underline hover:text-wismo-primary-hover"
          >
            {t('decline_back')}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xl bg-white rounded-2xl border border-wismo-border shadow-sm p-4">
          <textarea
            className="w-full border-0 outline-none text-wismo-text placeholder:text-wismo-text-light bg-transparent resize-none text-base leading-relaxed disabled:opacity-60"
            rows={3}
            placeholder={t('input_placeholder')}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={status === 'loading'}
          />
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-wismo-border-light">
            {status === 'error' && (
              <p className="flex-1 text-sm text-red-600">{t('init_error')}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || status === 'loading'}
              className="bg-wismo-primary text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-wismo-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'loading' ? t('submit_loading') : t('submit')}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 max-w-xl text-center text-xs text-wismo-text-light leading-relaxed">
        {t('disclaimer')}
      </p>

      <ConsentModal
        isOpen={status === 'consent'}
        onConsented={handleConsented}
        onDeclined={handleDeclined}
      />
      {!user && !isLoadingSession && (
        <GoogleOneTap onCredential={googleLogin} />
      )}
    </div>
  )
}
