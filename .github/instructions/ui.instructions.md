---
description: "Use when editing React UI components, useGameEngine hook, menus, HUD, controls, pickers, FormulaInput. Covers screen flow, component patterns, i18n, Tailwind usage."
applyTo: "src/ui/**"
---
# UI Module — Quy Tắc Chi Tiết

## Screen Flow (App State Machine)

```
mainMenu → localMenu → game → gameOver → mainMenu
mainMenu → lobby → waiting → game → gameOver → mainMenu
```

`App.tsx` delegate toàn bộ logic sang `useGameEngine` hook.

## useGameEngine (`useGameEngine.ts`)

Custom hook quản lý game lifecycle:

- Khởi tạo `GameState`, `TurnManager`, `CollisionSystem` (useMemo)
- AppScreen state machine: `mainMenu | localMenu | lobby | waiting | game | gameOver`
- Subscribe events: `StateChanged`, `TimerTick`, `GameOver`, `FireAnimationDone`, `FireComplete`
- `FireComplete` → pause timer + pending action; `FireAnimationDone` → resume timer / endTurn
- InputAdapter pattern: `LocalInputAdapter` (local) / `FirebaseInputAdapter` (online)
- Guest init: watch `roomMeta.status='playing'` → load host snapshot (guarded by `guestInitialized` ref)

### Handlers
- **Local**: `handleMove`, `handleFire`, `handlePreview`, `handleMenuStart`
- **Online**: `handleCreateRoom`, `handleJoinRoom`, `handleOnlineStart`, `handleCancelRoom`, `handleLeaveGame`

## Component Reference

| Component | Vai trò |
|-----------|---------|
| `MainMenu` | Local Play / Online Play. `isFirebaseConfigured()` check → disable Online nếu k config |
| `MenuScreen` | Nhập tên × 2, chọn màu (6 colors, mutual exclusion), SkinPicker, MapPicker, difficulty, How to Play guide |
| `LobbyScreen` | Profile (name, color, skin — localStorage), create room (difficulty + map) hoặc join room (6-char code) |
| `WaitingRoom` | Room code display + copy, player cards, game settings, host Start button |
| `HudHeader` | HP bars, timer, buffs (BuffBadges sub-component), turn indicator, leave/forfeit, disconnect indicator |
| `ControlFooter` | FormulaInput, direction toggle, Move/Fire buttons, preview trigger. `disabled` khi animating hoặc (online && !isMyTurn) |
| `GameOverOverlay` | Trophy icon, "[Name] Wins!", BACK TO MENU button |
| `SkinPicker` | Carousel slider (Embla) — mini preview shape + trail |
| `MapPicker` | Carousel slider — mini preview canvas. Random option + 7 presets |
| `PhaserGame` | Mount Phaser canvas, config 3 scenes, truyền GameState qua `game.registry` |
| `FormulaInput` | Input + validation realtime + KaTeX inline preview (`useDebounceValue` 150ms). Helper: `expressionToLatex()` |
| `ThemeToggle` | `useTheme()` hook (useLocalStorage) — Dark/Light, `.dark` class on `<html>` |
| `LanguageSwitcher` | EN/VI toggle, `i18n.changeLanguage()` |

## Interfaces Quan Trọng
- `MenuResult { player1, player2, difficulty, mapId }` — output của MenuScreen
- `CreateRoomConfig`, `JoinRoomConfig` — output của LobbyScreen

## Skin & Map Data Flow

**Skin**: MenuScreen → `MenuResult.player1.skinId` → `gameState.init()` + Phaser registry → `SkinRegistry.get(skinId)` → Entity renderers

**Map**: MenuScreen → `MenuResult.mapId` (null = random) → `MapStorage.get()` hoặc `MapGenerator.generate()` → `gameState.init()`

## i18n

- Mọi user-facing text dùng i18n keys (EN + VI)
- Key structure: `menu.*`, `hud.*`, `footer.*`, `button.*`, `guide.*`, `tooltip.*`, `skin.*`, `map.*`, `mainMenu.*`, `lobby.*`, `waiting.*`
- Storage key: `'mystic-shot-lang'`, default: `'en'`

## Validation Công Thức

- Tối đa **100 ký tự** (maxLength trên input)
- **Easy**: Chỉ đa thức
- **Medium**: + sin, cos, tan, log, ln, sqrt, abs
- **Hard**: Bắt buộc ≥1 hàm đặc biệt
