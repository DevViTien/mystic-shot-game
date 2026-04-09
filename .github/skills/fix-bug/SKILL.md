---
name: fix-bug
description: 'Debug và fix bugs. Use when: bug, lỗi, crash, sai behavior, regression, debug, trace, root cause.'
---

# Fix Bug — Debug & Sửa Lỗi

## When to Use

- Phát hiện bug cần trace + fix
- Behavior sai so với mong đợi
- Regression sau khi thay đổi code

## Procedure

### Step 1 — Thu thập thông tin

1. Bug description (từ user)
2. Expected behavior vs actual behavior
3. Steps to reproduce (nếu có)
4. Screenshot / log (nếu có)

**Nếu thiếu info → hỏi NGẮN GỌN, KHÔNG đoán bừa.**

Các module thường liên quan:
- `GameState.ts` — state + events
- `TurnManager.ts` — phase + timer
- `CollisionSystem.ts` — va chạm
- `Commands.ts` — MoveCommand / FireCommand
- `FunctionParser.ts` — parse + translate hàm
- `GraphRenderer.ts` — sampling trajectory

### Step 2 — Trace flow

Mô tả luồng chạy liên quan đến bug:

```
User action
  → React component (nào?)
    → Command (Move/Fire?)
      → GameState method (nào?)
        → Event emitted (nào?)
          → Phaser handler (nào?)
            → Render result
```

Chỉ rõ:
- File + function liên quan
- Nơi state bị sai / logic sai
- Data flow qua các layers

### Step 3 — Root cause analysis

- Xác định **NGUYÊN NHÂN GỐC** (không chỉ triệu chứng)
- Nếu nhiều khả năng → liệt kê + đánh giá xác suất:
  - Khả năng A (70%): ...
  - Khả năng B (30%): ...

### Step 4 — Đề xuất fix

- Sửa logic nào?
- Sửa ở file nào?
- Vì sao fix này đúng?
- **CHỜ user confirm trước khi implement**

### Step 5 — Implement fix

- Code clean, typed
- Thay đổi TỐI THIỂU — KHÔNG refactor thêm
- KHÔNG phá:
  - EventEmitter flow
  - GameState contract
  - Command pattern
  - Layer separation

### Step 6 — Regression check

- Fix này có thể ảnh hưởng phần nào khác?
- Edge cases cần verify:
  - Multiplayer (cả host + guest)?
  - Các TurnPhase khác nhau?
  - Power-up interactions?
  - Obstacle types (hard/soft)?
- Đề xuất manual test steps

### Step 7 — Post-fix

- Build check: `npm run build`
- Lint check: `npm run lint`
