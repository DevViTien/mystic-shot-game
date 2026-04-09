# Hướng Dẫn Dự Án — Mystic Shot

## Tổng Quan

Game artillery theo lượt trên hệ tọa độ 2D. Người chơi nhập **hàm toán học f(x)** để di chuyển và bắn đạn — đạn bay theo đồ thị hàm số.

**Trạng thái**: Phase 1 hoàn chỉnh ✅ | Phase 2a (Skins) hoàn chỉnh ✅ | Phase 2c (Preset Maps) hoàn chỉnh ✅ | Phase 2b (Online) chưa triển khai

## Kiến Trúc

Hệ thống **hai lớp** (Hybrid):

| Lớp | Công nghệ | Vai trò |
|-----|-----------|---------|
| **UI/DOM** | React 19 | HUD, nhập công thức, menu, hiển thị KaTeX |
| **Game/Canvas** | Phaser 3.80 | Render lưới tọa độ, người chơi, đạn, vật cản |
| **Logic** | TypeScript thuần | GameState, TurnManager, CollisionSystem |
| **Toán học** | math.js 13 | Parse & evaluate biểu thức an toàn (sandbox) |
| **Styling** | Tailwind CSS 4 | Utility-first CSS, theme tokens via `@theme` directive |
| **Icons** | lucide-react | Icon library (React) + canvas-icons (Phaser) |
| **i18n** | i18next + react-i18next | Đa ngôn ngữ (EN/VI), localStorage persistence |
| **Hooks** | usehooks-ts | Common hooks (useLocalStorage, useDebounceValue, ...) |
| **Carousel** | Embla Carousel 8.6 | Slider component cho SkinPicker, MapPicker |
| **Linting** | ESLint 9 (flat config) | typescript-eslint, react-hooks, react-refresh |
| **Formatting** | Prettier | Single quotes, trailing commas, 100 char width |
| **Build** | Vite 6 | Dev server HMR, bundling, `@tailwindcss/vite` plugin |

**Giao tiếp React ↔ Phaser**: Qua `GameState` (typed EventEmitter). React dispatch command → GameState emit event → Phaser lắng nghe và re-render.

## Cấu Trúc Thư Mục

