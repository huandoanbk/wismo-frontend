# Chat UX Spec — Streaming, Components & Case Switch

**Source:** WISMO Project Specification v18, Section 6.6–6.8  
**Scope:** `useChatStream`, `ChatWindow`, `MessageBubble`, `InputArea`, `ThinkingDots`, case switch UX  
**Ai đọc:** Agent làm FE.3 (streaming hook), FE.5 (performance), bất kỳ task touch chat flow

---

## 1. Streaming UX Timeline

Khi user gửi message, trải nghiệm theo thời gian:

```
0ms:         User gửi → input lock, send button disable
             → FE state: thinking

~20ms:       Server emit 'thinking'
             → Hiện ThinkingDots (○○○)

~50–250ms:   Server emit 'state(session_resolved)', 'state(case_resolved)'
             → FE update internal state, chưa hiện gì

~220–300ms:  Server emit 'state(safety_resolved)'
             → Nếu frontend_state = 'show_hotline_inline' → render HotlineBlock
             → Nếu frontend_state = 'show_hotline_overlay' → render CrisisOverlay

~700ms+:     First token arrive
             → Ẩn ThinkingDots
             → Hiện text + cursor ▊ nhấp nháy

~700–3200ms: Tokens stream dần
             → Text build theo, cursor ▊ luôn ở cuối

~3400ms:     Server emit 'state(validated)' rồi 'done'
             → Ẩn cursor ▊
             → Overwrite preview bằng done.final_text
             → Hiện 👍👎 feedback buttons
             → Input unlock, send button enable
```

**3 quy tắc bất biến:**
1. Input chỉ unlock khi nhận `done` hoặc `error`
2. `done.final_text` overwrite toàn bộ preview buffer
3. Reconnect sau disconnect → gọi `/turn-status`, không resume token stream cũ

---

## 2. useChatStream Hook

```typescript
// hooks/useChatStream.ts

import { useState, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { parseSSEStream } from '@/lib/sseParser';
import type { SSEEvent, ChatSendRequest, ChatDonePayload, FrontendState } from '@/types/api';

type StreamStatus =
  | 'idle'
  | 'thinking'
  | 'streaming_preview'
  | 'validator_review'
  | 'interrupted'
  | 'recover_final_available'
  | 'regenerate_required'
  | 'done'
  | 'error';

interface UseChatStreamReturn {
  status: StreamStatus;
  previewText: string;            // preview buffer — overwritten by done.final_text
  finalText: string | null;       // từ done.final_text — source of truth
  frontendState: FrontendState;
  turnId: string | null;
  errorMessage: string | null;
  sendMessage: (request: ChatSendRequest) => Promise<void>;
  reset: () => void;
}

/**
 * Hook quản lý toàn bộ SSE streaming lifecycle cho 1 chat turn.
 * Tất cả API call liên quan đến streaming đặt ở đây.
 * Component chỉ đọc state và gọi sendMessage / reset.
 */
export function useChatStream(): UseChatStreamReturn {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [previewText, setPreviewText] = useState('');
  const [finalText, setFinalText] = useState<string | null>(null);
  const [frontendState, setFrontendState] = useState<FrontendState>('normal');
  const [turnId, setTurnId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Buffer dùng cho performance — batch DOM update mỗi animation frame
  const previewBufferRef = useRef('');
  const rafScheduledRef = useRef(false);

  const flushPreviewBuffer = useCallback(() => {
    setPreviewText(previewBufferRef.current);
    rafScheduledRef.current = false;
  }, []);

  const appendToken = useCallback((token: string) => {
    previewBufferRef.current += token;
    // Batch update mỗi ~50ms (requestAnimationFrame) thay vì mỗi token
    if (!rafScheduledRef.current) {
      rafScheduledRef.current = true;
      requestAnimationFrame(flushPreviewBuffer);
    }
  }, [flushPreviewBuffer]);

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'thinking':
        setStatus('thinking');
        break;

      case 'state':
        if (event.frontend_state) {
          setFrontendState(event.frontend_state);
        }
        if (event.state_name === 'validated') {
          setTurnId(event.turn_id ?? null);
        }
        break;

      case 'token':
        setStatus('streaming_preview');
        appendToken(event.text ?? '');
        break;

      case 'info':
        // Validator đang regenerate — giữ preview, không unlock
        if (event.message?.includes('validation_regenerate')) {
          setStatus('validator_review');
        }
        break;

      case 'done': {
        const payload = event.meta as unknown as ChatDonePayload | undefined;
        if (payload?.final_text) {
          // done.final_text là source of truth — overwrite preview
          previewBufferRef.current = payload.final_text;
          setPreviewText(payload.final_text);
          setFinalText(payload.final_text);
        }
        setTurnId(event.turn_id ?? payload?.turn_id ?? null);
        if (payload?.frontend_state) {
          setFrontendState(payload.frontend_state);
        }
        setStatus('done');
        break;
      }

      case 'error':
        setErrorMessage(event.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
        setStatus('error');
        break;
    }
  }, [appendToken]);

  const sendMessage = useCallback(async (request: ChatSendRequest) => {
    // Reset state trước khi gửi
    setStatus('thinking');
    setPreviewText('');
    setFinalText(null);
    setFrontendState('normal');
    setTurnId(null);
    setErrorMessage(null);
    previewBufferRef.current = '';

    try {
      const response = await apiFetch('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      for await (const event of parseSSEStream(response.body)) {
        handleEvent(event);
        // Stop processing sau terminal events
        if (event.type === 'done' || event.type === 'error') break;
      }
    } catch (err) {
      // Network disconnect trong khi streaming → interrupted
      if (status === 'thinking' || status === 'streaming_preview') {
        setStatus('interrupted');
        setErrorMessage('Mất kết nối. Đang khôi phục...');
      } else {
        setStatus('error');
        setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  }, [handleEvent, status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setPreviewText('');
    setFinalText(null);
    setFrontendState('normal');
    setTurnId(null);
    setErrorMessage(null);
    previewBufferRef.current = '';
  }, []);

  return {
    status,
    previewText,
    finalText,
    frontendState,
    turnId,
    errorMessage,
    sendMessage,
    reset,
  };
}
```

