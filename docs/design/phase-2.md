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

**Thứ tự triển khai**: P2a → P2b → P2c (tuần tự), P2d + P2e (độc lập, làm song song)

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

## 9. Dependencies mới (Phase 2)

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
- **Replay system**: Phát lại từ command log
- **Sound effects**: Bắn, hit, nhặt power-up
- **Particle effects**: Explosion, hit markers
- **Community skins**: User-created, seasonal events
