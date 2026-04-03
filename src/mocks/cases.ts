import type { Case } from '@/types/api'

export const mockCases: Case[] = [
  { id: 'c1', title: 'Căng thẳng công việc', status: 'active',   created_at: '2024-01-01T09:00:00Z', updated_at: '2024-01-01T10:03:00Z', message_count: 8 },
  { id: 'c2', title: 'Mối quan hệ gia đình', status: 'paused',   created_at: '2023-12-15T09:00:00Z', updated_at: '2023-12-20T14:00:00Z', message_count: 12 },
  { id: 'c3', title: 'Lo âu thi cử',         status: 'resolved', created_at: '2023-11-01T09:00:00Z', updated_at: '2023-11-30T16:00:00Z', message_count: 24 },
]
