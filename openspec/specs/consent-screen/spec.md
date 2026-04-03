# Consent Screen Spec — GDPR Consent UI

**Source:** WISMO Project Specification v18, Section 5.3 + 5.3A  
**Scope:** `ConsentScreen` component, `useConsent` hook, consent copy text, re-consent flow  
**Ai đọc:** Agent làm FE.3 (consent wiring), bất kỳ task touch consent screen

---

## 1. Tại sao Consent bắt buộc

Mental health data = GDPR Article 9 "special category" → cần **explicit consent** trước khi xử lý. Finland thuộc EU — không thể bỏ qua.

**6 tiêu chí GDPR phải đáp ứng:**

| Tiêu chí | Cách đáp ứng |
|----------|-------------|
| Freely given | Có nút "Tôi không đồng ý" rõ ràng |
| Specific | 3 checkboxes tách riêng từng loại |
| Informed | Ngôn ngữ dễ hiểu, không legal jargon |
| Unambiguous | User phải tick, không pre-ticked |
| Documented | Lưu DB: version, timestamp, IP, text hash |
| Withdrawable | Rút consent trong Settings → Privacy |

---

## 2. Canonical Consent Copy (3 ngôn ngữ)

### Tiếng Việt

```
Chào mừng bạn đến với WISMO

WISMO là AI companion giúp bạn suy ngẫm và tự hiểu mình,
KHÔNG phải dịch vụ tư vấn tâm lý hay y tế.
WISMO không chẩn đoán bệnh, không kê đơn thuốc, không trị liệu.

Nếu cần hỗ trợ khẩn cấp: 📞 09 2525 0111

─────────────────────────────────────────────

☐ Tôi đồng ý WISMO lưu và xử lý nội dung hội thoại
  để cá nhân hóa hỗ trợ cho tôi (bắt buộc)

☐ Tôi đồng ý WISMO ghi nhớ thông tin giữa các phiên
  để hỗ trợ liên tục (bắt buộc)

☐ Tôi đồng ý dữ liệu ẩn danh được dùng để cải thiện
  chất lượng dịch vụ (không bắt buộc)

─────────────────────────────────────────────

Bạn có thể xóa dữ liệu bất cứ lúc nào trong Cài đặt → Quyền riêng tư.
Xem thêm: Chính sách bảo mật

[Bắt đầu trò chuyện]    [Tôi không đồng ý]
```

### English

```
Welcome to WISMO

WISMO is an AI companion to help you reflect and understand yourself.
It is NOT a mental health or medical service.
WISMO does not diagnose, prescribe or provide therapy.

For urgent support: 📞 09 2525 0111

─────────────────────────────────────────────

☐ I agree that WISMO may store and process my conversations
  to personalise support for me (required)

☐ I agree that WISMO may remember information between sessions
  for continuity (required)

☐ I agree that anonymised data may be used to improve
  the service (optional)

─────────────────────────────────────────────

You can delete your data at any time in Settings → Privacy.
Read more: Privacy Policy

[Start conversation]    [I do not agree]
```

### Finnish

```
Tervetuloa WISMOon

WISMO on AI-kumppani, joka auttaa sinua pohtimaan ja ymmärtämään itseäsi.
Se EI ole mielenterveys- tai lääkäripalvelu.
WISMO ei diagnostisoi, määrää lääkkeitä eikä tarjoa terapiaa.

Kiireellistä apua varten: 📞 09 2525 0111

─────────────────────────────────────────────

☐ Hyväksyn, että WISMO voi tallentaa ja käsitellä
  keskustelujani palvelun personalisoimiseksi (pakollinen)

☐ Hyväksyn, että WISMO voi muistaa tietoja
  istuntojen välillä jatkuvuuden vuoksi (pakollinen)

☐ Hyväksyn, että anonymisoitua dataa voidaan käyttää
  palvelun kehittämiseen (valinnainen)

─────────────────────────────────────────────

Voit poistaa tietosi milloin tahansa kohdassa Asetukset → Tietosuoja.
Lue lisää: Tietosuojakäytäntö

[Aloita keskustelu]    [En hyväksy]
```

---

## 3. ConsentScreen Component