```
src/
├── main.tsx           # Entry point React — mount App vào DOM, import i18n
├── config.ts          # Hằng số & enum toàn cục (xem chi tiết bên dưới)
├── styles.css         # Tailwind CSS import, @theme tokens (dark/light), @layer base
│
├── assets/            # ═══ Static assets (bundled bởi Vite) ═══
│   └── image/
│       └── logo.png          # Game logo (hiển thị ở MenuScreen)
│
├── common/            # ═══ Shared utilities (không phụ thuộc domain) ═══
│   ├── components/
│   │   ├── AppImage.tsx      # Base image component — resolve assets từ src/assets/image/
│   │   │                     #   → import.meta.glob eager load, truyền name prop
│   │   ├── Modal.tsx         # Reusable modal wrapper
│   │   ├── Slider.tsx        # Embla Carousel slider — dùng cho SkinPicker, MapPicker
│   │   └── index.ts          # Barrel export
│   ├── icons/
│   │   ├── index.ts          # Barrel re-export lucide-react icons với prefix Icon*
│   │   │                     #   → Theme: IconSun, IconMoon
│   │   │                     #   → HUD: IconHeart, IconClock, IconTrophy, IconBack
│   │   │                     #   → Actions: IconFire, IconMove, IconPlay, IconChevronLeft/Right/Up/Down
│   │   │                     #   → Guide: IconTarget, IconHowItWorks, IconActions, IconPowerUp, ...
│   │   │                     #   → Power-ups: IconDoubleDamage, IconKnockback, IconExtraMove, IconShield, IconPiercing
│   │   └── canvas-icons.ts   # Phaser CanvasTexture cho power-up icons (SVG paths → Canvas 2D)
│   │                         #   → registerPowerUpIcons(scene) — gọi trong GameScene.create()
│   │                         #   → getPowerUpIconKey(type) — trả texture key
│   └── hooks/
│       └── index.ts          # Barrel re-export từ usehooks-ts:
│                             #   → Storage: useLocalStorage, useSessionStorage
│                             #   → Timing: useDebounceValue, useInterval
│                             #   → DOM: useMediaQuery, useEventListener, useOnClickOutside
│                             #   → Lifecycle: useUnmount
│
├── i18n/              # ═══ Internationalization (i18next) ═══
│   ├── index.ts              # Khởi tạo i18next, resources EN/VI, localStorage persistence
│   │                         #   → Storage key: 'mystic-shot-lang'
│   │                         #   → Default: 'en', fallback: 'en'
│   └── locales/
│       ├── en.json           # English translations (~130+ keys)
│       └── vi.json           # Vietnamese translations (~130+ keys)
│                             #   → Cấu trúc: menu.*, hud.*, footer.*, button.*, guide.*,
│                             #              tooltip.*, skin.*, map.{arena,fortress,...}.*
│
├── core/              # ═══ Logic nền tảng (không phụ thuộc Phaser/React) ═══
│   ├── EventEmitter.ts       # Typed pub/sub — generic EventMap, type-safe on/off/emit
│   │                         #   → Subclass cung cấp concrete EventMap (GameEventMap, TurnEventMap)
│   ├── GameState.ts          # Quản lý toàn bộ state game (players, obstacles, buffs, phase)
│   │                         #   → Types: Position, PlayerState (bao gồm skinId), ActiveBuff,
│   │                         #            ObstacleState, PowerUpState, GameStateSnapshot
│   │                         #   → Interface: GameEventMap — typed event signatures
│   │                         #   → Enum: GameEvent (StateChanged, PlayerHit, PlayerMoved,
│   │                         #       TurnChanged, PhaseChanged, ObstacleDestroyed,
│   │                         #       PowerUpCollected, GameOver, FireComplete,
│   │                         #       FireAnimationDone, GameStarted)
│   │                         #   → Batching: beginBatch()/endBatch() — gom nhiều mutation
│   │                         #       thành 1 lần emit StateChanged (nestable)
│   │                         #   → endGameByTimeout() — hết giờ → đối thủ thắng
│   │                         #   → Emit GameEvent.StateChanged sau mỗi mutation (hoặc cuối batch)
│   ├── TurnManager.ts        # Timer 60s/lượt, chuyển pha (Idle→Move→Fire→Resolve)
│   │                         #   → Enum: TurnEvent (TimerTick, TimerExpired, PhaseChanged)
│   │                         #   → Interface: TurnEventMap — typed event signatures
│   │                         #   → pauseTimer()/resumeTimer() cho animation
│   │                         #   → resetTimer() cho bonus shot khi nhặt power-up
│   │                         #   → Hết giờ → gọi endGameByTimeout() (đối thủ thắng)
│   ├── CollisionSystem.ts    # Trace quỹ đạo đạn (Δx=0.05), xử lý va chạm theo priority
│   │                         #   → Hỗ trợ direction (1/-1): bắn theo hướng player chọn
│   │                         #   → Interface: CollisionResult (hit, targetId, collectedPowerUps,
│   │                         #       destroyedObstacles, finalPosition, trajectoryPoints)
│   ├── CommandQueue.ts       # Queue lệnh tuần tự + lịch sử (cho multiplayer replay)
│   │                         #   → Interface: Command, SerializableCommand
│   ├── Commands.ts           # MoveCommand (di chuyển theo arc length), FireCommand (bắn + collision)
│   │                         #   → FireCommand: nhận direction param, batch mutations, emit FireComplete
│   │                         #   → MoveCommand: di chuyển dọc đồ thị, giới hạn arc length = 5
│   │                         #   → Interface: FireResult
│   └── index.ts              # Barrel export
│
├── entities/          # ═══ Phaser game objects (render layer) ═══
│   ├── Player.ts             # Hitbox r=0.5, delegate hình dạng cho PlayerShapeRenderer
│   │                         #   → Nhận PlayerSkin để render circle/star/diamond/hexagon + glow/pulse
│   ├── Obstacle.ts           # Hình chữ nhật — cứng (tô đặc) / mềm (viền nét đứt, fill mờ)
│   ├── PowerUp.ts            # Icon entity với themed texture background
│   │                         #   → Dùng getThemedPowerUpIconKey(type, theme) cho icon
│   │                         #   → Theme background colors per PowerUpThemeRenderer
│   ├── Projectile.ts         # Animated orb + trail, delegate style cho TrailStyleRenderer
│   │                         #   → Nhận TrailSkin để render solid/neon/rainbow/fire/ice/sparkle
│   │                         #   → POINTS_PER_FRAME=12, TAIL_LENGTH=30, ORB_RADIUS=5
│   │                         #   → animate(onComplete) — chạy trên scene 'update' event
│   │                         #   → Fade out tween khi kết thúc, emit FireAnimationDone
│   └── index.ts
│
├── skins/             # ═══ Skin System (Phase 2a) ═══
│   ├── types.ts              # Interfaces: SkinSet, PlayerSkin, TrailSkin, PowerUpSkin
│   │                         #   → PlayerSkin: shape, color, glow, pulse, scale
│   │                         #   → TrailSkin: style, widthMultiplier, fadeSpeed, particleEmitter
│   │                         #   → PowerUpSkin: theme, bgColors
│   ├── SkinRegistry.ts       # Singleton registry: get(id), getAll(), getDefault()
│   │                         #   → 5 skins: classic, neon, geometric, starlight, pixel
│   ├── presets/
│   │   ├── classic.ts        # Circle + solid trail + classic icons (default)
│   │   ├── neon.ts           # Circle + glow + neon trail + tech icons
│   │   ├── geometric.ts      # Hexagon + solid trail (1.3× width)
│   │   ├── starlight.ts      # Star + pulse + sparkle trail + magical icons
│   │   └── pixel.ts          # Diamond + solid trail (1.2× fade) + pixel icons
│   ├── renderers/
│   │   ├── PlayerShapeRenderer.ts   # Render 4 shapes: circle, star, diamond, hexagon + glow/pulse
│   │   ├── TrailStyleRenderer.ts    # Render 6 trail styles: solid, neon, rainbow, fire, ice, sparkle
│   │   └── PowerUpThemeRenderer.ts  # Register themed CanvasTexture per theme (classic, pixel, magical, tech)
│   └── index.ts              # Barrel export
│
├── maps/              # ═══ Preset Maps (Phase 2c) ═══
│   ├── types.ts              # Interfaces: PresetMap, PresetMapObstacle, PresetMapPowerUp
│   │                         #   → PresetMap: id, nameKey, descriptionKey, spawns, obstacles, powerUps, tags
│   ├── MapStorage.ts         # Load all presets: get(id), getAll()
│   ├── MapValidator.ts       # Build-time validation: bounds, spawn distance, overlap checks
│   ├── presets/              # 7 map JSON files
│   │   ├── arena.json        # Open field (2 hard obstacles, 3 power-ups)
│   │   ├── fortress.json     # Walled fortresses (complex obstacles)
│   │   ├── maze.json         # Complex paths (mixed hard/soft obstacles)
│   │   ├── sniper.json       # Narrow lanes (precision shots)
│   │   ├── mirror.json       # Perfectly symmetrical
│   │   ├── chaos.json        # All soft + many power-ups
│   │   └── duel.json         # No obstacles (pure math skill)
│   └── index.ts              # Barrel export
│
├── scenes/            # ═══ Phaser scenes (vòng đời game) ═══
│   ├── MenuScene.ts          # Blank idle — React MenuScreen overlay thay thế hoàn toàn
│   ├── GameScene.ts          # Scene gameplay chính:
│   │                         #   → Load skin từ registry, register themed power-up icons
│   │                         #   → Render lưới tọa độ, trục X/Y (grid + axes)
│   │                         #   → Tạo entity từ GameState snapshot, truyền skin config
│   │                         #   → Subscribe StateChanged + FireComplete để re-render
│   │                         #   → Helper: worldToScreen() (module-level function)
│   │                         #   → Tooltip system: interactive zones cho players, obstacles, power-ups
│   │                         #       hover hiển thị thông tin (i18n tooltip.* keys)
│   ├── GameOverScene.ts      # Blank idle — React GameOverOverlay thay thế hoàn toàn
│   └── index.ts
│
├── math/              # ═══ Parse & validate biểu thức toán học ═══
│   ├── FunctionParser.ts     # Wrapper math.js sandbox:
│   │                         #   → parse(), evaluate(), createEvaluator()
│   │                         #   → createTranslatedEvaluator(expr, ox, oy) — tính f(x-ox) - f(0) + oy
│   ├── FunctionValidator.ts  # Validate theo độ khó (duyệt AST math.js):
│   │                         #   → Easy: chỉ đa thức
│   │                         #   → Medium: + sin/cos/tan/log/sqrt/abs
│   │                         #   → Hard: bắt buộc ≥1 hàm đặc biệt
│   │                         #   → Interface: ValidationResult { valid, error? }
│   ├── GraphRenderer.ts      # Sinh mảng điểm (sampling) từ evaluator → dữ liệu cho vẽ quỹ đạo
│   └── index.ts
│
├── ui/                # ═══ React components (DOM layer) ═══
│   ├── App.tsx               # Root component — orchestrator mỏng, delegate logic sang useGameEngine
│   │                         #   → Render: MenuScreen | (HudHeader + PhaserGame + ControlFooter) | GameOverOverlay
│   │                         #   → useTheme() hook
│   ├── useGameEngine.ts      # Custom hook — quản lý toàn bộ game lifecycle:
│   │                         #   → Khởi tạo GameState, TurnManager, CollisionSystem (useMemo)
│   │                         #   → Subscribe events: StateChanged, TimerTick, GameOver, FireAnimationDone
│   │                         #   → Handlers: handleMove, handleFire, handleMenuStart, handleBackToMenu
│   │                         #   → State: snapshot, timer, gameStarted, gameOver, winnerId, animating
│   │                         #   → Pause timer khi animating, resume/endTurn khi animation done
│   │                         #   → handleMenuStart: nhận skin IDs + map ID, truyền vào GameState + Phaser registry
│   ├── HudHeader.tsx         # Header bar: HP bars (2 players), timer countdown, buffs icons,
│   │                         #   active turn indicator (glow + badge), ThemeToggle, LanguageSwitcher
│   │                         #   → BuffBadges sub-component: hiển thị power-up icons + remaining turns
│   ├── ControlFooter.tsx     # Footer bar (h-10 cố định): turn info, FormulaInput, direction toggle,
│   │                         #   Move button, Fire button
│   │                         #   → Direction: single toggle button (nhấn đổi ◀/▶)
│   │                         #   → Reset canFire + expression khi turnNumber thay đổi
│   ├── GameOverOverlay.tsx   # Overlay khi game kết thúc: trophy icon, "[Name] Wins!", nút BACK TO MENU
│   │                         #   → Nhận winnerId prop (không suy từ HP nữa)
│   ├── MenuScreen.tsx        # Menu trước game: logo, nhập tên, chọn màu (6 colors, mutual exclusion),
│   │                         #   SkinPicker (mỗi player), MapPicker, difficulty,
│   │                         #   How to Play guide (collapsible), ThemeToggle + LanguageSwitcher
│   │                         #   → Interface: MenuResult { player1, player2, difficulty, mapId? }
│   │                         #   → player1/player2 bao gồm: name, color, skinId
│   ├── SkinPicker.tsx        # Carousel slider chọn skin — mini preview (shape + trail)
│   │                         #   → Dùng Slider component (Embla Carousel)
│   ├── MapPicker.tsx         # Carousel slider chọn map — mini preview canvas
│   │                         #   → Random option + 7 preset maps
│   ├── PhaserGame.tsx        # Mount Phaser canvas vào React DOM, config 3 scenes,
│   │                         #   truyền GameState qua game.registry, expose PhaserGameHandle
│   ├── FormulaInput.tsx      # Input công thức + validation realtime + KaTeX preview (inline)
│   │                         #   → useDebounceValue cho KaTeX render (150ms)
│   │                         #   → Error + preview hiển thị inline cùng dòng input
│   │                         #   → Helper: expressionToLatex()
│   ├── ThemeToggle.tsx       # useTheme() hook (useLocalStorage) + ThemeToggle component
│   │                         #   → Dark/Light toggle, .dark class on <html>
│   ├── LanguageSwitcher.tsx  # EN/VI toggle buttons, gọi i18n.changeLanguage()
│   └── index.ts              # Barrel export tất cả components + hooks
│
└── utils/             # ═══ Helpers dùng chung ═══
    ├── MapGenerator.ts       # Sinh map ngẫu nhiên: 3-6 vật cản + 2-4 power-up,
    │                         #   tránh overlap (min 50 attempts), spawn players ở 2 bên
    │                         #   → fromPreset(): load preset map thay vì random
    ├── MathUtils.ts          # distance(), clamp(), lerp()
    └── index.ts
```

