---
name: write-tests
description: 'Viết unit tests cho module. Use when: viết test, unit test, test coverage, tạo test mới, test module, kiểm thử.'
---

# Write Tests — Viết Unit Tests

## When to Use

- Viết tests cho module hiện có chưa có test
- Thêm test cases cho edge cases / regression
- Tăng coverage cho module cụ thể

## Procedure

### Step 1 — Xác định scope

1. Xác định module cần test (file / folder)
2. Đọc source code để hiểu behavior
3. Kiểm tra test file đã tồn tại chưa (`*.test.ts` cùng thư mục)

### Step 2 — Phân tích test cases

Với mỗi function/method public, liệt kê:

| Function | Happy path | Edge cases | Error cases |
|----------|-----------|------------|-------------|
| `fn()` | Input bình thường | Boundary values, empty, null | Invalid input, overflow |

### Step 3 — Viết tests

1. Tạo file `<Module>.test.ts` cùng thư mục với source
2. Cấu trúc:
   ```typescript
   import { describe, it, expect, beforeEach } from 'vitest';
   import { TargetModule } from './TargetModule';

   describe('TargetModule', () => {
     describe('methodName', () => {
       it('should handle normal case', () => {
         // Arrange
         // Act
         // Assert
       });
     });
   });
   ```

3. Quy tắc:
   - **AAA pattern**: Arrange → Act → Assert
   - Mỗi `it()` test **1 behavior** duy nhất
   - Test name bắt đầu `should` + mô tả behavior
   - Dùng `beforeEach` cho shared setup
   - KHÔNG mock internal logic — chỉ mock external deps (Phaser, Firebase, DOM)

### Step 4 — Chạy tests

```bash
npm run test          # Chạy tất cả
npm run test:coverage # Xem coverage
```

### Step 5 — Review kết quả

- Tất cả tests PHẢI pass
- Kiểm tra coverage: target ≥80% cho module được test
- Nếu fail → fix test hoặc báo bug trong source code

### Step 6 — Báo cáo

Output tóm tắt:

| Module | Tests | Pass | Coverage |
|--------|-------|------|----------|
| `Module.ts` | X | X/X | XX% |

Nếu phát hiện bug trong source → đề xuất chạy skill `/fix-bug`.
