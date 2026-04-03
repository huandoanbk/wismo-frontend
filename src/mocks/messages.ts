import type { Message } from '@/types/api'

export const mockMessages: Message[] = [
  { id: 'm1', role: 'user',      content: 'Xin chào, tôi cần hỗ trợ.', created_at: '2024-01-01T10:00:00Z' },
  { id: 'm2', role: 'assistant', content: 'Chào bạn, tôi ở đây để lắng nghe.', created_at: '2024-01-01T10:00:05Z', turn_id: 't1' },
  { id: 'm3', role: 'user',      content: 'Dạo này tôi rất căng thẳng.', created_at: '2024-01-01T10:01:00Z' },
  { id: 'm4', role: 'assistant', content: 'Bạn có thể kể thêm không?', created_at: '2024-01-01T10:01:10Z', turn_id: 't2' },
  { id: 'm5', role: 'user',      content: 'Công việc áp lực quá.', created_at: '2024-01-01T10:02:00Z' },
  { id: 'm6', role: 'assistant', content: 'Tôi hiểu. Điều gì khiến bạn áp lực nhất?', created_at: '2024-01-01T10:02:08Z', turn_id: 't3' },
  { id: 'm7', role: 'user',      content: 'Deadline liên tục, sếp khó tính.', created_at: '2024-01-01T10:03:00Z' },
  { id: 'm8', role: 'assistant', content: 'Cảm ơn bạn đã chia sẻ.', created_at: '2024-01-01T10:03:12Z', turn_id: 't4', feedback: 1 },
]
