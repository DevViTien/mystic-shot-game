# 📄 PHASE 2 DESIGN — Mystic Shot

## 1. Tổng quan

### 1.1 Mục tiêu Phase 2

Mở rộng Mystic Shot từ game local 2 người trên 1 máy thành sản phẩm hoàn chỉnh hơn với:

- **Hệ thống skin** — cá nhân hóa visual cho player, đường đạn, power-up
- **Chơi online** — 2 người chơi qua mạng (Firebase Realtime Database)
- **Map có sẵn** — bộ sưu tập map thiết kế sẵn thay vì chỉ random
- **Preview đường đạn** — hiển thị quỹ đạo dự kiến trên canvas trước khi bắn/di chuyển
- **Phím tắt gameplay** — điều khiển bằng bàn phím: fire, move, đổi hướng

### 1.2 Thứ tự triển khai

| Phase | Feature | Lý do thứ tự | Dependency |
|-------|---------|-------------|------------|
| **P2a** | Skin System | Không phụ thuộc backend, cải thiện UX ngay | Không |
| **P2b** | Online Multiplayer | Phức tạp nhất, cần P2a xong để sync skin online | P2a (skin data trong player state) |
| **P2c** | Preset Maps | Đơn giản, bổ sung content cuối cùng | P2b (map selection trong lobby) |
| **P2d** | Trajectory Preview | UX nhỏ, triển khai nhanh, độc lập | Không (có thể làm song song) |
| **P2e** | Keyboard Shortcuts | UX nhỏ, triển khai nhanh, độc lập | P2d (preview cần update khi đổi hướng) |

### 1.3 Nguyên tắc thiết kế

- **Backward compatible**: Chế độ local play giữ nguyên, không ảnh hưởng gameplay hiện tại
- **Incremental**: Mỗi sub-phase có thể release độc lập
- **Extensible**: Thiết kế cho phép thêm skin/map sau mà không refactor lại

---

## 2. P2a — Skin System

### 2.1 Phạm vi

Skin là bộ visual tùy chỉnh ảnh hưởng 3 thành phần hiển thị:

| Thành phần | Hiện tại (Phase 1) | Sau khi có Skin |
|------------|---------------------|-----------------|
| **Player marker** | Hình tròn, màu đơn sắc | Nhiều hình dạng (circle, star, diamond, hexagon) + hiệu ứng glow/pulse |
| **Đường đạn** | Gradient tail + 3-layer glow orb cố định | Nhiều style trail (solid, sparkle, rainbow, fire, ice, neon) |
| **Power-up icon** | SVG → CanvasTexture, nền vàng cố định | Nhiều theme icon (classic, pixel, magical, tech) với màu nền riêng |

**Lưu ý**: Skin chỉ thay đổi **visual**, không ảnh hưởng gameplay (hitbox, damage, speed giữ nguyên).

### 2.2 Cấu trúc dữ liệu Skin

Mỗi skin (SkinSet) bao gồm:

```
SkinSet
├── id: string unique             # "classic", "neon", "pixel", ...
├── nameKey: string               # i18n key để hiển thị tên
├── player: PlayerSkin
│   ├── shape                     # circle | star | diamond | hexagon
│   ├── glowEffect: boolean       # Vòng sáng mờ bao quanh player
│   └── pulseAnimation: boolean   # Hiệu ứng co giãn nhẹ
├── trail: TrailSkin
│   ├── style                     # solid | sparkle | rainbow | fire | ice | neon
│   ├── particleEmitter: boolean  # Bật Phaser particle system dọc trail
│   ├── widthMultiplier           # Hệ số nhân chiều rộng trail (0.5–2.0)
│   └── fadeSpeed                 # Hệ số tốc độ mờ dần (0.5–2.0)
└── powerUp: PowerUpSkin
    └── theme                     # classic | pixel | magical | tech
```

### 2.3 Bộ skin mặc định (Built-in)

| ID | Player | Trail | Power-up | Mô tả phong cách |
|----|--------|-------|----------|-------------------|
| `classic` | Circle | Solid gradient | Classic (vàng + đen) | Mặc định, giữ nguyên Phase 1 |
| `neon` | Circle + Glow | Neon (sáng, alpha cao) | Tech (xanh neon) | Cyberpunk, rực sáng |
| `geometric` | Hexagon | Solid (dày hơn) | Classic | Hình học cứng cáp |
| `starlight` | Star + Pulse | Sparkle (particle) | Magical (tím + sáng) | Ma thuật, lấp lánh |
| `pixel` | Diamond | Solid (blocky) | Pixel (8-bit) | Retro, pixel art |

### 2.4 Rendering — Chiến lược refactor

Hiện tại mỗi entity (Player, Projectile, PowerUp) tự vẽ trực tiếp. Cần tách thành **Renderer layer** riêng biệt:

```
Trước (Phase 1):
  Player.draw()      → Trực tiếp gọi graphics.fillCircle()
  Projectile.tick()  → Trực tiếp vẽ gradient trail + orb
  PowerUp.create()   → Trực tiếp dùng texture key cố định

Sau (Phase 2a):
  Player.draw()      → Delegate tới PlayerShapeRenderer
  Projectile.tick()  → Delegate tới TrailStyleRenderer
  PowerUp.create()   → Dùng texture key theo theme
```

**3 Renderer mới:**

