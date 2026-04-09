# Online Multiplayer

## 1. Phạm vi

2 người chơi trên 2 máy khác nhau chơi cùng trận qua mạng:

- **Room-based**: Host tạo room → room code 6 ký tự → Guest nhập code join
- **Turn-based sync**: Command forwarding — deterministic execution
- **Anonymous**: Firebase Anonymous Auth — không cần đăng ký

---

## 2. Công nghệ: Firebase Realtime Database

| Tiêu chí | Firebase RTDB | Socket.IO + Server |
|----------|---------------|-------------------|
| Setup | Zero server | Cần deploy + maintain |
| Latency | ~100–300ms | ~30–100ms |
| Đủ cho turn-based? | ✅ Thừa | ✅ Thừa |
| Auto reconnect | ✅ Built-in | Tự implement |
| Presence detection | ✅ Built-in (`onDisconnect`) | Tự implement |
| Cost | Free tier: 100K conn/month | ~$5/month minimum |
| Anti-cheat | ❌ Client-side + Rules | ✅ Server authoritative |

**Quyết định**: Firebase RTDB — zero maintenance, presence miễn phí, turn-based chấp nhận latency.

**Services**: Realtime Database (room data, sync) + Anonymous Authentication (định danh player)

**Dependency**: `firebase` ^12.x (modular, tree-shakeable) — chỉ import `firebase/app`, `firebase/database`, `firebase/auth`

---

## 3. Cấu trúc dữ liệu Firebase

```
/rooms/{roomId}/
│
├── meta/
│   ├── roomCode: string          # 6-char (A-Z, 2-9, loại I/O/0/1)
│   ├── hostId: string            # Firebase Auth UID
│   ├── guestId: string | null
│   ├── status: string            # "waiting" | "playing" | "finished" | "abandoned"
│   ├── createdAt: ServerTimestamp
│   ├── difficulty: Difficulty
│   ├── mapId: string
│   ├── host/                     # { name, color, skinId }
│   └── guest/                    # null → PlayerInfo khi join
│
├── state/
│   ├── snapshot: string          # JSON GameStateSnapshot
│   ├── turnStartedAt: ServerTimestamp
│   └── startingPlayer: 1 | 2
│
├── commands/                     # Append-only log
│   └── {pushId}/
│       ├── type, payload, timestamp
│
└── presence/
    ├── {hostUid}: { online, lastSeen }
    └── {guestUid}: { online, lastSeen }
```

---

## 4. Command Forwarding Sync

**Nguyên lý**: Chỉ gửi command (~100 bytes) thay vì full state (~KB). Cả 2 client execute cùng command → deterministic result.

```
Active player nhập hàm → validate → Fire/Move
  │
  ├─ 1. Execute locally trên GameState
  ├─ 2. Push SerializableCommand lên /commands/
  │     → Firebase assign unique push key
  │
  ├─ 3. Cả 2 client subscribe onChildAdded(/commands/)
  │     → Nhận command → check processedCommandIds (dedup)
  │     → Validate turn (playerId = currentPlayerId)
  │     → Execute trên local GameState
  │
  └─ 4. Host ghi GameStateSnapshot lên /state/
         (backup cho reconnect)
```

**Dedup**: Active player execute locally TRƯỚC khi push → track push key trong `processedCommandIds` Set → skip khi nhận lại từ Firebase.

**Turn validation**: Remote commands bị reject nếu `playerId ≠ currentPlayerId`.

---

## 5. InputAdapter Pattern

Interface trừu tượng để game logic không phụ thuộc local/online:

```
InputAdapter
├── submitMove(expression, direction)
├── submitFire(expression, direction)
├── onCommand(callback) → unsubscribe
├── isMyTurn(): boolean
└── dispose()
```

### LocalInputAdapter

- `submitMove/Fire`: Tạo Command → `execute()` trực tiếp
- `isMyTurn()`: Luôn `true` (2 player cùng máy)

### FirebaseInputAdapter

- `submitMove/Fire`: Execute locally + push to Firebase + host writes state backup
- `onCommand`: Subscribe `onChildAdded` → dedup → validate turn → execute remote command
- `isMyTurn()`: `currentPlayerId === myPlayerId`
- `myPlayerId`: Determined by `uid === hostId ? 1 : 2`

### Tác động lên useGameEngine

