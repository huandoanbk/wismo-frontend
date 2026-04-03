# Crisis Display Spec — Hotline Display Rules per Tier

**Source:** WISMO Project Specification v18, Section 5.2.2  
**Scope:** `CrisisOverlay`, `HotlineBlock`, footer hotline — khi nào hiện, loại nào, copy text  
**Ai đọc:** Agent làm FE.3 (crisis wiring from SSE), bất kỳ task touch crisis UI  
**Nguyên tắc:** Component KHÔNG detect crisis tier — chỉ đọc `frontend_state` từ SSE event

---

## 1. Mapping frontend_state → UI

Frontend KHÔNG biết crisis tier là gì. Nó chỉ đọc `frontend_state` từ SSE event và render đúng component tương ứng.

| `frontend_state` | Component hiện | Nguồn gốc |
|-----------------|----------------|-----------|
| `show_hotline_overlay` | `CrisisOverlay` (full-screen) | Tier A (active intent) |
| `show_hotline_inline` | `HotlineBlock` (inline trong chat) | Tier B (ideation) |
| `show_info_banner` | `InfoBanner` (soft warning) | Tier C (hopelessness) — khi severity tăng |
| `normal` | Không hiện gì | Tất cả các trường hợp khác |

**Quy tắc cứng:** ChatWindow nhận `frontendState` prop → render đúng component. Không tự phân tích content message để detect crisis.

---

## 2. CrisisOverlay — Full-Screen (Tier A)

Hiện khi `frontend_state = 'show_hotline_overlay'`.

```typescript
// components/crisis/CrisisOverlay.tsx

interface CrisisOverlayProps {
  /** Gọi khi user bấm nút đóng overlay (không tắt hỗ trợ). */
  onDismiss: () => void;
}

/**
 * Full-screen overlay cho crisis tier A (active intent/plan).
 * Hiện trên toàn màn hình, z-index cao nhất.
 * Không thể dismiss hoàn toàn — chỉ minimize xuống footer.
 * Chat vẫn visible phía sau (user không bị cut off).
 */
export function CrisisOverlay({ onDismiss }: CrisisOverlayProps) {
  const t = useTranslations('crisis');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-sm">
      {/* Top section — hotline focus */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">

        {/* Hotline numbers */}
        <div className="w-full max-w-sm bg-red-50 border-2 border-red-200 rounded-2xl p-6 space-y-4">
          <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
            {t('overlay_urgent_label')}
          </p>

          <a
            href="tel:0925250111"
            className="flex items-center gap-3 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            <span className="text-2xl">📞</span>
            <div className="text-left">
              <p className="font-bold text-lg">09 2525 0111</p>
              <p className="text-xs text-red-100">Kriisipuhelin — 24/7</p>
            </div>
          </a>

          <a
            href="tel:112"
            className="flex items-center gap-3 p-3 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition-colors"
          >
            <span className="text-2xl">🚨</span>
            <div className="text-left">
              <p className="font-bold text-lg">112</p>
              <p className="text-xs text-red-500">Hätäkeskus — nguy hiểm tức thì</p>
            </div>
          </a>
        </div>

        {/* WISMO message */}
        <div className="max-w-sm space-y-2">
          <p className="text-wismo-text font-medium">{t('overlay_wismo_message_1')}</p>
          <p className="text-sm text-wismo-text-muted">{t('overlay_wismo_message_2')}</p>
        </div>
      </div>

      {/* Bottom — WISMO still here */}
      <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
        <p className="text-sm text-wismo-text-muted">{t('overlay_still_here')}</p>
        <button
          onClick={onDismiss}
          className="text-sm text-wismo-primary hover:underline"
        >
          {t('overlay_back_to_chat')}
        </button>
      </div>
    </div>
  );
}
```

**i18n keys (vi):**
```json
"crisis": {
  "overlay_urgent_label": "Liên hệ ngay",
  "overlay_wismo_message_1": "Mình nghe bạn, và mình lo lắng cho bạn ngay lúc này.",
  "overlay_wismo_message_2": "Xin hãy gọi ngay số trên — họ được đào tạo để giúp bạn ngay lúc này. Mình ở đây, nhưng họ có thể giúp tốt hơn.",
  "overlay_still_here": "Mình vẫn ở đây với bạn.",
  "overlay_back_to_chat": "Quay lại trò chuyện"
}
```

---

## 3. HotlineBlock — Inline (Tier B)

Hiện khi `frontend_state = 'show_hotline_inline'` — ở trong luồng chat, không full-screen.

```typescript
// components/crisis/HotlineBlock.tsx

interface HotlineBlockProps {
  /** Hiện sau WISMO response text — không thay thế response. */
  showSekasin?: boolean;
}

/**
 * Inline hotline block cho crisis tier B (ideation).
 * Hiện ngay sau WISMO response text.
 * Không phải overlay, không block chat.
 * Sekasin thêm vào nếu showSekasin=true.
 */
export function HotlineBlock({ showSekasin = true }: HotlineBlockProps) {
  const t = useTranslations('crisis');

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
        {t('inline_support_label')}
      </p>

      <a
        href="tel:0925250111"
        className="flex items-center gap-2 text-sm text-amber-800 hover:text-amber-900"
      >
        <span>📞</span>
        <span className="font-medium">09 2525 0111</span>
        <span className="text-amber-600">— Kriisipuhelin (24/7)</span>
      </a>

      {showSekasin && (
        <a
          href="https://sekasin.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-amber-800 hover:text-amber-900"
        >
          <span>💬</span>
          <span className="font-medium">sekasin.fi</span>
          <span className="text-amber-600">— Sekasin-chat</span>
        </a>
      )}
    </div>
  );
}
```

---

## 4. Footer Hotline — Luôn visible sau crisis

