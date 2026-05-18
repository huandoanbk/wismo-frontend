'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { useTranslations } from 'next-intl'

interface ComposerProps {
  onSubmit: (message: string) => void
  /** Full disable — quota exhausted. Textarea and button both inert. */
  disabled?: boolean
  /** Processing state — textarea stays enabled for pre-typing; button shows Stop icon. */
  isProcessing?: boolean
}

export function Composer({ onSubmit, disabled = false, isProcessing = false }: ComposerProps) {
  const t = useTranslations('chat')
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  /**
   * Keep textarea height in sync with current value after each render.
   * This guarantees the composer collapses back immediately after submit.
   */
  useLayoutEffect(() => {
    if (textareaRef.current) {
      resize(textareaRef.current)
    }
  }, [value])

  /**
   * Ensure initial render is single-line even if browser restores form state.
   */
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [])

  function handleChange(nextValue: string) {
    setValue(nextValue)
  }

  function handleSubmit() {
    if (!value.trim() || disabled || isProcessing) return
    onSubmit(value.trim())
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="bg-wismo-bg border border-wismo-border rounded-2xl flex items-center gap-2 px-4 py-3 focus-within:border-wismo-primary focus-within:ring-2 focus-within:ring-wismo-primary/20 transition-all">
      <textarea
        ref={textareaRef}
        className="flex-1 resize-none bg-transparent outline-none text-sm text-wismo-text placeholder:text-wismo-text-light leading-relaxed self-end min-h-[20px] max-h-48 overflow-y-auto disabled:opacity-60"
        rows={1}
        placeholder={t('composer_placeholder')}
        value={value}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {isProcessing ? (
        <button
          disabled
          className="flex-shrink-0 bg-wismo-text-muted/30 text-wismo-text-muted rounded-xl w-9 h-9 flex items-center justify-center cursor-not-allowed self-end"
          aria-label="Processing"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="10" height="10" rx="1.5" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="flex-shrink-0 bg-wismo-primary text-white rounded-xl w-9 h-9 flex items-center justify-center hover:bg-wismo-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
          aria-label={t('send')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
