---
name: responsive-refactor
description: 'Refactor UI responsive cho mobile, tablet, PC. Use when: responsive, mobile UI, adaptive layout, breakpoints, touch support.'
---

# Responsive Refactor — Mobile / Tablet / PC

## When to Use

- Dự án hiện tại chỉ UI cho PC → cần responsive toàn bộ
- Sửa layout bị vỡ trên mobile / tablet
- Thêm touch support, adaptive components

## Procedure

### Step 1 — Audit hiện trạng

1. Liệt kê TẤT CẢ pages / screens / overlays trong dự án
2. Với mỗi screen, đánh giá:

| Screen | Mobile | Tablet | PC | Vấn đề |
|--------|--------|--------|----|--------|
| ... | ❌/⚠️/✅ | ❌/⚠️/✅ | ✅ | Mô tả cụ thể |

3. Xác định breakpoints hiện có (nếu có) và đề xuất breakpoints chuẩn:
   - **Mobile**: < 640px (`sm`)
   - **Tablet**: 640px – 1024px (`sm` → `lg`)
   - **PC**: > 1024px (`lg+`)

4. Kiểm tra:
   - Phaser canvas: có resize handler không? Responsive ratio?
   - Fixed pixel values (width/height hardcoded)
   - Overflow / scroll issues
   - Touch events vs mouse events
   - Font sizes quá nhỏ / quá lớn trên mobile

**Output audit table cho user review. CHỜ XÁC NHẬN trước khi refactor.**

### Step 2 — Thiết kế Responsive Strategy

Với mỗi screen, đề xuất 1 trong 3 strategy:

| Strategy | Khi nào dùng |
|----------|-------------|
| **Reflow** | Cùng component, đổi layout (flex-col ↔ flex-row) |
| **Rearrange** | Ẩn/hiện hoặc đổi vị trí component giữa breakpoints |
| **Redesign** | Component mobile khác hẳn PC (ví dụ: sidebar → bottom sheet) |

Đề xuất cụ thể:

```
Screen: [Tên]
├── Mobile: [layout description]
├── Tablet: [layout description]
└── PC: [layout hiện tại — giữ nguyên / adjust]
```

**Nguyên tắc:**
- Mobile-first approach (style mặc định = mobile, thêm `sm:`, `md:`, `lg:` cho lớn hơn)
- Touch target tối thiểu 44×44px
- Không horizontal scroll trên mobile
- Text readable không cần zoom (min 14px body)

### Step 3 — Lập kế hoạch thay đổi

Phân loại theo risk:

| File | Action | Strategy | Risk | Mô tả |
|------|--------|----------|------|--------|
| path/file.tsx | MODIFY | Reflow | LOW | flex-row → flex-col on mobile |

Thứ tự implement:
1. **Global**: Tailwind config (breakpoints, theme), base styles
2. **Layout shell**: App container, page wrappers
3. **Shared components**: Modal, Tooltip, Slider — responsive variants
4. **Screen by screen**: Theo thứ tự flow (menu → game → overlay)
5. **Canvas**: Phaser resize handler, scale manager

**Output plan cho user review. CHỜ XÁC NHẬN.**

### Step 4 — Implement

Thực hiện từng screen, mỗi screen = 1 commit logic:

#### 4a. Tailwind / CSS foundations
- Đảm bảo viewport meta: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Thiết lập responsive utilities nếu cần (container queries, safe-area-inset)
- Kiểm tra Tailwind breakpoints có đủ không

#### 4b. Component refactor
- Dùng Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Tránh hardcode px — dùng relative units khi hợp lý
- Touch interactions: đủ tap area, không rely chỉ hover
- Conditional rendering nếu layout khác biệt nhiều:
  ```tsx
  // Ưu tiên CSS (Tailwind classes) hơn JS conditional
  // Chỉ dùng JS conditional khi component structure khác hẳn
  <div className="flex flex-col lg:flex-row">
  ```

#### 4c. Phaser canvas (nếu có)
- Scale mode: `Phaser.Scale.RESIZE` hoặc `Phaser.Scale.FIT`
- Listen resize event → recalculate game dimensions
- Touch input: Phaser tự handle, nhưng kiểm tra custom input handlers
- Minimum playable size (đảm bảo game elements không quá nhỏ)

#### 4d. Mỗi component thay đổi phải:
- Giữ nguyên logic / behavior
- Chỉ thay đổi layout / styling
- Test visual ở 3 breakpoints (devtools responsive mode)
- Không break existing functionality

### Step 5 — Verification

Với mỗi screen đã refactor, verify:

| Checkpoint | Mobile (375px) | Tablet (768px) | PC (1280px) |
|------------|---------------|----------------|-------------|
| Layout không vỡ | ☐ | ☐ | ☐ |
| Text readable | ☐ | ☐ | ☐ |
| Touch targets ≥ 44px | ☐ | N/A | N/A |
| No horizontal scroll | ☐ | ☐ | ☐ |
| Interactive elements accessible | ☐ | ☐ | ☐ |
| Phaser canvas usable | ☐ | ☐ | ☐ |

Chạy:
- `npm run build` — đảm bảo build thành công
- `npm run lint` — không lỗi mới
- Dev server → Chrome DevTools → Toggle Device Toolbar → test 3 kích thước

### Step 6 — Summary report

Output cho user:

```
## Responsive Refactor Summary

### Screens refactored: X/Y
| Screen | Strategy | Status |
|--------|----------|--------|
| ... | Reflow/Rearrange/Redesign | ✅/⚠️ |

### Breaking changes: (nếu có)
### Known limitations: (nếu có)
### Recommended follow-ups: (nếu có)
```
