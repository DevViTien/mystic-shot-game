# Skin System

## 1. Phạm vi

Skin thay đổi **visual only** — không ảnh hưởng gameplay (hitbox, damage, speed giữ nguyên).

3 thành phần visual:

| Thành phần | Không có skin | Có skin |
|------------|---------------|---------|
| **Player marker** | Circle, màu đơn sắc | 4 shapes + glow/pulse |
| **Đường đạn** | Gradient tail + glow orb | 6 trail styles |
| **Power-up icon** | CanvasTexture, nền vàng | 4 themes với màu nền riêng |

---

## 2. Cấu trúc dữ liệu

```
SkinSet
├── id: string                    # "classic", "neon", ...
├── nameKey: string               # i18n key
├── player: PlayerSkin
│   ├── shape: PlayerShape        # circle | star | diamond | hexagon
│   ├── glowEffect: boolean
│   └── pulseAnimation: boolean
├── trail: TrailSkin
│   ├── style: TrailStyle         # solid | sparkle | rainbow | fire | ice | neon
│   ├── particleEmitter: boolean
│   ├── widthMultiplier: number   # 0.5–2.0
│   └── fadeSpeed: number         # 0.5–2.0
└── powerUp: PowerUpSkin
    └── theme: PowerUpTheme       # classic | pixel | magical | tech
```

---

## 3. Built-in Skins (5)

| ID | Player | Trail | Power-up | Phong cách |
|----|--------|-------|----------|------------|
| `classic` | Circle | Solid gradient | Classic (vàng + đen) | Mặc định |
| `neon` | Circle + Glow | Neon (alpha cao) | Tech (xanh neon) | Cyberpunk |
| `geometric` | Hexagon | Solid (dày hơn) | Classic | Hình học |
| `starlight` | Star + Pulse | Sparkle (particle dots) | Magical (tím) | Ma thuật |
| `pixel` | Diamond | Solid (blocky) | Pixel (8-bit) | Retro |

---

## 4. Renderers

### 4.1 PlayerShapeRenderer

Vẽ player shape lên `Phaser.GameObjects.Graphics`.

**4 shapes**:

| Shape | Phương pháp | Ghi chú |
|-------|-------------|---------|
| `circle` | `fillCircle()` | Giữ nguyên Phase 1 |
| `star` | Polygon 10 điểm (5 outer + 5 inner) | Inner radius ≈ 45% outer |
| `diamond` | Polygon 4 điểm | Hình vuông xoay 45° |
| `hexagon` | Polygon 6 điểm đều | Flat-top orientation |

**Hiệu ứng**:
- `glowEffect`: Circle mờ (alpha 0.15) bán kính ×2, vẽ phía sau shape
- `pulseAnimation`: Phaser tween `scaleX/scaleY` 0.95–1.05, yoyo, infinite

**API**: `draw(graphics, position, radius, skin, color)` + `setupPulse(scene, graphics, skin)`

### 4.2 TrailStyleRenderer

Vẽ projectile trail + orb trên 2 Graphics layers (trail depth 500, orb depth 501).

**6 styles**:

| Style | Visual | Kỹ thuật |
|-------|--------|---------|
| `solid` | Gradient tail mờ dần + 3-layer glow orb | Phase 1 original |
| `neon` | Như solid, alpha cao hơn, width ×1.5 | Glow radius +50% |
| `rainbow` | Trail đổi màu (cycle hue) | HSL color per segment |
| `fire` | Gradient orange→red | Color lerp |
| `ice` | Gradient blue→white | Color lerp |
| `sparkle` | Solid + particle dots mỗi 4 points | Deterministic offset ±3px |

**Orb rendering**: 3 circle layers (outer glow 0.15 → mid glow 0.35 → white core 0.9). Neon style: glow radius ×1.5.

**API**: `drawFrame(trail, orb, trajectory, index, skin, color)` + `drawStatic(trail, trajectory, color)`

### 4.3 PowerUpThemeRenderer

Đăng ký `CanvasTexture` per theme trong Phaser scene.

**4 themes**:

| Theme | Background | Stroke | Cảm giác |
|-------|-----------|--------|----------|
| `classic` | `#ffcc00` | Đen 2px, round cap | Lucide icons gốc |
| `pixel` | `#44ff66` | Đen 3px, square cap | 8-bit blocky |
| `magical` | `#aa66ff` | Trắng 2px, round cap | Thanh lịch |
| `tech` | `#00ccff` | Trắng 1.5px, butt cap | Geometric |

**Texture key**: `powerup_{theme}_{type}` (ví dụ `powerup_pixel_shield`)

**Icon drawing**: 5 `DrawFn` functions (SVG-path-like canvas operations) shared across all themes — chỉ stroke/fill style khác nhau.

**API**: `registerThemedPowerUpIcons(scene, theme)` + `getThemedPowerUpIconKey(theme, type)` + `getThemeBgColor(theme)` + `getThemeBgAlpha(theme)`

---

## 5. SkinRegistry

Singleton quản lý skins:

- `get(id)` → SkinSet (fallback → classic)
- `getAll()` → SkinSet[]
- `getDefault()` → classic

Đăng ký tất cả built-in skins khi module load. Mở rộng: thêm skin từ server hoặc user-created sau.

---

## 6. Data Flow

```
MenuScreen (user chọn skin)
  │ skinId lưu vào MenuResult per player
  ▼
useGameEngine.handleMenuStart()
  │ skinId → Phaser registry ('p1Skin', 'p2Skin')
  │ skinId → GameState.init() → PlayerState.skinId
  ▼
GameScene.create()
  │ Đọc skinId từ registry → SkinRegistry.get(skinId) → SkinSet
  │ registerThemedPowerUpIcons(scene, skinSet.powerUp.theme)
  │ Truyền skin cho entity constructors
  ▼
Entity rendering
  │ Player      → PlayerShapeRenderer.draw(skin.player)
  │ Projectile  → TrailStyleRenderer.drawFrame(skin.trail)
  │ PowerUp     → getThemedPowerUpIconKey(skin.powerUp.theme, type)
```

---

## 7. Cấu trúc thư mục

```
src/skins/
├── types.ts                    # SkinSet, PlayerSkin, TrailSkin, PowerUpSkin
├── SkinRegistry.ts             # Singleton registry
├── presets/
│   ├── classic.ts
│   ├── neon.ts
│   ├── geometric.ts
│   ├── starlight.ts
│   └── pixel.ts
├── renderers/
│   ├── PlayerShapeRenderer.ts  # 4 shapes + glow/pulse
│   ├── TrailStyleRenderer.ts   # 6 trail styles + orb
│   └── PowerUpThemeRenderer.ts # 4 themes, CanvasTexture
└── index.ts                    # Barrel export
```
