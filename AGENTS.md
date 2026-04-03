# WISMO Frontend — Codex Rules

## Project
- Next.js 15 + React 19 + TypeScript + Tailwind CSS
- Package manager: npm

## Purpose
File này hướng dẫn Codex khi **thực thi một active change đã được OpenSpec tạo và Owner duyệt/chỉnh**.

Codex không tự quyết định roadmap, không tự chia lại ownership giữa workers, và không tự mở rộng scope ngoài change hiện tại.

Codex phải làm theo:
1. `openspec/changes/<change-name>/proposal.md`
2. `openspec/changes/<change-name>/design.md`
3. `openspec/changes/<change-name>/tasks.md`
4. các `Spec References` được liệt kê trong proposal/design

Nếu Owner đã chỉnh proposal/design/tasks sau khi OpenSpec sinh ra, **bản đã chỉnh là source of truth**.

---

## Execution Boundary

### Codex phù hợp cho
- Project scaffold / config / Tailwind wiring
- UI components dùng mock data
- Presentational components
- Form components
- Narrow-scope hooks để wire API
- Sidebar / settings / consent / auth UI wiring
- CRUD-style API integration ở frontend
- Typed API client updates
- Component tests / hook tests / regression UI checks
- Small-to-medium refactors trong một lane rõ ràng
- Performance-safe cleanup trong scope task

### Codex không tự nhận
- SSE orchestration phức tạp
- Reconnect / recovery flow nhiều trạng thái
- Case switch flow có business coordination phức tạp
- Cross-hook / cross-page coordination lớn
- Refactor kiến trúc lớn ngoài active change
- Tự ý đưa business policy vào component
- Tự ý đổi UX flow không được task/spec giao

---

## Workflow Rules
- Nhận task → đọc `proposal.md`, `design.md`, `tasks.md`
- Chỉ load đúng các spec files được list trong `Spec References`
- Không load toàn bộ specs folder nếu change đã chỉ rõ spec refs
- Code theo từng checkbox trong `tasks.md`
- Chạy test/lint đúng scope trước khi check item done
- Chỉ sửa các file nằm trong active change đã được duyệt
- Nếu task phát sinh cần đụng file ngoài scope, dừng và báo để update change/task
- Không opportunistic refactor
- Không tự ý sửa logic stream/reconnect phức tạp nếu change không giao

---

## Spec Reference Rules

### Full spec
- Full spec: `docs/WISMO_Project_Specification_v18.md`
- Chỉ dùng khi change yêu cầu; bình thường ưu tiên domain specs frontend.

### Frontend domain specs
- `product/spec.md`
  - clinical boundary cho text user-facing
- `ui-layout/spec.md`
  - layout / responsive / shell / sitemap
- `chat-ux/spec.md`
  - component behavior
  - chat interactions
  - case switch UX
  - loading states
- `auth-flow/spec.md`
  - guest / register / login / returning user flows
- `consent-screen/spec.md`
  - consent copy
  - checkbox wording
  - consent screen behavior
- `crisis-display/spec.md`
  - hotline UI rules theo tier
- `api-contracts/spec.md`
  - endpoint request/response shapes
  - SSE event format
  - chat payload contracts

### Mandatory interpretation rules
- Không tự suy diễn API response shape nếu `api-contracts/spec.md` đã định nghĩa.
- Không tự viết lại consent copy hoặc hotline copy nếu spec đã có text chuẩn.
- Không nhét business policy vào component chỉ vì tiện wiring.

---

## UI / Wiring Rules

### Component boundary
- Components phải nhận props.
- Không fetch trực tiếp trong component.
- Không đặt business filtering/sorting/policy logic trong component nếu spec không yêu cầu rõ tại component layer.

### Hook boundary
- Khi wire API thật:
  - tạo hook mới hoặc cập nhật hook existing
  - hook fetch/mutate data
  - component nhận state/callbacks qua props hoặc page-level composition
- Nếu API chưa có:
  - giữ mock
  - ghi `// TODO(<task-id>): wire when API ready`

### Mapping rule
- Mỗi wiring task phải rõ:
  - endpoint nào
  - response shape nào
  - map vào type nào
  - component prop nào nhận dữ liệu đó

### Do not
- Không fetch trong component
- Không hardcode business assumptions không có trong spec
- Không lén thêm sorting/filtering/policy behavior nếu task không giao

---

## Code Standards

### Language & Tooling
- TypeScript strict mode
- Formatter/lint: `prettier` + `eslint`
- Không dùng `any`

### Naming
- Components: `PascalCase`
- Hooks: `camelCase` bắt đầu `use`
- Functions: `camelCase`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types / interfaces: `PascalCase`

Tên phải rõ nghĩa, tránh tên mơ hồ hoặc một ký tự nếu không cần.

### JSDoc
- Bắt buộc cho component, hook, function public hoặc có logic đáng kể
- Props interface nên có comment cho từng prop nếu component không hiển nhiên

### Comments
- Giải thích tại sao, không giải thích điều hiển nhiên
- TODO format: `// TODO(<task-id>): ...`

### Readability
- Từng bước rõ ràng
- Early return cho edge/error states
- Không dồn logic phức tạp vào một dòng
- Destructure props rõ ràng

---

## Types / API Contracts
- Frontend request/response types phải bám `api-contracts/spec.md`
- Không tự đổi field names
- Nếu cần UI model riêng, tách rõ adapter/mapper thay vì trộn trực tiếp vào component tree

---

## Clinical Boundary
- Mọi text user thấy: không dùng ngôn ngữ clinical bị cấm
- Footer disclaimer phải đúng wording được spec cho phép
- Consent screen text phải copy đúng từ `consent-screen/spec.md`
- Crisis/hotline text phải bám `crisis-display/spec.md`

---

## Testing Rules
- Framework: `vitest` + `@testing-library/react`
- Hook tests dùng mock API/SSE khi cần
- Component tests tập trung vào rendering + interaction + visible state
- Không test business logic backend-side
- Không bỏ test chỉ vì component “nhỏ”

### Với wiring/API integration changes
- Phải test loading / success / error states phù hợp
- Nếu có mapping logic, phải test mapping đó
- Không report done nếu flow UI chính chưa có coverage tối thiểu

---

## Definition of Done
Chỉ report done khi:
- tất cả checklist trong `tasks.md` đã xong
- tests liên quan đã pass
- lint/format sạch
- không sửa ngoài scope
- module bám đúng domain spec đã chỉ định
- component boundary vẫn sạch: props in, hooks/lib handle data