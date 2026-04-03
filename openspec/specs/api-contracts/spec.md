# API Contracts Spec — Frontend TypeScript Types & Endpoint Contracts

**Source:** WISMO Project Specification v18, Section 7.5A + 6.6A + 15.7  
**Scope:** Toàn bộ API contracts FE cần biết — request/response types, SSE events, endpoint list  
**Ai đọc:** Agent làm FE.3 (useChatStream), FE.4 (sidebar/settings), mọi task wire API  
**Không thuộc scope:** Backend implementation — xem backend api-contracts/spec.md

---

## 1. TypeScript Types — Source of Truth cho Frontend

Tất cả types sau phải được đặt trong `types/api.ts` và import từ đây. Không tự khai báo lại ở component.

```typescript
// types/api.ts

// ─── SSE Events ───────────────────────────────────────────────

export type SSEEventType =
  | 'thinking'
  | 'token'
  | 'info'
  | 'done'
  | 'error'
  | 'state';

export type FrontendState =
  | 'normal'
  | 'show_hotline_inline'
  | 'show_hotline_overlay'
  | 'show_info_banner'
  | 'reconnecting'
  | 'interrupted'
  | 'recover_final_available'
  | 'regenerate_required';

export type SSEStateName =
  | 'session_resolved'
  | 'case_resolved'
  | 'safety_resolved'
  | 'validated';

/** Mọi event từ SSE stream đều conform interface này. */
export interface SSEEvent {
  schema_version: 'sse.v1';
  type: SSEEventType;
  request_id: string;                  // UUID
  turn_id?: string;                    // UUID — có ở done, error, state(validated)
  state_name?: SSEStateName;           // chỉ khi type='state'
  text?: string;                       // chỉ khi type='token'
  message?: string;                    // user-facing info (type='info'|'error')
  frontend_state?: FrontendState;      // source of truth cho UI overlay/banner
  is_final?: boolean;                  // true khi type='done'|'error'
  meta?: Record<string, unknown>;      // extra structured data trong done
}

/** Payload đầy đủ trong SSEEvent.meta khi type='done'. */
export interface ChatDonePayload {
  schema_version: 'chat-done.v1';
  turn_id: string;
  assistant_message_id: string;
  final_text: string;                  // source of truth — overwrite preview buffer
  frontend_state: FrontendState;
  case_id?: string;
  case_status?: CaseStatus;
  show_hotline?: boolean;
  hotline_type?: 'fullscreen' | 'inline' | 'none';
}

// ─── Chat Request ──────────────────────────────────────────────

/** POST /api/chat/message — request body. */
export interface ChatSendRequest {
  schema_version: 'chat-send.v1';
  content: string;                     // trim trước khi gửi
  session_id: string;
  active_case_id?: string | null;
  client_context?: {
    app_locale?: 'vi' | 'en' | 'fi';
  };
}

// ─── Chat Data ─────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;                  // ISO-8601
  case_id?: string;
  feedback?: FeedbackRating | null;
}

export type FeedbackRating = 1 | -1;

export type CaseStatus = 'active' | 'resolved' | 'paused' | 'stalled' | 'abandoned' | 'inactive';

export interface Case {
  id: string;
  topic: string;
  status: CaseStatus;
  current_phase: 'understand' | 'illuminate' | 'followup';
  created_at: string;
  updated_at: string;
}

// ─── Auth ──────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user_id: string;
  is_guest: boolean;
}

export interface UserProfile {
  user_id: string;
  email?: string;
  age_range?: string;
  goal?: string;
  language: 'vi' | 'en' | 'fi';
  is_guest: boolean;
}

// ─── Consent ───────────────────────────────────────────────────

export type ConsentStatus =
  | 'no_consent'
  | 'consented_v1'
  | 'reconsent_required'
  | 'withdrawn_pending_delete'
  | 'deleted';

export interface ConsentCheckResponse {
  has_consent: boolean;
  status: ConsentStatus;
  consent_version?: string;
  reason?: string;
}

export interface GrantConsentRequest {
  chat_processing: true;           // required, không pre-tick
  memory_storage: true;            // required, không pre-tick
  analytics_improvement?: boolean; // optional
  consent_version: string;         // e.g. 'v1.0'
}

// ─── Memory ────────────────────────────────────────────────────

export type MemorySensitivity = 'public_safe' | 'private_safe' | 'clinical_sensitive';

export interface MemoryItem {
  id: string;
  text: string;
  tags: string[];
  salience: number;
  sensitivity: MemorySensitivity;
  user_visible: boolean;
  user_editable: boolean;
  created_at: string;
  last_seen_at?: string;
}

// ─── Turn Status (Recovery) ────────────────────────────────────

export type TurnFinalStatus =
  | 'completed'
  | 'stream_interrupted_no_final'
  | 'failed_terminal';

export interface TurnStatusResponse {
  turn_id: string;
  status: TurnFinalStatus;
  assistant_message_id?: string;
  final_text?: string;
}

// ─── Feedback ──────────────────────────────────────────────────

export interface FeedbackRequest {
  rating: FeedbackRating;
  text?: string;
}
```

