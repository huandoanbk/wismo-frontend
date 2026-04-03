# WISMO Frontend — Claude Code Rules

## Project
- Next.js 15 + React 19 + TypeScript + Tailwind CSS
- Package manager: npm
- State: React hooks (`useState`, `useReducer`) — KHÔNG Redux/Zustand cho MVP

## Purpose
File này hướng dẫn Claude Code khi **thực thi một active change đã được OpenSpec tạo và Owner duyệt/chỉnh**.

Claude không tự quyết định roadmap, không tự chia lại ownership giữa workers, và không tự mở rộng scope ngoài change hiện tại.

Claude phải làm theo:
1. `openspec/changes/<change-name>/proposal.md`
2. `openspec/changes/<change-name>/design.md`
3. `openspec/changes/<change-name>/tasks.md`
4. các `Spec References` được liệt kê trong proposal/design

Nếu Owner đã chỉnh proposal/design/tasks sau khi OpenSpec sinh ra, **bản đã chỉnh là source of truth**.

---

## Execution Boundary

### Claude phù hợp cho
- SSE streaming hook / event parsing / stream lifecycle
- Reconnect / recovery / no-duplicate-message flows
- Case switch confirmation flow
- Chat performance optimization
- Virtualized list / batched render / token streaming buffer
- Complex cross-hook coordination
- Multi-file integration ở app/chat/settings/auth flow
- Error recovery logic cho chat UX
- Crisis hotline display logic nếu liên quan nhiều states/specs
- Frontend behavior cần bám chặt canonical SSE contract

### Claude không tự nhận
- Scaffold component đơn giản nếu tasks không yêu cầu
- Cleanup/refactor tiện tay ngoài active change
- Wiring CRUD đơn giản chỉ vì “thấy sẵn API”
- Tự ý làm thay các isolated UI/tasks vốn phù hợp với Codex
- Tự ý đổi response mapping hoặc spec ownership

---

## Workflow Rules
- Trước khi code, đọc `proposal.md`, `design.md`, `tasks.md`.
- Chỉ load các spec files được liệt kê trong `Spec References`.
- Không load toàn bộ specs folder nếu change đã chỉ rõ spec refs.
- Code theo checklist trong `tasks.md`.
- Chạy test đúng scope trước khi check xong từng task quan trọng.
- Chỉ sửa các file nằm trong active change đã được duyệt.
- Nếu đang làm mà phát sinh nhu cầu sửa file ngoài scope, dừng và báo để update change/task trước khi tiếp tục.
- Không tự ý gộp nhiều changes vào một lần implement.
- Nếu proposal/tasks lệch với codebase hiện tại, ưu tiên:
  1. spec refs
  2. proposal/design/tasks đã duyệt
  3. code cũ

---

## Spec Reference Rules

### Full spec
- Full spec: `docs/WISMO_Project_Specification_v18.md`
- Chỉ đọc đúng phần cần thiết cho frontend change hiện tại.
- Mặc định frontend chủ yếu bám Section 5 user-facing copy/rules, Section 6 UX/UI, và API contracts.

### Frontend domain specs
- `product/spec.md`
  - clinical boundary cho text user-facing
  - disclaimer / forbidden wording boundary
- `ui-layout/spec.md`
  - layout, sitemap, responsive structure, shell
- `chat-ux/spec.md`
  - streaming UX
  - message states
  - chat components
  - case switch behavior
  - loading/recovery behavior
- `auth-flow/spec.md`
  - first visit
  - returning user
  - guest flow
  - auth-state UX
- `consent-screen/spec.md`
  - consent copy
  - checkbox text
  - consent screen behavior
- `crisis-display/spec.md`
  - hotline display rules theo tier
  - fullscreen / inline / footer behavior
- `api-contracts/spec.md`
  - `ChatSendRequest`
  - `ChatDonePayload`
  - SSE event format
  - endpoint request/response shapes

### Mandatory interpretation rules
- Không tự suy diễn SSE event shape từ backend cũ hoặc từ trí nhớ.
- SSE/UI streaming behavior phải bám `api-contracts/spec.md`.
- Consent copy phải bám `consent-screen/spec.md`.
- Crisis display phải bám `crisis-display/spec.md`.
- User-facing disclaimer / wording boundary phải bám `product/spec.md`.

---

## UI Architecture Rules

### Component boundary
- Components render từ props — không tự fetch data.
- Components không tự chứa business logic.
- Components chỉ nhận data đã được chuẩn hóa để render.
- Không đặt fetch/axios trực tiếp trong component.

### Hook boundary
- API calls nằm trong hooks hoặc lib client layer.
- Hook chịu trách nhiệm fetch/mutate/parse/retry/recovery state.
- Component nhận props từ page/container/hook composition.