- `handleMove()` / `handleFire()`: Check online mode → delegate to adapter hoặc execute trực tiếp
- UI `disabled`: `animating || (onlineMode && !isMyTurn)`

---

## 6. Room Lifecycle

### 6.1 Tạo room (Host)

```
Lobby → chọn tên, color, skin, difficulty, map → "Create Room"
  → signInAnonymously() → UID
  → Generate room code 6-char (unique, loại I/O/0/1)
  → Ghi /rooms/{id}/meta/ (status='waiting')
  → Hiển thị room code → chờ guest
  → Subscribe meta changes → biết khi guest join
```

### 6.2 Join room (Guest)

```
Lobby → chọn tên, color, skin → nhập code → "Join"
  → signInAnonymously() → UID
  → Query rooms theo roomCode (orderByChild + equalTo)
  → Validate: status='waiting', guestId=null, color ≠ host
  → Ghi guestId + guest info
  → Subscribe meta changes → biết khi host start
```

### 6.3 Start game (Host)

```
Host thấy guest → "Start Game"
  → MapGenerator (random hoặc preset)
  → Random starting player
  → gameState.init()
  → Ghi GameStateSnapshot + startingPlayer vào /state/
  → Set status='playing'
  → Tạo FirebaseInputAdapter
  → Register presence
```

### 6.4 Guest init

```
Guest watch roomMeta.status
  → status = 'playing' (guarded by guestInitialized ref)
  → readState() → parse JSON snapshot
  → gameState.init() từ host snapshot
  → Tạo FirebaseInputAdapter
  → Register presence
  → Start game
```

### 6.5 Kết thúc game

```
HP = 0 → GameOver event
  → Host set status='finished', winnerId
  → "Back to Menu" → dispose adapters, cleanup
```

### 6.6 Leave/Cancel

- **Host cancel** (waiting): status='abandoned'
- **Guest leave** (waiting): clear guestId + guest
- **Leave during game** (online): Forfeit → opponent wins

---

## 7. Presence Tracking

### PresenceManager

```
register(roomId):
  → presenceRef = /rooms/{roomId}/presence/{uid}
  → onDisconnect().set({ online: false, lastSeen }) ← TRƯỚC set (race-safe)
  → set({ online: true, lastSeen })

onOpponentPresence(roomId, opponentUid, callback):
  → onValue(/presence/{opponentUid}/online)
  → callback(online: boolean)
```

### UI Indicator

- `opponentOnline = false` → HudHeader hiển thị "Opponent disconnected" (text đỏ pulse)

---

## 8. Timer (Hiện trạng)

Timer hiện chạy **local** (`setInterval`) trên mỗi client. Chấp nhận được cho turn-based (60s tolerance).

**Thiết kế dự kiến** (chưa implement):
- Host ghi `turnStartedAt` (server timestamp) mỗi đầu lượt
- Guest tính: `timer = 60 - (now - turnStartedAt)`
- Hết giờ: chỉ host gửi signal

---

## 9. Reconnection (Hiện trạng)

Hiện chỉ có presence tracking + state snapshot backup. Full reconnection flow chưa implement.

**Thiết kế dự kiến**:
- Disconnect → opponent thấy indicator → countdown 30s
- Reconnect trước 30s → load latest /state/ → resume
- Không reconnect → opponent thắng

---

## 10. Security Rules

| Path | Đọc | Ghi | Điều kiện |
|------|-----|-----|-----------|
| `/meta/` | Auth | Host tạo; Guest chỉ ghi guest fields | `auth != null` |
| `/state/` | Auth | Chỉ host | `meta.hostId === auth.uid` |
| `/commands/{id}` | Auth | Player tương ứng | `newData.playerId` match auth |
| `/presence/{uid}` | Auth | Chỉ owner | `auth.uid === $uid` |

---

## 11. Cấu trúc thư mục

```
src/network/
├── firebase.ts              # Firebase init (lazy), signInAnon, getDb, getCurrentUserId
│                            # Config từ env: VITE_FIREBASE_*
│                            # isFirebaseConfigured() check
├── InputAdapter.ts          # Interface
├── LocalInputAdapter.ts     # Local play
├── FirebaseInputAdapter.ts  # Online play (dedup, turn validation)
├── RoomManager.ts           # Room CRUD, command push, state read/write
├── PresenceManager.ts       # onDisconnect tracking
└── index.ts                 # Barrel export
```
