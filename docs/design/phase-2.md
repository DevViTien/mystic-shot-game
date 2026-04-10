# Phase 2 — Extensions

## 1. Mục tiêu

Mở rộng Mystic Shot từ game local 2 người thành sản phẩm hoàn chỉnh:

- **Cá nhân hóa** — skin system cho visual
- **Online play** — 2 người chơi qua mạng
- **Content** — map thiết kế sẵn
- **UX** — preview đường đạn, phím tắt gameplay

## 2. Sub-phases

| Phase | Feature | Trạng thái | Dependency |
|-------|---------|------------|------------|
| **P2a** | [Skin System](skin-system.md) | ✅ Hoàn chỉnh | Không |
| **P2b** | [Online Multiplayer](online-multiplayer.md) | ✅ Hoàn chỉnh | P2a (skin data trong player state) |
| **P2c** | [Preset Maps](preset-maps.md) | ✅ Hoàn chỉnh | P2b (map selection trong lobby) |
| **P2d** | Trajectory Preview | ✅ Hoàn chỉnh | Không |
| **P2e** | Keyboard Shortcuts | ✅ Hoàn chỉnh | P2d (preview update khi đổi hướng) |
| **P2f** | Replay System | ✅ Hoàn chỉnh | Không |

**Thứ tự triển khai**: P2a → P2b → P2c (tuần tự), P2d + P2e (độc lập, làm song song), P2f (độc lập)

## 3. Nguyên tắc thiết kế

- **Backward compatible**: Local play giữ nguyên
- **Incremental**: Mỗi sub-phase release độc lập
- **Extensible**: Thêm skin/map sau không cần refactor

## 4. P2a — Skin System (Tóm tắt)

Skin thay đổi **visual only** (không ảnh hưởng gameplay): player shape, trail style, power-up theme.

**5 built-in skins**: classic, neon, geometric, starlight, pixel

**3 renderers**: PlayerShapeRenderer (4 shapes + glow/pulse), TrailStyleRenderer (6 styles), PowerUpThemeRenderer (4 themes)

Chi tiết: xem [skin-system.md](skin-system.md)

## 5. P2b — Online Multiplayer (Tóm tắt)

Room-based matchmaking qua Firebase RTDB. Anonymous auth, command forwarding sync, presence tracking.

**Chiến lược**: Command Forwarding — chỉ gửi command (~100 bytes), cả 2 client execute deterministic.

**InputAdapter pattern**: `LocalInputAdapter` (local) / `FirebaseInputAdapter` (online) — game logic không thay đổi.

Chi tiết: xem [online-multiplayer.md](online-multiplayer.md)

## 6. P2c — Preset Maps (Tóm tắt)

7 map thiết kế sẵn dưới dạng JSON: arena, fortress, maze, sniper, mirror, chaos, duel.

**MapPicker**: Carousel trong MenuScreen/Lobby, mini preview canvas.

Chi tiết: xem [preset-maps.md](preset-maps.md)

## 7. P2d — Trajectory Preview

### Phạm vi

Hiển thị **đường cong dự kiến** (dashed line) trên Phaser canvas khi player nhập hàm số hợp lệ.

### Hành vi

| Trạng thái | Preview | Trigger |
|------------|---------|--------|
| Input rỗng hoặc invalid | Ẩn | — |
| Input hợp lệ | Hiển thị | Sau debounce ~200ms |
| Bấm Fire/Move | Xoá → chạy animation thật | Ngay lập tức |
| Thay đổi expression | Xoá → vẽ mới | Debounce |
| Chuyển lượt | Xoá sạch | Ngay lập tức |

### Visual

| Thuộc tính | Giá trị |
|------------|--------|
| Kiểu nét | Dashed line (nét đứt) |
| Màu sắc | Màu player, alpha ~0.4 |
| Độ dày | 1.5px |
| Depth | Dưới entities, trên grid |
| Điểm kết thúc | Dot marker |

### Data flow

```
FormulaInput → validate ok → debounce 200ms
  → useGameEngine.handlePreview()
  → FunctionParser.createTranslatedEvaluator()
  → GraphRenderer.generatePoints() (step=0.2, lớn hơn đạn thật)
  → emit GameEvent.PreviewUpdate { points, mode }
  → GameScene vẽ dashed line trên Graphics layer
```

**Preview mode**:
- **Fire**: Từ player → biên map theo direction
- **Move**: Từ player → đến arc length limit hoặc biên map

### Performance

- Debounce 200ms để không render mỗi keystroke
- Sample step 0.2 (thay vì 0.05 của đạn thật)
- Single `Phaser.GameObjects.Graphics` tái sử dụng (`clear()` + vẽ lại)
- Skip khi đang animating

## 8. P2e — Keyboard Shortcuts

### Key Bindings

