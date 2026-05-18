'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { ConsentCheckbox } from './ConsentCheckbox'
import type { AcceptConsentResponse } from '@/types/api'

interface ConsentModalProps {
  isOpen: boolean
  /** first_time: guest onboarding, reconsent: registered user policy re-consent */
  mode?: 'first_time' | 'reconsent'
  /** Called after successful consent accept. */
  onConsented: () => void
  /** Called when user clicks "Tôi không đồng ý". No API call is made. */
  onDeclined: () => void
}

/**
 * Consent popup modal — shown after guest session is created on the landing page.
 * Calls POST /api/consents/accept/ on accept.
 * Decline is handled purely by the parent (no API call).
 */
export function ConsentModal({ isOpen, mode = 'first_time', onConsented, onDeclined }: ConsentModalProps) {
  const [chatProcessing, setChatProcessing] = useState(false)
  const [memoryStorage, setMemoryStorage] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = useTranslations('consent')

  const canProceed = chatProcessing && memoryStorage

  const handleConsent = async () => {
    if (!canProceed) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await apiFetch('/api/consents/accept', { method: 'POST' })
      if (!res.ok) throw new Error('consent_failed')
      // Validate response shape before proceeding
      const data: AcceptConsentResponse = await res.json()
      if (data.consent_state === 'accepted') {
        onConsented()
      } else {
        setError(t('error_retry'))
      }
    } catch {
      setError(t('error_retry'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-wismo-border p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-wismo-text">
            {mode === 'reconsent' ? t('title_reconsent') : t('title_welcome')}
          </h2>
        </div>

        {mode === 'reconsent' && (
          <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
            {t('reconsent_notice')}
          </p>
        )}

        {/* Description */}
        <div className="text-sm text-wismo-text-muted space-y-2">
          <p>{t('description_companion')}</p>
          <p className="font-medium text-red-600">{t('description_not_therapy')}</p>
          <p className="text-xs">
            {t('emergency_label')}{' '}
            <a href="tel:0925250111" className="font-medium text-wismo-primary">
              📞 09 2525 0111
            </a>
          </p>
        </div>

        <hr className="border-wismo-border" />

        {/* Checkboxes — never pre-ticked (GDPR) */}
        <div className="space-y-4">
          <ConsentCheckbox
            id="modal_chat_processing"
            checked={chatProcessing}
            onChange={setChatProcessing}
            label={t('checkbox_chat_processing')}
            required
          />
          <ConsentCheckbox
            id="modal_memory_storage"
            checked={memoryStorage}
            onChange={setMemoryStorage}
            label={t('checkbox_memory_storage')}
            required
          />
          <ConsentCheckbox
            id="modal_analytics"
            checked={analytics}
            onChange={setAnalytics}
            label={t('checkbox_analytics')}
            required={false}
          />
        </div>

        <hr className="border-wismo-border" />

        {/* Footer note */}
        <p className="text-xs text-wismo-text-light">
          {t('delete_note')}{' '}
          <a href="/privacy" className="underline hover:text-wismo-primary">
            {t('privacy_policy_link')}
          </a>
        </p>

        {/* API error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded" role="alert">
            {error}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleConsent}
            disabled={!canProceed || isSubmitting}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              canProceed && !isSubmitting
                ? 'bg-wismo-primary text-white hover:bg-wismo-primary-hover'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? t('button_loading') : t('button_start')}
          </button>

          <button
            onClick={onDeclined}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-lg text-sm text-wismo-text-muted border border-wismo-border hover:bg-gray-50 disabled:opacity-40"
          >
            {t('button_decline')}
          </button>
        </div>
      </div>
    </div>
  )
}