Sau khi crisis tier A/B detect trong session, footer hotline hiện **liên tục** (không ẩn đi sau vài turns).

```typescript
// components/crisis/CrisisFooter.tsx

/**
 * Persistent hotline footer — hiện sau khi crisis detected trong session.
 * Không bao giờ ẩn trong session đó.
 */
export function CrisisFooter() {
  return (
    <div className="bg-red-50 border-t border-red-100 px-4 py-2 text-xs text-red-700 flex items-center gap-2">
      <span>📞</span>
      <span>Kriisipuhelin: <strong>09 2525 0111</strong> (24/7)</span>
    </div>
  );
}
```

---

## 5. WISMO Crisis Response Text

WISMO text trong response khi crisis detected — đây là text backend stream về. Component chỉ render, không tự tạo.

**Tier A — Active intent:**
```
"Mình nghe bạn, và mình lo lắng cho bạn ngay lúc này.
Xin hãy gọi ngay số trên — họ có thể giúp bạn ngay.
Mình ở đây, nhưng họ được đào tạo cho tình huống này."
```

**Tier B — Ideation:**
```
"Mình nghe bạn. Khi mệt đến mức đó, cảm giác thật nặng nề.
Bạn đang rất can đảm khi chia sẻ điều này.
Mình muốn chắc chắn bạn an toàn.
Bạn có đang nghĩ đến việc tự làm hại mình không?"
```

**Tier C — Hopelessness:**
```
"Mình nghe thấy bạn đang rất mệt. Cảm giác đó thật nặng nề.
Bạn muốn chia sẻ thêm — điều gì khiến bạn cảm thấy như vậy?"
```

**Tier D — Third-party:**
```
"Mình lo lắng khi nghe bạn nói điều này.
Người bạn/người thân đó có thể cần giúp đỡ ngay."
```

---

## 6. Integration trong ChatArea

```typescript
// components/layout/ChatArea.tsx (excerpt)

export function ChatArea() {
  const { frontendState, ... } = useChatStream();
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [sessionHadCrisis, setSessionHadCrisis] = useState(false);

  // Track khi nào session có crisis event
  useEffect(() => {
    if (
      frontendState === 'show_hotline_overlay' ||
      frontendState === 'show_hotline_inline'
    ) {
      setSessionHadCrisis(true);
    }
  }, [frontendState]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <ChatHeader ... />

      {/* Crisis overlay — full screen */}
      {frontendState === 'show_hotline_overlay' && !overlayDismissed && (
        <CrisisOverlay onDismiss={() => setOverlayDismissed(true)} />
      )}

      {/* Main chat window */}
      <ChatWindow
        ...
        // Hotline block sẽ render sau WISMO response nếu cần
        showHotlineInline={frontendState === 'show_hotline_inline'}
      />

      {/* Persistent footer hotline sau khi có crisis trong session */}
      {sessionHadCrisis && <CrisisFooter />}
    </div>
  );
}
```

**Rules:**
- `CrisisOverlay` hiện khi `frontend_state = 'show_hotline_overlay'`
- Dismiss overlay → overlayDismissed = true, nhưng `CrisisFooter` vẫn persist
- `HotlineBlock` render sau message response khi `frontend_state = 'show_hotline_inline'`
- `sessionHadCrisis` = true → không bao giờ reset về false trong cùng session

---

## 7. Finnish Resources (readonly)

```typescript
// lib/crisisResources.ts

export const CRISIS_RESOURCES = {
  kriisipuhelin: {
    name: 'Kriisipuhelin',
    phone: '09 2525 0111',
    hours: '24/7',
    tel: 'tel:0925250111',
  },
  hatakeskus: {
    name: 'Hätäkeskus',
    phone: '112',
    hours: '24/7',
    tel: 'tel:112',
  },
  sekasin: {
    name: 'Sekasin-chat',
    url: 'https://sekasin.fi',
    hours: '24/7',
  },
  mielenterveystalo: {
    name: 'Mielenterveystalo',
    url: 'https://mielenterveystalo.fi',
    hours: 'Business hours',
  },
} as const;
```

---

## 8. Hard Rules cho Agent

1. **Không detect crisis tier trong component** — chỉ đọc `frontend_state` từ SSE
2. **Overlay không block hoàn toàn** — chat visible phía sau, user không bị cắt đứt
3. **Hotline phone numbers KHÔNG được thay đổi** — hardcode từ CRISIS_RESOURCES
4. **`sessionHadCrisis` không reset** — một khi có crisis trong session, footer persist
5. **Overlay dismiss ≠ crisis resolved** — CrisisFooter vẫn hiện sau dismiss
6. **HotlineBlock render sau response text** — không thay thế response, append sau

**Test suite tối thiểu:**
```
tests/components/CrisisOverlay.test.tsx
  - renders with correct phone numbers
  - dismiss button calls onDismiss
  - tel: links are clickable
tests/components/HotlineBlock.test.tsx
  - renders kriisipuhelin link
  - renders sekasin when showSekasin=true
  - does not render sekasin when showSekasin=false
tests/components/ChatArea.test.tsx (crisis scenarios)
  - overlay renders when frontend_state='show_hotline_overlay'
  - overlay not shown when frontend_state='normal'
  - sessionHadCrisis=true persists CrisisFooter after dismiss
  - inline block renders when frontend_state='show_hotline_inline'
```

---

## 9. Cross-references

- **Crisis tier detection:** backend `safety/spec.md` — SafetyStateMachine → frontend_state mapping
- **SSE event source:** `api-contracts-spec.md` — SSEEvent.frontend_state field
- **WISMO crisis response text:** backend `safety/spec.md` — crisis protocol copy
- **Chat integration point:** `chat-ux-spec.md` — ChatWindow props, streaming flow
