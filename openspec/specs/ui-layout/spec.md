# UI Layout Spec — Layout, Sitemap, Project Structure & Design System

**Source:** WISMO Project Specification v18, Section 6.1–6.3  
**Scope:** Bố cục tổng thể, Tailwind design system, project structure, sitemap, responsive rules  
**Ai đọc:** Agent làm FE.1 (shell UI), FE.4 (sidebar/settings), bất kỳ task nào touch layout

---

## 1. Tech Stack

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | |
| UI | React 19 + TypeScript strict | |
| Styling | Tailwind CSS v3 | utility-first, không viết custom CSS thô |
| i18n | next-intl | Finnish, English, Vietnamese |
| Auth | Next.js middleware + HttpOnly cookie | không localStorage |
| Realtime | SSE (Server-Sent Events) | token-by-token streaming |
| Virtualization | react-virtuoso | cho chat message list |
| Theme | Light only | 1 theme, không dark mode ở MVP |
| Testing | vitest + @testing-library/react | |
| Package manager | npm | không yarn/pnpm |

---

## 2. Bố cục chính — Sidebar + Chat Area

Chuẩn ChatGPT/Claude: sidebar trái cố định + chat area phải chiếm phần còn lại.

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────────┐  ┌─────────────────────────────────────┐  │
│ │     SIDEBAR       │  │         CHAT AREA                   │  │
│ │  w=260px desktop  │  │                                     │  │
│ │  overlay mobile   │  │  Header: WISMO logo + [Calm] [⚙]  │  │
│ │                   │  │─────────────────────────────────────│  │
│ │ [+ Trò chuyện mới]│  │                                     │  │
│ │                   │  │  Messages (virtualized scroll)      │  │
│ │ ● Đang trao đổi   │  │  User: bên phải, bg-blue-50         │  │
│ │   Stress công việc│  │  WISMO: bên trái, bg-white          │  │
│ │                   │  │                    [👍] [👎]        │  │
│ │ ✓ Đã giải quyết   │  │                                     │  │
│ │   Cảm xúc với con │  │  ○○○  WISMO đang suy nghĩ...       │  │
│ │   Khó ngủ         │  │                                     │  │
│ │                   │  │─────────────────────────────────────│  │
│ │ ⏸ Tạm dừng        │  │  [Chia sẻ với WISMO...]    [Gửi]  │  │
│ │   Quan hệ đ.nghiệp│  │─────────────────────────────────────│  │
│ │                   │  │  WISMO là AI, không phải tư vấn     │  │
│ │ ─────────────────  │  │  y khoa. Khẩn cấp: 09 2525 0111   │  │
│ │ ⚙ Cài đặt         │  └─────────────────────────────────────┘  │
│ └───────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Sidebar

- **Desktop:** fixed left, width 260px, không collapse tự động
- **Mobile (< 768px):** overlay (position: fixed, z-50), toggle bằng hamburger button
- **Tablet (768–1024px):** có thể collapse, icon-only mode

**Nội dung sidebar:**
```
[+ Trò chuyện mới]   ← luôn trên cùng

── ĐANG THẢO LUẬN ──
● Stress công việc   ← active case, click → view (không switch context)
● Khó ngủ            ← second active case

── ĐÃ GIẢI QUYẾT ──
✓ Cảm xúc với con    ← read-only
✓ Quan hệ gia đình   ← read-only

── TẠM DỪNG ──
⏸ Quan hệ đồng nghiệp ← read-only

─────────────────
⚙ Cài đặt          ← luôn cuối sidebar
```

**Khác ChatGPT/Claude:** Sidebar hiện cases (theo vấn đề), không phải conversations (theo thời gian). Click case cũ = xem read-only, **không** switch active conversation.

### 2.2 Chat Area

- **Header (height 56px):** WISMO logo + tên active case (truncated) + [Calm] toggle + [⚙] settings shortcut
- **Messages area:** flex-1, overflow-y-scroll, virtualized với react-virtuoso
- **Input bar (min-height 64px):** textarea auto-resize + Send button, sticky bottom
- **Footer disclaimer (height 40px):** text nhỏ, cố định, luôn visible

---