**Lưu ý**: Thư mục `input/` (InputAdapter, LocalInputAdapter) **chưa được implement**. Input handling hiện tại được xử lý trực tiếp qua callbacks trong `useGameEngine.ts`. Thiết kế input abstraction dành cho multiplayer tương lai (Phase 2b).

### Hằng Số Quan Trọng (`config.ts`)

| Nhóm | Giá trị | Ý nghĩa |
|------|---------|---------|
| `MAP` | X[-20,20] Y[-15,15], WIDTH=40, HEIGHT=30 | Phạm vi hệ tọa độ game |
| `PLAYER` | HP=100, DMG=25, hitbox=0.5, moves=2, arcLength=5, moveStep=0.05 | Thông số người chơi |
| `TURN` | 60s, warning=10s | Thời gian mỗi lượt |
| `PROJECTILE` | step=0.05 | Bước lấy mẫu quỹ đạo |
| `OBSTACLES` | min=3, max=6 | Số lượng vật cản |
| `POWERUPS` | min=2, max=4, doubleDmgMultiplier=2, knockbackDist=2 | Số lượng & thông số power-up |
| `PHASER_CONFIG` | 960×720, BG=0x1a1a2e, Grid=0x333355, Axis=0x6666aa, P1=0x00ccff, P2=0xff4466 | Canvas + màu sắc |