---

## 3. useTurnRecovery Hook

```typescript
// hooks/useTurnRecovery.ts

/**
 * Sau khi SSE bị interrupt, gọi endpoint này để lấy canonical turn state.
 * Không bao giờ resume raw token stream cũ.
 */
export function useTurnRecovery() {
  const recover = useCallback(async (turnId: string) => {
    const res = await apiFetch(`/api/chat/turn-status?turn_id=${turnId}`);
    if (!res.ok) throw new Error('Recovery failed');
    return res.json() as Promise<TurnStatusResponse>;
  }, []);

  return { recover };
}
```

---

## 4. ChatWindow Component

```typescript
// components/chat/ChatWindow.tsx

import { Virtuoso } from 'react-virtuoso';
import type { Message } from '@/types/api';

interface ChatWindowProps {
  /** Danh sách messages đã persisted. */
  messages: Message[];
  /** Preview text đang stream (chưa final). Null khi idle. */
  streamingPreview: string | null;
  /** True khi đang ở thinking state. */
  isThinking: boolean;
  /** Gọi khi user submit message. */
  onSend: (content: string) => void;
  /** True khi input phải lock (đang streaming). */
  isInputLocked: boolean;
  /** Callback khi user click 👍/👎. */
  onFeedback: (messageId: string, rating: 1 | -1) => void;
}

/**
 * Main chat display — virtualized message list + input area.
 * Không tự fetch data. Nhận tất cả state qua props.
 */
export function ChatWindow({
  messages,
  streamingPreview,
  isThinking,
  onSend,
  isInputLocked,
  onFeedback,
}: ChatWindowProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Virtualized message list — dùng react-virtuoso để render 200+ messages mượt */}
      <Virtuoso
        className="flex-1"
        data={messages}
        followOutput="smooth"        // auto-scroll khi có message mới
        itemContent={(_, message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onFeedback={onFeedback}
          />
        )}
        components={{
          Footer: () => (
            <>
              {/* Preview text đang stream */}
              {streamingPreview && (
                <MessageBubble
                  message={{
                    id: '__preview__',
                    role: 'assistant',
                    content: streamingPreview,
                    created_at: new Date().toISOString(),
                  }}
                  isPreview
                />
              )}
              {/* Thinking indicator */}
              {isThinking && !streamingPreview && <ThinkingDots />}
            </>
          ),
        }}
      />

      {/* Input bar */}
      <InputArea onSend={onSend} isLocked={isInputLocked} />
    </div>
  );
}
```

