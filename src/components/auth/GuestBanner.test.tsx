import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GuestBanner } from './GuestBanner'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('GuestBanner', () => {
  it('test_renders_register_link', () => {
    render(<GuestBanner onDismiss={vi.fn()} />)

    const link = screen.getByRole('link', { name: /guest_banner_register/i })
    expect(link).toHaveAttribute('href', '/register')
  })

  it('test_dismiss_calls_on_dismiss', () => {
    const onDismiss = vi.fn()
    render(<GuestBanner onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalled()
  })
})
