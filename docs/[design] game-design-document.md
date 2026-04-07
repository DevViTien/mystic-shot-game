# 📄 GAME DESIGN DOCUMENT — "Mystic Shot"

## 1. Tổng quan

| Item | Detail |
|------|--------|
| **Tên** | Mystic Shot |
| **Thể loại** | Turn-based Artillery / Math Puzzle |
| **Platform** | Desktop Web (HTML5) |
| **Số người chơi** | 2 (local, cùng máy — thiết kế mở rộng online) |
| **Art style** | Geometric, Minimalist |
| **Monetization** | Free |

---

## 2. Core Gameplay Loop

```
Bắt đầu trận → Chọn difficulty → Random map
       ↓
┌─── TURN START (60s countdown) ────────────────────┐
│                                                    │
│  1. [Tuỳ chọn] Di chuyển (nếu còn lượt)          │
│     → Nhập hàm số → Player di chuyển theo đồ thị  │
│     → Di chuyển đến khi chạm biên map              │
│                                                    │
│  2. Tấn công                                       │
│     → Chọn hướng ◀/▶ + Nhập hàm số → Đạn bay theo đồ thị │
│     → Kiểm tra va chạm:                           │
│        • Vật cản cứng → đạn dừng                  │
│        • Vật cản mềm → đạn dừng + xoá vật cản    │
│        • Power-up → nhặt + đạn tiếp tục bay       │
│        • Đối thủ (hitbox r=0.5) → gây damage      │
│                                                    │
│  3. Cập nhật state → Chuyển lượt                   │
└────────────────────────────────────────────────────┘
       ↓
  HP đối thủ = 0 → WIN
```

---

## 3. Hệ thống chi tiết

### 3.1 Hệ tọa độ & Map

- Map = mặt phẳng Oxy, hiển thị grid lines
- Kích thước map: **-20 ≤ x ≤ 20**, **-15 ≤ y ≤ 15** (có thể điều chỉnh)
- Player được render dưới dạng **hình tròn** (bán kính 0.5) tại tọa độ của mình
- Camera: fixed, hiển thị toàn map
- Mỗi trận **random vị trí** obstacles và power-ups

### 3.2 Shooting (Tấn công)

| Thuộc tính | Giá trị |
|------------|---------|
| Input | Hàm số dạng text, ví dụ `y = -0.5*x^2 + 3*x` (tối đa **100 ký tự**) |
| Validation | Parse bằng **math.js**, kiểm tra hợp lệ theo difficulty |
| Quỹ đạo đạn | Đồ thị hàm số, vẽ animation từ vị trí player |
| Hướng bắn | Player **tự chọn hướng** bắn: +x (phải) hoặc -x (trái) thông qua UI direction picker (◀/▶) |
| Hitbox | Hình tròn bán kính **0.5** quanh mỗi player |
| Damage | Mặc định: **25 HP** (có thể thay đổi bởi power-up) |

**Cơ chế dịch hàm số (Translate + Normalize):**
- Hàm số luôn được **normalize** để đi qua vị trí player: `translated(x) = f(x - ox) - f(0) + oy`
- Tại vị trí player (`x = ox`): `f(0) - f(0) + oy = oy` → **luôn xuất phát từ player** ✅
- Ví dụ: Player ở (3, 2), nhập `y = x^2` → `y = (x-3)² - 0 + 2 = (x-3)² + 2`
- Ví dụ: Player ở (3, 2), nhập `y = cos(x)` → `y = cos(x-3) - cos(0) + 2 = cos(x-3) - 1 + 2`
- **Hằng số tự do bị vô hiệu hóa**: `f(x) = 5` → `5 - 5 + oy = oy` → đường ngang qua player (không thể exploit)

**Hướng bắn — Player tự chọn:**
- Player chọn hướng bắn qua UI direction picker (◀ trái / ▶ phải), giống cơ chế Move
- Hướng mặc định: **về phía đối thủ** (auto-suggest)
- Bắn ngược (xa đối thủ) = chiến thuật hợp lệ: nhặt power-up phía sau, phá vật cản, hoặc tấn công đối thủ đã di chuyển ra sau lưng
- Đạn run theo hướng đã chọn cho đến khi ra khỏi biên map hoặc chạm vật cản/player

