---
name: code
description: 'Implement features theo thiết kế. Use when: code feature mới, implement design, triển khai, develop, scaffold, tạo module mới.'
---

# Code — Implement Theo Thiết Kế

## When to Use

- Implement feature mới từ design doc đã approved
- Scaffold module / component mới
- Triển khai thay đổi theo kế hoạch

## Procedure

### Step 1 — Đọc thiết kế

1. Đọc design doc của feature cần implement
2. Xác nhận design đã được review/approved
3. Nếu chưa có design doc → yêu cầu chạy skill `/design` trước

### Step 2 — Phân tích impact

1. Từ design doc, extract và phân loại:
   - ✅ **New**: files / modules cần tạo mới
   - 🔄 **Modify**: files cần sửa
   - ⚠️ **Breaking**: thay đổi có khả năng break code hiện tại

2. Với mỗi thay đổi, extract:
   - Data structures mới (types, interfaces)
   - Events mới / thay đổi
   - Dependencies

3. Thực hiện 3-way tracing:
   - 🔼 Forward: ảnh hưởng downstream
   - 🔽 Backward: phụ thuộc upstream
   - ↔ Horizontal: consistency với code hiện tại

### Step 3 — Lập kế hoạch implement

Với mỗi thay đổi:

| File | Action | Risk | Mô tả |
|------|--------|------|--------|
| path/file.ts | NEW/MODIFY | LOW/MED/HIGH | Nội dung thay đổi |

**Output plan cho user review. CHỜ XÁC NHẬN trước khi code.**

### Step 4 — Validation checklist (trước khi code)

- [ ] KHÔNG mutate state ngoài GameState
- [ ] KHÔNG phá vỡ event contract
- [ ] KHÔNG duplicate logic có sẵn
- [ ] KHÔNG phá Command pattern
- [ ] KHÔNG coupling chặt React ↔ Phaser
- [ ] Tận dụng code có sẵn (utils, hooks, components)
- [ ] Đúng naming convention (PascalCase file, camelCase hook)
- [ ] Barrel export qua `index.ts`

### Step 5 — Implement

1. Implement từng bước nhỏ, theo thứ tự dependency:
   - **core/** trước (types, state, events)
   - **entities/** / **skins/** / **maps/** (nếu có)
   - **scenes/** (Phaser integration)
   - **ui/** cuối (React components)

2. Mỗi bước phải giải thích:
   - Đã thay đổi gì
   - Tại sao
   - Tích hợp với hệ thống như thế nào

3. Tuân thủ:
   - Prettier: single quotes, trailing commas, 100 char width
   - Import alias: `import { X } from '@/core'`
   - Constants → `config.ts`
   - i18n keys cho user-facing text (cả EN + VI)

4. Nguyên tắc:
   - Thay đổi tối thiểu — ưu tiên extension hơn modification
   - KHÔNG rewrite nếu không cần thiết

### Step 6 — Post-implement check

- Build check: `npm run build` (TypeScript + Vite)
- Lint check: `npm run lint`

### Step 7 — Self-review

Review lại code vừa viết:
- Kiến trúc: layer separation đúng?
- Performance: re-render? event spam? sampling loop?
- Edge cases: multiplayer compatible? buff interactions?
- Đề xuất cải tiến / refactor (nếu hợp lý)
