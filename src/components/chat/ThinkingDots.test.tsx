import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThinkingDots } from '@/components/chat/ThinkingDots'

describe('ThinkingDots', () => {
  it('renders a status with three animated dots', () => {
    const { container } = render(<ThinkingDots />)

    expect(screen.getByRole('status', { name: 'WISMO đang suy nghĩ' })).toBeTruthy()
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(3)
  })
})