| Renderer | Đầu vào | Đầu ra |
|----------|---------|--------|
| `PlayerShapeRenderer` | Graphics context, position, radius, PlayerSkin, color | Vẽ shape (circle/star/diamond/hexagon) + hiệu ứng glow/pulse lên canvas |
| `TrailStyleRenderer` | Graphics context, trajectory points, TrailSkin, color | Vẽ trail + orb theo style (solid/sparkle/rainbow/fire/ice/neon) lên canvas |
| `PowerUpThemeRenderer` | Phaser Scene, PowerUpSkin | Đăng ký bộ CanvasTexture theo theme, trả texture key |

### 2.5 Chi tiết player shapes

| Shape | Phương pháp vẽ | Ghi chú |
|-------|----------------|---------|
| `circle` | `fillCircle()` | Giữ nguyên Phase 1 |
| `star` | Polygon 10 điểm (5 đỉnh ngoài + 5 đỉnh trong) | Inner radius ≈ 45% outer radius |
| `diamond` | Polygon 4 điểm, xoay 45° | Hình vuông xoay |
| `hexagon` | Polygon 6 điểm đều | Flat-top orientation |

**Hiệu ứng bổ sung:**
- `glowEffect`: Vẽ thêm 1 circle mờ (alpha 0.15) bán kính ×2 bao ngoài shape
- `pulseAnimation`: Phaser tween `scaleX/scaleY` dao động 0.95–1.05, yoyo, lặp vô hạn

### 2.6 Chi tiết trail styles

| Style | Mô tả visual | Kỹ thuật |
|-------|-------------|---------|
| `solid` | Gradient tail mờ dần + 3-layer glow orb | Giữ nguyên logic Phase 1 |
| `sparkle` | Như solid + particle nhỏ sáng dọc trail | Phaser ParticleEmitter, tần suất thấp, offset ngẫu nhiên ±3px |
| `rainbow` | Trail đổi màu liên tục (cycle hue) | Mỗi segment dùng HSL color, hue tăng dần theo index |
| `fire` | Gradient đỏ-cam + tàn lửa | Color cố định orange→red, ParticleEmitter hướng lên |
| `ice` | Gradient xanh-trắng + crystal particles | Color cố định blue→white, particle nhỏ hình thoi |
| `neon` | Như solid nhưng alpha cao hơn, width lớn hơn | widthMultiplier=1.5, alpha tăng +0.2, glow radius +50% |

### 2.7 Chi tiết power-up themes

Mỗi theme = bộ drawing functions riêng + màu nền riêng trong `canvas-icons.ts`:

| Theme | Màu nền | Stroke style | Cảm giác |
|-------|---------|-------------|----------|
| `classic` | Vàng `#ffcc00` | Đen 2px, rounded | Lucide icons gốc (Phase 1) |
| `pixel` | Xanh lá `#44ff66` | Đen 3px, square cap | Nét thô, blocky, 8-bit |
| `magical` | Tím `#aa66ff` | Trắng 2px, rounded | Mảnh, thanh lịch |
| `tech` | Xanh neon `#00ccff` | Trắng 1.5px, butt cap | Geometric, góc cạnh |

Texture key format: `powerup_{theme}_{type}` (ví dụ `powerup_pixel_shield`).

### 2.8 Skin Registry

Quản lý qua **singleton registry**:

- Đăng ký tất cả built-in skins khi module load
- Cung cấp: `get(id)`, `getAll()`, `getDefault()` (trả `classic`)
- Mở rộng: sau này có thể thêm skin từ server hoặc user-created

### 2.9 UI — Skin Picker

Thêm component SkinPicker vào MenuScreen, nằm dưới color picker:

```
┌──────────────────┐
│   Player 1       │
│ [___name___]     │
│ ● ● ● ● ● ●    │  ← Color picker (giữ nguyên)
│                  │
│ Skin:            │
│ [◀] Classic [▶]  │  ← Carousel chọn skin
│ ◉ Preview        │  ← Preview nhỏ: shape + trail
└──────────────────┘
```

**Quy tắc:**
- Carousel ngang, ◀/▶ để chuyển skin
- Hiển thị tên skin (i18n)
- Preview nhỏ: mini canvas vẽ player shape + đoạn trail ngắn với màu đã chọn
- 2 player **có thể** chọn cùng skin (khác với color — bắt buộc khác nhau)

### 2.10 Data flow

```
MenuScreen
  │ User chọn skin → skinId lưu vào MenuResult
  ▼
useGameEngine
  │ Nhận skinId → lưu vào Phaser registry ('p1Skin', 'p2Skin')
  │ Truyền skinId vào GameState.init() → lưu trong PlayerState.skinId
  ▼
GameScene.create()
  │ Đọc skinId từ registry → lấy SkinSet từ SkinRegistry
  │ Truyền SkinSet cho entity constructors
  ▼
Entity rendering
  │ Player      → PlayerShapeRenderer(skinSet.player, color)
  │ Projectile  → TrailStyleRenderer(skinSet.trail, color)
  │ PowerUp     → texture key theo skinSet.powerUp.theme
  ▼
Phaser canvas hiển thị visual tương ứng
```

### 2.11 Thay đổi state

- `PlayerState` thêm field `skinId: string` (default `"classic"`)
- `MenuResult` thêm field `skinId` cho mỗi player config
- `GameStateSnapshot` tự động bao gồm `skinId` (nằm trong PlayerState)

### 2.12 Cấu trúc thư mục

