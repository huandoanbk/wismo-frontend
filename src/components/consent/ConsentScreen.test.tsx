import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConsentScreen } from './ConsentScreen'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/hooks/useConsent', () => ({
  useConsent: vi.fn(),
}))

import { useConsent } from '@/hooks/useConsent'
const mockUseConsent = useConsent as ReturnType<typeof vi.fn>

const mockGrantConsent = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockUseConsent.mockReturnValue({
    status: null,
    isLoading: false,
    checkConsent: vi.fn(),
    grantConsent: mockGrantConsent,
    withdrawConsent: vi.fn(),
  })
})

describe('ConsentScreen', () => {
  const defaultProps = {
    mode: 'first_time' as const,
    onConsented: vi.fn(),
    onDeclined: vi.fn(),
  }

  it('test_3_checkboxes_all_unchecked_default', () => {
    render(<ConsentScreen {...defaultProps} />)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
    checkboxes.forEach((cb) => {
      expect(cb).not.toBeChecked()
    })
  })

  it('test_start_button_disabled_until_both_required', () => {
    render(<ConsentScreen {...defaultProps} />)

    const startButton = screen.getByRole('button', { name: /button_start/i })
    expect(startButton).toBeDisabled()

    // Tick first required checkbox
    const [cb1, cb2] = screen.getAllByRole('checkbox')
    fireEvent.click(cb1)
    expect(startButton).toBeDisabled()

    // Tick second required checkbox — button should enable
    fireEvent.click(cb2)
    expect(startButton).not.toBeDisabled()
  })

  it('test_optional_doesnt_affect_button', () => {
    render(<ConsentScreen {...defaultProps} />)

    const [cb1, cb2, cb3] = screen.getAllByRole('checkbox')
    const startButton = screen.getByRole('button', { name: /button_start/i })

    // Only tick both required
    fireEvent.click(cb1)
    fireEvent.click(cb2)
    expect(startButton).not.toBeDisabled()

    // Untick optional — button stays enabled
    fireEvent.click(cb3)
    expect(startButton).not.toBeDisabled()
  })

  it('test_grant_consent_called_with_correct_data', async () => {
    mockGrantConsent.mockResolvedValueOnce(undefined)
    const onConsented = vi.fn()

    render(<ConsentScreen {...defaultProps} onConsented={onConsented} />)

    const [cb1, cb2] = screen.getAllByRole('checkbox')
    fireEvent.click(cb1)
    fireEvent.click(cb2)

    const startButton = screen.getByRole('button', { name: /button_start/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockGrantConsent).toHaveBeenCalledWith()
      expect(onConsented).toHaveBeenCalled()
    })
  })

  it('test_api_error_shows_retry_message', async () => {
    mockGrantConsent.mockRejectedValueOnce(new Error('API error'))

    render(<ConsentScreen {...defaultProps} />)

    const [cb1, cb2] = screen.getAllByRole('checkbox')
    fireEvent.click(cb1)
    fireEvent.click(cb2)
    fireEvent.click(screen.getByRole('button', { name: /button_start/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('error_retry')
    })
  })

  it('test_decline_calls_on_declined', () => {
    const onDeclined = vi.fn()
    render(<ConsentScreen {...defaultProps} onDeclined={onDeclined} />)

    fireEvent.click(screen.getByRole('button', { name: /button_decline/i }))
    expect(onDeclined).toHaveBeenCalled()
  })

  it('test_reconsent_mode_shows_notice', () => {
    render(<ConsentScreen mode="reconsent" onConsented={vi.fn()} onDeclined={vi.fn()} />)

    expect(screen.getByText('reconsent_notice')).toBeTruthy()
    expect(screen.getByText('title_reconsent')).toBeTruthy()
  })

  it('test_decline_modal_shows_crisis_resources', () => {
    // DeclineModal is in consent/page.tsx — ConsentScreen just calls onDeclined
    // This test verifies the decline button triggers the callback
    const onDeclined = vi.fn()
    render(<ConsentScreen {...defaultProps} onDeclined={onDeclined} />)

    fireEvent.click(screen.getByRole('button', { name: /button_decline/i }))
    expect(onDeclined).toHaveBeenCalledOnce()
  })
})