**Cơ chế collision detection:**
- Đạn được sample theo từng bước `Δx` nhỏ (ví dụ 0.05)
- Tại mỗi điểm `(x, f(x))`, kiểm tra khoảng cách tới:
  - Power-up → nhặt (áp dụng lượt sau) + đạn tiếp tục bay
  - Vật cản mềm → đạn dừng + xoá vật cản (trừ khi có Piercing)
  - Vật cản cứng → đạn dừng
  - Player đối thủ → `distance ≤ 0.5` → HIT → gây damage

### 3.3 Movement (Di chuyển)

- Nhập hàm số giống shooting, hàm số được **translate + normalize** từ vị trí hiện tại (cùng công thức: `f(x-ox) - f(0) + oy`)
- Player **chọn hướng di chuyển**: +x (phải) hoặc -x (trái) — tự do, không phụ thuộc vị trí đối thủ
- Player **di chuyển dọc theo đồ thị**, giới hạn bởi **arc length = 5 đơn vị**
- Vị trí cuối cùng = điểm trên đồ thị tại đó tổng quãng đường đạt 5 đơn vị
- Nếu đồ thị ra ngoài biên map trước khi đủ 5 → dừng tại điểm biên hợp lệ cuối cùng
- Mỗi turn: tối đa **1 lần di chuyển** (nếu còn lượt), thực hiện **trước khi bắn**
- Lượt di chuyển ban đầu: **2**
- Có thể tăng bằng power-up (Extra Move)

**Cơ chế arc length:**
- Arc length (độ dài đường cong) = tổng khoảng cách Euclid giữa các điểm sample trên đồ thị
- Tính bằng công thức gần đúng: `L ≈ Σ √(Δx² + Δy²)` với Δx = 0.05
- Hàm thẳng (`f(x) = 0`) → đi được 5 đơn vị theo x
- Hàm cong (`f(x) = x²`) → đi được ít hơn 5 đơn vị x (vì đường cong dài hơn)
- **Chiến thuật**: Chọn hàm đơn giản → đi xa hơn. Chọn hàm phức tạp → đi ngắn nhưng di chuyển phức tạp (né vật cản)

```
Ví dụ: Player ở (0, 0), di chuyển theo f(x) = 0 (đường thẳng), hướng +x
→ Arc length = 5 → dừng tại (5, 0)

Ví dụ: Player ở (0, 0), di chuyển theo f(x) = sin(x), hướng +x
→ Đường cong dài hơn đường thẳng → dừng tại khoảng (3.8, sin(3.8))
   vì arc length sin(x) > x trên cùng khoảng
```

### 3.4 Difficulty Levels (Giới hạn hàm số)

| Level | Cho phép | Ví dụ | Validation |
|-------|----------|-------|------------|
| **Easy** | Đa thức (bậc 1, 2, 3...) | `y = 2*x + 1`, `y = x^2 - 3*x` | Chỉ chấp nhận `+`, `-`, `*`, `/`, `^`, số, `x` |
| **Medium** | Đa thức + Lượng giác + Logarit | `y = sin(x) + x`, `y = log(x) + x^2` | Chấp nhận thêm `sin`, `cos`, `tan`, `log`, `ln`, `sqrt` |
| **Hard** | Chỉ lượng giác, logarit, hàm đặc biệt | `y = sin(x)*cos(2*x)`, `y = tan(x/3)` | **REJECT** nếu nhập đa thức đơn thuần. Hàm PHẢI chứa ít nhất 1 hàm đặc biệt |

### 3.5 Obstacles (Vật cản)

| Loại | Visual | Khi đạn chạm | Persistence |
|------|--------|--------------|-------------|
| **Cứng** (Hard) | Hình chữ nhật, viền đậm, fill đặc | Đạn **dừng** | **Giữ nguyên** cả trận |
| **Mềm** (Soft) | Hình chữ nhật, viền nét đứt, fill mờ | Đạn **dừng** | **Bị phá hủy** (biến mất) |

- Vị trí: random mỗi trận
- Số lượng: 3–6 vật cản (tuỳ map size)
- Kích thước: nhỏ (1x1 đến 2x3 đơn vị tọa độ)

### 3.6 Power-ups

Khi đạn đi qua power-up → **nhặt**, đạn **tiếp tục bay** (vẫn có thể gây damage).
Hiệu ứng áp dụng **từ lượt tiếp theo**.

