'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useChats } from '@/hooks/chat/useChats'
import { useCreateChat } from '@/hooks/chat/useCreateChat'
import { useDeleteChat } from '@/hooks/chat/useDeleteChat'
import type { Chat } from '@/types/api'

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  refreshKey?: number
  chatNameUpdate?: { chatId: string; displayName: string }
  chatIdToRemove?: string
}

/* ─── Icons ─────────────────────────────────────────────────── */

function IconNewChat() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconAccount() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconHelp() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconLogin() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
}

function IconSignup() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
}

/* ─── NavItem ────────────────────────────────────────────────── */
/**
 * Unified nav item: icon always visible, label fades in when expanded.
 * Uses fixed left padding (icon always at ~22px) — same layout in both states.
 * Label is `absolute` when hidden so it takes no layout space.
 * Tooltip rendered only in collapsed mode.
 */
function NavItem({
  icon, label, isExpanded, href, onClick, variant = 'default',
}: {
  icon: React.ReactNode
  label: string
  isExpanded: boolean
  href?: string
  onClick?: () => void
  variant?: 'default' | 'danger' | 'primary'
}) {
  const colorClass =
    variant === 'danger'
      ? 'text-wismo-text-muted hover:text-red-600 hover:bg-red-50'
      : variant === 'primary'
      ? 'text-wismo-primary hover:bg-wismo-bg'
      : 'text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg'

  // In collapsed mode: justify-center keeps the icon centred within the narrow sidebar.
  // In expanded mode: justify-start + label margin gives icon → label row.
  const baseClass = `group/nav relative flex items-center rounded-xl transition-colors cursor-pointer w-full px-3 py-2.5
    ${isExpanded ? 'justify-start' : 'justify-center'}
    ${colorClass}`

  const inner = (
    <>
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>

      {/*
        Label: max-width + opacity transition so it takes no space when hidden.
        ml-3 transitions with it so the gap doesn't flicker.
        No parent overflow-hidden needed — label clips itself via overflow-hidden.
      */}
      <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
        isExpanded ? 'max-w-[160px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'
      }`}>
        {label}
      </span>

      {/* Tooltip: CSS hover, only in collapsed mode. Extends outside sidebar — requires no parent overflow-hidden. */}
      {!isExpanded && (
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50 bg-gray-900 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-[opacity,visibility] duration-150">
          {label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
        </span>
      )}
    </>
  )

  if (href) return <Link href={href} className={baseClass}>{inner}</Link>
  return <button onClick={onClick} className={baseClass}>{inner}</button>
}

/* ─── Chat list item with hover "⋯" menu ────────────────────── */
/**
 * Dropdown is rendered via portal so it escapes the `overflow-y-auto` nav.
 * Position is calculated from the button's bounding rect (fixed coords).
 */
function ChatListItem({
  chat,
  onRemove,
  onMobileClose,
}: {
  chat: Chat
  onRemove: (chatId: string) => void
  onMobileClose: () => void
}) {
  const t = useTranslations('chat')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const { deleteChat, isDeleting } = useDeleteChat()
  const router = useRouter()
  const pathname = usePathname()

  // Close on outside mousedown
  useEffect(() => {
    if (!menuOpen) return
    const handler = () => setMenuOpen(false)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleOpenMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setMenuOpen(v => !v)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await deleteChat(chat.chat_id)
    if (ok) {
      setMenuOpen(false)
      onRemove(chat.chat_id)
      if (pathname === `/chat/${chat.chat_id}`) {
        router.push('/chat')
      }
    }
  }

  return (
    <div className="group relative flex items-center rounded-xl hover:bg-wismo-bg transition-colors mb-0.5">
      <Link
        href={`/chat/${chat.chat_id}`}
        onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) onMobileClose() }}
        className="flex flex-col flex-1 min-w-0 px-3 py-2.5"
      >
        <p className="text-sm font-medium text-wismo-text truncate">{chat.chat_display_name}</p>
        <p className="text-xs text-wismo-text-light mt-0.5">
          {new Date(chat.last_activity_at).toLocaleDateString()}
        </p>
      </Link>

      {/* ⋯ button — visible on hover / focus */}
      <button
        ref={btnRef}
        onMouseDown={e => e.stopPropagation()} // prevent document handler from firing on open
        onClick={handleOpenMenu}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 mr-1.5 p-1.5 rounded-lg cursor-pointer text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-border/60 transition-[opacity,color,background-color]"
        aria-label={t('chat_options')}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {/* Portal dropdown — escapes overflow-y-auto nav clip */}
      {menuOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[200] w-36 bg-white rounded-xl shadow-lg border border-wismo-border py-1"
          style={{ top: menuPos.top, right: menuPos.right }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isDeleting ? t('delete_deleting') : t('delete_this_chat')}
          </button>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ─── Help submenu ───────────────────────────────────────────── */
/**
 * Portal-based flyout so it escapes any overflow/clip ancestor.
 * `bottom` is calculated from the trigger's bounding rect so the submenu
 * bottom edge aligns with the trigger bottom and opens upward — always visible.
 */
function HelpMenu({ isExpanded }: { isExpanded: boolean }) {
  const tn = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 0, bottom: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => setOpen(false), 120)
  }

  const handleMouseEnter = () => {
    cancelClose()
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect()
      setPos({ left: r.right + 8, bottom: window.innerHeight - r.bottom })
    }
    setOpen(true)
  }

  return (
    <div ref={containerRef} onMouseEnter={handleMouseEnter} onMouseLeave={scheduleClose}>
      <button
        className={`flex items-center rounded-xl transition-colors cursor-pointer w-full px-3 py-2.5 text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg ${
          isExpanded ? 'justify-start gap-3' : 'justify-center'
        }`}
        aria-label={tn('help')}
      >
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center"><IconHelp /></span>
        {isExpanded && (
          <>
            <span className="text-sm font-medium flex-1 text-left">{tn('help')}</span>
            <svg className="w-3.5 h-3.5 text-wismo-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[200] bg-white rounded-xl shadow-lg border border-wismo-border py-1 min-w-[180px]"
          style={{ left: pos.left, bottom: pos.bottom }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <Link href="/about" className="block px-4 py-2.5 text-sm text-wismo-text hover:bg-wismo-bg transition-colors">{tn('about')}</Link>
          <Link href="/contact" className="block px-4 py-2.5 text-sm text-wismo-text hover:bg-wismo-bg transition-colors">{tn('contact')}</Link>
          <div className="my-1 border-t border-wismo-border" />
          <Link href="/privacy" className="block px-4 py-2.5 text-sm text-wismo-text hover:bg-wismo-bg transition-colors">{tn('privacy_policy')}</Link>
          <Link href="/disclosure" className="block px-4 py-2.5 text-sm text-wismo-text hover:bg-wismo-bg transition-colors">{tn('disclosure_policy')}</Link>
          <Link href="/usage-policy" className="block px-4 py-2.5 text-sm text-wismo-text hover:bg-wismo-bg transition-colors">{tn('usage_policy')}</Link>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ─── Sidebar content (single component, CSS-driven expand) ──── */
interface SidebarContentProps {
  isExpanded: boolean
  onToggle: () => void
  chats: Chat[]
  isLoadingChats: boolean
  onNewChat: () => void
  isCreating: boolean
  onRemoveChat: (chatId: string) => void
}

function SidebarContent({ isExpanded, onToggle, chats, isLoadingChats, onNewChat, isCreating, onRemoveChat }: SidebarContentProps) {
  const t = useTranslations('chat')
  const tn = useTranslations('nav')
  const { user, sessionUser, sessionState, logout } = useAuth()
  const isGuest = sessionState !== 'registered'
  const displayName = user?.display_name || sessionUser?.display_name || sessionUser?.email?.split('@')[0] || ''

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="h-14 relative border-b border-wismo-border flex-shrink-0">
        {/* Collapsed: small icon logo centred */}
        <div className={`absolute inset-0 flex items-center justify-center transition-[opacity,visibility] duration-200 ${
          isExpanded ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'
        }`}>
          <Link href="/">
            <Image src="/small-logo.png" alt="WISMO" width={28} height={28} className="w-7 h-7" />
          </Link>
        </div>
        {/* Expanded: full logo left + mobile close right */}
        <div className={`absolute inset-0 flex items-center px-3 gap-2 transition-[opacity,visibility] duration-200 ${
          isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}>
          <Link href="/" className="flex items-center flex-1">
            <Image src="/logo.png" alt="WISMO" height={26} width={84} className="h-[26px] w-auto" />
          </Link>
          <button
            onClick={onToggle}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg transition-colors flex-shrink-0"
            aria-label={t('close_sidebar')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── New Chat ── */}
      <div className="px-2 pt-3 pb-2 flex-shrink-0">
        {isExpanded ? (
          <button
            onClick={onNewChat}
            disabled={isCreating}
            className="w-full flex items-center gap-2 text-sm font-semibold text-white bg-wismo-primary rounded-xl px-4 py-2.5 hover:bg-wismo-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t('new_chat')}
          </button>
        ) : (
          <div className="group/nav relative flex items-center justify-center w-full px-3 py-2.5">
            <button
              onClick={onNewChat}
              disabled={isCreating}
              className="group/btn relative w-9 h-9 flex items-center justify-center rounded-xl text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconNewChat />
              <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50 bg-gray-900 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-[opacity,visibility] duration-150">
                {t('new_chat')}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Chat list — fades in when expanded ── */}
      <nav
        className={`flex-1 overflow-y-auto py-1 px-2 transition-[opacity,visibility] duration-200 ${
          isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {isLoadingChats ? (
          <div className="flex flex-col gap-1 px-2 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 rounded-xl bg-wismo-bg animate-pulse" />
            ))}
          </div>
        ) : (
          chats.map(chat => (
            <ChatListItem
              key={chat.chat_id}
              chat={chat}
              onRemove={onRemoveChat}
              onMobileClose={onToggle}
            />
          ))
        )}
      </nav>

      {/* ── Footer nav ── */}
      <div className="border-t border-wismo-border px-2 py-3 flex flex-col gap-1 flex-shrink-0">
        <HelpMenu isExpanded={isExpanded} />

        {isGuest ? (
          <>
            <NavItem icon={<IconLogin />} label={tn('login')} isExpanded={isExpanded} href="/login" />
            <NavItem icon={<IconSignup />} label={tn('register')} isExpanded={isExpanded} href="/register" variant="primary" />
          </>
        ) : (
          <>
            <NavItem icon={<IconAccount />} label={t('account')} isExpanded={isExpanded} href="/account" />
            <NavItem icon={<IconLogout />} label={t('logout')} isExpanded={isExpanded} onClick={logout} variant="danger" />
          </>
        )}
      </div>

      {/* ── User profile row (registered only) ── */}
      {!isGuest && displayName && (
        <div className="border-t border-wismo-border px-3 py-3 flex items-center gap-3 flex-shrink-0 overflow-hidden">
          <span className="w-7 h-7 rounded-full bg-wismo-primary text-white text-xs font-semibold flex items-center justify-center uppercase flex-shrink-0">
            {displayName.charAt(0)}
          </span>
          <span className={`text-sm font-medium text-wismo-text truncate transition-[opacity,visibility] duration-200 ${
            isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible absolute pointer-events-none'
          }`}>
            {displayName}
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Main export ────────────────────────────────────────────── */

export function ChatSidebar({ isOpen, onToggle, refreshKey, chatNameUpdate, chatIdToRemove }: ChatSidebarProps) {
  const t = useTranslations('chat')
  const { chats, isLoading: isLoadingChats, refresh, patchChatName, removeChat } = useChats()
  const { createChat, isCreating } = useCreateChat()
  const router = useRouter()

  const prevRefreshKeyRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0 && refreshKey !== prevRefreshKeyRef.current) {
      prevRefreshKeyRef.current = refreshKey
      refresh()
    }
  }, [refreshKey, refresh])

  useEffect(() => {
    if (chatNameUpdate) patchChatName(chatNameUpdate.chatId, chatNameUpdate.displayName)
  }, [chatNameUpdate, patchChatName])

  useEffect(() => {
    if (chatIdToRemove) removeChat(chatIdToRemove)
  }, [chatIdToRemove, removeChat])

  const handleNewChat = async () => {
    const chat = await createChat()
    if (chat) {
      refresh()
      router.push(`/chat/${chat.chat_id}`)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden backdrop-blur-sm"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/*
        Desktop: sticky sidebar with max-width transition (60px ↔ 260px).
        Mobile: fixed drawer that slides in/out with transform.
        The aside itself has no overflow-hidden so the edge expand-btn can protrude.
      */}
      <aside
        className={`
          flex-shrink-0 bg-white border-r border-wismo-border
          fixed inset-y-0 left-0 z-30 w-64
          md:relative md:inset-auto md:z-auto md:w-auto md:min-w-[60px]
          transition-[transform] md:transition-[max-width] duration-200 ease-in-out
          ${isOpen
            ? 'translate-x-0 md:max-w-[260px]'
            : '-translate-x-full md:translate-x-0 md:max-w-[60px]'
          }
        `}
      >
        {/* Inner content wrapper */}
        <div className="flex flex-col h-full">
          <SidebarContent
            isExpanded={isOpen}
            onToggle={onToggle}
            chats={chats}
            isLoadingChats={isLoadingChats}
            onNewChat={handleNewChat}
            isCreating={isCreating}
            onRemoveChat={removeChat}
          />
        </div>

        {/*
          Edge expand/collapse button — desktop only.
          Positioned absolute so it protrudes past the sidebar's right border.
          Chevron rotates 180° when expanded.
        */}
        <button
          onClick={onToggle}
          className="
            absolute top-5 -right-3.5 z-10
            w-7 h-7 rounded-full bg-white border border-wismo-border shadow-md
            items-center justify-center
            text-wismo-text-muted hover:text-wismo-text hover:bg-wismo-bg
            transition-colors
            hidden md:flex
          "
          aria-label={isOpen ? t('close_sidebar') : t('open_sidebar')}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </aside>
    </>
  )
}