---

## 5. MessageBubble Component

```typescript
// components/chat/MessageBubble.tsx

interface MessageBubbleProps {
  message: Pick<Message, 'id' | 'role' | 'content' | 'created_at' | 'feedback'>;
  /** True khi đây là preview buffer chưa final — không hiện feedback buttons. */
  isPreview?: boolean;
  onFeedback?: (messageId: string, rating: 1 | -1) => void;
}

/**
 * Render 1 message bubble.
 * User: bên phải, nền wismo-message-user.
 * WISMO: bên trái, nền white, có feedback buttons.
 * Preview: không có feedback, có cursor ▊ nhấp nháy.
 */
export function MessageBubble({ message, isPreview, onFeedback }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex mb-4 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-wismo-message-user text-wismo-text'
            : 'bg-white text-wismo-text border border-wismo-border'}
        `}
      >
        {/* Message content */}
        <p className="whitespace-pre-wrap">
          {message.content}
          {/* Cursor nhấp nháy chỉ khi preview */}
          {isPreview && (
            <span className="inline-block w-0.5 h-4 bg-wismo-text ml-0.5 animate-pulse" />
          )}
        </p>

        {/* Timestamp */}
        <p className="text-xs text-wismo-text-light mt-1">
          {formatTimestamp(message.created_at)}
        </p>

        {/* Feedback buttons — chỉ cho WISMO response đã final */}
        {!isUser && !isPreview && onFeedback && (
          <FeedbackButtons
            messageId={message.id}
            currentRating={message.feedback ?? null}
            onFeedback={onFeedback}
          />
        )}
      </div>
    </div>
  );
}
```

---

## 6. InputArea Component

```typescript
// components/chat/InputArea.tsx

interface InputAreaProps {
  onSend: (content: string) => void;
  isLocked: boolean;
}

/**
 * Textarea auto-resize + send button.
 * Disable khi isLocked=true (đang streaming).
 * Enter gửi, Shift+Enter xuống dòng.
 * Warning khi > 1500 ký tự.
 */
