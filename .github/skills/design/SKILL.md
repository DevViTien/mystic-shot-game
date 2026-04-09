---
name: design
description: 'Thiết kế feature mới từ yêu cầu. Use when: tạo design doc, feature specification, system design, kiến trúc mới, phân tích ý tưởng game.'
---

# Design — Tạo Thiết Kế Từ Yêu Cầu

## When to Use

- Nhận yêu cầu feature mới cần thiết kế
- Phân tích ý tưởng game mới
- Tạo / cập nhật tài liệu thiết kế trong `docs/design/`

## Procedure

### Step 1 — Thu thập yêu cầu

1. Đọc yêu cầu từ user
2. Nếu thiếu thông tin → **hỏi lại** (KHÔNG giả định)
3. Chia câu hỏi theo nhóm:
   - **Gameplay**: mechanics, rules, difficulty, progression
   - **Technical**: platform, performance, multiplayer, persistence
   - **UX/UI**: layout, interactions, responsiveness
   - **Business**: scope, timeline, monetization (nếu relevant)
4. Xác định:
   - Feature chính + phụ
   - Target user behavior
   - Scope (small / medium / large)

### Step 2 — Phân tích hệ thống hiện tại

1. Đọc [kiến trúc tổng quan](../../docs/design/overview.md)
2. Đọc design docs liên quan trong `docs/design/`
3. Xác định:
   - Modules bị ảnh hưởng (core / ui / scenes / network / skins / maps)
   - Patterns hiện tại cần tuân thủ
   - Constraints kỹ thuật

### Step 3 — Đề xuất hướng thiết kế

Nếu feature có nhiều cách tiếp cận → đưa ra 2-3 hướng:

- **Hướng A**: [mô tả] — Ưu: ... / Nhược: ... / Complexity: low/med/high
- **Hướng B**: [mô tả] — Ưu: ... / Nhược: ... / Complexity: low/med/high

Mỗi hướng cần:
- Gameplay/behavior chính
- Điểm khác biệt
- Độ phức tạp triển khai

→ CHỜ user chọn hướng trước khi chi tiết hóa.

### Step 4 — Thiết kế chi tiết

Tạo design doc theo cấu trúc:

```markdown
# Feature: [Tên]

## 1. Tổng quan
- Mô tả ngắn gọn
- Mục tiêu

## 2. Gameplay / Behavior
- User flow
- Rules / logic

## 3. Technical Design
- Data structures (types, interfaces)
- State changes (GameState mutations)
- Events (new / modified)
- Commands (new / modified)

## 4. UI Design
- React components (new / modified)
- Layout / interaction

## 5. Phaser Integration
- Entities (new / modified)
- Scene changes
- Rendering

## 6. Impact Analysis
- Files affected
- Breaking changes (nếu có)
- Risk level (LOW / MEDIUM / HIGH)

## 7. Implementation Plan
- Ordered task list
- Dependencies between tasks
```

### Step 5 — Validation

Kiểm tra thiết kế trước khi output:

- [ ] KHÔNG vi phạm layer separation (core ↔ ui ↔ phaser)
- [ ] Mọi state change → qua GameState methods
- [ ] Mọi action → Command pattern (serializable)
- [ ] Phaser chỉ render — không chứa business logic
- [ ] i18n keys cho mọi user-facing text
- [ ] Tương thích với online multiplayer (nếu relevant)
- [ ] Consistent với naming conventions hiện tại

### Step 6 — Output

- Xuất design doc vào `docs/design/[feature-name].md`
- Hoặc trình bày inline nếu user yêu cầu review trước
- CHỜ user confirm trước khi finalize

### Step 7 — Iteration

Sau khi user phản hồi:
- Cập nhật thiết kế theo feedback
- Làm rõ thêm gameplay / technical details
- Lặp lại cho đến khi user approve