```
src/skins/
├── types.ts                    # Interface: SkinSet, PlayerSkin, TrailSkin, PowerUpSkin
├── SkinRegistry.ts             # Singleton: register, get, getAll, getDefault
├── presets/                    # Built-in skin definitions
│   ├── classic.ts
│   ├── neon.ts
│   ├── geometric.ts
│   ├── starlight.ts
│   └── pixel.ts
├── renderers/
│   ├── PlayerShapeRenderer.ts  # Vẽ player shape + effects
│   ├── TrailStyleRenderer.ts   # Vẽ trail + orb
│   └── PowerUpThemeRenderer.ts # Đăng ký CanvasTexture per theme
└── index.ts                    # Barrel export
```

### 2.13 Danh sách file ảnh hưởng

| File | Loại | Nội dung thay đổi |
|------|------|-------------------|
| `src/skins/*` | **Mới** | Toàn bộ skin system |
| `src/ui/SkinPicker.tsx` | **Mới** | Component chọn skin carousel |
| `core/GameState.ts` | Sửa | `PlayerState` thêm `skinId` field |
| `entities/Player.ts` | Sửa | Delegate vẽ qua `PlayerShapeRenderer` |
| `entities/Projectile.ts` | Sửa | Delegate vẽ qua `TrailStyleRenderer` |
| `entities/PowerUp.ts` | Sửa | Dùng texture key theo theme |
| `common/icons/canvas-icons.ts` | Sửa | Thêm per-theme drawing maps |
| `scenes/GameScene.ts` | Sửa | Đọc skin từ registry, truyền cho entities |
| `ui/MenuScreen.tsx` | Sửa | Tích hợp SkinPicker |
| `ui/useGameEngine.ts` | Sửa | Truyền skinId qua Phaser registry |
| `i18n/locales/*.json` | Sửa | Thêm keys `skin.*` |

---

## 3. P2b — Online Multiplayer

### 3.1 Phạm vi

Cho phép 2 người chơi trên 2 máy khác nhau chơi cùng trận qua mạng:

- **Room-based**: Host tạo room → nhận room code 6 ký tự → Guest nhập code để join
- **Turn-based sync**: Active player gửi command → cả 2 client nhận → execute deterministic
- **Anonymous**: Không cần đăng ký tài khoản — Firebase Anonymous Auth

### 3.2 Công nghệ: Firebase Realtime Database

**So sánh lựa chọn:**

| Tiêu chí | Firebase RTDB | Socket.IO + Server |
|----------|---------------|-------------------|
| Setup | Zero server, chỉ config client SDK | Cần deploy + maintain Node.js server |
| Latency | ~100–300ms | ~30–100ms |
| Đủ cho turn-based? | ✅ Thừa (mỗi lượt 60s) | ✅ Thừa |
| Auto reconnect | ✅ Built-in | Phải tự implement |
| Presence detection | ✅ Built-in (`onDisconnect`) | Phải tự implement |
| Cost | Free tier: 100K connections/month | Hosting ~$5/month minimum |
| Anti-cheat | ❌ Client-side + Security Rules | ✅ Server authoritative |

**Quyết định: Firebase RTDB.**

**Lý do**: Turn-based tolerant latency cao, zero server maintenance, presence/reconnect miễn phí. Migration path sang Socket.IO nếu cần anti-cheat sau.

**Firebase services sử dụng:**

| Service | Mục đích |
|---------|---------|
| Realtime Database | Room data, state sync, command forwarding |
| Anonymous Authentication | Định danh player không cần đăng ký |

**Dependency**: `firebase` ^11.x (modular, tree-shakeable) — chỉ import `firebase/app`, `firebase/database`, `firebase/auth`.

### 3.3 Cấu trúc dữ liệu Firebase

```
/rooms/{roomId}/
│
├── meta/                               # Room metadata
│   ├── roomCode: string                # 6-char alphanumeric (VD: "A3F7K2")
│   ├── hostId: string                  # Firebase Auth UID
│   ├── guestId: string | null
│   ├── status: string                  # "waiting" | "playing" | "finished" | "abandoned"
│   ├── createdAt: ServerTimestamp
│   ├── difficulty: string              # "easy" | "medium" | "hard"
│   ├── mapId: string                   # "random" | preset map ID
│   ├── host/
│   │   ├── name, color, skinId
│   └── guest/                          # null cho đến khi guest join
│       ├── name, color, skinId
│
├── state/                              # GameStateSnapshot (host ghi, cả 2 đọc)
│   ├── players/[0], players/[1]        # PlayerState
│   ├── currentPlayerId, phase
│   ├── obstacles/[], powerUps/[]
│   ├── turnNumber
│   └── turnStartedAt: ServerTimestamp  # Cho timer sync
│
├── commands/                           # Append-only command log (cả 2 ghi, cả 2 đọc)
│   └── {pushId}/
│       ├── type, playerId, expression, direction, timestamp
│
└── presence/                           # Connection tracking
    ├── {hostUid}: boolean
    └── {guestUid}: boolean
```

### 3.4 Chiến lược đồng bộ: Command Forwarding

**Nguyên lý**: Thay vì sync toàn bộ state (nặng ~KB), chỉ gửi command (~100 bytes). Cả 2 client execute cùng command trên local state → kết quả deterministic.

```
Active player nhập hàm → validate → bấm Fire/Move
  │
  ├─ 1. Push SerializableCommand lên /rooms/{id}/commands/
  │       { type, playerId, expression, direction, timestamp }
  │
  ├─ 2. Cả 2 client subscribe onChildAdded(/commands/)
  │       → Nhận command → Deserialize → Execute trên local GameState
  │       → Deterministic: cùng input + state → cùng kết quả
  │
  └─ 3. Host ghi GameStateSnapshot lên /rooms/{id}/state/
         (backup cho reconnect và fallback desync)
```

