import { describe, it, expect } from 'vitest'
import { parseSSEStream } from '../sseParser'
import type { SSEEvent } from '@/types/api'

function makeStream(lines: string[]): ReadableStream<Uint8Array> {
  const text = lines.join('\n') + '\n'
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text))
      controller.close()
    },
  })
}

describe('parseSSEStream', () => {
  it('test_parse_token_event_yields_sse_event', async () => {
    const stream = makeStream([
      'data: {"type":"token","text":"hello","request_id":"abc","schema_version":"sse.v1"}',
    ])
    const events: SSEEvent[] = []
    for await (const e of parseSSEStream(stream)) events.push(e)
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('token')
    expect(events[0].text).toBe('hello')
  })

  it('test_parse_done_event_yields_sse_event', async () => {
    const stream = makeStream([
      'data: {"type":"done","request_id":"abc","schema_version":"sse.v1"}',
    ])
    const events: SSEEvent[] = []
    for await (const e of parseSSEStream(stream)) events.push(e)
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('done')
  })

  it('test_ignores_done_string', async () => {
    const stream = makeStream(['data: [DONE]'])
    const events: SSEEvent[] = []
    for await (const e of parseSSEStream(stream)) events.push(e)
    expect(events).toHaveLength(0)
  })

  it('test_ignores_malformed_json_no_throw', async () => {
    const stream = makeStream(['data: {invalid json}'])
    const events: SSEEvent[] = []
    await expect(async () => {
      for await (const e of parseSSEStream(stream)) events.push(e)
    }).not.toThrow()
    expect(events).toHaveLength(0)
  })
})