## 3. Calm Mode

```
Toggle [Calm] trong header → bật calm mode:
  - font-size tăng: base 16px → 18px
  - line-height: 1.5 → 1.75
  - sidebar auto-close (overlay)
  - padding rộng hơn
  - visual elements tối giản (ẩn feedback buttons, ẩn case status icons)
  - nền nhạt hơn
  
Mục đích: tạo không gian yên tĩnh cho user đang stress.
Lưu trong localStorage: 'wismo_calm_mode' = 'true'/'false'
```

---

## 4. Tailwind Design System

### 4.1 Colors

```typescript
// tailwind.config.ts — extend colors

colors: {
  wismo: {
    // Primary
    primary:    '#4F7CAC',   // main blue — buttons, links
    'primary-hover': '#3D6A9A',
    
    // Backgrounds
    bg:         '#FAFAFA',   // app background
    'sidebar-bg': '#F3F4F6', // sidebar background
    'message-user': '#EBF3FB', // user message bubble
    'message-bot':  '#FFFFFF', // WISMO message bubble
    
    // Text
    text:       '#1F2937',   // primary text
    'text-muted': '#6B7280', // secondary text
    'text-light': '#9CA3AF', // timestamps, hints
    
    // Status
    active:     '#10B981',   // ● active case (green)
    resolved:   '#6B7280',   // ✓ resolved case (grey)
    paused:     '#F59E0B',   // ⏸ paused case (amber)
    
    // Alerts
    crisis:     '#EF4444',   // crisis hotline overlay bg
    'crisis-border': '#DC2626',
    warning:    '#F59E0B',   // warning banners
    
    // Borders
    border:     '#E5E7EB',
    'border-light': '#F3F4F6',
  }
}
```

### 4.2 Typography

```typescript
// tailwind.config.ts

fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
fontSize: {
  // Base sizes
  'xs':   ['12px', { lineHeight: '16px' }],
  'sm':   ['14px', { lineHeight: '20px' }],
  'base': ['16px', { lineHeight: '24px' }],
  'lg':   ['18px', { lineHeight: '28px' }],
  // Calm mode override — dùng CSS variable
}
```

### 4.3 Spacing & Border Radius

```
Message bubble:  rounded-2xl, px-4 py-3, max-w-[75%]
Input area:      rounded-xl, px-4 py-2, border border-wismo-border
Sidebar item:    rounded-lg, px-3 py-2, hover:bg-wismo-border-light
Button primary:  rounded-lg, px-4 py-2, bg-wismo-primary text-white
```

---

## 5. Project Structure

