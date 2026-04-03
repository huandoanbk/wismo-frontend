# Product Boundary Spec — Clinical Boundary & User-Facing Text Rules

**Source:** WISMO Project Specification v18, Section 1.10  
**Scope:** Ngôn ngữ bắt buộc / cấm trong toàn bộ FE — copy text, labels, error messages, UI strings  
**Ai đọc:** Mọi agent viết UI text, component label, error message, i18n key  
**Không thuộc scope:** Business logic — xem backend product/spec.md

---

## 1. Nguyên tắc cốt lõi

WISMO **không phải** dịch vụ trị liệu tâm lý. Mọi text user thấy phải phản ánh nhất quán ranh giới này. Agent phải kiểm tra mọi string UI trước khi commit.

---

## 2. Ngôn ngữ CẤM — Không bao giờ xuất hiện trong UI

```
❌ KHÔNG DÙNG:
   "Kế hoạch điều trị" / "treatment plan"
   "Liệu trình" / "therapy session"
   "Chẩn đoán" / "diagnosis"
   "Bệnh nhân" / "patient"
   "Can thiệp" / "intervention"
   "Tiên lượng" / "prognosis"
   "Kê đơn" / "prescribe"
   "Hồi phục lâm sàng" / "clinical recovery"
   "Đánh giá triệu chứng" / "symptom assessment"
   "Tư vấn tâm lý" (khi nói về WISMO)
   "Trị liệu" (khi nói về WISMO)
   "Therapist" / "Counselor" (khi nói về WISMO)
   Bất kỳ tên tôn giáo: "Phật giáo", "Vipassana", "kinh Phật"
```

```
✅ THAY BẰNG:
   "Hành trình"          thay cho "liệu trình"
   "Khám phá"            thay cho "đánh giá"
   "Câu chuyện của bạn"  thay cho "trường hợp lâm sàng"
   "Tìm hiểu bản thân"   thay cho "điều trị"
   "Trò chuyện"          thay cho "phiên tư vấn"
   "Chia sẻ"             thay cho "khai báo triệu chứng"
   "Bạn đồng hành"       thay cho "therapist" / "counselor"
```

---

## 3. Copy Bắt buộc per Touchpoint

Các string sau phải xuất hiện **chính xác** ở đúng vị trí. Không paraphrase.

### 3.1 Landing page / hero

```
Tiêu đề:    "WISMO — Bạn đồng hành trong hành trình tự hiểu mình"
Subtitle:   "Lắng nghe, hỏi đúng câu, đồng hành cùng bạn khám phá bản thân"
```

### 3.2 Consent screen header

```
"WISMO là AI companion giúp bạn suy ngẫm,
KHÔNG phải dịch vụ tư vấn tâm lý hay y tế."
```

### 3.3 Onboarding greeting (first visit)

```
"Chào bạn, mình là WISMO.
Mình ở đây để lắng nghe và cùng bạn khám phá.
Bạn muốn chia sẻ gì hôm nay?"
```

### 3.4 Footer disclaimer (mọi trang có chat)

```
"WISMO là AI companion, không phải tư vấn y khoa hay trị liệu tâm lý.
Khẩn cấp: 09 2525 0111"
```

### 3.5 Out-of-scope response (UI fallback khi backend trả BLOCKED_OUT_OF_SCOPE)

```
"Điều này nằm ngoài khả năng của mình.
Mình là bạn đồng hành, không phải chuyên gia."
```

### 3.6 Escalation suggestion (khi backend recommend chuyên gia)

```
"Mình nghĩ một chuyên gia tâm lý có thể hỗ trợ bạn tốt hơn mình."
```

### 3.7 Settings / About tab

```
"WISMO giúp bạn tự quan sát và suy ngẫm qua phương pháp khai vấn.
WISMO không chẩn đoán, không kê đơn, không trị liệu."
```

### 3.8 Sidebar case status labels

| Status | Label hiện cho user | Icon |
|--------|-------------------|------|
| `active` | "Đang trao đổi" | ● (green) |
| `resolved` | "Đã giải quyết" | ✓ (grey) |
| `paused` | "Tạm dừng" | ⏸ (amber) |
| `stalled` | "Đang xem xét" | … (grey) — không dùng "stalled" |
| `abandoned` | Ẩn khỏi sidebar | — |

**Không dùng:** "Case", "Session", "Hồ sơ", "Tiến trình điều trị"

---

## 4. TypeScript Constants — Tham chiếu trong code