### Presentation vs logic
- `MessageBubble` nhận dữ liệu render → không tự quyết định policy.
- `ChatWindow` nhận messages + callbacks → không tự biết API.
- `Sidebar` nhận cases + activeCaseId + handlers → không tự fetch/sort business data nếu spec không yêu cầu tại component level.
- Hotline / warning / case switch UI nhận flags/props rõ ràng từ upper layer.

### State management
- MVP: local `useState` / `useReducer` only.
- Không thêm Redux/Zustand/Jotai/... nếu change không yêu cầu rõ.

---

## SSE / Streaming Rules
- Parse đúng canonical event ordering theo contract frontend/backend.
- `done` payload là source of truth cho final assistant message.
- Token preview chỉ là trạng thái tạm.
- Không giữ preview token làm final nếu `done` đã về.
- Recovery/reconnect phải tránh duplicate messages, duplicate final state, hoặc append sai order.
- Streaming performance phải ưu tiên ref/buffer/batched render khi change yêu cầu.

---

## Performance Rules
- Chat list ưu tiên virtualization khi spec/task yêu cầu.
- Token streaming ưu tiên append vào buffer/ref, tránh re-render toàn bộ list mỗi token.
- Không re-render toàn bộ chat tree khi input thay đổi.
- Lazy load lịch sử khi UX/spec yêu cầu.
- Tối ưu cho chat dài và stream dài, nhưng không hy sinh correctness của SSE contract.

---

## Clinical / Copy Boundary
- Mọi text user thấy: KHÔNG dùng ngôn ngữ clinical bị cấm.
- Footer disclaimer phải đúng wording được spec cho phép.
- Consent screen copy phải copy đúng từ `consent-screen/spec.md`.
- Hotline display phải đúng `crisis-display/spec.md`.
- Không tự “viết lại cho hay hơn” các copy safety/consent/disclaimer nếu spec đã cho text chuẩn.

---

## Code Standards

### Language & Tooling
- TypeScript strict mode
- Formatter/lint: `prettier` + `eslint`
- Không dùng `any` nếu không có lý do cực kỳ rõ và được task/spec cho phép
- Ưu tiên type aliases / interfaces rõ ràng cho API payloads, component props, hook returns

### Naming
- Components: `PascalCase`
- Hooks: `camelCase` bắt đầu bằng `use`
- Functions: `camelCase`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types / interfaces: `PascalCase`
- Files:
  - `PascalCase.tsx` cho components
  - `camelCase.ts` cho hooks / lib / utils

Tên phải tự giải thích, tránh tên mơ hồ như `data`, `item`, `tmp`, `flag` nếu có thể đặt rõ nghĩa hơn.

### JSDoc
- Bắt buộc cho component, hook, function public hoặc có logic đáng kể.
- Hook nên mô tả:
  - purpose
  - inputs
  - return shape
  - side effects quan trọng
- Props interface nên có comment cho từng prop khi component không hiển nhiên.

### Comments
- Chỉ comment để giải thích **tại sao**
- Không comment điều hiển nhiên
- Dùng `// TODO(<task-id>): ...` khi API/spec chưa sẵn

### Readability
- Từng bước rõ ràng
- Early return cho invalid/error states
- Không dồn nhiều logic vào một dòng
- Với SSE/reconnect logic, code phải chia phase rõ ràng

---

## Types / Contracts
- Frontend types cho request/response/SSE phải bám `api-contracts/spec.md`.
- Không tự đổi field names chỉ để tiện code.
- Nếu API contract đã có canonical shape, UI mapping phải tách rõ:
  - raw API type
  - UI view model nếu cần

---

## Error Handling
- Không swallow errors âm thầm
- Recovery path phải rõ:
  - loading
  - transient error
  - retry/reconnect
  - final failure state
- Với chat streaming, error state không được làm hỏng message history hiện có
- Không tạo UX mơ hồ khiến user không biết tin nhắn đã gửi chưa

---

## Testing Rules
- Framework: `vitest` + `@testing-library/react`
- Dùng hook tests khi change nằm ở hook/recovery/stream parsing
- Component tests tập trung vào rendering, interaction, state transitions thấy được từ UI
- Mock API responses / SSE events cho hook tests
- Không test implementation detail vô nghĩa

### Với các change thuộc stream / reconnect / recovery / crisis display
- Phải có test cases cho trạng thái lỗi / retry / dedupe / finalization
- Không report done nếu các flow quan trọng này chưa có coverage phù hợp

---

## Definition of Done
Chỉ report done khi:
- tất cả checklist item trong `tasks.md` đã xong
- tests liên quan đã pass
- lint/format sạch
- không sửa ngoài scope
- code bám đúng spec refs
- components vẫn giữ presentation boundary rõ ràng