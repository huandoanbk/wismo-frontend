'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useProfile } from '@/hooks/useProfile'
import { useConsent } from '@/hooks/useConsent'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import type { ChangePasswordResponse, AddPasswordResponse, DeleteAllChatResponse } from '@/types/api'

// ─── Language selector helpers ──────────────────────────────────

function getCurrentLocale(): string {
  if (typeof document === 'undefined') return 'en'
  const match = document.cookie.match(/(?:^|;\s*)WISMO_LOCALE=([^;]+)/)
  return match?.[1] ?? 'en'
}

function setLocale(locale: string) {
  document.cookie = `WISMO_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`
  window.location.reload()
}

// ─── Delete confirm modal ───────────────────────────────────────

interface ConfirmDeleteModalProps {
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
  deleteError: string | null
}

function ConfirmDeleteModal({ onConfirm, onCancel, isDeleting, deleteError }: ConfirmDeleteModalProps) {
  const t = useTranslations('account')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-base font-semibold text-wismo-text">{t('delete_chat_confirm_title')}</h3>
        <p className="text-sm text-wismo-text-muted">{t('delete_chat_confirm_body')}</p>
        {deleteError && (
          <p className="text-sm text-red-600">{t('delete_chat_error')}</p>
        )}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-wismo-border px-4 py-2.5 text-sm font-medium text-wismo-text hover:bg-wismo-bg transition-colors disabled:opacity-40"
          >
            {t('delete_chat_confirm_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {isDeleting ? t('delete_chat_deleting') : t('delete_chat_confirm_yes')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────

export default function AccountPage() {
  const t = useTranslations('account')
  const router = useRouter()
  const { consentState } = useAuth()
  const { profile, isLoading, error: loadError, isSaving, saveError, updateDisplayName } = useProfile()
  const { withdrawConsent, isLoading: isWithdrawing } = useConsent()

  // ── Profile state ──
  const [displayName, setDisplayName] = useState('')
  const [locale, setLocaleState] = useState('en')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync displayName when profile loads
  useEffect(() => {
    if (profile) setDisplayName(profile.display_name)
  }, [profile])

  // Read current locale from cookie on mount
  useEffect(() => {
    setLocaleState(getCurrentLocale())
  }, [])

  async function handleSaveProfile() {
    setSaveSuccess(false)
    const ok = await updateDisplayName(displayName)
    if (ok) setSaveSuccess(true)
  }

  // ── Password state ──
  // Canonical source: profile.has_usable_password from BE.
  // Fallback source: error-code detection for backward compatibility when field is absent.
  const [isGoogleOnlyFallback, setIsGoogleOnlyFallback] = useState(false)
  const [hasUsablePasswordOverride, setHasUsablePasswordOverride] = useState<boolean | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const effectiveHasUsablePassword = hasUsablePasswordOverride ?? profile?.has_usable_password
  const isGoogleOnly =
    effectiveHasUsablePassword === false ||
    (effectiveHasUsablePassword === undefined && isGoogleOnlyFallback)

  async function handleChangePassword() {
    setPasswordError(null)
    setPasswordSuccess(null)
    setIsChangingPassword(true)
    try {
      const res = await apiFetch('/api/accounts/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      if (res.ok) {
        const data: ChangePasswordResponse = await res.json()
        if (data.password_changed) {
          setCurrentPassword('')
          setNewPassword('')
          setPasswordSuccess(t('password_changed_success'))
        }
        return
      }
      const body = await res.json().catch(() => ({}))
      const code = (body as { error?: string })?.error ?? ''
      if (code === 'no_usable_password') {
        // Google-only account — silently switch to add-password form
        setIsGoogleOnlyFallback(true)
        setHasUsablePasswordOverride(false)
        setCurrentPassword('')
      } else {
        setPasswordError(mapPasswordError(code, t))
      }
    } catch {
      setPasswordError(t('error_password_generic'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  async function handleAddPassword() {
    setPasswordError(null)
    setPasswordSuccess(null)
    setIsChangingPassword(true)
    try {
      const res = await apiFetch('/api/accounts/add-password', {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      })
      if (res.ok) {
        const data: AddPasswordResponse = await res.json()
        if (data.password_added) {
          setNewPassword('')
          setIsGoogleOnlyFallback(false)
          setHasUsablePasswordOverride(true)
          setPasswordSuccess(t('password_added_success'))
        }
        return
      }
      const body = await res.json().catch(() => ({}))
      const code = (body as { error?: string })?.error ?? ''
      if (code === 'already_has_password') {
        // Cross-signal: account actually has a password — switch back to change form
        setIsGoogleOnlyFallback(false)
        setHasUsablePasswordOverride(true)
        setNewPassword('')
      } else {
        setPasswordError(mapPasswordError(code, t))
      }
    } catch {
      setPasswordError(t('error_password_generic'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  // ── Consent state ──
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  async function handleWithdraw() {
    setWithdrawError(null)
    const ok = await withdrawConsent()
    if (ok) {
      router.push('/')
    } else {
      setWithdrawError(t('withdraw_error'))
    }
  }

  // ── Delete chat state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDeleteConfirm() {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      const res = await apiFetch('/api/accounts/delete-all-chat', { method: 'POST' })
      if (res.ok) {
        const data: DeleteAllChatResponse = await res.json()
        if (data.erased) {
          setShowDeleteModal(false)
          router.push('/chat')
          return
        }
      }
      setDeleteError('error')
    } catch {
      setDeleteError('error')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Loading / error states ──
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-wismo-text-light text-sm">
        {t('saving')}
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center text-wismo-text-light text-sm">
        {t('error_load')}
      </div>
    )
  }

  const displayNameTooLong = displayName.length > 255

  return (
    <>
      {showDeleteModal && (
        <ConfirmDeleteModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setDeleteError(null) }}
          isDeleting={isDeleting}
          deleteError={deleteError}
        />
      )}

      <div className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-8">
          <h1 className="text-2xl font-bold text-wismo-text">{t('title')}</h1>

          {/* ── Profile section ── */}
          <section className="bg-white rounded-2xl border border-wismo-border p-6 space-y-5">
            <h2 className="text-base font-semibold text-wismo-text">{t('profile_section')}</h2>

            <div>
              <label className="block text-sm font-medium text-wismo-text mb-1.5">
                {t('display_name_label')}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setSaveSuccess(false) }}
                className="w-full border border-wismo-border rounded-xl px-4 py-2.5 text-sm text-wismo-text focus:outline-none focus:ring-2 focus:ring-wismo-primary/30 focus:border-wismo-primary"
              />
              {displayNameTooLong && (
                <p className="mt-1 text-xs text-red-600">{t('error_name_too_long')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-wismo-text mb-1.5">
                {t('email_label')}
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full border border-wismo-border rounded-xl px-4 py-2.5 text-sm text-wismo-text-muted bg-wismo-bg cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-wismo-text mb-1.5">
                {t('language_label')}
              </label>
              <select
                value={locale}
                onChange={e => { setLocaleState(e.target.value); setLocale(e.target.value) }}
                className="w-full border border-wismo-border rounded-xl px-4 py-2.5 text-sm text-wismo-text bg-white focus:outline-none focus:ring-2 focus:ring-wismo-primary/30 focus:border-wismo-primary"
              >
                <option value="en">{t('language_en')}</option>
                <option value="fi">{t('language_fi')}</option>
              </select>
            </div>

            {saveError && (
              <p className="text-sm text-red-600">{t(saveError === 'display_name_too_long' ? 'error_name_too_long' : 'error_save')}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-wismo-primary">{t('save')}</p>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={isSaving || displayNameTooLong}
              className="bg-wismo-primary text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-wismo-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? t('saving') : t('save')}
            </button>
          </section>

          {/* ── Password section ── */}
          <section className="bg-white rounded-2xl border border-wismo-border p-6 space-y-5">
            <h2 className="text-base font-semibold text-wismo-text">{t('password_section')}</h2>

            {!isGoogleOnly && (
              <div>
                <label className="block text-sm font-medium text-wismo-text mb-1.5">
                  {t('current_password_label')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => { setCurrentPassword(e.target.value); setPasswordError(null); setPasswordSuccess(null) }}
                  autoComplete="current-password"
                  className="w-full border border-wismo-border rounded-xl px-4 py-2.5 text-sm text-wismo-text focus:outline-none focus:ring-2 focus:ring-wismo-primary/30 focus:border-wismo-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-wismo-text mb-1.5">
                {t('new_password_label')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPasswordError(null); setPasswordSuccess(null) }}
                autoComplete="new-password"
                className="w-full border border-wismo-border rounded-xl px-4 py-2.5 text-sm text-wismo-text focus:outline-none focus:ring-2 focus:ring-wismo-primary/30 focus:border-wismo-primary"
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-wismo-primary">{passwordSuccess}</p>
            )}

            <button
              onClick={isGoogleOnly ? handleAddPassword : handleChangePassword}
              disabled={isChangingPassword || !newPassword || (!isGoogleOnly && !currentPassword)}
              className="bg-wismo-primary text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-wismo-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isChangingPassword
                ? t('password_saving')
                : isGoogleOnly
                  ? t('add_password_btn')
                  : t('change_password_btn')}
            </button>
          </section>

          {/* ── Privacy & Consent section ── */}
          <section className="bg-white rounded-2xl border border-wismo-border p-6 space-y-4">
            <h2 className="text-base font-semibold text-wismo-text">{t('privacy_section')}</h2>

            <div className="flex items-center justify-between">
              <span className="text-sm text-wismo-text-muted">{t('consent_status')}</span>
              <span className={`text-sm font-medium ${consentState === 'accepted' ? 'text-wismo-primary' : 'text-wismo-text-muted'}`}>
                {consentState === 'accepted' ? t('consent_accepted_badge') : t('consent_required_badge')}
              </span>
            </div>

            <div className="pt-2 border-t border-wismo-border space-y-3">
              <p className="text-xs text-wismo-text-light">{t('withdraw_note')}</p>
              {withdrawError && (
                <p className="text-sm text-red-600">{withdrawError}</p>
              )}
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || consentState !== 'accepted'}
                className="text-sm text-wismo-crisis border border-wismo-crisis/30 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? t('withdraw_withdrawing') : t('withdraw_consent')}
              </button>
            </div>
          </section>

          {/* ── Data section ── */}
          <section className="bg-white rounded-2xl border border-wismo-border p-6 space-y-4">
            <h2 className="text-base font-semibold text-wismo-text">{t('data_section')}</h2>
            <p className="text-xs text-wismo-text-light">{t('delete_chat_description')}</p>
            <button
              onClick={() => { setDeleteError(null); setShowDeleteModal(true) }}
              className="text-sm text-wismo-crisis border border-wismo-crisis/30 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors"
            >
              {t('delete_chat_btn')}
            </button>
          </section>
        </div>
      </div>
    </>
  )
}

function mapPasswordError(code: string, t: (key: string) => string): string {
  switch (code) {
    case 'invalid_current_password': return t('error_invalid_current_password')
    case 'password_too_short': return t('error_password_too_short')
    case 'password_too_common': return t('error_password_too_common')
    case 'password_entirely_numeric': return t('error_password_entirely_numeric')
    case 'password_too_similar': return t('error_password_too_similar')
    default: return t('error_password_generic')
  }
}