```typescript
// components/consent/ConsentScreen.tsx

interface ConsentScreenProps {
  /** 'first_time': first visit. 'reconsent': version updated. */
  mode: 'first_time' | 'reconsent';
  /** Gọi khi user grant consent thành công. */
  onConsented: () => void;
  /** Gọi khi user click "Không đồng ý". */
  onDeclined: () => void;
}

/**
 * GDPR consent screen — bắt buộc trước khi chat.
 * 3 checkboxes, 2 required. Không pre-tick.
 * Copy text lấy từ i18n messages, không hardcode.
 */
export function ConsentScreen({ mode, onConsented, onDeclined }: ConsentScreenProps) {
  const [chatProcessing, setChatProcessing] = useState(false);    // required
  const [memoryStorage, setMemoryStorage] = useState(false);      // required
  const [analytics, setAnalytics] = useState(false);              // optional
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('consent');

  // Chỉ enable button khi 2 required checkbox đã tick
  const canProceed = chatProcessing && memoryStorage;

  const handleConsent = async () => {
    if (!canProceed) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/api/accounts/consent', {
        method: 'POST',
        body: JSON.stringify({
          chat_processing: true,
          memory_storage: true,
          analytics_improvement: analytics,
          consent_version: 'v1.0',
        }),
      });
      if (!res.ok) throw new Error();
      onConsented();
    } catch {
      setError(t('error_retry'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-wismo-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-wismo-border p-6 space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-wismo-text">
            {mode === 'reconsent' ? t('title_reconsent') : t('title_welcome')}
          </h1>
        </div>

        {/* Description */}
        <div className="text-sm text-wismo-text-muted space-y-2">
          <p>{t('description_companion')}</p>
          <p className="font-medium text-red-600">{t('description_not_therapy')}</p>
          <p className="text-xs">
            {t('emergency_label')}{' '}
            <a href="tel:0925250111" className="font-medium text-wismo-primary">
              📞 09 2525 0111
            </a>
          </p>
        </div>

        <hr className="border-wismo-border" />

        {/* Checkboxes */}
        <div className="space-y-4">
          {/* Required 1 */}
          <ConsentCheckbox
            id="chat_processing"
            checked={chatProcessing}
            onChange={setChatProcessing}
            label={t('checkbox_chat_processing')}
            required
          />

          {/* Required 2 */}
          <ConsentCheckbox
            id="memory_storage"
            checked={memoryStorage}
            onChange={setMemoryStorage}
            label={t('checkbox_memory_storage')}
            required
          />

          {/* Optional */}
          <ConsentCheckbox
            id="analytics"
            checked={analytics}
            onChange={setAnalytics}
            label={t('checkbox_analytics')}
            required={false}
          />
        </div>

        <hr className="border-wismo-border" />

        {/* Footer note */}
        <p className="text-xs text-wismo-text-light">
          {t('delete_note')}{' '}
          <a href="/privacy-policy" className="underline hover:text-wismo-primary">
            {t('privacy_policy_link')}
          </a>
        </p>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleConsent}
            disabled={!canProceed || isSubmitting}
            className={`
              flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${canProceed && !isSubmitting
                ? 'bg-wismo-primary text-white hover:bg-wismo-primary-hover'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
          >
            {isSubmitting ? t('button_loading') : t('button_start')}
          </button>

          <button
            onClick={onDeclined}
            className="px-4 py-2.5 rounded-lg text-sm text-wismo-text-muted border border-wismo-border hover:bg-gray-50"
          >
            {t('button_decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### ConsentCheckbox helper

```typescript
// components/consent/ConsentCheckbox.tsx

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required: boolean;
}

/**
 * Single consent checkbox — không bao giờ pre-tick (GDPR requirement).
 * Hiện "(bắt buộc)" hoặc "(không bắt buộc)" badge.
 */
export function ConsentCheckbox({ id, checked, onChange, label, required }: ConsentCheckboxProps) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        defaultChecked={false}   // KHÔNG pre-tick — GDPR requirement
        className="mt-0.5 w-4 h-4 text-wismo-primary border-gray-300 rounded focus:ring-wismo-primary"
      />
      <span className="text-sm text-wismo-text leading-snug">
        {label}
        {' '}
        <span className={`text-xs ${required ? 'text-red-500' : 'text-wismo-text-light'}`}>
          ({required ? 'bắt buộc' : 'không bắt buộc'})
        </span>
      </span>
    </label>
  );
}
```

---

## 4. useConsent Hook

```typescript
// hooks/useConsent.ts

/**
 * Hook quản lý consent state: check, grant, withdraw.
 */
export function useConsent() {
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkConsent = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/accounts/consent/check');
      const data: ConsentCheckResponse = await res.json();
      setStatus(data.status);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const grantConsent = useCallback(async (req: GrantConsentRequest) => {
    const res = await apiFetch('/api/accounts/consent', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Consent grant failed');
    setStatus('consented_v1');
  }, []);

  const withdrawConsent = useCallback(async () => {
    const res = await apiFetch('/api/accounts/consent/withdraw', { method: 'POST' });
    if (!res.ok) throw new Error('Withdraw failed');
    setStatus('withdrawn_pending_delete');
  }, []);

  return { status, isLoading, checkConsent, grantConsent, withdrawConsent };
}
```

---

## 5. Re-consent Flow

Khi consent version thay đổi (backend cập nhật consent text):

```
User mở /chat với valid token
    │
    ▼
Middleware: có token, nhưng GET /consent/check → 'reconsent_required'
    │
    ▼
Redirect /consent?mode=reconsent
    │
    ▼
ConsentScreen với mode='reconsent'
    Hiện thêm message: "Chính sách của chúng tôi đã được cập nhật.
    Vui lòng xem lại và xác nhận đồng ý để tiếp tục."
    │
    ▼
User tick lại → [Tiếp tục]
    │
    ▼
POST /api/accounts/consent  ← version mới
    │
    ▼
Redirect /chat
```

---

## 6. "Không đồng ý" Flow

```
User click "Tôi không đồng ý"
    │
    ▼
Hiện modal nhỏ (không navigate):

  "Nếu bạn không đồng ý, bạn sẽ không thể sử dụng WISMO.
   
   Nếu cần hỗ trợ tâm lý ngay:
   📞 Kriisipuhelin: 09 2525 0111 (24/7)
   💬 Sekasin-chat: sekasin.fi
   
   [Quay lại xem lại]    [Rời khỏi trang]"

"Rời khỏi trang" → window.location.href = '/'
"Quay lại xem lại" → đóng modal, user đọc lại
```

---

## 7. i18n Keys (messages/vi.json excerpt)

```json
{
  "consent": {
    "title_welcome": "Chào mừng bạn đến với WISMO",
    "title_reconsent": "Chính sách đã được cập nhật",
    "description_companion": "WISMO là AI companion giúp bạn suy ngẫm và tự hiểu mình.",
    "description_not_therapy": "KHÔNG phải dịch vụ tư vấn tâm lý hay y tế. WISMO không chẩn đoán bệnh, không kê đơn thuốc, không trị liệu.",
    "emergency_label": "Nếu cần hỗ trợ khẩn cấp:",
    "checkbox_chat_processing": "Tôi đồng ý WISMO lưu và xử lý nội dung hội thoại để cá nhân hóa hỗ trợ cho tôi",
    "checkbox_memory_storage": "Tôi đồng ý WISMO ghi nhớ thông tin giữa các phiên để hỗ trợ liên tục",
    "checkbox_analytics": "Tôi đồng ý dữ liệu ẩn danh được dùng để cải thiện chất lượng dịch vụ",
    "delete_note": "Bạn có thể xóa dữ liệu bất cứ lúc nào trong Cài đặt → Quyền riêng tư.",
    "privacy_policy_link": "Xem Chính sách bảo mật",
    "button_start": "Bắt đầu trò chuyện",
    "button_loading": "Đang xử lý...",
    "button_decline": "Tôi không đồng ý",
    "error_retry": "Có lỗi xảy ra. Vui lòng thử lại."
  }
}
```

---

## 8. Hard Rules cho Agent

1. **Checkboxes KHÔNG pre-tick** — bất kỳ checkbox nào `defaultChecked={true}` là GDPR violation
2. **"Bắt đầu" button disable** cho đến khi cả 2 required checkbox được tick
3. **Copy text lấy từ i18n** — không hardcode text trong component
4. **Nút "Không đồng ý" phải visible** và không bị style fade out
5. **Consent version phải gửi kèm** trong request body — không hardcode string trực tiếp
6. **Re-consent mode** phải hiện rõ lý do (policy updated)
7. **Guest consent** vẫn bắt buộc — không skip dù là guest

**Test suite tối thiểu:**
```
tests/components/ConsentScreen.test.tsx
  - renders 3 checkboxes all unchecked by default
  - start button disabled when required unchecked
  - start button enabled when both required ticked
  - optional checkbox does not affect button state
  - calls onConsented after successful POST
  - shows error on API failure
  - decline button calls onDeclined
tests/components/ConsentCheckbox.test.tsx
  - not pre-ticked
  - shows required badge
  - onChange called on click
```

---

## 9. Cross-references

- **Consent state machine:** backend `safety/spec.md` + backend `architecture/spec.md` — ConsentState transitions
- **GDPR audit:** backend `telemetry/spec.md` — GDPRAuditService logs consent_given
- **Auth flow:** `auth-flow-spec.md` — consent bước sau guest-init
- **Privacy settings:** `ui-layout-spec.md` — Settings → Privacy tab cho withdraw/export
