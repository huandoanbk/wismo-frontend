'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ConsentScreen } from '@/components/consent/ConsentScreen'
import { DeclineModal } from '@/components/consent/DeclineModal'
import { useConsent } from '@/hooks/useConsent'

function ConsentPageInner() {
  const router = useRouter()
  const t = useTranslations('consent')
  const searchParams = useSearchParams()
  const { checkConsent } = useConsent()
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [consentCheckError, setConsentCheckError] = useState(false)

  const mode = searchParams.get('mode') === 'reconsent' ? 'reconsent' : 'first_time'

  const checkConsentStatus = async () => {
    try {
      setConsentCheckError(false)
      const data = await checkConsent()
      if (data.consent_state === 'accepted') {
        router.replace('/chat')
      }
    } catch {
      setConsentCheckError(true)
    }
  }

  useEffect(() => {
    checkConsentStatus()
  // checkConsent comes from useCallback and router is stable in app router context.
  // We intentionally run this on mount only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConsented = () => {
    router.replace('/chat')
  }

  const handleDeclined = () => {
    setShowDeclineModal(true)
  }

  const handleLeave = () => {
    window.location.href = '/'
  }

  return (
    <>
      {consentCheckError && (
        <div className="mx-auto mt-4 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start justify-between gap-3">
            <p>{t('error_retry')}</p>
            <button
              onClick={checkConsentStatus}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
            >
              {t('button_retry_status')}
            </button>
          </div>
        </div>
      )}
      <ConsentScreen mode={mode} onConsented={handleConsented} onDeclined={handleDeclined} />
      <DeclineModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onLeave={handleLeave}
      />
    </>
  )
}

/**
 * /consent route — wrapped in Suspense for useSearchParams().
 * Checks existing consent on mount — redirects to /chat if already consented_v1.
 * Supports ?mode=reconsent for policy-version re-consent flow.
 */
export default function ConsentPage() {
  return (
    <Suspense>
      <ConsentPageInner />
    </Suspense>
  )
}
