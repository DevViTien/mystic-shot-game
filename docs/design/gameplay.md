# Gameplay Mechanics

## 1. Hệ tọa độ & Map

### Hệ tọa độ

Hai hệ tọa độ song song:

| Hệ | Gốc | Hướng Y | Phạm vi | Dùng cho |
|----|------|---------|---------|----------|
| **Game coords** (toán) | Giữa canvas | Hướng lên ↑ | X[-25,25] Y[-18,18] | Logic, collision, state |
| **Screen coords** (Phaser) | Top-left | Hướng xuống ↓ | X[0,1200] Y[0,864] | Render trên canvas |

**Convert**: `worldToScreen(x, y)` — module-level function trong GameScene.ts

### Map

- Lưới (grid) hiển thị tại mỗi đơn vị nguyên, trục X/Y dày hơn tại x=0, y=0
- Size cố định: **50×36** đơn vị (WIDTH × HEIGHT)
- Camera fixed, hiển thị toàn map

### Map generation

- **Random** (default): `MapGenerator.generate()` — random 5–10 obstacles + 3–6 power-ups, players 2 bên
- **Preset**: `MapGenerator.fromPreset(preset)` — load từ JSON, assign IDs + runtime fields

---

## 2. Shooting (Tấn công)

### Input

| Thuộc tính | Giá trị |
|------------|---------|
| Hàm số | Text input, tối đa **100 ký tự** |
| Parse | math.js sandbox (an toàn, không dùng eval) |
| Validate | Theo difficulty level |
| Hướng bắn | Player **tự chọn**: +x (phải) hoặc -x (trái) |

### Dịch hàm số (Translate + Normalize)

Công thức: `translated(x) = f(x - ox) - f(0) + oy`

- `f` = hàm gốc player nhập
- `(ox, oy)` = vị trí hiện tại của player
- Trừ `f(0)` đảm bảo đạn **luôn đi qua vị trí player**

**Ví dụ**:
- Player ở (3, 2), nhập `x^2` → `(x-3)² - 0 + 2 = (x-3)² + 2`
- Player ở (3, 2), nhập `cos(x)` → `cos(x-3) - cos(0) + 2 = cos(x-3) + 1`
- Hằng số tự do: `f(x) = 5` → `5 - 5 + 2 = 2` → đường ngang qua player

### Hướng bắn

- Toggle button ◀/▶ trên ControlFooter
- Mặc định: auto-suggest về phía đối thủ
- Bắn ngược = chiến thuật hợp lệ (nhặt power-up, phá vật cản phía sau)
- `CollisionSystem.trace()` nhận `direction: 1 | -1`

### Collision Detection

Đạn được sample theo `Δx = 0.05` từ vị trí player theo hướng đã chọn.

**Thứ tự ưu tiên** tại mỗi điểm:

```
1. Power-up → thu thập, đạn TIẾP TỤC bay
2. Vật cản mềm → phá hủy, đạn DỪNG (trừ khi có Piercing)
3. Vật cản cứng → đạn DỪNG
4. Player đối thủ → gây damage, đạn DỪNG
```

**Hitbox**: Circle r=0.5. Check bằng `distance(point, player) ≤ 0.5`
**Obstacles/Power-ups**: Rectangle. Check bằng `pointInRect()`

### CollisionResult

```
CollisionResult {
  hit: boolean           # Có trúng player không
  targetId?: 1 | 2       # Player bị trúng
  collectedPowerUps[]     # Power-ups đã nhặt
  destroyedObstacles[]    # Obstacles đã phá
  finalPosition           # Điểm cuối quỹ đạo
  trajectoryPoints[]      # Toàn bộ điểm đã sample
}
```

---

## 3. Movement (Di chuyển)

### Cơ chế

- Nhập hàm số **giống shooting**, cũng được translate + normalize
- Player **di chuyển dọc theo đồ thị**, giới hạn bởi **arc length = 5 đơn vị**
- Hướng: player tự chọn (+x hoặc -x), cùng toggle với hướng bắn

### Arc length

Arc length = tổng khoảng cách Euclid giữa các điểm sample:
`L ≈ Σ √(Δx² + Δy²)` với Δx = 0.05

**Chiến thuật**:

| Hàm | Arc length cho cùng Δx | Đi xa được |
|-----|----------------------|------------|
| `f(x) = 0` (thẳng) | Đúng = Δx | 5 đơn vị x |
| `f(x) = x²` (cong) | > Δx | < 5 đơn vị x |
| `f(x) = sin(x)` (oscillate) | >> Δx | << 5 đơn vị x |

→ Hàm đơn giản = đi xa. Hàm phức tạp = đi ngắn nhưng né vật cản.

### Giới hạn

