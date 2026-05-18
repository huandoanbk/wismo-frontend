'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface GuestBannerProps {
  /** Called when user dismisses the banner. */
  onDismiss: () => void
}

/**
 * Soft invitation banner for guest users to sign up.
 * Displayed at top of chat area (below header).
 * Does NOT block chat or layout — dismissable.
 * All text via i18n.
 */
export function GuestBanner({ onDismiss }: GuestBannerProps) {
  const t = useTranslations('auth')

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm">
      <span className="text-blue-700">{t('guest_banner_message')}</span>
      <div className="flex items-center gap-3">
        <Link href="/register" className="text-blue-700 font-medium hover:underline">
          {t('guest_banner_register')}
        </Link>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-blue-400 hover:text-blue-600 leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
