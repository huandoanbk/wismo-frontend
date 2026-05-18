import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { RegisterForm } from './RegisterForm'
import type { RegisterRequest } from '@/types/api'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('./GoogleOAuthButton', () => ({
  GoogleOAuthButton: ({ label }: { label: string }) => (
    <button type="button" data-testid="google-btn">
      {label}
    </button>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function fillAndSubmit(opts: {
  email?: string
  password?: string
  confirmPassword?: string
  displayName?: string
  onSubmit?: Mock<(req: RegisterRequest) => void>
}) {
  const onSubmit: Mock<(req: RegisterRequest) => void> = opts.onSubmit ?? vi.fn()
  render(<RegisterForm onSubmit={onSubmit} isLoading={false} error={null} onGoogleCredential={vi.fn()} />)

  if (opts.displayName !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('placeholder_display_name'), {
      target: { value: opts.displayName },
    })
  }
  if (opts.email !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('placeholder_email'), {
      target: { value: opts.email },
    })
  }
  if (opts.password !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('placeholder_password'), {
      target: { value: opts.password },
    })
  }
  if (opts.confirmPassword !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('placeholder_confirm_password'), {
      target: { value: opts.confirmPassword },
    })
  }

  fireEvent.submit(screen.getByPlaceholderText('placeholder_email').closest('form')!)
  return onSubmit
}

describe('RegisterForm', () => {
  it('test_submit_calls_on_submit_with_email_and_password', () => {
    const onSubmit = fillAndSubmit({
      email: 'new@example.com',
      password: 'pass123',
      confirmPassword: 'pass123',
    })
    expect(onSubmit).toHaveBeenCalledWith({ email: 'new@example.com', password: 'pass123' })
  })

  it('test_submit_includes_display_name_when_provided', () => {
    const onSubmit = fillAndSubmit({
      displayName: 'Nguyen Van A',
      email: 'new@example.com',
      password: 'pass123',
      confirmPassword: 'pass123',
    })
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'pass123',
      display_name: 'Nguyen Van A',
    })
  })

  it('test_invalid_email_shows_error_and_blocks_submit', () => {
    const onSubmit = fillAndSubmit({
      email: 'not-an-email',
      password: 'pass123',
      confirmPassword: 'pass123',
    })
    expect(screen.getByText('error_email_invalid')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('test_password_too_short_shows_error_and_blocks_submit', () => {
    const onSubmit = fillAndSubmit({
      email: 'a@b.com',
      password: 'abc',
      confirmPassword: 'abc',
    })
    expect(screen.getByText('error_password_too_short')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('test_passwords_mismatch_shows_error_and_blocks_submit', () => {
    const onSubmit = fillAndSubmit({
      email: 'a@b.com',
      password: 'pass123',
      confirmPassword: 'different',
    })
    expect(screen.getByText('error_passwords_mismatch')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('test_error_message_displayed', () => {
    render(<RegisterForm onSubmit={vi.fn()} isLoading={false} error="email_already_registered" onGoogleCredential={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('email_already_registered')
  })

  it('test_loading_disables_button', () => {
    render(<RegisterForm onSubmit={vi.fn()} isLoading={true} error={null} onGoogleCredential={vi.fn()} />)
    expect(screen.getByRole('button', { name: /register_loading/i })).toBeDisabled()
  })

  it('test_google_button_shows_login_label', () => {
    render(<RegisterForm onSubmit={vi.fn()} isLoading={false} error={null} onGoogleCredential={vi.fn()} />)
    expect(screen.getByTestId('google-btn')).toHaveTextContent('login_google')
  })
})