```typescript
// lib/clinicalBoundary.ts

/**
 * Các string bắt buộc xuất hiện chính xác.
 * Import từ đây — không hardcode trong component.
 * Thay đổi phải qua review.
 */
export const REQUIRED_COPY = {
  FOOTER_DISCLAIMER: 'WISMO là AI companion, không phải tư vấn y khoa hay trị liệu tâm lý. Khẩn cấp: 09 2525 0111',
  ONBOARDING_GREETING: 'Chào bạn, mình là WISMO. Mình ở đây để lắng nghe và cùng bạn khám phá. Bạn muốn chia sẻ gì hôm nay?',
  CONSENT_HEADER: 'WISMO là AI companion giúp bạn suy ngẫm, KHÔNG phải dịch vụ tư vấn tâm lý hay y tế.',
  OUT_OF_SCOPE: 'Điều này nằm ngoài khả năng của mình. Mình là bạn đồng hành, không phải chuyên gia.',
} as const;

/**
 * Các cụm từ bị cấm trong mọi UI text.
 * Dùng cho automated linting / test.
 */
export const FORBIDDEN_TERMS_VI = [
  'kế hoạch điều trị', 'liệu trình', 'chẩn đoán', 'bệnh nhân',
  'can thiệp', 'tiên lượng', 'kê đơn', 'tư vấn tâm lý',
  'trị liệu', 'Phật giáo', 'Vipassana', 'kinh Phật',
] as const;

export const FORBIDDEN_TERMS_EN = [
  'treatment plan', 'therapy session', 'diagnosis', 'patient',
  'intervention', 'prognosis', 'prescribe', 'clinical recovery',
  'symptom assessment', 'Buddhism', 'Vipassana',
] as const;
```

---

## 5. Footer Disclaimer Component

```typescript
// components/common/FooterDisclaimer.tsx

/**
 * Medical disclaimer footer — luôn hiển thị trong chat area.
 * Copy không được thay đổi. Hotline phải clickable.
 */
export function FooterDisclaimer() {
  return (
    <div className="px-4 py-2 text-xs text-wismo-text-light border-t border-wismo-border flex items-center justify-between gap-2">
      <span>WISMO là AI companion, không phải tư vấn y khoa hay trị liệu tâm lý.</span>
      <a
        href="tel:0925250111"
        className="text-wismo-text-muted hover:text-wismo-primary whitespace-nowrap"
      >
        Khẩn cấp: 09 2525 0111
      </a>
    </div>
  );
}
```

---

## 6. i18n Keys — Boundary Strings

```json
// messages/vi.json (boundary section)
{
  "boundary": {
    "footer_disclaimer": "WISMO là AI companion, không phải tư vấn y khoa hay trị liệu tâm lý.",
    "footer_emergency": "Khẩn cấp: 09 2525 0111",
    "consent_not_therapy": "KHÔNG phải dịch vụ tư vấn tâm lý hay y tế. WISMO không chẩn đoán bệnh, không kê đơn thuốc, không trị liệu.",
    "out_of_scope": "Điều này nằm ngoài khả năng của mình. Mình là bạn đồng hành, không phải chuyên gia.",
    "escalation_suggest": "Mình nghĩ một chuyên gia tâm lý có thể hỗ trợ bạn tốt hơn mình.",
    "about_wismo": "WISMO giúp bạn tự quan sát và suy ngẫm qua phương pháp khai vấn. WISMO không chẩn đoán, không kê đơn, không trị liệu.",
    "case_status_active": "Đang trao đổi",
    "case_status_resolved": "Đã giải quyết",
    "case_status_paused": "Tạm dừng",
    "case_status_stalled": "Đang xem xét"
  }
}
```

---

## 7. Automated Boundary Lint (Test)

```typescript
// tests/boundary/clinicalBoundary.test.ts

import { FORBIDDEN_TERMS_VI, FORBIDDEN_TERMS_EN } from '@/lib/clinicalBoundary';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';
import fiMessages from '@/messages/fi.json';

/**
 * Kiểm tra không có forbidden term trong i18n files.
 * Chạy trong CI để catch drift sớm.
 */
describe('Clinical boundary — i18n files', () => {
  const viFlat = flattenObject(viMessages);
  const enFlat = flattenObject(enMessages);

  FORBIDDEN_TERMS_VI.forEach(term => {
    it(`VI messages không chứa "${term}"`, () => {
      const found = Object.entries(viFlat).filter(
        ([, v]) => typeof v === 'string' && v.toLowerCase().includes(term.toLowerCase())
      );
      expect(found).toHaveLength(0);
    });
  });

  FORBIDDEN_TERMS_EN.forEach(term => {
    it(`EN messages không chứa "${term}"`, () => {
      const found = Object.entries(enFlat).filter(
        ([, v]) => typeof v === 'string' && v.toLowerCase().includes(term.toLowerCase())
      );
      expect(found).toHaveLength(0);
    });
  });
});
```

---

## 8. Checklist cho Agent trước khi commit

Trước khi commit bất kỳ UI string nào, agent phải tự kiểm tra:

```
□ Không chứa "liệu trình", "chẩn đoán", "bệnh nhân", "can thiệp"?
□ Không nhắc đến Phật giáo, Vipassana, tôn giáo?
□ Footer disclaimer có mặt ở mọi trang có chat?
□ Hotline 09 2525 0111 có clickable (tel: link) không?
□ WISMO được mô tả là "AI companion", không phải "therapist"/"counselor"?
□ Case status dùng đúng label (không dùng từ "case" hay "session" cho user)?
□ Copy text bắt buộc lấy từ i18n, không hardcode?
```

---

## 9. Cross-references

- **Full product philosophy:** backend `product/spec.md` — Tam Học, khai vấn principles
- **Runtime enforcement:** backend `safety/spec.md` — ResponseValidator GLOBAL_FORBIDDEN list
- **Consent screen copy:** `consent-screen-spec.md` — canonical consent text
- **Crisis copy:** `crisis-display-spec.md` — hotline text, WISMO crisis response