export function InputArea({ onSend, isLocked }: InputAreaProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_CHARS = 2000;
  const WARN_CHARS = 1500;

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLocked) return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length > MAX_CHARS) return;
    setValue(newValue);

    // Debounced resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="border-t border-wismo-border px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLocked}
          placeholder={isLocked ? '' : 'Chia sẻ với WISMO...'}
          rows={1}
          className={`
            flex-1 resize-none rounded-xl border border-wismo-border
            px-4 py-2 text-sm text-wismo-text bg-white
            focus:outline-none focus:ring-2 focus:ring-wismo-primary focus:border-transparent
            disabled:bg-gray-50 disabled:cursor-not-allowed
            max-h-[200px] overflow-y-auto
          `}
        />
        <button
          onClick={handleSend}
          disabled={isLocked || !value.trim()}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${isLocked || !value.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-wismo-primary text-white hover:bg-wismo-primary-hover'}
          `}
        >
          Gửi
        </button>
      </div>

      {/* Warning khi gần giới hạn */}
      {value.length >= WARN_CHARS && (
        <p className="text-xs text-wismo-text-muted mt-1 text-right">
          {value.length}/{MAX_CHARS}
        </p>
      )}
    </div>
  );
}
```

---

## 7. ThinkingDots Component

```typescript
// components/chat/ThinkingDots.tsx

/**
 * Animated loading indicator — hiện khi WISMO đang xử lý.
 * 3 dots pulse theo nhau với delay khác nhau.
 */
export function ThinkingDots() {
  return (
    <div className="flex items-start px-4 mb-4">
      <div className="bg-white border border-wismo-border rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 bg-wismo-text-muted rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Case Switch UX

User **không cần biết** "case" tồn tại. Hệ thống tự xử lý trong nền.

```
Đang chat case "Stress công việc":
User: "Hôm nay muốn nói chuyện khác"
WISMO: "Được chứ. Bạn muốn chia sẻ gì?"
User: "Vợ tôi muốn ly hôn"

→ Backend: pause "Stress công việc", tạo "Hôn nhân"
→ Sidebar tự cập nhật (polled GET /cases mỗi 30s hoặc sau mỗi done event)
→ Chat window: liên tục, không ngắt quãng
→ User không thấy gì thay đổi ngoài sidebar
```

**Click case cũ trong sidebar:**
```
User click case "Cảm xúc với con" (resolved):
→ Mở slide-over panel (không navigate)
→ Hiện read-only messages của case đó
→ Chat window chính không thay đổi
→ Nút "Đóng" để quay lại
```

**Khi FE nhận done với case_status mới:**
```typescript
// Sau khi nhận done event → refetch cases list
if (donePayload.case_status !== previousCaseStatus) {
  await refetchCases();
}
```

---

## 9. Performance Rules

```typescript
// ChatWindow performance constraints

// 1. Virtualized rendering — dùng react-virtuoso cho message list
// Target: 200+ messages vẫn 60fps

// 2. Token streaming — batch DOM update, không update mỗi token
const appendToken = (token: string) => {
  previewBufferRef.current += token;
  if (!rafScheduledRef.current) {
    rafScheduledRef.current = true;
    requestAnimationFrame(() => {
      setPreviewText(previewBufferRef.current);
      rafScheduledRef.current = false;
    });
  }
};
// Interval: ~16ms (1 frame at 60fps) thay vì mỗi token (~50–200ms)

// 3. Input textarea — KHÔNG re-render toàn bộ chat khi typing
// InputArea là component riêng, state value không bubble lên ChatWindow

// 4. Auto-scroll — followOutput="smooth" trong Virtuoso
// Chỉ auto-scroll khi user đang ở bottom; nếu user scroll up thì dừng

// 5. Lazy load older messages
// scroll to top → trigger GET /messages?cursor=<oldest_id>&limit=20
```

---

## 10. Error States trong Chat

| Tình huống | FE state | UI hiện |
|-----------|----------|---------|
| SSE disconnect trong thinking | `interrupted` | "Mất kết nối" + [Thử lại] |
| `GET /turn-status` → completed | `recover_final_available` | Render final text |
| `GET /turn-status` → no_final | `regenerate_required` | [Tạo lại phản hồi] button |
| All providers fail | `error` từ SSE | "WISMO đang gặp sự cố. Vui lòng thử lại." |
| Validation fail 2x | `done` với safe fallback | Response generic, không thấy gì khác |
| Stream gián đoạn visible | partial + warning | "⚠ Phản hồi bị gián đoạn" badge + [Tạo lại] |

---

## 11. Constraints cho Agent

**Forbidden:**
- Component không được tự call `apiFetch` — chỉ hooks
- `useChatStream` không được biết về crisis tier (chỉ đọc `frontend_state`)
- Không merge preview buffer với previous messages
- Không render `done.final_text` nếu chưa nhận `done` event
- Không unlock input trước khi nhận `done` hoặc `error`

**Test suite tối thiểu:**
```
tests/hooks/useChatStream.test.ts
  - thinking → streaming_preview → done sequence
  - done.final_text overwrites preview
  - error event locks input correctly
  - token batching không duplicate text
  - interrupt → interrupted state
tests/components/ChatWindow.test.tsx
  - renders 200 messages without crash
  - preview bubble visible during streaming
  - ThinkingDots visible during thinking
  - input locked when isInputLocked=true
tests/components/InputArea.test.tsx
  - Enter sends, Shift+Enter newline
  - max 2000 chars enforced
  - warning shown at 1500 chars
  - disabled when locked
```

---

## 12. Cross-references

- **SSE event types:** `api-contracts-spec.md` — SSEEvent, ChatDonePayload
- **Crisis display trigger:** `crisis-display-spec.md` — frontend_state → HotlineBlock / CrisisOverlay
- **Layout wrapper:** `ui-layout-spec.md` — ChatArea component
- **Auth cho API calls:** `auth-flow-spec.md` — token cookie pattern
