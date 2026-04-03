export type SSEEventType = 'thinking' | 'state' | 'token' | 'done' | 'error' | 'ping'

export type FrontendState =
  | 'normal'
  | 'show_hotline_inline'
  | 'show_hotline_overlay'
  | 'show_info_banner'
  | 'reconnecting'
  | 'interrupted'
  | 'recover_final_available'
  | 'regenerate_required'

export type SSEStateName = 'safe' | 'crisis' | 'contraindicated' | 'ambiguous'

export interface SSEEvent {
  schema_version: string
  type: SSEEventType
  request_id: string
  turn_id?: string
  state_name?: SSEStateName
  text?: string
  message?: string
  frontend_state?: FrontendState
  is_final?: boolean
  meta?: Record<string, unknown>
}

export interface ChatDonePayload {
  schema_version: string
  turn_id: string
  assistant_message_id: string
  final_text: string
  frontend_state: FrontendState
  case_id?: string
  case_status?: CaseStatus
  show_hotline?: boolean
}

export interface ChatSendRequest {
  message: string
  session_id: string
  case_id?: string
}

export type StreamStatus =
  | 'idle'
  | 'connecting'
  | 'thinking'
  | 'streaming'
  | 'done'
  | 'error'
  | 'reconnecting'

export type FeedbackRating = 1 | -1

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  turn_id?: string
  feedback?: FeedbackRating
}

export type CaseStatus = 'active' | 'resolved' | 'paused'

export interface Case {
  id: string
  title: string
  status: CaseStatus
  created_at: string
  updated_at: string
  message_count: number
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user_id: string
  email: string
}

export interface UserProfile {
  user_id: string
  email: string
  age_range?: string
  goal?: string
  language?: string
}

export type ConsentStatus = 'granted' | 'not_granted' | 'expired'

export interface ConsentCheckResponse {
  status: ConsentStatus
  granted_at?: string
}

export interface GrantConsentRequest {
  consent_version: string
}

export type MemorySensitivity = 'normal' | 'clinical_sensitive'

export interface MemoryItem {
  id: string
  content: string
  sensitivity: MemorySensitivity
  created_at: string
}

export type TurnFinalStatus = 'completed' | 'interrupted' | 'error'

export interface TurnStatusResponse {
  turn_id: string
  status: TurnFinalStatus
  final_text?: string
  frontend_state?: FrontendState
}

export interface FeedbackRequest {
  rating: FeedbackRating
  comment?: string
}

export interface APIError {
  code: string
  message: string
  detail?: unknown
}
