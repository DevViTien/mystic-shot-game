# Phase 1 — Core Game

## 1. Mục tiêu

Xây dựng game artillery turn-based hoàn chỉnh cho 2 người chơi local (cùng máy):
- Hệ tọa độ 2D với grid
- Nhập hàm toán học để bắn đạn và di chuyển
- Validation theo độ khó
- Obstacles, power-ups, HP system
- Timer 60s mỗi lượt
- Menu setup + HUD + Game Over

## 2. Danh sách tính năng

| Priority | Feature | Trạng thái |
|----------|---------|------------|
| **P0** | Hệ trục tọa độ + grid | ✅ |
| **P0** | Render 2 players (hình tròn, hitbox r=0.5) | ✅ |
| **P0** | Input hàm số + validate (math.js sandbox) | ✅ |
| **P0** | Đạn bay theo đồ thị + animation trail | ✅ |
| **P0** | Collision detection (sample Δx=0.05) | ✅ |
| **P0** | HP system + damage (100 HP, 25 dmg) | ✅ |
| **P0** | Turn management + timer 60s | ✅ |
| **P0** | Win condition (HP = 0) | ✅ |
| **P1** | Movement system (arc length = 5) | ✅ |
| **P1** | Obstacles: hard (chặn) + soft (phá hủy) | ✅ |
| **P1** | Power-ups: 5 loại | ✅ |
| **P1** | Difficulty levels (Easy/Medium/Hard) | ✅ |
| **P1** | Random map generation | ✅ |
| **P2** | Menu screen (tên, màu, difficulty) | ✅ |
| **P2** | HUD (HP bars, timer, buffs, turn indicator) | ✅ |
| **P2** | Game Over overlay | ✅ |
| **P2** | KaTeX formula display | ✅ |
| **P2** | Dark/Light theme + EN/VI i18n | ✅ |

## 3. Quyết định thiết kế quan trọng

### 3.1 Dịch hàm số (Translate + Normalize)

**Vấn đề**: Hàm số nhập vào (ví dụ `y = x²`) không đi qua vị trí player.

**Giải pháp**: Auto-normalize: `translated(x) = f(x - ox) - f(0) + oy`
- Tại `x = ox`: `f(0) - f(0) + oy = oy` → luôn xuất phát từ player ✅
- Hằng số tự do bị vô hiệu hóa: `f(x) = c` → `c - c + oy = oy`

### 3.2 Hướng bắn — Player tự chọn

**Vấn đề ban đầu**: Đạn chỉ bắn về phía đối thủ → không thể nhặt power-ups phía sau.

**Giải pháp**: Player tự chọn hướng (◀/▶ toggle), mặc định auto-suggest về phía đối thủ.

### 3.3 Di chuyển — Arc length limit

**Các phương án**: (A) X-range limit, (B) Arc length limit, (C) Click-to-stop

**Chọn B**: Arc length = 5 đơn vị dọc đường cong.
- Hàm thẳng `f(x) = 0` → đi được 5 đơn vị x
- Hàm cong `f(x) = x²` → đi ít hơn 5 đơn vị x (đường cong dài hơn)
- Tạo chiến thuật: hàm đơn giản = đi xa, hàm phức tạp = né vật cản

### 3.4 Hết giờ → Game over

**Chọn**: Hết 60s → **đối thủ thắng** (không skip lượt). Tạo áp lực quyết định nhanh.

### 3.5 Kiến trúc 2 lớp

**Chọn**: React (DOM UI) + Phaser (Canvas game), giao tiếp qua EventEmitter.
- React quản lý menus, input, HUD
- Phaser chỉ render game canvas
- Decoupled: dễ thay thế hoặc mở rộng từng lớp

### 3.6 Command Pattern

**Chọn**: Mọi action = Command object (`MoveCommand`, `FireCommand`) với `.serialize()`.
- Chuẩn bị sẵn cho online multiplayer (Phase 2)
- `CommandQueue` quản lý thứ tự thực thi

## 4. Core Gameplay Loop

```
Bắt đầu trận → Chọn difficulty → Generate map
       ↓
┌─── TURN START (60s countdown) ────────────────────┐
│                                                    │
│  1. [Tùy chọn] Di chuyển (nếu còn lượt)          │
│     → Nhập hàm số → Player di chuyển theo đồ thị  │
│                                                    │
│  2. Tấn công                                       │
│     → Chọn hướng + Nhập hàm số → Đạn bay          │
│     → Collision: power-up → obstacle → player      │
│                                                    │
│  3. Cập nhật state → Chuyển lượt                   │
└────────────────────────────────────────────────────┘
       ↓
  HP đối thủ = 0 → WIN
```

## 5. Luồng dữ liệu chính

```
User gõ formula → FormulaInput validate
  → Bấm Fire/Move
  → ControlFooter gọi useGameEngine handler
  → Command.execute()
    → GameState mutations (batch)
    → emit StateChanged → React re-render
    → emit FireComplete → GameScene tạo Projectile animation
    → animation xong → emit FireAnimationDone
    → TurnManager endTurn/resetTimer
```

## 6. Animation Flow

```
FireCommand.execute()
  → CollisionSystem.trace() → CollisionResult
  → Batch: applyDamage, knockback, collectPowerUp, destroyObstacle
  → emit FireComplete { trajectory, playerId, collectedPowerUps }
  ↓
GameScene.onFireComplete()
  → Tạo Projectile entity (screen-transformed trajectory)
  → Projectile.animate() (12 points/frame, trail via TrailStyleRenderer)
  → Animation xong → fade out tween → emit FireAnimationDone
  ↓
useGameEngine nhận FireAnimationDone
  → animating = false
  → pendingAction: 'end' → endTurn, 'reset' → resetTimer (có power-up)
```

Chi tiết gameplay: xem [gameplay.md](gameplay.md)
Chi tiết UI: xem [ui-and-menus.md](ui-and-menus.md)
