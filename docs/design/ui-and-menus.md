# UI & Menus

## 1. App Flow

```
MainMenu
  ├── "Local Play"  → MenuScreen → Game → GameOver ⇄ Replay
  └── "Online Play" → LobbyScreen
                        ├── Create Room → WaitingRoom → Game → GameOver ⇄ Replay
                        └── Join Room  → WaitingRoom → Game → GameOver ⇄ Replay
```

**7 AppScreen states**: `mainMenu` → `localMenu` / `lobby` → `waiting` → `game` → `gameOver` ⇄ `replay`

Quản lý trong `useGameEngine` hook, render trong `App.tsx`.

---

## 2. MainMenu

```
┌────────────────────────────────────────┐
│                                        │
│        [Logo]                          │
│     M Y S T I C   S H O T             │
│  Turn-based Artillery / Math Puzzle    │
│                                        │
│       [ LOCAL PLAY ]                   │
│       [ ONLINE PLAY ]                  │
│                                        │
│    (Online disabled nếu Firebase       │
│     chưa config — check env vars)      │
│                                        │
│              [🌙/☀️] [EN/VI]           │
└────────────────────────────────────────┘
```

- `isFirebaseConfigured()` check → disable nút Online nếu không có `VITE_FIREBASE_*` env vars
- `AppImage` component render logo từ `src/assets/image/logo.png`

---

## 3. MenuScreen (Local Play)

```
┌────────────────────────────────────────────────┐
│             M Y S T I C   S H O T              │
│                                  [🌙] [EN/VI]  │
│                                                │
│  ┌──────────────┐    VS    ┌──────────────┐    │
│  │   Player 1   │         │   Player 2   │    │
│  │ [___name___] │         │ [___name___] │    │
│  │ ● ● ● ● ● ● │         │ ● ● ● ● ● ● │    │
│  │ (6 colors,   │         │ mutual       │    │
│  │  not same)   │         │ exclusion)   │    │
│  │              │         │              │    │
│  │ Skin:        │         │ Skin:        │    │
│  │ [◀]Classic[▶]│         │ [◀]Neon  [▶] │    │
│  │ ◉ Preview    │         │ ◉ Preview    │    │
│  └──────────────┘         └──────────────┘    │
│                                                │
│    Map:  [◀] Random [▶]                       │
│    Difficulty: [Easy] [Medium] [Hard]          │
│                                                │
│    [← BACK]          [START GAME]              │
│                                                │
│    How to Play [?]  ← Modal                   │
└────────────────────────────────────────────────┘
```

### Player config

- **Tên**: Max 16 ký tự, default "Player 1" / "Player 2"
- **Màu**: 6 options (Cyan, Pink, Green, Orange, Purple, Yellow) — 2 player **không được trùng** (mutual exclusion)
- **Skin**: Carousel (SkinPicker) — 2 player **có thể** trùng skin
- **Map**: Carousel (MapPicker) — Random + 7 presets
- **Difficulty**: 3 radio buttons

### MenuResult

```
MenuResult {
  player1: { name, color, skinId }
  player2: { name, color, skinId }
  difficulty: Difficulty
  mapId: string | null     # null = random
}
```

### How to Play (Modal)

Guide modal giải thích: objective, mechanics, actions, power-ups, obstacles, difficulty rules. Sử dụng `Modal` component (Escape close, backdrop click, focus trap).

---

## 4. LobbyScreen (Online)

```
┌────────────────────────────────────────────────┐
│            MYSTIC SHOT — Online                │
│                                                │
│  ┌────────────────────────────────────┐        │
│  │  Your Profile                     │        │
│  │  Name: [___________]              │        │
│  │  Color: ● ● ● ● ● ●             │        │
│  │  Skin:  [◀] Classic [▶]          │        │
│  └────────────────────────────────────┘        │
│                                                │
│  ┌─────────────────┐ ┌─────────────────┐      │
│  │  CREATE ROOM    │ │  JOIN ROOM      │      │
│  │ Difficulty:     │ │ Room Code:      │      │
│  │ [Easy][Med][Hrd]│ │ [_ _ _ _ _ _]  │      │
│  │ Map: [◀]Rand[▶] │ │                 │      │
│  │ [CREATE]        │ │ [JOIN]          │      │
│  └─────────────────┘ └─────────────────┘      │
│                                                │
│  [← Back to Main Menu]                        │
│  {Error message nếu có}                        │
└────────────────────────────────────────────────┘
```