```
wismo-frontend/
├── app/                        ← Next.js App Router
│   ├── layout.tsx              ← Root layout (font, i18n provider)
│   ├── page.tsx                ← / → redirect /chat hoặc /consent
│   ├── consent/
│   │   └── page.tsx            ← Consent screen
│   ├── chat/
│   │   └── page.tsx            ← Main chat screen
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── settings/
│   │   ├── page.tsx            ← Settings tabs wrapper
│   │   ├── profile/page.tsx
│   │   ├── memory/page.tsx
│   │   └── privacy/page.tsx
│   ├── privacy-policy/page.tsx
│   ├── terms/page.tsx
│   └── not-found.tsx
│
├── components/                 ← Reusable UI components
│   ├── layout/
│   │   ├── AppShell.tsx        ← Sidebar + ChatArea wrapper
│   │   ├── Sidebar.tsx         ← Case list + nav
│   │   ├── ChatArea.tsx        ← Header + messages + input
│   │   └── MobileMenuButton.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx      ← Virtualized message list
│   │   ├── MessageBubble.tsx   ← User + assistant variants
│   │   ├── InputArea.tsx       ← Textarea + send button
│   │   ├── ThinkingDots.tsx    ← Loading animation
│   │   ├── FeedbackButtons.tsx ← 👍 👎 per message
│   │   └── HotlineBlock.tsx    ← Inline hotline (crisis tier B/C)
│   ├── crisis/
│   │   └── CrisisOverlay.tsx   ← Full-screen crisis overlay (tier A)
│   ├── consent/
│   │   └── ConsentScreen.tsx   ← 3 checkboxes + buttons
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── settings/
│   │   ├── MemoryList.tsx
│   │   └── PrivacyPanel.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Spinner.tsx
│       └── ErrorBanner.tsx
│
├── hooks/                      ← Tất cả API calls sống ở đây
│   ├── useChatStream.ts        ← POST message → parse SSE events
│   ├── useMessages.ts          ← GET messages
│   ├── useCases.ts             ← GET cases
│   ├── useAuth.ts              ← login, register, logout, profile
│   ├── useConsent.ts           ← check, grant, withdraw consent
│   ├── useMemory.ts            ← GET/DELETE memory items
│   └── useTurnRecovery.ts      ← GET /turn-status sau disconnect
│
├── lib/
│   ├── api.ts                  ← apiFetch base client
│   └── sseParser.ts            ← parseSSEStream generator
│
├── types/
│   └── api.ts                  ← Tất cả TypeScript types (xem api-contracts-spec.md)
│
├── mocks/                      ← Mock data cho development
│   ├── messages.ts
│   ├── cases.ts
│   └── memory.ts
│
├── messages/                   ← i18n translations
│   ├── vi.json
│   ├── en.json
│   └── fi.json
│
├── middleware.ts               ← Auth check + consent redirect
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Sitemap & Routing

```
/                    → redirect /chat (logged in) hoặc /consent (first visit)
/consent             → Consent screen — bắt buộc trước khi chat
/chat                → Main screen (auth required)
/login               → Email + Google OAuth
/register            → Email + Google OAuth
/settings            → redirect /settings/profile
/settings/profile    → Age range, goal, language
/settings/memory     → Memory items (GDPR)
/settings/privacy    → Consent, export, delete account
/privacy-policy      → GDPR (3 ngôn ngữ)
/terms               → Terms of service
/*                   → 404
```

### 6.1 Next.js Middleware — auth + consent guard

```typescript
// middleware.ts

import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/consent', '/privacy-policy', '/terms'];
const CHAT_PATHS = ['/chat'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('wismo_access_token');
  const hasConsented = request.cookies.get('wismo_consented');

  // Public paths — không check
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Chưa có token → redirect /login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Có token nhưng chưa consent → redirect /consent
  if (CHAT_PATHS.some(p => pathname.startsWith(p)) && !hasConsented) {
    return NextResponse.redirect(new URL('/consent', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Sidebar: overlay (hidden by default), hamburger toggle |
| Tablet | 768–1023px | Sidebar: collapsible icon-only (48px collapsed) |
| Desktop | ≥ 1024px | Sidebar: fixed 260px |
| Large | ≥ 1280px | Chat area: max-w capped, centered |

```typescript
// Tailwind breakpoints dùng trong code
// sm: 640px  — không dùng nhiều
// md: 768px  — sidebar breakpoint
// lg: 1024px — desktop layout
// xl: 1280px — max content width
```

---

## 8. Hard Rules cho Agent

1. **Components nhận data qua props** — không tự gọi API trong component
2. **API calls chỉ trong hooks** — hooks trả data, component render data
3. **Không Redux/Zustand** — useState/useReducer only cho MVP
4. **1 component per file** — Component.tsx + Component.test.tsx co-locate
5. **JSDoc trên mọi component và hook** — mô tả render gì / làm gì
6. **Mọi text user thấy** — không dùng ngôn ngữ lâm sàng (xem product-boundary-spec.md)
7. **Hotline display** — chỉ từ `frontend_state` trong SSE event, không tự detect
8. **`done.final_text` là source of truth** — overwrite preview buffer khi nhận done

---

## 9. Cross-references

- **SSE types:** `api-contracts-spec.md` — TypeScript types
- **Streaming UX detail:** `chat-ux-spec.md` — useChatStream, component behavior
- **Consent UI:** `consent-screen-spec.md` — copy text, checkbox rules
- **Crisis display:** `crisis-display-spec.md` — HotlineBlock, CrisisOverlay rules
- **Clinical boundary copy:** `product-boundary-spec.md` — forbidden terms
- **Auth flow detail:** `auth-flow-spec.md` — first visit, guest, returning user