**Tại sao Command Forwarding?**
- Command nhỏ (~100 bytes) vs State snapshot lớn (nhiều KB) → ít bandwidth
- Commands đã serializable sẵn (`.serialize()` từ Phase 1)
- Deterministic: cùng expression + direction + game state → cùng collision result

**Fallback**: Host ghi snapshot sau mỗi command. Khi reconnect hoặc phát hiện desync → client load snapshot mới nhất.

### 3.5 Room Lifecycle

#### 3.5.1 Tạo room (Host)

```
Host mở Lobby → chọn tên, color, skin, difficulty, map
  → Bấm "Create Room"
  → signInAnonymously() → nhận UID
  → Generate room code 6-char (unique)
  → Ghi /rooms/{id}/meta/ với status='waiting'
  → Hiển thị room code → chờ guest
  → Subscribe meta/guestId — biết khi guest join
```

#### 3.5.2 Join room (Guest)

```
Guest mở Lobby → chọn tên, color, skin
  → Nhập room code → bấm "Join"
  → signInAnonymously() → nhận UID
  → Query rooms theo roomCode
  → Validate: status='waiting', guestId=null, color ≠ host color
  → Ghi guestId + guest info vào meta/
  → Subscribe meta/status — biết khi host start
```

#### 3.5.3 Start game (Host)

```
Host thấy guest đã join → bấm "Start Game"
  → MapGenerator (random hoặc preset)
  → Random starting player
  → Ghi GameStateSnapshot vào /state/
  → Set status='playing'
  → Cả 2 client nhận status change → chuyển sang game
  → Subscribe /commands/ → sẵn sàng nhận commands
```

#### 3.5.4 Kết thúc game

```
HP player = 0 → GameOver event
  → Host set status='finished', ghi winnerId
  → Cả 2 hiện GameOverOverlay
  → "Back to Menu" → disconnect khỏi room
```

### 3.6 InputAdapter — Lớp trừu tượng input

Để hỗ trợ cả local và online **mà không đổi game logic**, tách input thành interface:

```
InputAdapter (interface)
├── submitMove(expression, direction)     # Gửi move command
├── submitFire(expression, direction)     # Gửi fire command
├── onOpponentCommand(callback) → unsub  # Nhận command từ đối thủ
├── isMyTurn(): boolean                   # Kiểm tra lượt
└── dispose()                             # Cleanup listeners
```

**2 implementation:**

| Adapter | Dùng khi | submitFire/Move | onOpponentCommand |
|---------|---------|-----------------|-------------------|
| `LocalInputAdapter` | Local play | Tạo Command → execute trực tiếp | Không dùng (cùng máy) |
| `FirebaseInputAdapter` | Online play | Push lên Firebase | Subscribe onChildAdded |

**Tác động lên `useGameEngine`:**
- Nhận `InputAdapter` thay vì trực tiếp tạo Command
- `handleMove()` → `adapter.submitMove()`
- `handleFire()` → `adapter.submitFire()`
- Subscribe `adapter.onOpponentCommand()` → execute command nhận được
- UI disable khi `!adapter.isMyTurn()` (online: chỉ active player thao tác)

### 3.7 Timer đồng bộ

**Vấn đề**: `setInterval` client-side → 2 client có thể lệch timer.

**Giải pháp:**
- Host ghi `turnStartedAt` (Firebase server timestamp) vào `/state/` mỗi đầu lượt
- Guest tính: `timer = 60 - (now - turnStartedAt)`
- Hết giờ: **chỉ host** gửi skip-turn signal → cả 2 xử lý
- Host disconnect → Guest fallback timer local

### 3.8 Reconnection

```
Client mất kết nối
  │
  ├─ Firebase onDisconnect() tự set presence = false
  │
  ├─ Opponent nhận presence change
  │   → Hiện "Opponent disconnected — Reconnecting..."
  │   → Countdown 30 giây
  │
  ├─ Reconnect TRƯỚC 30s:
  │   → Firebase auto-reconnect
  │   → Set presence = true
  │   → Load latest /state/ → force-sync local GameState
  │   → Resume game
  │
  └─ KHÔNG reconnect trong 30s:
      → Opponent thắng mặc định
      → Set status='finished'
```

### 3.9 Security Rules

| Path | Ai đọc | Ai ghi | Điều kiện |
|------|--------|--------|-----------|
| `/meta/` | Tất cả (auth) | Host tạo; Guest chỉ ghi guestId + guest info | `auth != null` |
| `/state/` | Tất cả (auth) | Chỉ host | `meta.hostId === auth.uid` |
| `/commands/{cmdId}` | Tất cả (auth) | Player tương ứng | `newData.playerId` match auth |
| `/presence/{uid}` | Tất cả | Chỉ owner | `auth.uid === $uid` |

### 3.10 UI — Lobby & Waiting Room

