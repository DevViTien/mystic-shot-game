# Mystic Shot — Tổng Quan Thiết Kế

## 1. Khái niệm game

| Item | Detail |
|------|--------|
| **Tên** | Mystic Shot |
| **Thể loại** | Turn-based Artillery / Math Puzzle |
| **Platform** | Desktop Web (HTML5) |
| **Số người chơi** | 2 (local cùng máy hoặc online qua Firebase) |
| **Art style** | Geometric, Minimalist |
| **Monetization** | Free |

Game artillery theo lượt trên hệ tọa độ 2D. Người chơi nhập **hàm toán học f(x)** để di chuyển và bắn đạn — đạn bay theo đồ thị hàm số. Mục tiêu: giảm HP đối thủ về 0.

---

## 2. Tech Stack

| Thành phần | Công nghệ | Phiên bản | Vai trò |
|------------|-----------|-----------|---------|
| Game Engine | Phaser 3 | ^3.80 | Canvas rendering: grid, entities, projectile, animation |
| UI Framework | React | ^19.x | DOM layer: menus, HUD, formula input, KaTeX |
| Math Parser | math.js | ^13.x | Parse & evaluate biểu thức an toàn (sandbox) |
| Math Display | KaTeX | ^0.16 | Render công thức LaTeX real-time |
| Language | TypeScript | ^5.x | Type safety |
| Build Tool | Vite | ^6.x | HMR dev server, bundling |
| Styling | Tailwind CSS | ^4.2 | Utility-first CSS, dark/light theme |
| Icons | lucide-react | ^1.7 | Icon library (barrel re-export prefix `Icon*`) |
| Tooltip | @radix-ui/react-tooltip | ^1.2 | Accessible tooltip primitives |
| Carousel | Embla Carousel | ^8.6 | Slider cho SkinPicker, MapPicker |
| Animation | tailwindcss-animate | ^1.0 | CSS animation utilities |
| i18n | i18next + react-i18next | ^26 / ^17 | Đa ngôn ngữ EN/VI |
| Hooks | usehooks-ts | ^3.1 | Common hooks (localStorage, debounce, ...) |
| Network | Firebase | ^12.x | RTDB + Anonymous Auth cho online multiplayer |

---

## 3. Kiến trúc

### 3.1 Hai lớp (Hybrid Architecture)

```
┌─────────────────────────────────────────┐
│  React DOM Layer                        │
│  ┌─────────┐ ┌────────┐ ┌───────────┐  │
│  │ Menus   │ │ HUD    │ │ Controls  │  │
│  └─────────┘ └────────┘ └───────────┘  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Phaser Canvas (game render)    │    │
│  │  Grid, Players, Projectile,     │    │
│  │  Obstacles, Power-ups, Preview  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Giao tiếp React ↔ Phaser**: Qua `GameState` (typed EventEmitter).
- React dispatch command → GameState emit event → Phaser lắng nghe và re-render
- Cả hai lớp subscribe độc lập, không phụ thuộc nhau

### 3.2 Luồng phụ thuộc

```
config.ts (hằng số, enum)
    ↓
common/ (icons, hooks, components)
    ↓
i18n/ (i18next + locales)
    ↓
core/ (GameState, EventEmitter, TurnManager, CollisionSystem, Commands)
    ↓                           ↓
skins/ (types, registry,   maps/ (types, storage,
  presets, renderers)         presets, validator)
    ↓                           ↓
network/ (InputAdapter,   scenes/GameScene.ts
  LocalInputAdapter,          ├── entities/
  FirebaseInputAdapter,       ├── skins/renderers/
  RoomManager,                └── tooltip system
  PresenceManager)
    ↓
ui/App.tsx
├── useGameEngine.ts (lifecycle + InputAdapter orchestration)
├── MainMenu → MenuScreen / LobbyScreen → WaitingRoom
├── HudHeader, ControlFooter, FormulaInput
├── GameOverOverlay
├── SkinPicker, MapPicker
└── ThemeToggle, LanguageSwitcher
```

### 3.3 Giao tiếp Online

Qua `InputAdapter` abstraction:
- `LocalInputAdapter`: execute Commands trực tiếp
- `FirebaseInputAdapter`: push commands lên Firebase RTDB + subscribe remote commands

---

## 4. Cấu trúc thư mục

```
src/
├── main.tsx                 # Entry point
├── config.ts                # Hằng số & enum toàn cục
├── styles.css               # Tailwind CSS + theme tokens
├── assets/image/            # Static assets
├── common/                  # Shared utilities
│   ├── components/          # AppImage, Modal, Slider, Tooltip
│   ├── hooks/               # Barrel re-export usehooks-ts
│   └── icons/               # Barrel re-export lucide-react (prefix Icon*)
├── i18n/                    # i18next config + locales (en.json, vi.json)
├── core/                    # Logic nền tảng (framework-agnostic)
│   ├── EventEmitter.ts      # Typed pub/sub
│   ├── GameState.ts         # State manager (11 events, batching)
│   ├── TurnManager.ts       # Timer 60s, phase transitions
│   ├── CollisionSystem.ts   # Trajectory trace + collision
│   ├── Commands.ts          # MoveCommand, FireCommand (serializable)
│   └── CommandQueue.ts      # Queue lệnh tuần tự
├── skins/                   # Skin system (P2a)
│   ├── types.ts, SkinRegistry.ts
│   ├── presets/             # 5 built-in skins
│   └── renderers/           # PlayerShape, TrailStyle, PowerUpTheme
├── maps/                    # Preset maps (P2c)
│   ├── types.ts, MapStorage.ts, MapValidator.ts
│   └── presets/             # 7 map JSON files
├── network/                 # Online multiplayer (P2b)
│   ├── firebase.ts, InputAdapter.ts
│   ├── LocalInputAdapter.ts, FirebaseInputAdapter.ts
│   ├── RoomManager.ts, PresenceManager.ts
├── scenes/                  # Phaser scenes
│   ├── GameScene.ts         # Main gameplay
│   ├── MenuScene.ts         # Blank (React overlay)
│   └── GameOverScene.ts     # Blank (React overlay)
├── entities/                # Phaser game objects
│   ├── Player.ts, Projectile.ts, PowerUp.ts, Obstacle.ts
├── math/                    # Parse & validate biểu thức
│   ├── FunctionParser.ts, FunctionValidator.ts, GraphRenderer.ts
├── ui/                      # React components
│   ├── App.tsx, useGameEngine.ts
│   ├── MainMenu.tsx, MenuScreen.tsx
│   ├── LobbyScreen.tsx, WaitingRoom.tsx
│   ├── HudHeader.tsx, ControlFooter.tsx
│   ├── FormulaInput.tsx, GameOverOverlay.tsx
│   ├── SkinPicker.tsx, MapPicker.tsx
│   ├── PhaserGame.tsx, ThemeToggle.tsx, LanguageSwitcher.tsx
└── utils/                   # Helpers
    ├── MapGenerator.ts, MathUtils.ts
