'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useConsent } from '@/hooks/useConsent'
import { ConsentCheckbox } from './ConsentCheckbox'

interface ConsentScreenProps {
  /** 'first_time': first visit. 'reconsent': policy version updated. */
  mode: 'first_time' | 'reconsent'
  /** Called after successful consent grant. */
  onConsented: () => void
  /** Called when user clicks "Tôi không đồng ý". */
  onDeclined: () => void
}

/**
 * GDPR consent screen — required before chat access.
 * 3 checkboxes (2 required, 1 optional). Never pre-ticked.
 * Re-consent mode shows reconsent_notice (amber background).
 * All copy via i18n.
 */
export function ConsentScreen({ mode, onConsented, onDeclined }: ConsentScreenProps) {
  const [chatProcessing, setChatProcessing] = useState(false)
  const [memoryStorage, setMemoryStorage] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = useTranslations('consent')
  const { grantConsent } = useConsent()

  // Button only enabled when both required checkboxes are ticked
  const canProceed = chatProcessing && memoryStorage

  const handleConsent = async () => {
    if (!canProceed) return
    setIsSubmitting(true)
    setError(null)
    try {
      await grantConsent()
      onConsented()
    } catch {
      setError(t('error_retry'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-wismo-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-wismo-border p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-wismo-text">
            {mode === 'reconsent' ? t('title_reconsent') : t('title_welcome')}
          </h1>
        </div>

        {/* Re-consent notice — only shown for reconsent mode */}
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

        {/* Checkboxes — all defaultChecked={false} per GDPR */}
        <div className="space-y-4">
          <ConsentCheckbox
            id="chat_processing"
            checked={chatProcessing}
            onChange={setChatProcessing}
            label={t('checkbox_chat_processing')}
            required
          />
          <ConsentCheckbox
            id="memory_storage"
            checked={memoryStorage}
            onChange={setMemoryStorage}
            label={t('checkbox_memory_storage')}
            required
          />
          <ConsentCheckbox
            id="analytics"
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
            className="px-4 py-2.5 rounded-lg text-sm text-wismo-text-muted border border-wismo-border hover:bg-gray-50"
          >
            {t('button_decline')}
          </button>
        </div>
      </div>
    </div>
  )
}