---

## 2. Canonical SSE Event Ordering

Frontend PHẢI xử lý events theo đúng thứ tự này. Không tự suy luận flow.

**Success path:**
```
thinking → state(session_resolved) → state(case_resolved) 
        → state(safety_resolved) → token* → state(validated) → done
```

**Validator reject path:**
```
thinking → state(session_resolved) → state(case_resolved)
        → state(safety_resolved) → info(validation_regenerate) → token* → state(validated) → done
```

**Terminal safety path (crisis/out-of-scope):**
```
thinking → state(safety_resolved) → token? → done
```

**Error path:**
```
thinking → state(...)* → error
```

---

## 3. Frontend Streaming State Machine

| FE state | Vào khi | Tiếp theo | FE behavior |
|----------|---------|-----------|-------------|
| `thinking` | nhận `thinking` event | `streaming_preview`, `interrupted`, `error` | loading indicator, input lock |
| `streaming_preview` | nhận token đầu tiên | `validator_review`, `interrupted`, `done`, `error` | append preview text + cursor ▊ |
| `validator_review` | nhận `info(validation_regenerate)` | `streaming_preview`, `done`, `error` | giữ preview, không unlock input |
| `interrupted` | SSE disconnect trong `thinking`/`streaming_preview` | `recover_final_available`, `regenerate_required`, `error` | show reconnect UI |
| `recover_final_available` | `GET /turn-status` → `completed` | `done` | render final persisted text |
| `regenerate_required` | `GET /turn-status` → `stream_interrupted_no_final` | `thinking` (new request), `error` | user bấm regenerate |
| `done` | nhận canonical `done` event | terminal | unlock input, feedback enabled |
| `error` | terminal failure | terminal hoặc user retry | show retry hint |

**3 quy tắc cứng:**
1. `done.final_text` overwrite toàn bộ preview buffer — không merge
2. Reconnect sau disconnect KHÔNG resume token stream cũ — gọi `/turn-status`
3. Input chỉ unlock khi nhận `done` hoặc `error` — không unlock sớm hơn

---

## 4. Endpoint List

### 4.1 Chat

```
POST /api/chat/message
  Body: ChatSendRequest
  Response: text/event-stream (SSE)
  Auth: required (registered hoặc guest token)

GET  /api/chat/messages?session_id=<id>
  Response: { messages: Message[] }
  Auth: required

GET  /api/chat/cases
  Response: { cases: Case[] }
  Auth: required

GET  /api/chat/cases/{case_id}/messages
  Response: { messages: Message[], case: Case }
  Auth: required
  Note: read-only view cho case cũ

POST /api/chat/new-session
  Response: { session_id: string }
  Auth: required

POST /api/chat/messages/{message_id}/feedback
  Body: FeedbackRequest
  Response: { status: 'ok' }
  Auth: required

GET  /api/chat/turn-status?turn_id=<id>
  Response: TurnStatusResponse
  Auth: required
  Note: dùng sau disconnect để recovery
```

