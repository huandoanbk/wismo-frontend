# Auth Flow Spec — First Visit, Guest, Login & Returning User

**Source:** WISMO Project Specification v18, Section 6.4–6.5 + 6.10  
**Scope:** `useAuth`, `LoginForm`, `RegisterForm`, guest flow, middleware redirect, session init  
**Ai đọc:** Agent làm FE.3 (auth wiring), backend S1.2 (auth service), bất kỳ task touch auth

---

## 1. Tổng quan 3 User Types

| Type | Token | Long-term memory | Chat history | Consent |
|------|-------|:---:|:---:|---------|
| **Guest** | ephemeral session token (sessionStorage/cookie) | ❌ session only | ❌ không persist | Bắt buộc mỗi session mới |
| **Registered** | JWT HttpOnly cookie | ✅ | ✅ | Bắt buộc 1 lần, re-consent nếu version đổi |
| **Reconsent required** | token có, consent outdated | ✅ blocked | ✅ blocked | Phải re-consent trước khi chat |

---

## 2. First Visit Flow (Guest)

```
User mở WISMO lần đầu
    │
    ▼
Middleware check: không có wismo_access_token cookie
    │
    ▼
POST /api/accounts/guest-init
    → Server tạo ephemeral guest session
    → Trả { access_token, is_guest: true }
    → FE lưu token vào session cookie (không HttpOnly — ephemeral)
    │
    ▼
Redirect /consent  ← bắt buộc ngay cả với guest
    │
    ▼
Consent Screen (xem consent-screen-spec.md)
    User tick 2 checkboxes → [Bắt đầu]
    │
    ▼
POST /api/accounts/consent  ← lưu consent cho guest session
    │
    ▼
Redirect /chat
    │
    ▼
Chat Screen
    WISMO greeting: "Chào bạn, mình là WISMO.
    Mình ở đây để lắng nghe và đồng hành cùng bạn.
    Bạn muốn chia sẻ gì hôm nay?"
    │
    ▼
[Banner nhẹ, không ép]
    "Đăng ký để lưu cuộc trò chuyện này →"
```

**Guest limits:**
- Không có long-term memory (tất cả xóa khi đóng tab/app)
- Không có case persistence qua session mới
- Không có Memory screen / export
- Session mới = phải consent lại từ đầu
- Soft limit: ~10 turns, nhắc nhẹ khi gần limit

---

## 3. Returning User Flow

```
User mở WISMO (đã login trước đó)
    │
    ▼
Middleware check: có wismo_access_token cookie
    Check consent: có wismo_consented cookie
    │
    ├── Consent OK → redirect /chat
    │
    └── Consent cần re-consent (version mới)
            → redirect /consent với mode='reconsent'
```

**Tại /chat:**
- Hiện chat history từ lần trước
- WISMO **im lặng**, đợi user gõ
- Không greeting, không "Chào mừng trở lại"
- User tự tiếp tục hoặc bắt đầu topic mới

---

## 4. Login Flow

```
/login
    │
    ├── [Đăng nhập với Google]
    │       POST /api/accounts/google/callback  ← xử lý OAuth code
    │
    └── [Email / Password form]
            POST /api/accounts/login
            │
            ├── Success → set cookie → redirect /chat
            │
            ├── 401 → "Email hoặc mật khẩu không đúng"
            │
            └── 403 (under 18) → "Xin lỗi, WISMO chỉ dành cho người từ 18 tuổi trở lên."
```

---

## 5. Register Flow

```
/register
    │
    ├── [Đăng ký với Google]
    │       POST /api/accounts/google/callback  ← Google tạo account mới
    │
    └── [Email / Password form]
            POST /api/accounts/register
            │
            ├── Success → set cookie → redirect /consent
            │           (mới register luôn phải qua consent screen)
            │
            ├── 400 (duplicate email) → "Email này đã được đăng ký"
            │
            └── 403 (under 18) → Block screen (xem mục 8)
```

---

## 6. Guest → Registered Migration

```
User đang chat dưới dạng guest → click "Đăng ký"
    │
    ▼
/register (với guest_session_id trong request)
    │
    ▼
POST /api/accounts/register + { migrate_guest_session: session_id }
    Backend: promote public_safe memory items → user account
    Backend: kế thừa current session history (nếu trong session đang mở)
    │
    ▼
Success → giữ nguyên chat window
    Banner "Cuộc trò chuyện đã được lưu vào tài khoản của bạn ✓"
```

**Không promote:**
- `clinical_sensitive` memory items
- Guest session từ lần mở app cũ (chỉ current session)

---

## 7. useAuth Hook

