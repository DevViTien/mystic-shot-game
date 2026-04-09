# UI & Menus

## 1. App Flow

```
MainMenu
  ├── "Local Play"  → MenuScreen → Game → GameOver
  └── "Online Play" → LobbyScreen
                        ├── Create Room → WaitingRoom → Game → GameOver
                        └── Join Room  → WaitingRoom → Game → GameOver
```

**6 AppScreen states**: `mainMenu` → `localMenu` / `lobby` → `waiting` → `game` → `gameOver`

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

**Row 1**: Difficulty badge (color-coded) | Active turn indicator (glow + player name) | Language switcher + Theme toggle + Leave button

**Row 2**: P1 panel (name + HP bar + buff badges) | Timer (center) | P2 panel

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

### Layout (flex row)

1. **Left**: Turn info — player name (color-coded) + moves remaining
2. **Center** (flex-1): FormulaInput — input + validation + KaTeX
3. **Right**: Direction toggle + Move button + Fire button

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
│       [ BACK TO MENU ]        │
│                                │
└────────────────────────────────┘
```

- React overlay hiển thị trên canvas
- Nhận `winnerId` → resolve tên từ snapshot
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
- Config: 3 scenes (MenuScene, GameScene, GameOverScene)
- `GameState` truyền qua `game.registry`
- Expose `PhaserGameHandle` via `forwardRef` + `useImperativeHandle`
- `getGame()` method cho useGameEngine access Phaser instance