- Dừng tại điểm biên map hợp lệ cuối cùng nếu ra ngoài
- Dừng khi gặp giá trị `undefined` hoặc `Infinity`
- Mỗi lượt: tối đa **1 lần di chuyển** (nếu còn charges)
- Thực hiện **trước khi bắn**
- Charges ban đầu: **2**, tăng bằng ExtraMove power-up

---

## 4. Difficulty Levels

### Validation rules (duyệt AST math.js)

| Level | Cho phép | Bắt buộc | Ví dụ |
|-------|----------|----------|-------|
| **Easy** | Chỉ đa thức: `+`, `-`, `*`, `/`, `^`, `x`, số, `pi`, `e` | — | `2*x + 1`, `x^2 - 3*x` |
| **Medium** | Đa thức + `sin`, `cos`, `tan`, `log`, `ln`, `sqrt`, `abs` | — | `sin(x) + x`, `log(x) + x^2` |
| **Hard** | Giống Medium | **≥1 hàm đặc biệt** (reject đa thức thuần) | `sin(x)*cos(2*x)`, `tan(x/3)` |

**Validation flow**: Input → `FunctionParser.parse()` (kiểm tra cú pháp) → `FunctionValidator.validate()` (duyệt AST kiểm tra difficulty rules) → `ValidationResult { valid, error? }`

---

## 5. Obstacles (Vật cản)

| Loại | Visual | Khi đạn chạm | Persistence |
|------|--------|--------------|-------------|
| **Hard** | Hình chữ nhật, fill đặc (`0x888888`) | Đạn dừng | Giữ nguyên cả trận |
| **Soft** | Hình chữ nhật, fill mờ (0.4 alpha), viền sáng hơn | Đạn dừng + xoá obstacle | Bị phá hủy |

- Random: 5–10 vật cản mỗi trận
- Kích thước: 1×1 đến 3×4 đơn vị
- **Piercing buff**: Đạn xuyên qua soft obstacle mà không dừng

---

## 6. Power-ups

Đạn đi qua power-up → **nhặt**, đạn **tiếp tục bay**.

| Power-up | Hiệu ứng | Duration |
|----------|----------|----------|
| **DoubleDamage** | Damage ×2 (50 thay vì 25) | remainingTurns=2 → hiệu lực 1 lượt tiếp |
| **Knockback** | Đẩy lùi đối thủ 2 đơn vị theo hướng đạn | remainingTurns=2 → hiệu lực 1 lượt tiếp |
| **ExtraMove** | +1 moveCharges | Áp dụng ngay, vĩnh viễn |
| **Shield** | Chặn 1 lần damage hoàn toàn | remainingTurns=-1 (permanent đến khi bị hit) |
| **Piercing** | Đạn xuyên qua soft obstacles | remainingTurns=2 → hiệu lực 1 lượt tiếp |

**Buff duration**: DoubleDamage, Knockback, Piercing set `remainingTurns=2` khi nhặt, `nextTurn()` tick -1, nên hiệu lực cho đúng 1 lượt tiếp theo.

---

## 7. Timer & Turn Management

### Timer

- **60 giây** mỗi lượt (countdown)
- Warning khi **≤ 10 giây** (đổi màu đỏ, pulse animation)
- Hết giờ → **game kết thúc**, đối thủ thắng (không skip lượt)
- Timer **pause** khi đạn đang bay (animating), **resume** sau animation

### Turn phases

```
Idle → (user input) → Move → (animation) → Fire → (animation) → Resolve → Idle (next player)
```

| Phase | Mô tả |
|-------|-------|
| Idle | Chờ input từ player |
| Move | Đang xử lý di chuyển |
| Fire | Đang xử lý bắn |
| Resolve | Cập nhật state sau action |

### Chuyển lượt

```
TurnManager.endTurn()
  → gameState.nextTurn()
    → Tick buffs (remainingTurns -= 1, remove nếu = 0)
    → Switch currentPlayerId (1 ↔ 2)
    → Emit TurnChanged
  → startTurn() → reset timer
```

---

## 8. Edge Cases

| Case | Xử lý |
|------|--------|
| Hàm undefined tại 1 điểm (ví dụ `1/x` tại x=0) | Bỏ qua điểm đó, đạn tiếp tục |
| Hàm ra ngoài map Y | Đạn biến mất, tiếp tục nếu hàm quay lại trong map (ví dụ sin) |
| Hết thời gian | Đối thủ thắng |
| Cả 2 hết move charges | Nút Move disable |
| Player bắn trúng chính mình | Không xảy ra — collision bắt đầu sau vị trí player |
| Hằng số: `f(x) = 5` | Normalize thành đường ngang qua player |
| Hard mode: đa thức thuần | Reject — phải chứa ≥1 hàm đặc biệt |