**Lobby Screen:**
```
┌─────────────────────────────────────────────────┐
│              MYSTIC SHOT — Online                │
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │  Your Profile                         │      │
│  │  Name: [___________]                  │      │
│  │  Color: ● ● ● ● ● ●                 │      │
│  │  Skin:  [◀] Classic [▶]              │      │
│  └────────────────────────────────────────┘      │
│                                                  │
│  ┌───────────────────┐ ┌───────────────────┐    │
│  │   CREATE ROOM     │ │   JOIN ROOM       │    │
│  │ Difficulty:       │ │ Room Code:        │    │
│  │ [Easy][Med][Hard] │ │ [_ _ _ _ _ _]    │    │
│  │ Map: [◀]Random[▶] │ │                   │    │
│  │ [CREATE]          │ │ [JOIN]            │    │
│  └───────────────────┘ └───────────────────┘    │
│                                                  │
│  ← Back to Main Menu                            │
└─────────────────────────────────────────────────┘
```

**Waiting Room** (sau create/join):
```
┌─────────────────────────────────────────┐
│                                         │
│   Room Code: A 3 F 7 K 2  [COPY]       │
│                                         │
│   Host            VS       Guest        │
│   "TruongNBN"              "Guest42"    │
│   ● Cyan                   ● Pink       │
│   Skin: Neon               Skin: Pixel  │
│                                         │
│   Difficulty: Medium  │  Map: Arena     │
│                                         │
│   [CANCEL]                [START GAME]  │
│   (Start chỉ enable khi guest đã join)  │
└─────────────────────────────────────────┘
```

### 3.11 App flow mở rộng

```
Phase 1 (hiện tại):
  MenuScreen → Game → GameOver

Phase 2:
  MainMenu
    ├── "Local Play"  → MenuScreen (giữ nguyên) → Game → GameOver
    └── "Online Play" → LobbyScreen
                          ├── Create Room → WaitingRoom → Game → GameOver
                          └── Join Room  → WaitingRoom → Game → GameOver
```

`MainMenu`: màn hình đơn giản — logo, 2 nút Local/Online.

### 3.12 Cấu trúc thư mục

```
src/network/
├── firebase.ts                 # Firebase config + khởi tạo app/db/auth
├── InputAdapter.ts             # Interface InputAdapter
├── LocalInputAdapter.ts        # Local play (giữ logic Phase 1)
├── FirebaseInputAdapter.ts     # Online play (command forwarding)
├── RoomManager.ts              # Room CRUD: create, join, start, leave
├── PresenceManager.ts          # Connection tracking + reconnection
└── index.ts
```

### 3.13 Danh sách file ảnh hưởng

| File | Loại | Nội dung thay đổi |
|------|------|-------------------|
| `src/network/*` | **Mới** | Toàn bộ network layer |
| `src/ui/MainMenu.tsx` | **Mới** | Chọn Local / Online |
| `src/ui/LobbyScreen.tsx` | **Mới** | Tạo/join room |
| `src/ui/WaitingRoom.tsx` | **Mới** | Chờ opponent + start |
| `firebase.ts` (root) | **Mới** | Firebase project config |
| `ui/App.tsx` | Sửa | Thêm MainMenu flow |
| `ui/useGameEngine.ts` | Sửa | Nhận InputAdapter |
| `ui/ControlFooter.tsx` | Sửa | Disable khi không phải lượt (online) |
| `ui/HudHeader.tsx` | Sửa | "Waiting for opponent..." indicator |
| `core/TurnManager.ts` | Sửa | Server timestamp sync |
| `i18n/locales/*.json` | Sửa | Thêm keys `lobby.*`, `online.*` |

---

## 4. P2c — Preset Maps

### 4.1 Phạm vi

Cung cấp **7 map thiết kế sẵn** ngoài mode random hiện tại. Mỗi map = tập cố định spawn points, obstacles, power-ups dưới dạng JSON.

**Chưa bao gồm**: Map Editor (Phase 3).

### 4.2 Cấu trúc dữ liệu Map

```
PresetMap
├── id: string                    # "arena", "maze", ...
├── nameKey: string               # i18n key
├── descriptionKey: string        # i18n mô tả ngắn
├── player1Spawn: Position
├── player2Spawn: Position
├── obstacles[]
│   ├── type: ObstacleType
│   ├── position: Position
│   ├── width, height: number
├── powerUps[]
│   ├── type: PowerUpType
│   └── position: Position
├── suggestedDifficulty?: Difficulty
└── tags?: string[]               # "competitive", "fun", "maze", "open"
```

Map data = **JSON files** bundle cùng app (tĩnh, import trực tiếp).

### 4.3 Danh sách map

| ID | Tên | Concept | Obstacles | Power-ups | Đặc điểm |
|----|-----|---------|-----------|-----------|-----------|
| `random` | Random | MapGenerator Phase 1 | 3–6 random | 2–4 random | Mặc định |
| `arena` | Arena | Sân mở | 2 hard (đối xứng) | 3 (giữa) | Skill-based, tầm nhìn rộng |
| `fortress` | Fortress | Pháo đài 2 bên | 6 hard (bao quanh) | 2 (giữa) | Phòng thủ, cần hàm vòng qua |
| `maze` | Maze | Đường đi phức tạp | 6 mix | 4 (rải rác) | Chiến thuật dùng soft obstacle |
| `sniper` | Sniper Alley | Hành lang hẹp | 4 hard (tạo lane) | 2 (trong lane) | Precision shot |
| `mirror` | Mirror | Đối xứng qua trục Y | 4 đối xứng | 4 đối xứng | Công bằng tuyệt đối |
| `chaos` | Chaos | Soft + buff nhiều | 6 soft | 4 | Phá hủy liên tục, nhiều buff |
| `duel` | Duel | Không vật cản | 0 | 2 (giữa) | Pure math skill |

