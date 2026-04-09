---
name: review-code
description: 'Review code — đánh giá kiến trúc, code quality, TypeScript safety. Use when: review code, đánh giá PR, kiểm tra code quality, audit module.'
---

# Review Code — Đánh Giá Code

## When to Use

- Review code sau khi implement
- Đánh giá module / PR trước khi merge
- Audit code quality định kỳ

## Procedure

### Step 1 — Xác định scope

1. User chỉ định module / file / toàn bộ codebase
2. Đọc code trong scope
3. Đọc design doc liên quan (nếu có) để verify implementation vs design
4. Đọc `reports/` để tránh lặp issues đã flagged

### Step 2 — Đánh giá kiến trúc

- Layer separation: core ↔ ui ↔ phaser — có vi phạm?
- Coupling không cần thiết?
- Logic đặt sai layer? (business logic trong UI? state mutation trong Phaser?)
- Command pattern được tuân thủ?

### Step 3 — Code quality

- **Naming**: PascalCase file, camelCase function/hook, UPPER_CASE constants
- **DRY**: Có duplicated logic không?
- **SRP**: Function quá dài / làm quá nhiều việc?
- **Magic numbers**: Dùng `config.ts` constants?
- **Dead code**: Code không sử dụng?

### Step 4 — TypeScript safety

- Có `any` không cần thiết?
- Missing null checks / type guards?
- Generic types có thể improve?
- Event types consistent với `GameEventMap`?

### Step 5 — Reusability & abstraction

- Có đoạn nào nên extract thành util / hook / service?
- Có abstraction bị over-engineered?
- Có thể tái sử dụng code có sẵn trong `common/` hoặc `utils/`?

### Step 6 — Performance

- React: re-render không cần thiết? (missing memo/useCallback)
- Phaser: event emit quá nhiều? sampling loop tối ưu?
- GameState: batch mutations được sử dụng đúng?

### Step 7 — Consistency

- Import paths: dùng `@/` alias?
- Barrel exports: mỗi folder có `index.ts`?
- i18n: user-facing text có dùng translation keys?
- Icons: dùng prefix `Icon*` từ `common/icons`?

### Step 8 — Output báo cáo

Xuất vào: `reports/[review]<scope>-yyyymmdd.md`

```markdown
# Code Review Report — <scope>

## 1. Tổng quan
- Module/scope reviewed
- Nhận xét chung

## 2. Kiến trúc
- Điểm tốt / vấn đề / đề xuất

## 3. Code Quality
- Điểm tốt / vấn đề (kèm file:line reference)

## 4. TypeScript Safety
- Issues found

## 5. Reusability
- Đoạn nào nên extract? Over-engineered?

## 6. Performance
- Concerns (nếu có)

## 7. Issues Summary
| # | Severity | File | Mô tả |
|---|----------|------|--------|
| 1 | 🔴/🟡/🟢 | path/file.ts:L42 | Description |

## 8. Refactor đề xuất
- Danh sách theo thứ tự ưu tiên
```

Severity:
- 🔴 **Critical** — bug / sai kiến trúc → phải sửa
- 🟡 **Improvement** — nên sửa để tốt hơn
- 🟢 **Nice-to-have** — optional

### Step 9 — Post-review (khi user đồng ý refactor)

Khi user confirm "APPROVE REFACTOR":

1. Lập kế hoạch refactor — chia nhỏ bước, ưu tiên an toàn
2. Refactor từng phần — có before/after, giải thích ngắn gọn
3. Đảm bảo KHÔNG phá behavior / contract hiện tại
