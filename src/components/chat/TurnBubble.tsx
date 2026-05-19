import { useTranslations } from 'next-intl'
import type { ChatTurn } from '@/types/api'

interface TurnBubbleProps {
  turn: ChatTurn
}

function Bubble({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl text-sm leading-relaxed animate-fade-in ${
          isUser
            ? 'bg-wismo-message-user text-wismo-text px-4 py-2.5'
            : 'bg-wismo-message-bot text-wismo-text border border-wismo-border shadow-sm px-4 py-3'
        }`}
      >
        {text}
      </div>
    </div>
  )
}

export function CrisisBubble() {
  const t = useTranslations('chat')
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl text-sm leading-relaxed animate-fade-in bg-wismo-message-bot text-wismo-text border border-wismo-border shadow-sm px-4 py-3 space-y-2">
        <p>{t('response_crisis_text')}</p>
        <a
          href="tel:112"
          className="flex items-center gap-2 text-wismo-primary font-medium hover:underline"
        >
          📞 112
        </a>
        <a
          href="https://112.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-wismo-primary font-medium hover:underline"
        >
          🌐 112.fi
        </a>
      </div>
    </div>
  )
}

/** Renders a full turn as two bubbles: user message then assistant response. */
export function TurnBubble({ turn }: TurnBubbleProps) {
  return (
    <>
      <Bubble text={turn.user_message_text} isUser={true} />
      {turn.assistant_response_text && (
        turn.response_method === 'CRISIS_SAFE_ONLY'
          ? <CrisisBubble />
          : <Bubble text={turn.assistant_response_text} isUser={false} />
      )}
    </>
  )
}