| Power-up | Icon | Hiệu ứng | Thời hạn |
|----------|------|----------|----------|
| **Double Damage** | ⚔️ `x2` | Damage x2 (50 thay vì 25) | 1 lượt |
| **Knockback** | 💨 | Đẩy lùi đối thủ 2 đơn vị theo hướng đạn | 1 lượt |
| **Extra Move** | 🦶 `+1` | +1 lượt di chuyển | Vĩnh viễn |
| **Shield** | 🛡️ | Chặn 1 lần damage tiếp theo | Đến khi bị hit |
| **Piercing** | 🔥 | Đạn xuyên qua vật cản mềm (không dừng) | 1 lượt |

- Số lượng trên map: 2–4 power-ups
- Vị trí: random mỗi trận
- Không respawn sau khi nhặt

### 3.7 Player Stats

| Stat | Giá trị mặc định |
|------|-------------------|
| HP | **100** |
| Damage | **25** |
| Hitbox radius | **0.5** |
| Move charges | **2** (ban đầu) |
| Buffs | Không |
| Color | Chọn từ menu (6 màu: Cyan, Pink, Green, Orange, Purple, Yellow) |

- Mỗi player chọn **1 màu riêng** — 2 player không được trùng màu
- Màu mặc định: P1 = Cyan (`#00ccff`), P2 = Pink (`#ff4466`)
- Màu được dùng cho: hình tròn player, quỹ đạo đạn, HP bar, nhãn tên trên HUD
- Sau này có thể mở rộng thành chọn hình nhân vật (avatar/skin)

---

## 4. UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  P1: ■ 100HP [buffs]         ⏱ 45s         P2: ■ 100HP [buffs]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                         Y                                    │
│                         │                                    │
│                   ●P1   │        ◆pw    ██ob(hard)           │
│                         │                 ●P2                │
│   ──────────────────────┼─────────────────────── X           │
│                         │     ┊┊ob(soft)                     │
│                         │                                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  🎯 Player 1's Turn                    Moves left: 2        │
│  ┌──────────────────────────────────┐                       │
│  │ f(x) = ________________________ │   [Move]  [Fire]      │
│  └──────────────────────────────────┘                       │
│  Preview: (hiển thị đồ thị preview mờ trước khi xác nhận)   │
│  Formula: (KaTeX render công thức đẹp)                      │
└─────────────────────────────────────────────────────────────┘
```

### Menu Screen Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│               M Y S T I C   S H O T                 │
│          Turn-based Artillery / Math Puzzle          │
│                                                     │
│  ┌──────────────┐          ┌──────────────┐         │
│  │   Player 1   │   VS     │   Player 2   │         │
│  │ [___name___] │          │ [___name___] │         │
│  │ ● ● ● ● ● ● │          │ ● ● ● ● ● ● │         │
│  │ (6 colors)   │          │ (6 colors)   │         │
│  └──────────────┘          └──────────────┘         │
│                                                     │
│            Difficulty: [Easy] [Medium] [Hard]        │
│                                                     │
│                  [ START GAME ]                      │
│                                                     │
│                  How to Play ▼                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🎯 Objective: Giảm HP đối thủ về 0         │    │
│  │ 📐 How It Works: Nhập f(x), đạn bay theo   │    │
│  │ 🕹️ Actions: Fire (bắn) / Move (di chuyển)  │    │
│  │ ⚡ Power-Ups: x2, <<, +1, SH, !!           │    │
│  │ 🧱 Obstacles: Hard (chặn) / Soft (phá)     │    │
│  │ 📊 Difficulty: Easy / Medium / Hard rules   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Game Over Overlay

```
┌─────────────────────────────────────────┐
│                                         │
│         [Tên người thắng] Wins!         │
│                                         │
│           [ BACK TO MENU ]              │
│                                         │
└─────────────────────────────────────────┘
```

- Overlay React hiển thị trên canvas khi game kết thúc
- Nút BACK TO MENU → reset state, chuyển về MenuScreen

### Gameplay UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  P1: ■ 100HP [buffs]         ⏱ 45s         P2: ■ 100HP [buffs]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                         Y                                    │
│                         │                                    │
│                   ●P1   │        ◆pw    ██ob(hard)           │
│                         │                 ●P2                │
│   ──────────────────────┼─────────────────────── X           │
│                         │     ┊┊ob(soft)                     │
│                         │                                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  🎯 Player 1's Turn                    Moves left: 2        │
│  ┌──────────────────────────────────┐                       │
│  │ f(x) = ________________________ │   [◀][Move][▶] [Fire] │
│  └──────────────────────────────────┘                       │
│  Formula: (KaTeX render công thức đẹp)                      │
└─────────────────────────────────────────────────────────────┘
```

