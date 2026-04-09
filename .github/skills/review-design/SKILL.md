---
name: review-design
description: 'Review tài liệu thiết kế. Use when: đánh giá design doc, kiểm tra tính khả thi, phát hiện gaps, review architecture, validate feature spec.'
---

# Review Design — Đánh Giá Tài Liệu Thiết Kế

## When to Use

- Review design doc trước khi implement
- Kiểm tra tính khả thi kỹ thuật của thiết kế
- Phát hiện gaps, inconsistency, risks

## Procedure

### Step 1 — Đọc thiết kế

1. Đọc design doc cần review
2. Đọc [kiến trúc tổng quan](../../docs/design/overview.md) để có baseline
3. Đọc các design docs liên quan (nếu feature cross-module)

### Step 2 — Đánh giá Completeness

Kiểm tra design doc có đủ các phần:

- [ ] Tổng quan + mục tiêu rõ ràng
- [ ] Gameplay / behavior mô tả đủ user flow
- [ ] Data structures (types, interfaces) được define
- [ ] State changes + events được liệt kê
- [ ] UI design (components, layout)
- [ ] Phaser integration (entities, rendering)
- [ ] Impact analysis (files affected, risks)
- [ ] Implementation plan có ordered tasks

### Step 3 — Đánh giá Feasibility

- Thiết kế có khả thi với stack hiện tại? (Phaser 3 + React 19 + TypeScript)
- Có conflict với features đã có?
- Performance concerns? (re-render, event spam, sampling loops)
- Online multiplayer compatibility? (serializable commands, dedup)

### Step 4 — Đánh giá Architecture Compliance

- [ ] Tuân thủ layer separation (core ↔ ui ↔ phaser)
- [ ] State changes qua GameState — không direct mutation
- [ ] Actions qua Command pattern — serializable
- [ ] Phaser chỉ render — không business logic
- [ ] Naming conventions consistent
- [ ] i18n coverage cho user-facing text

### Step 5 — Phát hiện Risks

Phân loại:
- 🔴 **Blocker** — Thiết kế sai / không khả thi → cần sửa trước khi code
- 🟡 **Warning** — Thiếu detail / edge case chưa cover → nên bổ sung
- 🟢 **Suggestion** — Cải tiến nhỏ / nice-to-have

### Step 6 — Output

Format báo cáo review:

```markdown
# Design Review: [Feature Name]

## Verdict: ✅ Approved / ⚠️ Needs Changes / ❌ Rejected

## Completeness: X/8 items covered

## Issues Found
### 🔴 Blockers
### 🟡 Warnings
### 🟢 Suggestions

## Recommendations
```

- CHỜ user confirm trước khi tác giả thiết kế sửa