### 4.4 Validation

Mỗi preset map phải đảm bảo:
- Spawn nằm trong biên map `[-20,20] × [-15,15]`
- Khoảng cách 2 spawn ≥ 10 đơn vị
- Obstacles không overlap nhau và spawn points (padding ≥ 1)
- Power-ups không overlap obstacles và spawn points
- Validation chạy lúc build hoặc test (không runtime)

### 4.5 Integration

- `MapGenerator.generate()` → giữ nguyên (random)
- `MapGenerator.fromPreset(map)` → **mới**: convert PresetMap thành game data format

Menu/Lobby thêm **MapPicker** carousel:
```
Map: [◀] Random [▶]
     "Random obstacles and power-ups each match"
```

### 4.6 Cấu trúc thư mục

```
src/maps/
├── types.ts                # Interface PresetMap
├── MapStorage.ts           # Load preset by ID
├── MapValidator.ts         # Validate map integrity
├── presets/
│   ├── arena.json
│   ├── fortress.json
│   ├── maze.json
│   ├── sniper.json
│   ├── mirror.json
│   ├── chaos.json
│   └── duel.json
└── index.ts
```

### 4.7 Danh sách file ảnh hưởng

| File | Loại | Nội dung thay đổi |
|------|------|-------------------|
| `src/maps/*` | **Mới** | Map system + preset JSON |
| `src/ui/MapPicker.tsx` | **Mới** | Component chọn map carousel |
| `utils/MapGenerator.ts` | Sửa | Thêm `fromPreset()` |
| `ui/MenuScreen.tsx` | Sửa | Tích hợp MapPicker |
| `i18n/locales/*.json` | Sửa | Thêm keys `map.*` |

---

## 5. P2d — Trajectory Preview

### 5.1 Phạm vi

Hiển thị **đường cong dự kiến** (preview) trên Phaser canvas khi player nhập hàm số hợp lệ. Cho phép player thấy trước quỹ đạo đạn/đường di chuyển trước khi xác nhận Fire/Move.

**Mục tiêu UX**: Giảm "bắn mò" — player thấy trực quan hàm số sẽ tạo đường bay thế nào → quyết định chính xác hơn → game vui hơn.

### 5.2 Hành vi

| Trạng thái | Preview hiển thị | Trigger |
|------------|-----------------|--------|
| Input rỗng hoặc invalid | Không hiển thị | — |
| Input hợp lệ (validate pass) | Hiển thị đường cong preview trên canvas | Sau debounce ~200ms kể từ lần gõ cuối |
| User bấm Fire/Move | Preview biến mất → animation đạn/di chuyển thật chạy | Ngay lập tức |
| User thay đổi expression | Preview cũ xoá → vẽ preview mới | Debounce ~200ms |
| Chuyển lượt | Preview xoá sạch | Ngay lập tức |

### 5.3 Visual

```
                    Y
                    │
              ●P1   │   ·····················
                    │  ·                    ·
  ──────────────────┼──·─────────────────────·── X
                    │                        ·
                    │                         ● P2
```

**Đặc điểm visual:**

| Thuộc tính | Giá trị |
|------------|--------|
| Kiểu nét | **Dashed line** (nét đứt) — phân biệt rõ với đường đạn thật |
| Màu sắc | Cùng **màu player** hiện tại, alpha thấp (~0.4) |
| Độ dày | 1.5px |
| Phạm vi | Từ vị trí player → biên map (Fire) hoặc đến arc length limit (Move) |
| Depth/Z-order | Dưới entities (players, obstacles, power-ups), trên grid |
| Điểm kết thúc | Đánh dấu nhỏ (dot hoặc crosshair) tại điểm cuối quỹ đạo |

**Preview cho Move vs Fire:**

| Chế độ | Phạm vi preview | Điểm kết thúc |
|--------|----------------|---------------|
| Fire | Từ player → biên map theo direction đã chọn | Nơi đạn ra khỏi map hoặc chạm vật cản/player |
| Move | Từ player → đến khi arc length = 5 hoặc chạm biên | Vị trí player sẽ dừng (highlight rõ hơn) |

### 5.4 Data flow

```
FormulaInput (React)
  │ User gõ expression → validate ok
  │ Debounce 200ms
  ▼
useGameEngine / preview handler
  │ FunctionParser.createTranslatedEvaluator(expression, playerPos)
  │ GraphRenderer.generatePoints(evaluator, direction, bounds)
  ▼
GameState.emit(PreviewUpdate, { points, mode })
  ▼
GameScene
  │ Nhận PreviewUpdate event
  │ Vẽ dashed line trên Phaser Graphics layer (depth thấp)
  │ Xoá preview cũ trước khi vẽ mới
  ▼
Phaser canvas hiển thị preview
```

**Clear preview khi:**
- Expression thay đổi (vẽ lại)
- Expression invalid hoặc rỗng (xoá)
- Bấm Fire/Move (xoá → chạy animation thật)
- Chuyển lượt (xoá)

### 5.5 Giao tiếp React → Phaser

Thêm event mới trong `GameEventMap`:

```
GameEvent.PreviewUpdate → { points: Position[], mode: 'fire' | 'move' } | null
```

- `points` = mảng tọa độ game (chưa convert screen) do `GraphRenderer.generatePoints()` trả về
- `null` = xoá preview
- `mode` = phân biệt fire preview (full range) vs move preview (arc length limited)

### 5.6 Collision indication (tùy chọn)