### UI Components

| Component | Mô tả |
|-----------|-------|
| **Menu Screen** | React overlay: nhập tên, chọn màu (6 options, không trùng), chọn difficulty, nút Start, hướng dẫn game collapsible |
| **How to Play Guide** | Panel mở/đóng trong menu: giải thích objective, cách chơi, actions, power-ups, obstacles, difficulty rules |
| **Game Over Overlay** | React overlay: hiển thị tên người thắng + nút BACK TO MENU |
| **HP Bar** | Thanh HP ngang, giảm dần, đổi màu (xanh → vàng → đỏ) |
| **Timer** | Countdown 60s, đổi màu đỏ khi < 10s |
| **Turn Indicator** | Glow border quanh player đang active + badge "YOUR TURN" |
| **Buff icons** | Hiển thị power-up đang active bên cạnh HP |
| **Input field** | Text input cho hàm số, validate real-time, KaTeX preview |
| **Direction picker** | Nút ◀ / ▶ chọn hướng di chuyển (dùng cho Move) |
| **Move counter** | Số lượt di chuyển còn lại |
| **Action buttons** | [Move] và [Fire], disable khi formula invalid hoặc không khả dụng |

---

## 5. Tech Stack (Đã xác nhận)

| Component | Choice | Version | Reason |
|-----------|--------|---------|--------|
| **Game Engine** | **Phaser 3** | ^3.80 | Scene management, tweens, particles, input system, mature 2D engine. Phù hợp game turn-based trên hệ tọa độ |
| **UI Framework** | **React** | ^19.x | Quản lý DOM UI layer: input hàm số, KaTeX render, menu, HUD overlays. Phaser chỉ lo canvas game |
| **Math Parser** | **math.js** | ^13.x | Parse + evaluate biểu thức toán từ string an toàn (sandbox), hỗ trợ đầy đủ: `sin`, `cos`, `tan`, `log`, `ln`, `sqrt`, `abs`, `^`. Tree-shakeable để giảm bundle |
| **Math Display** | **KaTeX** | ^0.16 | Render công thức toán dạng LaTeX đẹp trong UI. Tích hợp từ đầu — hiển thị real-time khi player nhập hàm số |
| **Language** | **TypeScript** | ^5.x | Type safety cho game logic phức tạp (collision, state, commands). IntelliSense tốt khi develop |
| **Build Tool** | **Vite** | ^6.x | HMR nhanh, hỗ trợ TypeScript out-of-box, build tối ưu, cấu hình tối thiểu |
| **State Management** | Custom EventEmitter + Command pattern | — | Mọi action (Move, Fire) là Command objects serializable. Dễ tách ra cho multiplayer sau |
| **Styling** | **Tailwind CSS** | ^4.2 | Utility-first CSS, `@theme` directive cho dark/light tokens, `@tailwindcss/vite` plugin |
| **Icons** | **lucide-react** | ^1.7 | Icon library React (barrel re-export dưới prefix `Icon*`) + canvas-icons cho Phaser (CanvasTexture từ SVG paths) |
| **i18n** | **i18next** + **react-i18next** | ^26 / ^17 | Đa ngôn ngữ EN/VI, hook `useTranslation()`, interpolation `{{var}}`, localStorage persistence |
| **Hooks** | **usehooks-ts** | ^3.1 | Common hooks (useLocalStorage, useDebounceValue, useMediaQuery, ...) — barrel export qua `common/hooks/` |

### 5.1 Kiến trúc 2 lớp: React (DOM) + Phaser (Canvas)

