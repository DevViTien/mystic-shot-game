---
description: "Use when editing Firebase integration, InputAdapter, RoomManager, PresenceManager, online multiplayer sync. Covers room lifecycle, command dedup, presence management, guest initialization."
applyTo: "src/network/**"
---
# Network Module — Quy Tắc Chi Tiết

## Firebase (`firebase.ts`)

- SDK init **lazy** — chỉ khi cần
- Anonymous auth — không yêu cầu đăng nhập
- Config từ env vars: `VITE_FIREBASE_*` (apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId)
- `isFirebaseConfigured()` — check `apiKey` + `databaseURL` có giá trị
- `signInAnon()`, `getCurrentUserId()`, `getDb()`

## InputAdapter Pattern

Interface chung cho local và online play:

```
submitMove(playerId, expression, direction)
submitFire(playerId, expression, direction)
onCommand(callback)
isMyTurn(playerId): boolean
dispose()
```

| Adapter | Hành vi |
|---------|---------|
| `LocalInputAdapter` | Execute Commands trực tiếp trên GameState |
| `FirebaseInputAdapter` | Execute locally + push `SerializableCommand` lên Firebase RTDB |

### FirebaseInputAdapter Chi Tiết
- **Dedup**: Dùng Firebase push key (unique) — track bằng `processedCommandIds` Set
- **Turn validation**: Remote commands bị reject nếu `playerId ≠ currentPlayerId`
- **Host state backup**: Host writes state snapshot sau mỗi command (cho guest reconnect)

## RoomManager (`RoomManager.ts`)

CRUD room trên Firebase RTDB.

### Types
- `RoomMeta`: status, hostId, settings, players
- `PlayerInfo`: name, color, skinId, online
- `RoomState`: metadata + commands

### Room Lifecycle
```
createRoom() → 6-char code, hostId, status='waiting'
  → joinRoom(code) → validate status + color conflict
    → startGame() → status='playing'
      → finishGame() → status='finished'
        → leaveRoom() → cleanup
```

- Room code: 6-char alphanumeric (loại trừ I/O/0/1 tránh nhầm lẫn)
- `onMetaChange()` — subscribe metadata changes
- `onCommand()` — subscribe commands (skip existing children on subscribe)
- `allocateCommandKey()` → sync, generate push key (no network)
- `writeCommand(key, cmd)` → async, write command to allocated key

## PresenceManager (`PresenceManager.ts`)

Track online/offline via Firebase `onDisconnect`:

- `register()`: `onDisconnect()` registered **trước** `set()` (race-safe)
- `onOpponentPresence()`: subscribe opponent online status → UI hiển thị disconnect indicator

## Online Screen Flow

```
MainMenu → LobbyScreen (create/join) → WaitingRoom → Game → GameOver
```

## Guest Initialization

Guest watch `roomMeta.status='playing'` → load host snapshot:
- Guarded bởi `guestInitialized` ref để prevent re-init
- Host state backup đảm bảo guest có correct initial state
