---
description: "Use when editing Phaser scenes, game entities (Player, Obstacle, PowerUp, Projectile), coordinate rendering, animation, tooltip system. Covers worldToScreen conversion, entity lifecycle, skin rendering delegation."
applyTo: "src/scenes/**, src/entities/**"
---
# Phaser Module — Quy Tắc Chi Tiết

## Hệ Tọa Độ

- **Game coords** (toán): gốc giữa, y hướng lên, X[-25,25] Y[-18,18]
- **Screen coords** (Phaser): gốc top-left, y hướng xuống
- Dùng `worldToScreen(x, y)` — **module-level function** trong GameScene (không phải method)
- Phaser canvas: 1200×864, BG=0x1a1a2e, Grid=0x333355, Axis=0x6666aa

## Scenes

| Scene | Vai trò |
|-------|---------|
| `MenuScene` | Blank idle — React overlay thay thế hoàn toàn |
| `GameScene` | Scene gameplay chính (xem chi tiết bên dưới) |
| `GameOverScene` | Blank idle — React GameOverOverlay thay thế |

### GameScene Chi Tiết

1. Load skin từ `SkinRegistry.get(skinId)` (lấy từ Phaser registry)
2. Register themed power-up icons qua `PowerUpThemeRenderer`
3. Render lưới tọa độ + trục X/Y (grid + axes)
4. Tạo entities từ `GameState` snapshot, truyền skin config
5. Subscribe: `StateChanged`, `FireComplete`, `PreviewUpdate`
6. Preview system: dashed line hiển thị quỹ đạo dự kiến
7. Tooltip system: interactive zones cho players/obstacles/power-ups — hover hiển thị info (i18n `tooltip.*` keys)

## Entities

### Player (`Player.ts`)
- Hitbox r=0.5 (game coords)
- Delegate hình dạng cho `PlayerShapeRenderer` — nhận `PlayerSkin`
- Shapes: circle, star, diamond, hexagon + glow/pulse effects

### Obstacle (`Obstacle.ts`)
- Hình chữ nhật — **cứng**: tô đặc / **mềm**: viền nét đứt, fill mờ

### PowerUp (`PowerUp.ts`)
- Icon entity với themed texture background
- Dùng `getThemedPowerUpIconKey(type, theme)` cho icon
- Theme background colors per `PowerUpThemeRenderer`

### Projectile (`Projectile.ts`)
- Animated orb + trail — delegate style cho `TrailStyleRenderer` (nhận `TrailSkin`)
- Constants: `POINTS_PER_FRAME=12`, `TAIL_LENGTH=30`, `ORB_RADIUS=5`
- `animate(onComplete)` — chạy trên scene `'update'` event
- Fade out tween khi kết thúc → emit `FireAnimationDone`

## Animation Flow

```
FireCommand.execute() → emit FireComplete (trajectory + collectedPowerUps)
  → GameScene tạo Projectile → animate (TrailStyleRenderer theo skin)
    → animation xong → emit FireAnimationDone
      → useGameEngine resume timer / endTurn
```

## Phaser Colors (config.ts)

| Key | Hex | Dùng |
|-----|-----|------|
| BG | 0x1a1a2e | Canvas background |
| Grid | 0x333355 | Grid lines |
| Axis | 0x6666aa | X/Y axes |
| P1 | 0x00ccff | Player 1 |
| P2 | 0xff4466 | Player 2 |