| Phím | Hành động | Ghi chú |
|------|-----------|--------|
| `Enter` | Fire | Giữ nguyên (đã có từ Phase 1) |
| `Shift+Enter` | Move | Cùng nhóm "submit" với Enter |
| `Tab` | Đổi hướng (◀ ↔ ▶) | `preventDefault` chặn nhảy focus |

### Chiến lược

Tất cả hotkeys xử lý trong `FormulaInput.handleKeyDown`:
- FormulaInput luôn giữ focus trong gameplay → mọi keypress đều đi qua đây
- Không cần global event listener → đơn giản, không risk memory leak
- GameOver → FormulaInput unmount → tự vô hiệu hóa

### Guard conditions

| Tình huống | Xử lý |
|------------|--------|
| Formula invalid | Ignore Enter/Shift+Enter |
| Đang animating | Ignore tất cả (disabled prop) |
| GameOver | FormulaInput unmount → hotkeys tự vô hiệu |
| Online — không phải lượt | disabled=true → keyDown không fire |

### UI Feedback

Keyboard hints hiển thị trên buttons (chỉ desktop via `@media(hover:hover)`):
- Fire button: "↵"
- Move button: "⇧↵"
- Direction button: "Tab"

## 9. P2f — Replay System

### Phạm vi

Sau game over, người chơi có thể xem lại toàn bộ trận đấu dưới dạng animation. Hỗ trợ play/pause, điều chỉnh tốc độ phát (1×/2×/4×), thoát bất kỳ lúc nào.

### Kiến trúc

```
                  Gameplay
                     │
  ┌──────────────────┼──────────────────┐
  │ Record           │                  │
  │ ReplayRecorder   │                  │
  │ (listen events)  │                  │
  └──────────────────┼──────────────────┘
                     │ GameOver
                     ▼
              ReplayData stored
                     │ "Watch Replay" button
                     ▼
  ┌──────────────────────────────────────┐
  │ Playback                             │
  │ ReplayScene (Phaser) ← registry ←── │
  │       ▲                              │
  │       ├── ReplayOverlay (React)      │
  │       │   play/pause, speed, exit    │
  └──────────────────────────────────────┘
```

**3 module mới**:

| Module | Lớp | File | Vai trò |
|--------|-----|------|---------|
| `ReplayRecorder` | Core | `src/core/ReplayRecorder.ts` | Ghi lại events trong gameplay |
| `ReplayScene` | Phaser | `src/scenes/ReplayScene.ts` | Phát lại replay animation |
| `ReplayOverlay` | React | `src/ui/ReplayOverlay.tsx` | Controls (play/pause, speed, exit) |

### Data Model

```ts
interface ReplayEntry {
  type: 'move' | 'fire';
  playerId: 1 | 2;
  snapshotAfter: GameStateSnapshot;
  trajectory?: Position[];   // fire only — dùng cho Projectile animation
}

interface ReplayData {
  initialSnapshot: GameStateSnapshot;
  entries: ReplayEntry[];
}
```

**Chiến lược ghi**: Snapshot-after per action.
- `ReplayRecorder` subscribe `GameEvent.PlayerMoved` (cho move) và `GameEvent.FireComplete` (cho fire)
- Mỗi event → push 1 `ReplayEntry` kèm `gameState.getSnapshot()` tại thời điểm đó
- Initial snapshot ghi lúc `start()` (trước lượt đầu)

**Tại sao snapshot-after thay vì re-execute commands?**
- Deterministic replay khó đảm bảo khi `CollisionSystem.trace()` có nhiều side effects
- Snapshot nhỏ (~2-5 KB/entry), tổng ~50-200 KB cho 1 game
- Không cần reconstruct GameState → đơn giản, ít bug

### Recording

```
Game start → replayRecorder.start()
  ├── Lưu initialSnapshot
  ├── Subscribe PlayerMoved → push entry (type='move')
  └── Subscribe FireComplete → push entry (type='fire', trajectory)
Game over → replayRecorder.stop()
  └── setReplayData(replayRecorder.getData())
```

**Lifecycle trong `useGameEngine`**:
- `handleMenuStart()` / `handleOnlineStart()` / guest init → `replayRecorder.reset()` + `start()`
- `GameEvent.GameOver` handler → `replayRecorder.stop()` + lưu data

### Playback (ReplayScene)

**AppScreen flow mở rộng**: `gameOver` → (Watch Replay) → `replay` → (Exit) → `gameOver`

**ReplayScene** mở rộng Phaser scene, tận dụng entity rendering y hệt GameScene:
- Grid, Player, Obstacle, PowerUp, Projectile — cùng `worldToScreen()`, cùng skin renderers
- Không cần GameState hay TurnManager — chạy từ snapshot data

**Playback loop**:

```
create():
  1. Render initial snapshot (grid + players + obstacles + powerUps)
  2. Set wait timer (600ms initial delay)

update():
  1. Nếu paused → skip
  2. Wait timer countdown (× speed multiplier)
  3. Khi hết wait → playNextEntry()

playNextEntry():
  - type='move' → Tween player position (400ms / speed)
  - type='fire' → Projectile.animate(trajectory) (reuse entity)
  - onComplete → applySnapshot() + update progress + delay 800ms → next
```