### 4.2 Auth

```
POST /api/accounts/register
  Body: RegisterRequest
  Response: AuthResponse | 400 (duplicate email) | 403 (under 18)

POST /api/accounts/login
  Body: LoginRequest
  Response: AuthResponse | 401

POST /api/accounts/logout
  Response: { status: 'ok' }

POST /api/accounts/google/callback
  Body: { code: string }
  Response: AuthResponse

GET  /api/accounts/profile
  Response: UserProfile

PUT  /api/accounts/profile
  Body: Partial<UserProfile>
  Response: UserProfile

POST /api/accounts/guest-init
  Response: AuthResponse (is_guest: true)
```

### 4.3 Consent

```
GET  /api/accounts/consent/check
  Response: ConsentCheckResponse

POST /api/accounts/consent
  Body: GrantConsentRequest
  Response: { status: 'ok', consent_version: string }

POST /api/accounts/consent/withdraw
  Response: { status: 'ok' }
```

### 4.4 Privacy (GDPR)

```
GET  /api/settings/privacy/export
  Response: JSON download (Content-Disposition: attachment)
  Auth: registered users only

POST /api/settings/privacy/delete-all
  Body: { confirm: true }
  Response: { status: 'ok', deletion_job_id: string }
```

### 4.5 Memory

```
GET  /api/memory/items
  Response: { items: MemoryItem[] }
  Note: trả về items có user_visible=true, sensitivity != clinical_sensitive

DELETE /api/memory/items/{item_id}
  Response: { status: 'ok' }

DELETE /api/memory/items/all
  Body: { confirm: true }
  Response: { status: 'ok' }
```

---

## 5. Auth Token Pattern

```typescript
// lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

/** Lấy token từ HttpOnly cookie — browser tự gửi kèm request. */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',           // gửi HttpOnly cookie
    headers: {
      'Content-Type': 'application/json',
      'X-Locale': navigator.language.slice(0, 2) as 'vi' | 'en' | 'fi',
      ...options.headers,
    },
  });
}
```

**Không lưu token vào localStorage.** Dùng HttpOnly cookie để tránh XSS.

---

## 6. SSE Stream Parser

```typescript
// lib/sseParser.ts

/**
 * Parse SSE stream từ ReadableStream.
 * Yield từng SSEEvent sau khi parse JSON.
 * Unknown event type → ignore, không throw.
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw) as SSEEvent;
            yield event;
          } catch {
            // malformed JSON — ignore, không crash stream
            console.warn('[SSE] malformed event:', raw.slice(0, 100));
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

---

## 7. Error Handling Pattern

```typescript
// Chuẩn error response từ backend
export interface APIError {
  error: string;     // machine-readable code
  message?: string;  // user-facing message (optional)
  code?: number;
}

// HTTP status → UX action
// 400 → validation error, hiện form error
// 401 → redirect /login
// 403 → consent_required → redirect /consent, hoặc under_18 → block
// 429 → rate limit, hiện "Vui lòng thử lại sau"
// 500 → "WISMO đang gặp sự cố. Vui lòng thử lại."
```

---

## 8. Cross-references

- **SSEEvent contract nguồn gốc:** backend `architecture/spec.md` — Section 6.6A
- **ChatDonePayload nguồn gốc:** backend `architecture/spec.md` — Section 7.5A
- **Consent state machine:** `consent-screen-spec.md` — Section 5.3A
- **Crisis frontend_state:** `crisis-display-spec.md` — mapping tier → frontend_state
- **useChatStream implementation:** `chat-ux-spec.md` — Section 4
