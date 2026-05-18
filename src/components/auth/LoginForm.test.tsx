import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginForm } from './LoginForm'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// GoogleOAuthButton redirects via window.location — mock it
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

describe('LoginForm', () => {
  it('test_submit_calls_on_submit_with_data', () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} isLoading={false} error={null} onGoogleCredential={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('placeholder_email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('placeholder_password'), {
      target: { value: 'secret' },
    })
    fireEvent.submit(screen.getByPlaceholderText('placeholder_email').closest('form')!)

    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret' })
  })

  it('test_error_message_displayed', () => {
    render(<LoginForm onSubmit={vi.fn()} isLoading={false} error="invalid_credentials" onGoogleCredential={vi.fn()} />)

    // mock t() returns key as-is
    expect(screen.getByRole('alert')).toHaveTextContent('invalid_credentials')
  })

  it('test_loading_disables_button', () => {
    render(<LoginForm onSubmit={vi.fn()} isLoading={true} error={null} onGoogleCredential={vi.fn()} />)

    expect(screen.getByRole('button', { name: /login_loading/i })).toBeDisabled()
  })
})