```
┌─────────────────────────────────────────┐
│  React DOM Layer                        │
│  ┌─────────┐ ┌────────┐ ┌───────────┐  │
│  │ Menu    │ │ HUD    │ │ GameOver  │  │
│  │ Screen  │ │ Overlay│ │ Screen    │  │
│  └─────────┘ └────────┘ └───────────┘  │
│  ┌──────────────────┐ ┌─────────────┐  │
│  │ Formula Input    │ │ KaTeX       │  │
│  │ (text input +    │ │ (live       │  │
│  │  validate)       │ │  preview)   │  │
│  └──────────────────┘ └─────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Phaser Canvas (game render)    │    │
│  │  - Hệ tọa độ Oxy + grid        │    │
│  │  - Players, obstacles, powerups │    │
│  │  - Đạn bay animation            │    │
│  │  - Collision visual effects     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- **React** quản lý toàn bộ DOM: menu, input, KaTeX, buttons, HP bars, timer
- **Phaser** chỉ render game canvas: hệ tọa độ, players, đạn, vật cản
- Giao tiếp qua **shared GameState** (EventEmitter): React dispatch commands → GameState xử lý → Phaser re-render

### 5.3 Lý do chọn Phaser 3 (thay vì PixiJS / Canvas thuần)

- **Scene system**: Quản lý Menu → Game → GameOver dễ dàng
- **Tween system**: Animation đạn bay theo đồ thị mượt mà
- **Timer events**: Countdown 60s mỗi lượt, delay giữa các phase
- **Input handling**: Keyboard + mouse đã có sẵn
- **Camera**: Pan, zoom nếu cần mở rộng map size sau này
- **Particle system**: Hiệu ứng nổ, hit (P2)

### 5.4 Lý do chọn math.js (thay vì expr-eval / Function())

- **An toàn**: Evaluate trong sandbox, không cho phép truy cập `window`, `document`, `eval`
- **Đầy đủ hàm**: Hỗ trợ tất cả hàm cần cho Hard mode (sin, cos, tan, log, ln, sqrt, abs)
- **Parse tree**: Có thể duyệt AST để validate difficulty (kiểm tra có chứa hàm đặc biệt không)
- **Tree-shakeable**: Import chỉ các module cần thiết để giảm bundle size

### 5.5 Lý do chọn KaTeX (thay vì MathJax / plain text)

- **Nhẹ**: ~300KB (CSS + JS), nhanh hơn MathJax (~2MB) rất nhiều
- **Render nhanh**: Synchronous rendering, không lag khi player gõ
- **UX tốt**: Player thấy công thức đẹp real-time → trải nghiệm chuyên nghiệp
- **Convert**: Cần utility chuyển syntax math.js → LaTeX (ví dụ `x^2` → `x^{2}`, `sin(x)` → `\sin(x)`)

---

## 6. Kiến trúc hệ thống

### 6.1 High-level Architecture

```
┌─────────────────────────────────────────────┐
│                  CLIENT                      │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Input UI │→ │Math Parser│→ │ Validator  │  │
│  │(hàm số)  │  │(math.js)  │  │(difficulty │  │
│  └──────────┘  └──────────┘  │  + syntax) │  │
│                               └─────┬─────┘  │
│                                     ▼        │
│  ┌──────────────────────────────────────┐    │
│  │         Game Renderer (Phaser)       │    │
│  │  - Hệ trục Oxy + grid               │    │
│  │  - Vẽ đồ thị hàm số (animation)     │    │
│  │  - Player markers                    │    │
│  │  - Power-ups & Obstacles             │    │
│  │  - Hit detection visual              │    │
│  └──────────────────────────────────────┘    │
│                     ▲                        │
│                     │                        │
│  ┌──────────────────┴───────────────────┐    │
│  │        Game State Manager            │    │
│  │  - Turn management                   │    │
│  │  - HP, buffs, move charges           │    │
│  │  - Collision detection               │    │
│  │  - Command queue                     │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 6.2 Thiết kế hướng mở rộng Online

```
┌─────────────────────────────────────┐
│         GameStateManager            │
│  (Single source of truth)           │
│                                     │
│  ┌───────────┐   ┌───────────┐     │
│  │ LocalInput │   │ RemoteInput│    │  ← Sau này thay LocalInput
│  │ Adapter   │   │ Adapter    │    │    bằng RemoteInput cho online
│  └─────┬─────┘   └─────┬─────┘     │
│        └───────┬────────┘           │
│                ▼                    │
│  ┌─────────────────────┐           │
│  │   Command Queue     │           │  ← Tất cả action = Command objects
│  │  - MoveCommand      │           │    (serializable → gửi qua network)
│  │  - FireCommand      │           │
│  │  - SkipCommand      │           │
│  └─────────────────────┘           │
└─────────────────────────────────────┘
```

Mọi action (di chuyển, bắn) đều là **Command object** → dễ dàng serialize và gửi qua WebSocket khi mở rộng online.

