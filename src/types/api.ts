// ─── Auth ──────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string
  password: string
  display_name?: string
}

export interface RegisterResponse {
  email: string
  email_verification_required: true
  otp_expires_at: string
  next_action: 'verify_email'
}

export interface LoginRequest {
  email: string
  password: string
  attach_chat_id?: string | null
}

export interface GoogleLoginRequest {
  credential: string
  attach_chat_id?: string | null
}

export interface UserProfile {
  user_id: string
  email?: string
  display_name?: string
  age_range?: string
  goal?: string
  language: 'vi' | 'en' | 'fi'
  is_guest: boolean
}

// ─── Consent ───────────────────────────────────────────────────

export type ConsentState = 'unknown' | 'required' | 'accepted'

export type IdentityType = 'none' | 'guest' | 'user'

export interface ConsentStatusResponse {
  identity_type: IdentityType
  consent_state: ConsentState
}

// ─── Feedback ──────────────────────────────────────────────────

export type FeedbackRating = 1 | -1

export interface FeedbackRequest {
  rating: FeedbackRating
  comment?: string
}

// ─── Chat ──────────────────────────────────────────────────────

export interface Chat {
  chat_id: string
  chat_display_name: string
  case_id: string | null
  opening_input_text: string
  created_at: string
  last_activity_at: string
}

export interface ChatTurn {
  turn_id: string
  user_message_text: string
  assistant_response_text: string
  response_method: string
  status: 'received' | 'processing' | 'completed' | 'failed'
  created_at: string
  finalized_at: string | null
  case_id: string | null
}

// ─── Chat Turn / SSE ───────────────────────────────────────────

export interface SendMessageRequest {
  message: string
  chat_id?: string
}

/** event: response — assistant response for the turn.
 * Normal path: `text` present, no `response_key`.
 * Control path: `response_key` present, no `text` — FE renders from i18n catalog. */
export interface SSEResponseEvent {
  text?: string
  response_key?: string
}

/** event: done — turn finalized metadata */
export interface SSEDoneEvent {
  /** null for non-persist control paths (BLOCKED_MINOR, REDIRECT, REFUSAL, SPAM_REPLY). */
  turn_id: string | null
  chat_id: string
  /** Canonical display name of the chat at turn completion — use directly to update UI, no re-fetch needed. */
  chat_display_name: string
  response_method: string
  status: 'completed'
  quota_exhausted_after_turn: boolean
}

/** event: error — orchestrator failure after stream opened */
export interface SSEErrorEvent {
  error: string
  status_code: number
}

export interface CreateChatRequest {
  opening_input_text?: string
}

export interface CreateChatResponse {
  chat: Chat
}

export interface ListChatsResponse {
  chats: Chat[]
}

export interface GetChatDetailResponse {
  chat: Chat
  turns: ChatTurn[]
}

// ─── Session ───────────────────────────────────────────────────

export interface SessionUser {
  email: string
  display_name: string
  email_verified: boolean
}

export interface SessionResponse {
  session_state: 'unauthenticated' | 'guest' | 'registered' | 'session_expired'
  identity_type: IdentityType
  user?: SessionUser
  guest?: { id: string }
  consent_state: ConsentState
}

export interface LoginResponse extends SessionResponse {
  session_state: 'registered'
}

export interface LogoutResponse {
  session_state: 'unauthenticated' | 'guest'
  identity_type: IdentityType
  consent_state: ConsentState
}

export interface VerifyEmailRequest {
  email: string
  otp: string
}

export interface VerifyEmailResponse {
  email: string
  email_verified: boolean
  next_action: 'login'
}

export interface ResendOtpRequest {
  email: string
}

export interface ResendOtpResponse {
  email: string
  email_verification_required: boolean
  otp_expires_at: string
  next_action: 'verify_email'
}

// ─── Guest / Session ───────────────────────────────────────────

export interface GuestInitResponse {
  guest_token: string
  session_state: 'guest'
  identity_type: 'guest'
  guest: { id: string }
  consent_state: 'required'
  next_action: 'accept_consent'
}

export interface AcceptConsentResponse {
  consent_id: string
  identity_type: 'guest' | 'user'
  consent_state: 'accepted'
}

// ─── Account Settings ──────────────────────────────────────────

export interface ProfileResponse {
  email: string
  display_name: string
  email_verified: boolean
  date_joined: string
  /** Canonical password capability from backend; optional for backward compatibility. */
  has_usable_password?: boolean
}

export interface UpdateDisplayNameRequest {
  display_name: string
}

export type UpdateDisplayNameResponse = ProfileResponse

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface ChangePasswordResponse {
  password_changed: true
}

export interface AddPasswordRequest {
  new_password: string
}

export interface AddPasswordResponse {
  password_added: true
}

export interface DeleteChatResponse {
  archived: true
}

export interface DeleteAllChatResponse {
  erased: true
}

// ─── Error ─────────────────────────────────────────────────────

export interface APIError {
  code: string
  message: string
  detail?: unknown
}