**Tốc độ**: `ENTRY_DELAY_MS / speed`, `MOVE_TWEEN_MS / speed`. Projectile animate theo frame-based (inherently faster at higher FPS — speed applied via delay between entries).

### Giao tiếp React ↔ ReplayScene

Qua Phaser `game.registry` (pattern nhất quán với skin/color truyền qua registry):

| Registry key | Hướng | Type | Mô tả |
|-------------|-------|------|-------|
| `replayData` | React → Phaser | `ReplayData` | Data phát lại |
| `replaySpeed` | React → Phaser | `number` | 1, 2, hoặc 4 |
| `replayPaused` | React → Phaser | `boolean` | Tạm dừng |
| `replayProgress` | Phaser → React | `{current, total}` | Tiến trình |
| `replayFinished` | Phaser → React | `boolean` | Phát xong |

React listen thay đổi qua `game.registry.events.on('changedata-*')`.

### ReplayOverlay (React)

```
┌──────────────────────────────────────────────────────────────────┐
│ REPLAY   3/12            [⏸] [▶▶ 2×]  ████████░░   COMPLETE  [✕ Exit] │
└──────────────────────────────────────────────────────────────────┘
```

| Phần tử | Vị trí | Hành vi |
|---------|--------|---------|
| Label "REPLAY" | Trái | Accent color, uppercase |
| Progress text | Trái | "3 / 12" (current / total entries) |
| Play/Pause | Giữa | Toggle icon `IconPlay` / `IconPause` |
| Speed | Giữa | Cycle 1× → 2× → 4× → 1×, hiển thị `IconFastForward` + giá trị |
| Progress bar | Giữa | Width% = current/total, bg-accent |
| Finished badge | Giữa | "COMPLETE" khi replay xong |
| Exit | Phải | `IconX` + "Exit", quay về gameOver |

**Auto-pause**: Khi `replayFinished` = true → tự động pause.

### GameOverOverlay cập nhật

Thêm nút **"Watch Replay"** (chỉ hiển thị khi `replayData` có data):

```
┌────────────────────────────────┐
│                                │
│     🏆 [PlayerName] Wins!     │
│                                │
│  [ ▶ Watch Replay ]  [ BACK ] │
│                                │
└────────────────────────────────┘
```

### i18n keys

| Key | EN | VI |
|-----|----|----|
| `replay.title` | REPLAY | XEM LẠI |
| `replay.watchReplay` | Watch Replay | Xem lại trận đấu |
| `replay.action` | {{current}} / {{total}} | {{current}} / {{total}} |
| `replay.play` | Play | Phát |
| `replay.pause` | Pause | Tạm dừng |
| `replay.speed` | Playback speed | Tốc độ phát |
| `replay.finished` | COMPLETE | HOÀN TẤT |
| `replay.exit` | Exit | Thoát |

### Icons mới

| Icon | Nguồn | Sử dụng |
|------|-------|---------|
| `IconPause` | `lucide-react/Pause` | Nút pause trong ReplayOverlay |
| `IconFastForward` | `lucide-react/FastForward` | Nút speed trong ReplayOverlay |
| `IconX` | `lucide-react/X` | Nút exit trong ReplayOverlay |

### Giới hạn

- Replay chỉ lưu trong memory (mất khi refresh/back to menu)
- Không hỗ trợ seek/jump đến lượt cụ thể (chỉ sequential)
- Online: cả host và guest đều record local → replay hoạt động cả 2 bên
- Không serialize ReplayData ra localStorage/Firebase (Phase 3 planned)

## 10. Dependencies mới (Phase 2)

| Package | Phase | Mục đích |
|---------|-------|---------|
| `firebase` ^12.x | P2b | Realtime DB + Anonymous Auth |
| `@radix-ui/react-tooltip` ^1.2 | P2d | Tooltip primitives |
| `embla-carousel-react` ^8.6 | P2a/P2c | Carousel slider |
| `tailwindcss-animate` ^1.0 | P2a | CSS animation utilities |

## 10. Hướng phát triển Phase 3+

- **Timer sync**: Server timestamp cho online (hiện chạy local)
- **Reconnection flow**: 30s countdown + auto-reconnect + state sync
- **Map Editor**: Drag-and-drop → export/import JSON → share online
- **Account system**: Firebase Email/Google Auth → stats, skin collection
- **Ranked matchmaking**: ELO-based, random opponent
- **Spectator mode**: Xem live game qua room code
- **Replay persistence**: Serialize ReplayData → localStorage / Firebase → share replay
- **Replay seek**: Skip/jump đến lượt cụ thể
- **Sound effects**: Bắn, hit, nhặt power-up
- **Particle effects**: Explosion, hit markers
- **Community skins**: User-created, seasonal events
