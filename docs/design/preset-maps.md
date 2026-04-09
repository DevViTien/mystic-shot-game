# Preset Maps

## 1. Phạm vi

7 map thiết kế sẵn ngoài mode random. Mỗi map = tập cố định spawn points, obstacles, power-ups dưới dạng **JSON** bundle cùng app.

---

## 2. Cấu trúc dữ liệu

```
PresetMap
├── id: string                    # "arena", "maze", ...
├── nameKey: string               # i18n key
├── descriptionKey: string        # i18n mô tả ngắn
├── player1Spawn: { x, y }
├── player2Spawn: { x, y }
├── obstacles[]
│   ├── type: ObstacleType        # Hard | Soft
│   ├── position: { x, y }
│   └── width, height: number
├── powerUps[]
│   ├── type: PowerUpType
│   └── position: { x, y }
├── suggestedDifficulty?: Difficulty
└── tags?: string[]               # "competitive", "fun", "maze", "open"
```

---

## 3. Danh sách map

| ID | Tên | Concept | Obstacles | Power-ups | Đặc điểm |
|----|-----|---------|-----------|-----------|-----------|
| `arena` | Arena | Sân mở | 2 hard (đối xứng) | 3 (giữa) | Skill-based, tầm nhìn rộng |
| `fortress` | Fortress | Pháo đài 2 bên | 6 hard (bao quanh) | 2 (giữa) | Phòng thủ, cần hàm vòng qua |
| `maze` | Maze | Đường đi phức tạp | 6 mix (hard + soft) | 4 (rải rác) | Chiến thuật, soft obstacle |
| `sniper` | Sniper Alley | Hành lang hẹp | 4 hard (tạo lane) | 2 (trong lane) | Precision shot |
| `mirror` | Mirror | Đối xứng Y | 4 đối xứng | 4 đối xứng | Công bằng tuyệt đối |
| `chaos` | Chaos | All soft + buff | 6 soft | 4 | Phá hủy liên tục |
| `duel` | Duel | Không vật cản | 0 | 2 (giữa) | Pure math skill |

**Random** (default): `MapGenerator.generate()` — 5–10 obstacles + 3–6 power-ups.

---

## 4. Validation

Mỗi preset map phải đảm bảo (kiểm tra bởi `MapValidator`):

| Rule | Điều kiện |
|------|-----------|
| Spawn trong biên | `[-25,25] × [-18,18]` |
| Khoảng cách spawn | ≥ 10 đơn vị |
| Obstacles không overlap | Nhau và spawn points (padding ≥ 1) |
| Power-ups không overlap | Obstacles và spawn points |

Validation chạy lúc **build/test**, không runtime.

---

## 5. Integration

### MapGenerator

- `generate()` → random map (giữ nguyên Phase 1)
- `fromPreset(preset)` → convert `PresetMap` → `MapData`:
  - Assign unique IDs (`obs_0`, `pu_0`, ...)
  - Initialize runtime fields (`destroyed: false`, `collected: false`)
  - Copy positions (immutable source)

### MapStorage

- Import tất cả JSON tĩnh
- `get(id)` → `PresetMap | undefined`
- `getAll()` → `PresetMap[]`

### UI — MapPicker

Carousel trong MenuScreen/LobbyScreen:
- Random option (default) + 7 presets
- Mini preview canvas: vẽ thu nhỏ obstacles + spawn points
- Tên + mô tả ngắn (i18n keys `map.{id}.name`, `map.{id}.description`)

### useGameEngine

```
handleMenuStart(config):
  mapId = config.mapId
  preset = mapId && mapId !== 'random' ? MapStorage.get(mapId) : undefined
  map = preset ? MapGenerator.fromPreset(preset) : MapGenerator.generate()
  gameState.init({ obstacles: map.obstacles, powerUps: map.powerUps, ... })
```

---

## 6. Cấu trúc thư mục

```
src/maps/
├── types.ts             # PresetMap, PresetMapObstacle, PresetMapPowerUp
├── MapStorage.ts        # Load all presets, get(id), getAll()
├── MapValidator.ts      # Build-time validation
├── presets/
│   ├── arena.json
│   ├── fortress.json
│   ├── maze.json
│   ├── sniper.json
│   ├── mirror.json
│   ├── chaos.json
│   └── duel.json
└── index.ts             # Barrel export
```
