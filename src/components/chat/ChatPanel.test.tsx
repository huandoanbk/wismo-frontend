import { render } from '@testing-library/react'
import type { SessionResponse } from '@/types/api'
import { ChatPanel } from './ChatPanel'

const { pushMock, authStateRef, turnListPropsRef } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  authStateRef: { sessionState: 'unauthenticated' as SessionResponse['session_state'] },
  turnListPropsRef: { current: null as Record<string, unknown> | null },
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ sessionState: authStateRef.sessionState }),
}))

vi.mock('./TurnList', () => ({
  TurnList: (props: Record<string, unknown>) => {
    turnListPropsRef.current = props
    return <div data-testid="turn-list" />
  },
}))

vi.mock('./Composer', () => ({
  Composer: () => <div data-testid="composer" />,
}))

vi.mock('@/components/consent/ConsentModal', () => ({
  ConsentModal: () => null,
}))

describe('ChatPanel', () => {
  beforeEach(() => {
    pushMock.mockReset()
    turnListPropsRef.current = null
  })

  function renderPanel() {
    render(
      <ChatPanel
        turns={[]}
        isLoading={false}
        completedTurns={[]}
        pendingTurn={null}
        turnState="done"
        onSend={() => {}}
        onRetry={() => {}}
        error={null}
        quotaExhausted={true}
        chatId="chat-123"
      />
    )
  }

  it('passes sign-in/sign-up actions to TurnList when quota exhausted and session is unauthenticated', () => {
    authStateRef.sessionState = 'unauthenticated'
    renderPanel()

    const quotaConfig = turnListPropsRef.current?.quotaExhaustedConfig as {
      registerAction?: { label: string }
      loginAction?: { label: string }
    }

    expect(quotaConfig).toBeTruthy()
    expect(quotaConfig.registerAction?.label).toBe('send_action_register')
    expect(quotaConfig.loginAction?.label).toBe('quota_exhausted_login')
  })

  it('does not pass auth actions when session is registered', () => {
    authStateRef.sessionState = 'registered'
    renderPanel()

    const quotaConfig = turnListPropsRef.current?.quotaExhaustedConfig as {
      registerAction?: { label: string }
      loginAction?: { label: string }
    }

    expect(quotaConfig).toBeTruthy()
    expect(quotaConfig.registerAction).toBeUndefined()
    expect(quotaConfig.loginAction).toBeUndefined()
  })
})
