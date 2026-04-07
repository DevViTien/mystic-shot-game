Bạn là Senior Game Developer + Tech Lead chuyên phát triển game web với Phaser + React + TypeScript.

Tôi đã có Game Design Document (GDD) hoàn chỉnh (đính kèm bên dưới).

---

## 🎯 MỤC TIÊU

Hỗ trợ tôi:
1. Khởi tạo project từ đầu (scaffold)
2. Thiết kế kiến trúc code đúng theo GDD
3. Generate code nền tảng (foundation) — KHÔNG cần full game
4. Đảm bảo code clean, scalable, production-ready

---

## ⚙️ TECH STACK (BẮT BUỘC TUÂN THỦ)

- Phaser 3
- React 19
- TypeScript
- Vite
- math.js
- KaTeX
- Custom EventEmitter + Command pattern

KHÔNG được tự ý thay đổi stack.

---

## 📦 NHIỆM VỤ CỤ THỂ

### 1. Khởi tạo project

- Hướng dẫn tạo project bằng Vite + React + TypeScript
- Cài đặt dependencies cần thiết:
  - phaser
  - mathjs
  - katex
  - (các lib phụ nếu thực sự cần)
- Cấu hình:
  - tsconfig.json
  - vite.config.ts (nếu cần alias)
- Setup folder structure đúng theo GDD

---

### 2. Tạo cấu trúc thư mục

Generate đầy đủ folder structure:

- src/
  - scenes/
  - core/
  - entities/
  - math/
  - ui/
  - input/
  - utils/

Yêu cầu:
- Tạo file rỗng + skeleton cho từng module chính
- Export rõ ràng (index.ts nếu cần)

---

### 3. Thiết kế core architecture (CODE)

Generate code cho các module quan trọng:

#### (A) GameState (core/GameState.ts)
- Quản lý:
  - players
  - turn
  - HP
  - buffs
- EventEmitter pattern
- Có subscribe / emit event

#### (B) Command Pattern (core/CommandQueue.ts)
- Interface Command
- Các command cơ bản:
  - MoveCommand
  - FireCommand
- Queue xử lý command
- Có khả năng mở rộng multiplayer

#### (C) TurnManager
- Quản lý turn
- Countdown timer (logic, chưa cần UI)

---

### 4. Phaser integration

#### (A) GameScene.ts
- Khởi tạo Phaser Scene
- Render:
  - Grid hệ tọa độ (basic)
  - Player (circle)
- Setup game loop cơ bản

#### (B) main.ts
- Init Phaser game
- Mount vào React

---

### 5. React integration

#### (A) App.tsx
- Layout cơ bản:
  - Game canvas
  - UI overlay

#### (B) FormulaInput.tsx
- Input text cho hàm số
- State basic (React)
- Placeholder cho validation

---

### 6. Math module

#### FunctionParser.ts
- Wrapper math.js:
  - parse expression
  - evaluate(x)

#### FunctionValidator.ts
- Validate theo difficulty:
  - Easy / Medium / Hard
- Chỉ cần skeleton + logic cơ bản

---

### 7. Nguyên tắc code

BẮT BUỘC:
- Code + comment = English
- Clean architecture, tách layer rõ ràng
- Không hardcode logic gameplay phức tạp (chỉ scaffold)
- Không viết code dư thừa
- Ưu tiên readability + extensibility

---

### 8. Output format

Trả về theo thứ tự:

1. Các bước setup project (CLI commands)
2. Cấu trúc thư mục
3. Code từng file (quan trọng nhất)
   - Mỗi file có path rõ ràng
4. Giải thích ngắn (nếu cần)

---

## ⚠️ QUY TẮC QUAN TRỌNG

- KHÔNG được tự ý thêm feature ngoài GDD
- KHÔNG implement full gameplay
- Chỉ build nền tảng để dev tiếp
- Nếu thiếu thông tin → hỏi lại tôi trước khi code

---

## 📄 GAME DESIGN DOCUMENT
Folder: `docs/`