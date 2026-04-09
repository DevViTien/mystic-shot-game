---
description: "Use when editing skin system, SkinRegistry, skin presets, renderers (PlayerShape, TrailStyle, PowerUpTheme). Covers skin types, visual-only constraint, renderer patterns."
applyTo: "src/skins/**"
---
# Skins Module — Quy Tắc Chi Tiết

## Nguyên Tắc Cốt Lõi

Skin chỉ thay đổi **visual** — không ảnh hưởng gameplay (hitbox, damage, speed giữ nguyên).

## Types (`types.ts`)

| Interface | Thuộc tính chính |
|-----------|------------------|
| `SkinSet` | id, nameKey, player, trail, powerUp |
| `PlayerSkin` | shape, glowEffect, pulseAnimation |
| `TrailSkin` | style, widthMultiplier, fadeSpeed, particleEmitter |
| `PowerUpSkin` | theme |

## SkinRegistry (`SkinRegistry.ts`)

Singleton registry — `get(id)`, `getAll()`, `getDefault()`.

## 5 Presets

| Skin | Shape | Trail | Theme | Ghi chú |
|------|-------|-------|-------|---------|
| `classic` | Circle | Solid | Classic | **Default** |
| `neon` | Circle + glow | Neon | Tech | Glow effect |
| `geometric` | Hexagon | Solid (1.3× width) | Classic | |
| `starlight` | Star + pulse | Sparkle | Magical | Pulse animation |
| `pixel` | Diamond | Solid (1.2× fade) | Pixel | |

## 3 Renderers

### PlayerShapeRenderer
- 4 shapes: `circle`, `star`, `diamond`, `hexagon`
- Optional: `glowEffect`, `pulseAnimation`
- Nhận `PlayerSkin` object + player color

### TrailStyleRenderer
- 6 styles: `solid`, `neon`, `rainbow`, `fire`, `ice`, `sparkle`
- Tham số: `widthMultiplier`, `fadeSpeed`, `particleEmitter`
- Nhận `TrailSkin` object + player color

### PowerUpThemeRenderer
- 4 themes: `classic`, `pixel`, `magical`, `tech`
- Register themed `CanvasTexture` per theme
- Dùng `getThemedPowerUpIconKey(type, theme)` cho icon key

## Data Flow

```
MenuScreen → MenuResult.playerX.skinId
  → useGameEngine → gameState.init(skinId) + Phaser registry
    → GameScene.create() → SkinRegistry.get(skinId)
      → Entity constructors nhận skin objects
        → delegate rendering sang skins/renderers/
```