### Enum (`config.ts`)

| Enum | Giá trị |
|------|---------|
| `Difficulty` | Easy, Medium, Hard |
| `PowerUpType` | DoubleDamage, Knockback, ExtraMove, Shield, Piercing |
| `ObstacleType` | Hard, Soft |
| `TurnPhase` | Idle, Move, Fire, Resolve |

### Luồng Phụ Thuộc

```
config.ts (hằng số, enum — không phụ thuộc gì)
    ↓
common/ (icons, hooks, components — shared utilities)
    ↓
i18n/ (i18next config + locale files)
    ↓
core/ (GameState, EventEmitter, TurnManager, CollisionSystem, Commands)
    ↓                           ↓
skins/ (types, registry,   maps/ (types, storage,
  presets, renderers)         presets, validator)
    ↓                           ↓
ui/App.tsx                 scenes/GameScene.ts
├── useGameEngine.ts           ├── entities/ (Player, Obstacle, PowerUp, Projectile)
│   (lifecycle hook)           │   → delegate rendering sang skins/renderers/
├── HudHeader.tsx              ├── common/icons/canvas-icons (power-up textures)
├── ControlFooter.tsx          ├── skins/renderers/ (themed power-up icons)
├── GameOverOverlay.tsx        ├── tooltip system (interactive zones + i18n)
├── MenuScreen.tsx             └── subscribe GameState events
│   ├── SkinPicker.tsx
│   └── MapPicker.tsx
├── PhaserGame.tsx
├── FormulaInput.tsx
├── ThemeToggle.tsx
├── LanguageSwitcher.tsx
└── math/ (Parser, Validator, KaTeX)
```