Preview **có thể** hiển thị thêm thông tin collision dự kiến:

| Indicator | Visual | Chi tiết |
|-----------|--------|----------|
| Hit player | Đổi màu trail thành đỏ/xanh tại vùng hitbox | Tính `distance(point, opponent) ≤ 0.5` |
| Hit obstacle | Điểm dừng đánh dấu × (cross) | Preview dừng tại vật cản |
| Collect power-up | Nhấp nháy nhẹ power-up icon trên map | Đường đi qua power-up |

**Lưu ý**: Collision indication chạy **logic giống CollisionSystem.trace()** nhưng **không thay đổi state** — chỉ dùng để vẽ. Có thể tái sử dụng `CollisionSystem.trace()` ở chế độ "dry run" (không emit events, không mutate state).

### 5.7 Performance

- **Debounce 200ms**: Không render preview mỗi keystroke mà đợi user ngừng gõ
- **Giới hạn sampling**: Preview dùng step lớn hơn đạn thật (ví dụ Δx=0.2 thay vì 0.05) → ít điểm hơn, vẽ nhanh hơn
- **Single Graphics object**: Dùng 1 `Phaser.GameObjects.Graphics` tái sử dụng, `clear()` + vẽ lại — không tạo/huỷ object mỗi lần
- **Skip khi animating**: Không hiển thị preview trong lúc đạn đang bay (animating = true)

### 5.8 Danh sách file ảnh hưởng

| File | Loại | Nội dung thay đổi |
|------|------|-------------------|
| `core/GameState.ts` | Sửa | Thêm event `PreviewUpdate` vào `GameEventMap` |
| `math/GraphRenderer.ts` | Sửa | Thêm `generatePoints()` — sample points cho preview (step lớn hơn) |
| `scenes/GameScene.ts` | Sửa | Subscribe `PreviewUpdate`, vẽ/xoá dashed line trên Graphics layer |
| `ui/useGameEngine.ts` | Sửa | Thêm `handlePreview()` — tính points + emit event |
| `ui/ControlFooter.tsx` | Sửa | Gọi `handlePreview()` khi expression thay đổi (debounce) |

---

## 6. P2e — Keyboard Shortcuts

### 6.1 Phạm vi

Bổ sung **phím tắt bàn phím** cho các hành động gameplay chính, cho phép player điều khiển hoàn toàn bằng bàn phím mà không cần click chuột vào buttons.

**Mục tiêu UX**: Tăng tốc thao tác — player chỉ cần gõ công thức → nhấn phím → hành động, không rời tay khỏi bàn phím.

### 6.2 Phân tích hiện trạng

**Input handling hiện tại:**

| Hành động | Cách thao tác | Keyboard? |
|-----------|--------------|----------|
| Gõ công thức | FormulaInput (autoFocus mỗi lượt) | ✅ Có sẵn |
| Fire | Click nút FIRE, hoặc Enter trong FormulaInput | ✅ Enter (đã có) |
| Move | Click nút MOVE | ❌ Chỉ chuột |
| Đổi hướng | Click nút ◀/▶ toggle | ❌ Chỉ chuột |

**Ràng buộc:**
- `FormulaInput` luôn giữ focus trong gameplay (autoFocus + remount mỗi lượt)
- Biểu thức toán dùng các ký tự: `0-9`, `x`, `+`, `-`, `*`, `/`, `^`, `(`, `)`, `.`, chữ cái (`sin`, `cos`, `tan`, `log`, `sqrt`, `abs`) → các phím này **không thể dùng** làm shortcut
- Cần phím **không xung đột** với việc gõ công thức

### 6.3 Key Bindings

| Phím | Hành động | Điều kiện | Ghi chú |
|------|-----------|-----------|--------|
| `Enter` | **Fire** | Formula valid, không đang animating | Giữ nguyên (đã có sẵn) |
| `Shift+Enter` | **Move** | Formula valid, còn move charges, không đang animating | Variant tự nhiên của Enter |
| `Tab` | **Đổi hướng** (◀ ↔ ▶) | Đang trong lượt, không đang animating | `preventDefault` để không nhảy focus |

**Lý do chọn phím:**

| Phím | Lý do | Phương án đã loại bỏ |
|------|-------|---------------------|
| `Shift+Enter` cho Move | Cùng nhóm "submit" với Enter (Fire), dễ nhớ: Enter=bắn, Shift+Enter=di chuyển | `Ctrl+Enter` (xung đột browser), `Space` (có thể nằm trong formula) |
| `Tab` cho Direction | Không gõ ký tự vào input, metaphor "switch/toggle" tự nhiên, một ngón tay dễ bấm | `Alt+←/→` (arrow di chuyển cursor trong input), `~` (xa tay), `Ctrl+D` (xung đột bookmark) |

### 6.4 Hành vi chi tiết

#### Enter → Fire

```
User nhấn Enter trong FormulaInput
  │
  ├─ Formula invalid hoặc rỗng → Không làm gì
  ├─ Đang animating → Không làm gì
  └─ Formula valid → Gọi onFire(expression, direction) → Bắn đạn
```

*(Giữ nguyên logic hiện tại trong FormulaInput.handleKeyDown)*

#### Shift+Enter → Move

```
User nhấn Shift+Enter trong FormulaInput
  │
  ├─ Formula invalid → Không làm gì
  ├─ Đang animating → Không làm gì
  ├─ Hết move charges → Không làm gì
  └─ Formula valid + còn charges → Gọi onMove(expression, direction) → Di chuyển
```

