'use client'

import { useTranslations } from 'next-intl'

interface ConsentCheckboxProps {
  /** Unique id for the checkbox input. */
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Label text — passed pre-translated from parent. */
  label: string
  /** Required checkbox: badge shows 'badge_required', else 'badge_optional'. */
  required: boolean
}

/**
 * Single consent checkbox — never pre-ticked (GDPR requirement).
 * Badge text via i18n — not hardcoded.
 */
export function ConsentCheckbox({ id, checked, onChange, label, required }: ConsentCheckboxProps) {
  const t = useTranslations('consent')

  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-wismo-border text-wismo-primary focus:ring-wismo-primary flex-shrink-0"
      />
      <span className="text-sm text-wismo-text leading-relaxed">
        {label}{' '}
        <span className="text-wismo-text-muted text-xs">
          ({required ? t('badge_required') : t('badge_optional')})
        </span>
      </span>
    </label>
  )
}