## Lệnh Build & Dev

```bash
npm run dev          # Chạy dev server (Vite HMR)
npm run build        # TypeScript check + Vite build production
npm run preview      # Xem bản build production
npm run lint         # ESLint check (src/)
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format tất cả files
npm run format:check # Prettier check (CI-friendly)
```

## Quy Tắc Code

### Đặt Tên
- **File**: PascalCase cho class/component (`GameState.ts`, `HudHeader.tsx`), camelCase cho hooks (`useGameEngine.ts`)
- **Type/Interface**: Hậu tố theo vai trò — `PlayerState`, `FireResult`, `GameEventMap`
- **Event**: Dùng enum `GameEvent`, `TurnEvent` (string literal)

### Export
- Mỗi thư mục có `index.ts` barrel export
- Import qua alias: `import { GameState } from '@/core'`

### Quản lý State
- **Mọi thay đổi state** phải qua method của `GameState` (không mutate trực tiếp)
- GameState emit `GameEvent.StateChanged` sau mỗi mutation
- Dùng `beginBatch()`/`endBatch()` để gom nhiều mutation liên tiếp → 1 emit duy nhất
- React và Phaser subscribe độc lập

### Command Pattern
- Mọi hành động (move, fire) là một `Command` (serializable cho multiplayer tương lai)
- `CommandQueue` quản lý thứ tự thực thi
- `FireCommand` sử dụng batch để gom damage + powerup + obstacle mutations

