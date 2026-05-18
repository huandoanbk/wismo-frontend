'use client'

import { useTranslations } from 'next-intl'

interface DeclineModalProps {
  isOpen: boolean
  /** "Quay lại xem lại" — close modal so user can re-read. */
  onClose: () => void
  /** "Rời khỏi trang" — navigate away from WISMO. */
  onLeave: () => void
}

/**
 * Modal shown when user clicks "Tôi không đồng ý".
 * Must display crisis resources before allowing user to leave.
 * All text via i18n.
 */
export function DeclineModal({ isOpen, onClose, onLeave }: DeclineModalProps) {
  const t = useTranslations('consent')

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <p className="text-sm text-wismo-text whitespace-pre-line">{t('decline_modal_message')}</p>

        <div className="space-y-2 text-sm">
          <a
            href="tel:0925250111"
            className="flex items-center gap-2 text-wismo-primary font-medium"
          >
            📞 {t('decline_crisis_phone_label')}: 09 2525 0111
          </a>
          <a
            href="https://sekasin.fi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-wismo-primary font-medium"
          >
            💬 {t('decline_crisis_chat_label')}: sekasin.fi
          </a>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm border border-wismo-border text-wismo-text hover:bg-gray-50"
          >
            {t('decline_modal_back')}
          </button>
          <button
            onClick={onLeave}
            className="flex-1 py-2 rounded-lg text-sm bg-gray-100 text-wismo-text-muted hover:bg-gray-200"
          >
            {t('decline_modal_leave')}
          </button>
        </div>
      </div>
    </div>
  )
}
