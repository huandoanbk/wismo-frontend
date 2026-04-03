import { describe, it, expect } from 'vitest'
import { mockMessages } from '@/mocks/messages'
import { mockCases } from '@/mocks/cases'
import type { FrontendState, Message, Case } from '@/types/api'

const FRONTEND_STATES: FrontendState[] = [
  'normal',
  'show_hotline_inline',
  'show_hotline_overlay',
  'show_info_banner',
  'reconnecting',
  'interrupted',
  'recover_final_available',
  'regenerate_required',
]

describe('api types', () => {
  it('test_frontend_state_has_8_values', () => {
    expect(FRONTEND_STATES).toHaveLength(8)
  })

  it('test_mock_messages_conform_interface', () => {
    mockMessages.forEach((m: Message) => {
      expect(m).toHaveProperty('id')
      expect(m).toHaveProperty('role')
      expect(m).toHaveProperty('content')
      expect(m).toHaveProperty('created_at')
      expect(['user', 'assistant']).toContain(m.role)
    })
    expect(mockMessages).toHaveLength(8)
  })

  it('test_mock_cases_conform_interface', () => {
    mockCases.forEach((c: Case) => {
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('status')
      expect(['active', 'resolved', 'paused']).toContain(c.status)
    })
    const statuses = mockCases.map(c => c.status)
    expect(statuses).toContain('active')
    expect(statuses).toContain('resolved')
    expect(statuses).toContain('paused')
  })
})