### Animation Flow
- `FireCommand.execute()` → emit `FireComplete` (trajectory data)
- GameScene nhận trajectory → tạo `Projectile` → animate (sử dụng TrailStyleRenderer theo skin)
- Khi animation xong → emit `FireAnimationDone`
- `useGameEngine` nhận `FireAnimationDone` → resume timer hoặc endTurn

### Skin Data Flow
- MenuScreen → `MenuResult.player1.skinId` / `player2.skinId`
- `useGameEngine.handleMenuStart()` → truyền skinId vào `gameState.init()` + set vào Phaser registry
- GameScene.create() → `SkinRegistry.get(skinId)` → resolve `PlayerSkin`, `TrailSkin`, `PowerUpSkin`
- Entity constructors nhận skin objects → delegate rendering sang `skins/renderers/`

### Map Data Flow
- MenuScreen → `MenuResult.mapId` (null = random)
- `useGameEngine.handleMenuStart()`:
  - mapId có: `MapStorage.get(mapId)` → sử dụng preset obstacles + powerUps + spawns
  - mapId null: `MapGenerator.generate()` → random map
- Obstacles + powerUps + player spawns → `gameState.init()`

### Formatting & Linting
- **Prettier**: single quotes, trailing commas, 100 char width, LF line endings
- **ESLint 9**: flat config, typescript-eslint, react-hooks, react-refresh, eslint-config-prettier
- **EditorConfig**: UTF-8, 2-space indent, final newline

## Lưu Ý Quan Trọng

