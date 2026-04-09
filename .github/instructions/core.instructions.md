---
description: "Use when editing GameState, EventEmitter, TurnManager, CollisionSystem, Commands, CommandQueue. Covers state mutation rules, event contracts, command pattern, batch mechanics, turn phases."
applyTo: "src/core/**"
---
# Core Module — Quy Tắc Chi Tiết

## GameState (`GameState.ts`)

Quản lý toàn bộ state: players, obstacles, buffs, phase, winner.

### Types & Interfaces
- `Position { x, y }`, `PlayerState` (bao gồm `skinId`), `ActiveBuff`, `ObstacleState`, `PowerUpState`
- `GameStateSnapshot` — serializable snapshot (dùng cho online guest init)
- `PreviewData` — trajectory preview points
- `GameEventMap` — typed event signatures cho tất cả `GameEvent`

### Enum `GameEvent` (11 events)
`StateChanged`, `PlayerHit`, `PlayerMoved`, `TurnChanged`, `PhaseChanged`, `ObstacleDestroyed`, `PowerUpCollected`, `GameOver`, `FireComplete`, `FireAnimationDone`, `PreviewUpdate`

- `FireComplete` payload: `{ trajectory, playerId, collectedPowerUps }`
- `GameOver` payload: `{ winnerId }`

### Batching
- `beginBatch()` / `endBatch()` gom nhiều mutation → 1 `StateChanged` emit duy nhất
- **Nestable** — chỉ outer `endBatch()` mới emit
- `FireCommand` sử dụng batch để gom damage + powerup + obstacle mutations

### endGameByTimeout()
- Hết giờ → đối thủ thắng (không skip lượt)
- Được gọi từ `TurnManager.onTimerExpired()`

## EventEmitter (`EventEmitter.ts`)

Generic typed pub/sub — `on<K>(event, handler)`, `off()`, `emit()`.
Subclass cung cấp concrete `EventMap` (vd: `GameEventMap`, `TurnEventMap`).

## TurnManager (`TurnManager.ts`)

Timer 60s/lượt, chuyển pha: `Idle → Move → Fire → Resolve`.

- `TurnEvent`: `TimerTick`, `TimerExpired`, `PhaseChanged`
- `pauseTimer()` / `resumeTimer()` / `resetTimer()` — dùng trong animation flow
- Hết giờ → gọi `endGameByTimeout()` → emit `GameOver`

## CollisionSystem (`CollisionSystem.ts`)

Trace quỹ đạo đạn (Δx = 0.05), xử lý va chạm theo priority:

1. Power-up → thu thập, đạn tiếp tục
2. Vật cản mềm → phá hủy, đạn dừng (trừ Piercing buff)
3. Vật cản cứng → đạn dừng
4. Đối thủ → damage, đạn dừng

- `direction: 1 | -1` — hướng bắn do player chọn
- `CollisionResult`: `{ hit, targetId, collectedPowerUps, destroyedObstacles, finalPosition, trajectoryPoints }`

## Commands (`Commands.ts`)

| Command | Hành vi |
|---------|---------|
| `MoveCommand` | Di chuyển dọc đồ thị, giới hạn arc length = 5, step = 0.05 |
| `FireCommand` | Bắn + collision, batch mutations, emit `FireComplete` kèm `collectedPowerUps` |

- `serialize()` → `SerializableCommand` — dùng cho online sync qua Firebase
- `CommandQueue` quản lý thứ tự thực thi + lịch sử

## Buff Duration Rules

| Buff | `remainingTurns` | Ghi chú |
|------|-------------------|---------|
| DoubleDamage, Knockback, Piercing | `2` khi nhặt | Survive qua endTurn tick → hiệu lực 1 lượt tiếp |
| Shield | `-1` (permanent) | Chặn 1 lần damage → biến mất |
| ExtraMove | Áp dụng ngay | +1 moveCharges, không lưu buff |