```typescript
// hooks/useAuth.ts

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '@/types/api';

interface UseAuthReturn {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  initGuest: () => Promise<void>;
  googleLogin: (code: string) => Promise<void>;
}

/**
 * Hook quản lý auth state: login, register, logout, guest init.
 * Token được server set vào HttpOnly cookie — FE không đọc token trực tiếp.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (req: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/accounts/login', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      if (res.status === 401) {
        setError('Email hoặc mật khẩu không đúng');
        return;
      }
      if (res.status === 403) {
        setError('Xin lỗi, WISMO chỉ dành cho người từ 18 tuổi trở lên.');
        return;
      }
      const data: AuthResponse = await res.json();
      // Server đã set HttpOnly cookie — chỉ cần lấy profile
      await fetchProfile();
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (req: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/accounts/register', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      if (res.status === 400) {
        setError('Email này đã được đăng ký');
        return;
      }
      if (res.status === 403) {
        // Under 18 → set flag cho under18 screen
        setError('UNDER_18');
        return;
      }
      await fetchProfile();
      // Redirect /consent handled by middleware
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initGuest = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/accounts/guest-init', { method: 'POST' });
      const data: AuthResponse = await res.json();
      setUser({ user_id: data.user_id, language: 'vi', is_guest: true });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/api/accounts/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  }, []);

  const googleLogin = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/accounts/google/callback', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error();
      await fetchProfile();
    } catch {
      setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    const res = await apiFetch('/api/accounts/profile');
    if (res.ok) {
      const profile: UserProfile = await res.json();
      setUser(profile);
    }
  };

  return { user, isLoading, error, login, register, logout, initGuest, googleLogin };
}
```

---

## 8. Under-18 Block Screen

```
Khi age_range = 'under_18' hoặc server trả 403:

┌─────────────────────────────────────────────────┐
│                                                 │
│              🌱  WISMO                          │
│                                                 │
│  Cảm ơn bạn đã tìm đến WISMO.                 │
│                                                 │
│  WISMO hiện chỉ dành cho người từ 18 tuổi     │
│  trở lên.                                       │
│                                                 │
│  Nếu bạn đang cần hỗ trợ tâm lý, hãy liên    │
│  hệ:                                            │
│                                                 │
│  📞 Sekasin: 09 2525 0111 (24/7)              │
│  💬 sekasin.fi (chat)                           │
│                                                 │
│              [Quay lại]                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Rules:**
- Không cho phép navigate về `/chat`
- Không cố gắng "re-check" sau vài phút
- Hiện resources phù hợp cho người trẻ

---

## 9. Guest Banner Component

```typescript
// components/auth/GuestBanner.tsx

/**
 * Banner nhẹ nhàng mời guest đăng ký.
 * Hiện ở top của chat area (dưới header).
 * KHÔNG aggressive, KHÔNG block chat.
 */
export function GuestBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm">
      <span className="text-blue-700">
        Đăng ký để lưu cuộc trò chuyện này
      </span>
      <div className="flex gap-2">
        <a href="/register" className="text-blue-700 font-medium hover:underline">
          Đăng ký
        </a>
        <button onClick={onDismiss} className="text-blue-400 hover:text-blue-600">
          ✕
        </button>
      </div>
    </div>
  );
}
```

---

## 10. LoginForm & RegisterForm Components

```typescript
// components/auth/LoginForm.tsx

/**
 * Login form: email + password + Google OAuth button.
 * Không tự gọi API — nhận onSubmit prop từ page.
 */
interface LoginFormProps {
  onSubmit: (req: LoginRequest) => void;
  isLoading: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && error !== 'UNDER_18' && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
      )}

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full border border-wismo-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wismo-primary focus:outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Mật khẩu"
        required
        className="w-full border border-wismo-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wismo-primary focus:outline-none"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-wismo-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-wismo-primary-hover disabled:opacity-50"
      >
        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>

      <div className="relative text-center text-xs text-wismo-text-muted">
        <span className="bg-white px-2">hoặc</span>
      </div>

      <GoogleOAuthButton label="Đăng nhập với Google" />
    </form>
  );
}
```

---

## 11. Constraints cho Agent

**Hard rules:**
- Token lưu trong HttpOnly cookie — FE không đọc trực tiếp, không localStorage
- Guest initiation phải xảy ra trước khi redirect /consent
- Under-18 block không có workaround — hiện resources và quay lại
- Guest banner không block chat, có thể dismiss
- `/login` và `/register` không cần token (public paths trong middleware)

**Test suite tối thiểu:**
```
tests/hooks/useAuth.test.ts
  - login success → user set
  - login 401 → error message
  - login 403 → under18 message
  - register duplicate → error message
  - initGuest → is_guest: true
  - logout → clear user + redirect
tests/components/LoginForm.test.tsx
  - renders email + password fields
  - submit calls onSubmit with correct data
  - error message displays
  - loading state disables button
tests/components/GuestBanner.test.tsx
  - renders with link to /register
  - dismiss button calls onDismiss
```

---

## 12. Cross-references

- **Consent redirect:** `consent-screen-spec.md` — ConsentScreen component
- **Middleware:** `ui-layout-spec.md` — Section 6.1 middleware.ts
- **Under-18 safety:** backend `safety/spec.md` — BLOCKED_MINOR state
- **Guest memory rules:** backend `memory/spec.md` — guest ephemeral section
- **Token pattern:** `api-contracts-spec.md` — apiFetch, credentials: include