### Hệ Tọa Độ
- **Game coords** (toán): gốc ở giữa, y hướng lên, phạm vi X[-20,20] Y[-15,15]
- **Screen coords** (Phaser): gốc top-left, y hướng xuống
- Dùng helper `worldToScreen()` trong GameScene (module-level function)

### Dịch Hàm Số
- Công thức người chơi là **tương đối so với vị trí** của họ
- `FunctionParser.createTranslatedEvaluator(expr, ox, oy)` tính `f(x - ox) - f(0) + oy`
- Trừ `f(0)` đảm bảo đạn luôn đi qua vị trí player
- Cả 2 người chơi dùng cùng cú pháp nhưng ra quỹ đạo khác nhau

### Hướng Bắn
- Player **tự chọn hướng bắn** qua toggle button: +x (phải) hoặc -x (trái)
- Không tự động xác định theo vị trí đối thủ
- `CollisionSystem.trace()` nhận param `direction: 1 | -1`
- `FireCommand` nhận direction khi construct

### Hướng Di Chuyển
- Player **tự chọn hướng** di chuyển: +x (phải) hoặc -x (trái)
- Cùng direction toggle với hướng bắn
- UI direction toggle trong ControlFooter (single button, nhấn đổi ◀/▶)

### Collision — Thứ Tự Ưu Tiên
```
1. Power-up → thu thập, đạn tiếp tục bay
2. Vật cản mềm → phá hủy, đạn dừng (trừ khi có buff Piercing)
3. Vật cản cứng → đạn dừng
4. Người chơi đối thủ → gây sát thương, đạn dừng
```

### Buff Duration
- **DoubleDamage, Knockback, Piercing**: `remainingTurns=2` khi nhặt (để survive qua endTurn tick → hiệu lực 1 lượt tiếp theo)
- **Shield**: `remainingTurns=-1` (permanent cho đến khi bị hit → chặn hoàn toàn 1 lần damage)
- **ExtraMove**: Áp dụng ngay (+1 moveCharges), không lưu buff

### Hết Thời Gian
- Khi timer về 0 → **game kết thúc**, đối thủ thắng (không skip lượt)
- `TurnManager.onTimerExpired()` → `gameState.endGameByTimeout()` → emit `GameOver`
- `winnerId` được lưu trong state và truyền trực tiếp cho `GameOverOverlay`

### Validation Công Thức theo Độ Khó
- Tối đa **100 ký tự** (maxLength trên input)
- **Easy**: Chỉ đa thức (x, x², 2x+1...)
- **Medium**: + sin, cos, tan, log, ln, sqrt, abs
- **Hard**: **Bắt buộc** có ít nhất 1 hàm đặc biệt (từ chối đa thức thuần)

### Skin System (Phase 2a)
- Skin chỉ thay đổi **visual**, không ảnh hưởng gameplay (hitbox, damage, speed giữ nguyên)
- 5 skins: classic (default), neon, geometric, starlight, pixel
- 3 thành phần render: PlayerShapeRenderer (4 shapes), TrailStyleRenderer (6 styles), PowerUpThemeRenderer (4 themes)
- Mỗi skin preset define đầy đủ PlayerSkin + TrailSkin + PowerUpSkin
- `SkinRegistry` singleton quản lý, resolve qua `skinId` string

### Preset Maps (Phase 2c)
- 7 maps: arena, fortress, maze, sniper, mirror, chaos, duel
- JSON format trong `maps/presets/`, load qua `MapStorage`
- `MapValidator` kiểm tra bounds, spawn distance, overlap tại build-time
- MenuScreen MapPicker: carousel + mini preview canvas
- Random option vẫn available (default khi không chọn preset)

### Bảo Mật
- math.js chạy sandbox — **không dùng eval()** cho biểu thức người dùng
- Validate input trước khi parse

## Tài Liệu Tham Khảo

- Thiết kế game chi tiết (Phase 1): xem `docs/[design] game-design-document.md`
- Thiết kế Phase 2: xem `docs/[design] phase-2-features.md`