### 6.3 Folder Structure (Hiện tại)

```
mystic-shot-game/
├── docs/
│   └── [design] game-design-document.md
├── src/
│   ├── main.tsx                 # Entry point React — mount App, import i18n
│   ├── config.ts                # Game constants & enums
│   ├── styles.css               # Tailwind CSS import, @theme tokens, @layer base
│   ├── common/
│   │   ├── icons/
│   │   │   ├── index.ts         # Barrel re-export lucide-react icons (prefix Icon*)
│   │   │   └── canvas-icons.ts  # Phaser CanvasTexture cho power-up icons
│   │   └── hooks/
│   │       └── index.ts         # Barrel re-export usehooks-ts hooks
│   ├── i18n/
│   │   ├── index.ts             # i18next config, EN/VI resources, localStorage
│   │   └── locales/
│   │       ├── en.json          # English translations (~110 keys)
│   │       └── vi.json          # Vietnamese translations (~110 keys)
│   ├── core/
│   │   ├── EventEmitter.ts      # Pub/sub nhẹ
│   │   ├── GameState.ts         # State manager + events
│   │   ├── TurnManager.ts       # Turn logic + timer
│   │   ├── CollisionSystem.ts   # Collision detection
│   │   ├── CommandQueue.ts      # Command pattern
│   │   ├── Commands.ts          # MoveCommand, FireCommand
│   │   └── index.ts             # Barrel export
│   ├── scenes/
│   │   ├── MenuScene.ts         # Placeholder (React overlay)
│   │   ├── GameScene.ts         # Main gameplay (registerPowerUpIcons)
│   │   ├── GameOverScene.ts     # Result screen
│   │   └── index.ts
│   ├── entities/
│   │   ├── Player.ts            # Player circle entity
│   │   ├── Obstacle.ts          # Obstacle rectangle entity
│   │   ├── PowerUp.ts           # Power-up icon entity (CanvasTexture)
│   │   ├── Projectile.ts        # Animated orb + glowing trail entity
│   │   └── index.ts
│   ├── math/
│   │   ├── FunctionParser.ts    # math.js wrapper (sandbox)
│   │   ├── FunctionValidator.ts # Difficulty-based validation
│   │   ├── GraphRenderer.ts     # Point sampling cho trajectory
│   │   └── index.ts
│   ├── ui/
│   │   ├── App.tsx              # Root — orchestrator mỏng, delegate sang useGameEngine
│   │   ├── useGameEngine.ts     # Custom hook: game lifecycle, state, handlers
│   │   ├── HudHeader.tsx        # HP bars, timer, buffs, theme/lang toggles
│   │   ├── ControlFooter.tsx    # Formula input, direction picker, Move/Fire buttons
│   │   ├── GameOverOverlay.tsx  # Victory overlay: winner name, back to menu
│   │   ├── MenuScreen.tsx       # Menu: tên, màu, difficulty, guide
│   │   ├── PhaserGame.tsx       # Mount Phaser canvas vào React DOM
│   │   ├── FormulaInput.tsx     # Input + validation + KaTeX preview
│   │   ├── ThemeToggle.tsx      # useTheme() hook + ThemeToggle component
│   │   ├── LanguageSwitcher.tsx # EN/VI toggle buttons
│   │   └── index.ts
│   └── utils/
│       ├── MapGenerator.ts      # Random map generation
│       ├── MathUtils.ts         # distance(), clamp(), lerp()
│       └── index.ts
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
└── index.html
```

---

## 7. Game Flow Chi Tiết

