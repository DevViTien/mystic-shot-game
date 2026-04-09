# Hướng Dẫn Dự Án — Mystic Shot

## Tổng Quan

Game artillery theo lượt trên hệ tọa độ 2D. Người chơi nhập **hàm toán học f(x)** để di chuyển và bắn đạn — đạn bay theo đồ thị hàm số. Phase 1 + Phase 2 (Skins, Online Multiplayer, Preset Maps) hoàn chỉnh.

## Kiến Trúc

Hệ thống **hai lớp** (Hybrid): React 19 (DOM/UI) + Phaser 3.80 (Canvas/Game).

| Lớp | Công nghệ | Vai trò |
|-----|-----------|---------|
| **UI/DOM** | React 19 | HUD, nhập công thức, menu, KaTeX |
| **Game/Canvas** | Phaser 3.80 | Render lưới tọa độ, người chơi, đạn, vật cản |
| **Logic** | TypeScript thuần | GameState, TurnManager, CollisionSystem |
| **Toán học** | math.js 13 | Parse & evaluate biểu thức (sandbox) |
| **Network** | Firebase 12 (RTDB) | Online multiplayer |
| **Styling** | Tailwind CSS 4 | Utility-first, `@theme` directive |
| **Build** | Vite 6 | Dev server HMR, bundling |

Thư viện phụ: lucide-react (icons, prefix `Icon*`), @radix-ui/react-tooltip, i18next + react-i18next (EN/VI), usehooks-ts, Embla Carousel 8.6, tailwindcss-animate.

**Giao tiếp React ↔ Phaser**: Qua `GameState` (typed EventEmitter). React dispatch command → GameState emit event → Phaser re-render.

**Giao tiếp Online**: Qua `InputAdapter` abstraction. `LocalInputAdapter` execute trực tiếp; `FirebaseInputAdapter` push lên Firebase RTDB.

## Cấu Trúc Thư Mục (Top-level)

```
src/
├── main.tsx           # Entry point React
├── config.ts          # Hằng số & enum toàn cục
├── styles.css         # Tailwind CSS + animations
├── common/            # Shared: components (Modal, Slider, Tooltip), icons (Icon*), hooks
├── i18n/              # i18next config + locales/ (en.json, vi.json ~190+ keys)
├── core/              # GameState, EventEmitter, TurnManager, CollisionSystem, Commands
├── network/           # Firebase, InputAdapter, RoomManager, PresenceManager
├── entities/          # Phaser entities: Player, Obstacle, PowerUp, Projectile
├── skins/             # Skin system: types, registry, 5 presets, 3 renderers
├── maps/              # Preset maps: types, storage, validator, 7 JSON presets
├── scenes/            # Phaser scenes: MenuScene, GameScene, GameOverScene
├── math/              # FunctionParser, FunctionValidator, GraphRenderer
├── ui/                # React components: App, menus, HUD, controls, pickers
└── utils/             # MapGenerator, MathUtils
```

## Hằng Số Quan Trọng (`config.ts`)

| Nhóm | Giá trị |
|------|---------|
| MAP | X[-25,25] Y[-18,18], WIDTH=50, HEIGHT=36 |
| PLAYER | HP=100, DMG=25, hitbox=0.5, moves=2, arcLength=5 |
| TURN | 60s, warning=10s |
| PROJECTILE | step=0.05 |
| Enums | Difficulty(Easy/Medium/Hard), PowerUpType(5), ObstacleType(Hard/Soft), TurnPhase(4) |

## Core Patterns

### State Management
- **Mọi thay đổi state** phải qua method của `GameState` (không mutate trực tiếp)
- GameState emit `GameEvent.StateChanged` sau mỗi mutation
- `beginBatch()`/`endBatch()` gom nhiều mutation → 1 emit (nestable)

### Command Pattern
- Mọi hành động (move, fire) = `Command` (serializable cho multiplayer)
- `serialize()` → `SerializableCommand` — online sync qua Firebase

### Animation Flow
- `FireCommand.execute()` → emit `FireComplete` → Phaser animate `Projectile` → emit `FireAnimationDone` → resume timer / endTurn

## Quy Tắc Code

### Đặt Tên
- **File**: PascalCase (class/component), camelCase (hooks)
- **Type/Interface**: Hậu tố theo vai trò — `PlayerState`, `GameEventMap`

### Export & Import
- Mỗi thư mục có `index.ts` barrel export
- Import alias: `import { GameState } from '@/core'`

### Formatting
- **Prettier**: single quotes, trailing commas, 100 char width, LF
- **ESLint 9**: flat config, typescript-eslint, react-hooks
- **EditorConfig**: UTF-8, 2-space indent, final newline
- i18n keys cho mọi user-facing text (EN + VI)

## Lệnh Build & Dev

```bash
npm run dev          # Dev server (Vite HMR)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Prettier check (CI)
npm run test         # Vitest run all tests
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest coverage report
```

## Lưu Ý Quan Trọng

### Hệ Tọa Độ
- **Game coords**: gốc giữa, y lên, X[-25,25] Y[-18,18]
- **Screen coords**: gốc top-left, y xuống — dùng `worldToScreen()` trong GameScene

### Dịch Hàm Số
- `createTranslatedEvaluator(expr, ox, oy)` → `f(x-ox) - f(0) + oy`
- Trừ `f(0)` đảm bảo đạn đi qua vị trí player

### Collision — Thứ Tự Ưu Tiên
1. Power-up → thu thập, đạn tiếp tục bay
2. Vật cản mềm → phá hủy, đạn dừng (trừ Piercing)
3. Vật cản cứng → đạn dừng
4. Đối thủ → damage, đạn dừng

### Hết Thời Gian
- Timer về 0 → **game kết thúc**, đối thủ thắng (không skip lượt)

### Bảo Mật
- math.js sandbox — **KHÔNG dùng eval()** cho biểu thức người dùng
- Firebase config qua env vars (`VITE_FIREBASE_*`) — không hardcode

## Tài Liệu Tham Khảo

- Tổng quan: `docs/design/overview.md`
- Gameplay: `docs/design/gameplay.md`
- UI & Menus: `docs/design/ui-and-menus.md`
- Phase 1/2: `docs/design/phase-1.md`, `docs/design/phase-2.md`
- Skins: `docs/design/skin-system.md`
- Online: `docs/design/online-multiplayer.md`
- Maps: `docs/design/preset-maps.md`
- Deploy: `docs/guide/deployment.md`
