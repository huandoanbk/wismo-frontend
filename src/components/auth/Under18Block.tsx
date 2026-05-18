'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

/**
 * Block screen for under-18 users.
 * Shows age restriction message + Finnish crisis resources.
 * "Quay lại" navigates to homepage, NOT /chat.
 * All text via i18n.
 */
export function Under18Block() {
  const t = useTranslations('auth')

  return (
    <div className="min-h-screen bg-wismo-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-wismo-border p-6 text-center space-y-4">
        <p className="text-base font-medium text-wismo-text">{t('under18_thanks')}</p>
        <p className="text-sm text-wismo-text-muted">{t('under18_age_limit')}</p>

        <div className="text-sm text-wismo-text-muted pt-2">
          <p className="mb-2">{t('under18_support_intro')}</p>
          <a
            href="tel:0925250111"
            className="flex items-center justify-center gap-2 text-wismo-primary font-medium mb-1"
          >
            📞 09 2525 0111
          </a>
          <a
            href="https://sekasin.fi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-wismo-primary font-medium"
          >
            💬 sekasin.fi
          </a>
        </div>

        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2 rounded-lg text-sm border border-wismo-border text-wismo-text hover:bg-gray-50"
        >
          {t('under18_back')}
        </Link>
      </div>
    </div>
  )
}
