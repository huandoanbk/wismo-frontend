import { renderHook, act, waitFor } from '@testing-library/react'
import { useSendMessage } from './useSendMessage'

// Helper to build a fake SSE stream from event blocks
function makeStream(blocks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const block of blocks) {
        controller.enqueue(encoder.encode(block))
      }
      controller.close()
    },
  })
}

function sseBlock(eventType: string, data: unknown): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
}

function sseBlockNoTrailingDelimiter(eventType: string, data: unknown): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}`
}

function sseBlockFromDataLines(eventType: string, dataLines: string[]): string {
  return `event: ${eventType}\n${dataLines.map(line => `data: ${line}`).join('\n')}\n\n`
}

const CHAT_ID = 'chat-123'
const MESSAGE = 'hello'

describe('useSendMessage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mockOkStream(blocks: string[]) {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      body: makeStream(blocks),
    } as unknown as Response)
  }

  function mockGateError(status: number, errorCode: string) {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status,
      json: async () => ({ error: errorCode }),
    } as unknown as Response)
  }

  it('happy path: turnState transitions and completedTurns accumulate', async () => {
    mockOkStream([
      sseBlock('response', { text: 'world' }),
      sseBlock('done', { turn_id: 't1', chat_id: CHAT_ID, chat_display_name: 'My Chat', response_method: 'ASK', status: 'completed', quota_exhausted_after_turn: false }),
    ])

    const { result } = renderHook(() => useSendMessage(CHAT_ID))
    expect(result.current.turnState).toBe('idle')

    act(() => { result.current.sendMessage(MESSAGE, CHAT_ID) })
    expect(result.current.turnState).toBe('sending')
    expect(result.current.pendingTurn?.userText).toBe(MESSAGE)

    await waitFor(() => expect(result.current.turnState).toBe('done'))
    expect(result.current.pendingTurn?.assistantText).toBe('world')
    expect(result.current.completedTurns).toHaveLength(1)
    expect(result.current.completedTurns[0].userText).toBe(MESSAGE)
    expect(result.current.completedTurns[0].assistantText).toBe('world')
    expect(result.current.quotaExhausted).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('multi-turn: completedTurns accumulates correctly', async () => {
    mockOkStream([
      sseBlock('response', { text: 'reply 1' }),
      sseBlock('done', { turn_id: 't1', chat_id: CHAT_ID, chat_display_name: 'My Chat', response_method: 'ASK', status: 'completed', quota_exhausted_after_turn: false }),
    ])
    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage('msg 1', CHAT_ID) })
    expect(result.current.completedTurns).toHaveLength(1)

    mockOkStream([
      sseBlock('response', { text: 'reply 2' }),
      sseBlock('done', { turn_id: 't2', chat_id: CHAT_ID, chat_display_name: 'My Chat', response_method: 'ASK', status: 'completed', quota_exhausted_after_turn: false }),
    ])
    await act(async () => { await result.current.sendMessage('msg 2', CHAT_ID) })

    await waitFor(() => expect(result.current.completedTurns).toHaveLength(2))
    expect(result.current.completedTurns[0].userText).toBe('msg 1')
    expect(result.current.completedTurns[1].userText).toBe('msg 2')
  })

  it('gate error: sets error and turnState = error', async () => {
    mockGateError(400, 'invalid_request')
    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    expect(result.current.turnState).toBe('error')
    expect(result.current.error).toBe('invalid_request')
    expect(result.current.quotaExhausted).toBe(false)
  })

  it('quota gate error: sets quotaExhausted = true', async () => {
    mockGateError(429, 'quota_exceeded')
    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    expect(result.current.turnState).toBe('error')
    expect(result.current.error).toBe('quota_exceeded')
    expect(result.current.quotaExhausted).toBe(true)
  })

  it('quota gate error registration_required_by_quota: sets quotaExhausted = true', async () => {
    mockGateError(429, 'registration_required_by_quota')
    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    expect(result.current.quotaExhausted).toBe(true)
  })

  it('stream error event: sets error and turnState = error', async () => {
    mockOkStream([
      sseBlock('error', { error: 'llm_gateway_provider_unavailable', status_code: 503 }),
    ])
    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('error'))
    expect(result.current.error).toBe('llm_gateway_provider_unavailable')
  })

  it('abrupt close: stream ends before done event', async () => {
    // Stream closes after response event but no done event
    mockOkStream([
      sseBlock('response', { text: 'partial' }),
    ])
    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('error'))
    expect(result.current.error).toBe('stream_interrupted')
    expect(result.current.completedTurns).toHaveLength(0)
  })

  it('parses trailing done event even without final delimiter', async () => {
    mockOkStream([
      sseBlock('response', { text: 'world' }),
      sseBlockNoTrailingDelimiter('done', {
        turn_id: 't1',
        chat_id: CHAT_ID,
        chat_display_name: 'My Chat',
        response_method: 'ASK',
        status: 'completed',
        quota_exhausted_after_turn: false,
      }),
    ])

    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('done'))
    expect(result.current.error).toBeNull()
    expect(result.current.completedTurns).toHaveLength(1)
    expect(result.current.completedTurns[0].assistantText).toBe('world')
  })

  it('parses multi-line data payload in one SSE event block', async () => {
    const responseDataLines = ['{', '"text":"hello world"', '}']
    mockOkStream([
      sseBlockFromDataLines('response', responseDataLines),
      sseBlock('done', {
        turn_id: 't1',
        chat_id: CHAT_ID,
        chat_display_name: 'My Chat',
        response_method: 'ASK',
        status: 'completed',
        quota_exhausted_after_turn: false,
      }),
    ])

    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('done'))
    expect(result.current.error).toBeNull()
    expect(result.current.completedTurns).toHaveLength(1)
    expect(result.current.completedTurns[0].assistantText).toBe('hello world')
  })

  it('retry: calls sendMessage again with last message', async () => {
    mockGateError(500, 'internal_error')
    const { result } = renderHook(() => useSendMessage(CHAT_ID))
    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })
    expect(result.current.turnState).toBe('error')

    mockOkStream([
      sseBlock('response', { text: 'ok' }),
      sseBlock('done', { turn_id: 't1', chat_id: CHAT_ID, chat_display_name: 'My Chat', response_method: 'ASK', status: 'completed', quota_exhausted_after_turn: false }),
    ])
    await act(async () => { await result.current.retryLastMessage() })

    await waitFor(() => expect(result.current.turnState).toBe('done'))
    expect(result.current.completedTurns).toHaveLength(1)
  })

  it('response_key: control path has no text — assistantText null, responseKey set', async () => {
    mockOkStream([
      sseBlock('response', { response_key: 'crisis_hotline_immediate' }),
      sseBlock('done', { turn_id: 't1', chat_id: CHAT_ID, chat_display_name: 'My Chat', response_method: 'CRISIS_SAFE_ONLY', status: 'completed', quota_exhausted_after_turn: false }),
    ])

    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('done'))
    expect(result.current.completedTurns[0].responseKey).toBe('crisis_hotline_immediate')
    expect(result.current.completedTurns[0].assistantText).toBe('')
    expect(result.current.completedTurns[0].turnId).toBe('t1')
  })

  it('blocked_minor: response_key passed through, turn_id null for non-persist', async () => {
    mockOkStream([
      sseBlock('response', { response_key: 'blocked_minor' }),
      sseBlock('done', { turn_id: null, chat_id: CHAT_ID, chat_display_name: 'My Chat', response_method: 'BLOCKED_MINOR', status: 'completed', quota_exhausted_after_turn: false }),
    ])

    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('done'))
    expect(result.current.completedTurns[0].responseKey).toBe('blocked_minor')
    expect(result.current.completedTurns[0].turnId).toBeNull()
    expect(result.current.lastTurnId).toBeNull()
  })

  it('lastTurnId: set from done event', async () => {
    mockOkStream([
      sseBlock('response', { text: 'hello' }),
      sseBlock('done', { turn_id: 'turn-xyz', chat_id: CHAT_ID, chat_display_name: 'My Chat', response_method: 'ASK', status: 'completed', quota_exhausted_after_turn: false }),
    ])

    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('done'))
    expect(result.current.lastTurnId).toBe('turn-xyz')
  })

  it('chatDisplayName: set from done event', async () => {
    mockOkStream([
      sseBlock('response', { text: 'hello' }),
      sseBlock('done', { turn_id: 't1', chat_id: CHAT_ID, chat_display_name: 'Updated Title', response_method: 'ASK', status: 'completed', quota_exhausted_after_turn: false }),
    ])

    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('done'))
    expect(result.current.chatDisplayName).toBe('Updated Title')
  })

  it('response_generation_failed: sets error code, allows retry', async () => {
    mockOkStream([
      sseBlock('error', { error: 'response_generation_failed', status_code: 500 }),
    ])
    const { result } = renderHook(() => useSendMessage(CHAT_ID))

    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })

    await waitFor(() => expect(result.current.turnState).toBe('error'))
    expect(result.current.error).toBe('response_generation_failed')
    expect(result.current.completedTurns).toHaveLength(0)
  })

  it('reset on chatId change: clears completedTurns and state', async () => {
    mockOkStream([
      sseBlock('response', { text: 'hi' }),
      sseBlock('done', { turn_id: 't1', chat_id: CHAT_ID, chat_display_name: 'My Chat', response_method: 'ASK', status: 'completed', quota_exhausted_after_turn: false }),
    ])
    const { result, rerender } = renderHook(({ id }) => useSendMessage(id), {
      initialProps: { id: CHAT_ID },
    })
    await act(async () => { await result.current.sendMessage(MESSAGE, CHAT_ID) })
    await waitFor(() => expect(result.current.completedTurns).toHaveLength(1))

    rerender({ id: 'chat-456' })
    await waitFor(() => expect(result.current.completedTurns).toHaveLength(0))
    expect(result.current.turnState).toBe('idle')
  })
})