- **Profile**: persisted trong localStorage (name, color, skin)
- **Create**: Chọn difficulty + map → tạo room → nhận code 6 ký tự
- **Join**: Nhập room code → validate → join room
- **Error display**: ROOM_NOT_FOUND, ROOM_FULL_OR_STARTED, COLOR_CONFLICT
- Loading state khi đang tạo/join

---

## 5. WaitingRoom

```
┌────────────────────────────────────────┐
│                                        │
│   Room Code: A 3 F 7 K 2  [COPY]      │
│                                        │
│   Host            VS       Guest       │
│   "TruongNBN"              "Guest42"   │
│   ● Cyan                   ● Pink      │
│   Skin: Neon               Skin: Pixel │
│                                        │
│   Difficulty: Medium  │  Map: Arena    │
│                                        │
│   [CANCEL]               [START GAME]  │
│   (Start chỉ enable khi guest đã join) │
└────────────────────────────────────────┘
```

- Subscribe `roomManager.onMetaChange()` → realtime update khi guest join
- Start button chỉ cho **host**, chỉ enable khi guest đã join
- Cancel → host: status='abandoned', guest: clear guest data

---

## 6. HudHeader (Gameplay)

```
┌───────────────────────────────────────────────────────────┐
│ [Medium]           🎯 Player 1's Turn         [VI] [🌙] [✕]│
├───────────────────────────────────────────────────────────┤
│ P1: TruongNBN ████████ 100 [⚔️2]   ⏱ 45s   P2: Bot █ 75  │
└───────────────────────────────────────────────────────────┘
```

**Row 1**: Difficulty badge (color-coded, single letter on mobile) | Active turn indicator (glow + player name, truncated on mobile) | Language switcher (hidden mobile) + Theme toggle + Leave button

**Row 2 Desktop**: P1 panel (name + HP bar + buff badges) | Timer (center) | P2 panel

**Row 2 Mobile**: Timer (top, compact) → P1 panel + P2 panel side-by-side (compact HP bars, hidden buff badges)

### Player Panel

- **Tên player** (màu accent/danger)
- **HP bar**: Thanh ngang, width theo HP%, màu player
- **Buff badges**: Icon + remaining turns, tooltip mô tả

### Timer

- 60s countdown, font tabular-nums
- ≤ 10s: đổi màu đỏ + `animate-pulse`
- Icon `IconClock`

### Buff Badges

Mỗi active buff hiển thị icon nhỏ + số lượt còn lại. Tooltip content i18n.

### Online indicators

- **Opponent disconnected**: text đỏ pulse "Opponent disconnected"
- **Leave button**: Tooltip "Forfeit" (online) hoặc "Leave Game" (offline)

---

## 7. ControlFooter (Gameplay)

```
┌───────────────────────────────────────────────────────────────┐
│ P1 · 2 moves │ f(x) = [________________] │ [◀Tab] [↗⇧↵] [🔥↵] │
│              │ f(x) = x² + 2x (KaTeX)   │                     │
└───────────────────────────────────────────────────────────────┘
```

### Layout

**Desktop** (flex row):
1. **Left**: Turn info — player name (color-coded) + moves remaining
2. **Center** (flex-1): FormulaInput — input + validation + KaTeX
3. **Right**: Direction toggle + Move button + Fire button

**Mobile** (flex column, 2 rows):
1. **Row 1**: FormulaInput full-width
2. **Row 2**: Move count badge (left) + Direction toggle + Move button + Fire button (right)

### Direction toggle

