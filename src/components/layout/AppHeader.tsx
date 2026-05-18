'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'

const LOCALES = ['en', 'fi'] as const
type Locale = (typeof LOCALES)[number]

export function AppHeader() {
  const t = useTranslations('nav')
  const { user, sessionUser, sessionState, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [activeLocale, setActiveLocale] = useState<Locale>('en')

  // Read current locale from cookie after mount
  useEffect(() => {
    const match = document.cookie.match(/WISMO_LOCALE=([^;]+)/)
    const val = match?.[1]
    if (val && (LOCALES as readonly string[]).includes(val)) {
      setActiveLocale(val as Locale)
    }
  }, [])

  function handleLocaleChange(locale: Locale) {
    if (locale === activeLocale) return
    setActiveLocale(locale)
    // Let the transition render before reload
    setTimeout(() => {
      document.cookie = `WISMO_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`
      window.location.reload()
    }, 180)
  }

  const displayName = user?.display_name || sessionUser?.display_name || sessionUser?.email?.split('@')[0] || 'User'
  const isRegisteredSession = sessionState === 'registered'

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!isUserMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isUserMenuOpen])

  return (
    <>
      <header className="bg-white border-b border-wismo-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image src="/logo.png" alt="WISMO" height={36} width={116} className="h-9 w-auto" priority />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-wismo-text-muted">
              {isRegisteredSession && (
                <Link href="/chat" className="hover:text-wismo-text transition-colors">{t('chat')}</Link>
              )}
              <Link href="/about" className="hover:text-wismo-text transition-colors">{t('about')}</Link>
              <Link href="/contact" className="hover:text-wismo-text transition-colors">{t('contact')}</Link>
            </nav>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-0.5 bg-wismo-bg border border-wismo-border rounded-lg p-0.5">
                {LOCALES.map(locale => (
                  <button
                    key={locale}
                    onClick={() => handleLocaleChange(locale)}
                    className={`px-2.5 py-1 rounded-md uppercase text-xs font-semibold tracking-wide transition-all duration-200 ${
                      locale === activeLocale
                        ? 'bg-wismo-primary text-white'
                        : 'text-wismo-text-muted hover:text-wismo-text'
                    }`}
                  >
                    {locale}
                  </button>
                ))}
              </div>

              {isRegisteredSession ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(v => !v)}
                    className="flex items-center gap-1.5 text-sm font-medium text-wismo-text hover:text-wismo-primary transition-colors"
                  >
                    <span>Hi, {displayName}</span>
                    <svg className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-wismo-border py-1 z-50">
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-wismo-text hover:bg-wismo-bg transition-colors"
                      >
                        {t('account')}
                      </Link>
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-wismo-text hover:bg-wismo-bg transition-colors"
                      >
                        {t('settings')}
                      </Link>
                      <hr className="my-1 border-wismo-border" />
                      <button
                        onClick={() => { setIsUserMenuOpen(false); logout() }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-wismo-text-muted hover:text-wismo-text transition-colors">
                    {t('login')}
                  </Link>
                  <Link href="/register" className="text-sm font-medium bg-wismo-primary text-white rounded-xl px-4 py-2 hover:bg-wismo-primary-hover transition-colors shadow-sm">
                    {t('register')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg transition-colors"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-wismo-border flex-shrink-0">
          <Image src="/logo.png" alt="WISMO" height={28} width={90} className="h-7 w-auto" />
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 py-4">
          {[
            ...(isRegisteredSession ? [{ href: '/chat', label: t('chat') }] : []),
            { href: '/about', label: t('about') },
            { href: '/contact', label: t('contact') },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-wismo-text-muted hover:text-wismo-text px-3 py-3 rounded-xl hover:bg-wismo-bg transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 flex flex-col gap-2 border-t border-wismo-border pt-4">
          {isRegisteredSession ? (
            <>
              <p className="text-sm font-medium text-wismo-text px-1 pb-1">Hi, {displayName}</p>
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="text-center text-sm font-medium text-wismo-text border border-wismo-border rounded-xl px-4 py-2.5 hover:bg-wismo-bg transition-colors"
              >
                {t('account')}
              </Link>
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="text-center text-sm font-medium text-wismo-text border border-wismo-border rounded-xl px-4 py-2.5 hover:bg-wismo-bg transition-colors"
              >
                {t('settings')}
              </Link>
              <button
                onClick={() => { setIsOpen(false); logout() }}
                className="text-center text-sm font-medium text-red-600 border border-red-200 rounded-xl px-4 py-2.5 hover:bg-red-50 transition-colors"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-center text-sm font-medium text-wismo-text border border-wismo-border rounded-xl px-4 py-2.5 hover:bg-wismo-bg transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="text-center text-sm font-medium bg-wismo-primary text-white rounded-xl px-4 py-2.5 hover:bg-wismo-primary-hover transition-colors shadow-sm"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-center gap-0.5 bg-wismo-bg border border-wismo-border rounded-lg p-0.5">
            {LOCALES.map(locale => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`flex-1 py-1.5 rounded-md uppercase text-xs font-semibold tracking-wide transition-all duration-200 ${
                  locale === activeLocale
                    ? 'bg-wismo-primary text-white'
                    : 'text-wismo-text-muted hover:text-wismo-text'
                }`}
              >
                {locale}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