#### Tab → Direction Toggle

```
User nhấn Tab
  │
  ├─ preventDefault() → Chặn browser chuyển focus
  ├─ Đang animating → Không làm gì
  └─ Bình thường → Đổi direction (1 ↔ -1)
      └─ Trigger preview update (nếu formula đang valid)
```

### 6.5 Chiến lược implementation

Xử lý **tất cả hotkeys trong `FormulaInput.handleKeyDown`** thay vì global listener:

**Lý do:**
- FormulaInput luôn nhận focus trong gameplay → mọi keypress đều đi qua đây
- Handler `onKeyDown` đã có sẵn (xử lý Enter) → chỉ cần mở rộng
- Không cần thêm/cleanup global event listener → đơn giản hơn, không risk memory leak
- Khi game kết thúc (GameOver) → FormulaInput unmount → tự động vô hiệu hoá shortcuts

**Callbacks mới truyền vào FormulaInput:**

| Prop hiện tại | Prop mới | Mục đích |
|-------------|---------|----------|
| `onSubmit` → Fire | *(giữ nguyên)* | Enter → Fire |
| — | `onMove` | Shift+Enter → Move |
| — | `onDirectionToggle` | Tab → Đổi hướng |

### 6.6 UI Feedback

Hiển thị **tooltip/hint phím tắt** trên buttons:

```
┌──────────────────────────────────────────────────────────────┐
│  P1 · 2 moves │ [f(x)=___________] [◀ Tab] [↗ Shift+Enter] [🔥 Enter]  │
└──────────────────────────────────────────────────────────────┘
```

- Nút Fire: hiển thị "Enter" nhỏ phía dưới hoặc tooltip
- Nút Move: hiển thị "Shift+Enter" nhỏ phía dưới hoặc tooltip
- Nút Direction: hiển thị "Tab" nhỏ phía dưới hoặc tooltip
- Hint chỉ hiện trên **desktop** (detect `hover` media query) — mobile không cần

### 6.7 Guard conditions

Để tránh hành vi ngoài ý muốn:

| Tình huống | Xử lý |
|------------|--------|
| Modal đang mở (How to Play guide) | Escape đóng modal → hotkeys không ảnh hưởng (FormulaInput bị che) |
| Đang animating (đạn đang bay) | Tất cả hotkeys bị ignore (`disabled` prop truyền vào FormulaInput) |
| GameOver | FormulaInput unmount → hotkeys tự vô hiệu |
| Online play — không phải lượt mình | `disabled=true` trên ControlFooter → FormulaInput disabled → keyDown không fire |

### 6.8 Danh sách file ảnh hưởng

| File | Loại | Nội dung thay đổi |
|------|------|-------------------|
| `ui/FormulaInput.tsx` | Sửa | Mở rộng `handleKeyDown`: thêm Shift+Enter (Move) + Tab (Direction) |
| `ui/ControlFooter.tsx` | Sửa | Truyền `onMove`, `onDirectionToggle` callbacks vào FormulaInput; thêm keyboard hints trên buttons |
| `i18n/locales/*.json` | Sửa | Thêm keys cho keyboard hint labels (nếu cần i18n) |

---

## 7. Tổng kết

### 7.1 Dependencies mới

| Package | Phase | Mục đích |
|---------|-------|---------|
| `firebase` ^11.x | P2b | Realtime DB + Anonymous Auth |

### 7.2 Tổng hợp file changes

| Phase | Files mới | Files sửa |
|-------|-----------|-----------|
| P2a — Skin | ~10 (`skins/*`, `SkinPicker.tsx`) | ~9 (entities, scenes, UI, i18n) |
| P2b — Online | ~8 (`network/*`, lobby/waiting UI, firebase config) | ~6 (App, useGameEngine, ControlFooter, HudHeader, TurnManager, i18n) |
| P2c — Maps | ~10 (`maps/*`, presets, `MapPicker.tsx`) | ~3 (MapGenerator, MenuScreen, i18n) |
| P2d — Preview | 0 | ~5 (GameState, GraphRenderer, GameScene, useGameEngine, ControlFooter) |
| P2e — Keyboard | 0 | ~3 (FormulaInput, ControlFooter, i18n) |

### 7.3 Đánh giá rủi ro

| Rủi ro | Mức độ | Phòng tránh |
|--------|--------|-------------|
| Firebase latency bất thường | Thấp | Turn-based chấp nhận được; state fallback |
| Desync 2 client | Thấp | Deterministic execution + host state backup |
| Skin rendering chậm | Thấp | Particle emitter giới hạn; chỉ 1 projectile/lần |
| Firebase vượt free tier | Rất thấp | 100K connections/month thừa cho indie |
| Preset map mất cân bằng | Trung bình | Playtest + phản hồi |
| Preview lag khi hàm phức tạp | Thấp | Debounce 200ms + sampling step lớn hơn (Δx=0.2) |
| Tab bị browser chặn | Rất thấp | preventDefault() trong handler; chỉ ảnh hưởng khi FormulaInput focused |

### 7.4 Hướng phát triển Phase 3+

- **Map Editor**: Drag-and-drop → export/import JSON → share online
- **Account system**: Firebase Email/Google Auth → lưu progress, stats, skin collection
- **Ranked matchmaking**: ELO-based, random opponent
- **Spectator mode**: Xem live game qua room code
- **Replay system**: Phát lại từ command log
- **Community skins**: User-created, seasonal events