```
[MENU SCREEN]
  → Nhập tên P1, P2 (max 16 ký tự, mặc định "Player 1" / "Player 2")
  → Chọn màu player (6 options, 2 player không được trùng)
  → Chọn difficulty (Easy / Medium / Hard)
  → [Tuỳ chọn] Xem hướng dẫn game (How to Play — collapsible panel)
     • Objective, cách nhập hàm, actions, power-ups, obstacles, difficulty rules
  → [START GAME]

[MAP GENERATION]
  → Random vị trí P1, P2 (đảm bảo khoảng cách tối thiểu)
  → Random obstacles (3-6, mix cứng/mềm)
  → Random power-ups (2-4)
  → Đảm bảo không overlap

[BATTLE PHASE]
  → Random ai đi trước
  → Lượt Player X:
     1. Countdown 60s bắt đầu
     2. [Tuỳ chọn] Nếu còn move charges:
        - Nhập hàm số di chuyển
        - Preview đường di chuyển
        - Bấm [Move] → animation di chuyển
        - Player dừng tại điểm cuối (trước biên map)
     3. Nhập hàm số tấn công
        - Preview đồ thị (dashed line)
        - Bấm [Fire]
        - Animation đạn bay theo đồ thị
        - Collision detection theo thứ tự:
          a. Power-up → nhặt, đạn tiếp tục
          b. Vật cản mềm → đạn dừng, xoá vật cản
          c. Vật cản cứng → đạn dừng
          d. Player đối thủ → gây damage
          e. Ra biên map → kết thúc
     4. Cập nhật state (HP, buffs, obstacles)
     5. Kiểm tra win condition
     6. Chuyển lượt
  → Hết 60s mà chưa bắn → auto skip turn

[GAME OVER]
  → React overlay hiển thị trên canvas
  → Hiển thị tên người thắng ("[Name] Wins!")
  → [BACK TO MENU] → reset toàn bộ state, quay về Menu Screen
  → (Tương lai) Stats: tổng damage, số hit, power-ups collected
```

---

## 8. Danh sách Feature (MVP Priorities)

| Priority | Feature | Mô tả |
|----------|---------|-------|
| **P0** | Hệ trục tọa độ + grid | Render Oxy, grid lines, labels |
| **P0** | Render 2 players | Hình tròn tại tọa độ |
| **P0** | Input hàm số + validate | Text input, math.js parse, difficulty validation |
| **P0** | Vẽ đồ thị + animation đạn | Đạn bay theo đồ thị hàm số (hướng đối thủ) |
| **P0** | Collision detection | Hitbox r=0.5, sample Δx=0.05 |
| **P0** | HP system + damage | 100 HP, 25 damage mặc định |
| **P0** | Turn management + timer | Lần lượt, countdown 60s |
| **P0** | Win/Lose condition | HP = 0 → thua |
| **P1** | Movement system | Nhập hàm, di chuyển đến biên map |
| **P1** | Vật cản cứng + mềm | 2 loại, collision logic |
| **P1** | Power-ups (5 loại) | Double Damage, Knockback, Extra Move, Shield, Piercing |
| **P1** | Preview đồ thị | Dashed line trước khi Fire/Move |
| **P1** | Difficulty levels | Easy/Medium/Hard validation |
| **P1** | Random map generation | Random obstacles + power-ups |
| **P2** | Menu screen | Tên (max 16 chars), chọn màu (6 colors, mutual exclusion), difficulty, start, hướng dẫn game collapsible |
| **P2** | Game Over screen | React overlay: tên Winner, nút Back to Menu (reset state) |
| **P2** | KaTeX formula display | Hiển thị công thức đẹp |
| **P2** | Sound effects | Bắn, hit, nhặt power-up |
| **P2** | Particle effects | Explosion, hit markers |
| **P3** | Online multiplayer | WebSocket, rooms, matchmaking |

---

## 9. Các quy tắc & Edge Cases

### Collision Priority (khi đạn đi qua nhiều object cùng lúc)
1. Power-up → nhặt, đạn tiếp tục
2. Vật cản (cứng/mềm) → đạn dừng
3. Player → gây damage

### Edge Cases
- **Hàm số undefined tại 1 điểm** (ví dụ `1/x` tại x=0): Bỏ qua điểm đó, đạn tiếp tục
- **Hàm số ra ngoài map theo Y**: Đạn biến mất khi y > 15 hoặc y < -15, tiếp tục nếu quay lại trong map (ví dụ sin)
- **Hết thời gian**: Auto skip turn, không bắn
- **Cả 2 player hết move charges**: Nút Move bị disable
- **Player bắn trúng chính mình**: Không xảy ra vì đạn bắt đầu từ vị trí player (normalize đảm bảo f(0)=0) và collision bắt đầu từ bước đầu tiên sau player
- **Hằng số tự do bị loại bỏ**: `f(x) = c` → `c - c + oy = oy` → đường ngang qua player (không thể exploit)
- **Hard mode reject**: Nếu biểu thức không chứa hàm đặc biệt (sin, cos, tan, log, ln, sqrt, abs) → hiển thị lỗi "Ở Hard mode, hàm phải chứa ít nhất 1 hàm đặc biệt"