- Single button, nhấn đổi ◀/▶
- Auto-reset mỗi lượt (default: face opponent)
- Trigger preview update khi đổi hướng
- Tooltip: phím tắt "Tab"

### Move button

- Enabled khi: `canMove && canFire && !disabled`
- `canMove` = `moveCharges > 0 && phase === Idle`
- Tooltip: phím tắt "Shift+Enter"

### Fire button

- Enabled khi: `canFire && !disabled`
- Tooltip: phím tắt "Enter"

### State management

- `expressionRef` (useRef) — tránh re-render khi gõ
- `canFire` (useState) — set bởi FormulaInput.onChange
- `direction` (useState) — reset mỗi lượt
- `disabled` prop: `animating || (onlineMode && !isMyTurn)`

### Preview integration

FormulaInput `onChange` callback:
- Valid expression → `onPreview(expr, direction, 'fire')`
- Invalid/empty → `onPreview('', direction, 'fire')` (clear)

Direction toggle: khi đổi hướng + expression đang valid → trigger preview update

---

## 8. FormulaInput

### Features

- **Validation real-time**: mỗi keystroke → parse + validate theo difficulty
- **KaTeX preview**: debounce 150ms, render LaTeX inline
- **Keyboard shortcuts**: Enter (fire), Shift+Enter (move), Tab (direction)
- **Error display**: inline text đỏ dưới input
- **autoFocus**: remount mỗi lượt via `key={snapshot.turnNumber}`

### expressionToLatex()

Convert math.js syntax → rough LaTeX:
- `^2` → `^{2}`, `sin` → `\sin`, `sqrt(x)` → `\sqrt{x}`
- `abs(x)` → `\left|x\right|`
- `*` → `\cdot`

### Keyboard handler

```
handleKeyDown:
  Tab → preventDefault + onDirectionToggle()
  Shift+Enter → preventDefault + onMove(expr) (if canMove && valid)
  Enter → onSubmit(expr) (if valid)
```

---

## 9. GameOverOverlay

```
┌────────────────────────────────┐
│                                │
│     🏆 [PlayerName] Wins!     │
│                                │
│  [ ▶ Watch Replay ]  [ BACK ] │
│                                │
└────────────────────────────────┘
```

- React overlay hiển thị trên canvas
- Nhận `winnerId` → resolve tên từ snapshot
- **Watch Replay**: Chỉ hiển thị khi `replayData` có data → chuyển sang screen `replay`
- Back to Menu → reset state, cleanup adapters, chuyển về MainMenu

---

## 10. SkinPicker

Carousel slider chọn skin cho mỗi player trong MenuScreen/LobbyScreen.

- Dùng `Slider` component (Embla Carousel)
- Mini preview: vẽ player shape + đoạn trail ngắn với màu đã chọn
- Hiển thị tên skin (i18n via `nameKey`)
- 5 options: classic, neon, geometric, starlight, pixel

---

## 11. MapPicker

Carousel slider chọn map trong MenuScreen/LobbyScreen.

- Random option (default) + 7 preset maps
- Mini preview canvas: vẽ thu nhỏ obstacles + spawn points
- Hiển thị tên + mô tả ngắn map (i18n)

---

## 12. Theme & Language

### ThemeToggle

- `useTheme()` hook — `useLocalStorage('mystic-shot-theme', 'dark')`
- Toggle `.dark` class trên `<html>`
- Icon: `IconSun` / `IconMoon`

### LanguageSwitcher

- 2 nút EN / VI
- `i18n.changeLanguage()` — localStorage key `'mystic-shot-lang'`

---

## 13. PhaserGame

Mount Phaser canvas vào React DOM:
- Config: 4 scenes (MenuScene, GameScene, GameOverScene, ReplayScene)
- `GameState` truyền qua `game.registry`
- Expose `PhaserGameHandle` via `forwardRef` + `useImperativeHandle`
- `getGame()` method cho useGameEngine access Phaser instance
- Canvas hiển thị khi `screen === 'game'` hoặc `screen === 'replay'`