```

---

## 5. Hằng số quan trọng (`config.ts`)

| Nhóm | Giá trị | Ý nghĩa |
|------|---------|---------|
| `MAP` | X[-25,25] Y[-18,18], WIDTH=50, HEIGHT=36 | Phạm vi hệ tọa độ |
| `PLAYER` | HP=100, DMG=25, hitbox=0.5, moves=2, arcLength=5 | Thông số player |
| `TURN` | 60s, warning=10s | Thời gian mỗi lượt |
| `PROJECTILE` | step=0.05 | Bước lấy mẫu quỹ đạo |
| `PREVIEW` | step=0.2, opacity=0.5, dash=[6,4] | Preview trajectory |
| `OBSTACLES` | min=5, max=10 | Số lượng vật cản (random) |
| `POWERUPS` | min=3, max=6, doubleDmg×2, knockback=2 | Power-up params |
| `PHASER_CONFIG` | 1200×864 | Canvas dimensions |

**Enums**: `Difficulty` (Easy/Medium/Hard), `PowerUpType` (5 loại), `ObstacleType` (Hard/Soft), `TurnPhase` (Idle/Move/Fire/Resolve)

---

## 6. Lệnh Build & Dev

```bash
npm run dev          # Vite HMR dev server
npm run build        # TypeScript check + Vite production build
npm run preview      # Xem bản build production
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Prettier check (CI)
```

---

## 7. Giai đoạn phát triển

| Phase | Nội dung | Trạng thái |
|-------|---------|------------|
| **Phase 1** | Core game: gameplay, UI, math engine | ✅ Hoàn chỉnh |
| **Phase 2** | Extensions: skins, online, maps, preview, keyboard | ✅ Hoàn chỉnh |
| **Phase 3** | Planned: map editor, accounts, matchmaking, spectator, replay | ⬜ Chưa bắt đầu |

Chi tiết: xem [phase-1.md](phase-1.md) và [phase-2.md](phase-2.md)

---

## 8. Tài liệu thiết kế chi tiết

| Tài liệu | Phạm vi |
|-----------|---------|
| [phase-1.md](phase-1.md) | Giai đoạn 1 — Core Game |
| [phase-2.md](phase-2.md) | Giai đoạn 2 — Extensions |
| [gameplay.md](gameplay.md) | Gameplay mechanics: shooting, movement, collision, power-ups, obstacles, difficulty, preview |
| [ui-and-menus.md](ui-and-menus.md) | UI/UX: tất cả screens, HUD, controls, formula input, keyboard shortcuts |
| [skin-system.md](skin-system.md) | Hệ thống skin: shapes, trails, themes, registry |
| [online-multiplayer.md](online-multiplayer.md) | Online: Firebase, rooms, command sync, presence |
| [preset-maps.md](preset-maps.md) | Preset maps: 7 maps, validation, MapPicker |

---

## 9. Quy tắc code

### Đặt tên
- **File**: PascalCase cho class/component, camelCase cho hooks
- **Type/Interface**: Hậu tố theo vai trò — `PlayerState`, `GameEventMap`
- **Event**: Dùng enum `GameEvent`, `TurnEvent`

### Export
- Mỗi thư mục có `index.ts` barrel export
- Import qua alias: `import { GameState } from '@/core'`

### State management
- Mọi thay đổi state phải qua method của `GameState`
- Dùng `beginBatch()`/`endBatch()` để gom mutations → 1 emit
- React và Phaser subscribe độc lập

### Command Pattern
- Mọi hành động = `Command` (serializable cho multiplayer)
- `FireCommand` sử dụng batch để gom damage + powerup + obstacle mutations

### Formatting
- Prettier: single quotes, trailing commas, 100 char width
- ESLint 9: flat config, typescript-eslint, react-hooks