---

## 14. ReplayOverlay

React controls bar hiển thị khi `screen === 'replay'`, nằm bottom của viewport.

```
┌──────────────────────────────────────────────────────────────────┐
│ REPLAY   3/12            [⏸] [▶▶ 2×]  ████████░░   COMPLETE  [✕ Exit] │
└──────────────────────────────────────────────────────────────────┘
```

### Elements

| Phần tử | Vị trí | Hành vi |
|---------|--------|--------|
| Label "REPLAY" | Trái | Accent color, uppercase, font-bold |
| Progress text | Trái | "3 / 12" (current / total entries) |
| Play/Pause | Giữa | Toggle `IconPlay` / `IconPause` |
| Speed | Giữa | Cycle 1× → 2× → 4× → 1×, `IconFastForward` + giá trị |
| Progress bar | Giữa | Width% = current/total, bg-accent, animated |
| Finished badge | Giữa | "COMPLETE" khi replay xong, text-warning |
| Exit | Phải | `IconX` + "Exit", quay về gameOver screen |

### Behavior

- **Auto-pause**: Khi replay phát xong (`replayFinished` = true), tự động pause
- **Exit**: Gỡ registry event listeners, chuyển `screen` về `gameOver`
- **Speed cycle**: Click nút speed → 1× → 2× → 4× → 1× (loop)
- **Giao tiếp**: Set `replaySpeed` / `replayPaused` trên `game.registry` → ReplayScene đọc trong `update()`

---

## 15. Responsive Design

Toàn bộ UI hỗ trợ 3 breakpoints:

| Breakpoint | Kích thước | Tailwind prefix |
|-----------|-----------|----------------|
| Mobile | < 640px | (default) |
| Tablet | 768–1023px | `md:` |
| Desktop | ≥ 1280px | `xl:` (hoặc `md:` cho hầu hết) |

### Nguyên tắc

- **Mobile-first approach**: Style mặc định = mobile, thêm `md:` cho tablet/desktop
- **Touch targets**: Tối thiểu 44×44px cho buttons trên mobile
- **Không horizontal scroll** trên mobile
- **Text readable**: Min 12px trên mobile

### Responsive Strategy theo Screen

| Screen | Strategy | Chi tiết |
|--------|----------|---------|
| MainMenu | Reflow | Giảm padding (px-6), text-2xl title, buttons full-width |
| MenuScreen | Rearrange | P1/P2 stack dọc (flex-col) trên mobile, ẩn "VS" text thay bằng divider |
| LobbyScreen | Reflow | Đã có `md:` breakpoints, fine-tune padding. 2-column → 1-column mobile |
| WaitingRoom | Reflow | Giảm padding, room code tracking giảm, buttons stack dọc mobile |
| HudHeader | Rearrange | Mobile: ẩn difficulty full text (chỉ chữ cái đầu), timer trên top, players compact. Ẩn LanguageSwitcher + buff badges trên mobile |
| ControlFooter | Rearrange | Mobile: 2 rows — Row 1: formula input, Row 2: move count + action buttons. Ẩn turn info text |
| FormulaInput | Reflow | Label nhỏ hơn, input full-width, KaTeX left-aligned mobile |
| GameOverOverlay | Reflow | Giảm padding, buttons stack dọc, text nhỏ hơn |
| ReplayOverlay | Rearrange | Mobile: 2 rows — Row 1: label + exit, Row 2: controls + progress bar full-width |
| SkinPicker, MapPicker | OK | Đã responsive sẵn (Embla Carousel + Slider component) |
| Modal | OK | Đã responsive sẵn (mx-4, max-h-[85vh], overflow-y-auto) |

### Phaser Canvas

- Scale mode: `Phaser.Scale.FIT` + `CENTER_BOTH` — tự scale theo container
- Canvas 1200×864 sẽ thu nhỏ trên mobile (~31% trên 375px) — chấp nhận vì game cần nhìn toàn bộ map
- Container responsive via `flex-1 min-h-0` trong App.tsx
