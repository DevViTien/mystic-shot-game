import {
  ref,
  set,
  get,
  push,
  update,
  query,
  orderByChild,
  equalTo,
  serverTimestamp,
  onValue,
  onChildAdded,
  type Unsubscribe,
} from 'firebase/database';
import { getDb, signInAnon, getCurrentUserId } from './firebase';
import type { Difficulty } from '../config';

// ─── Types ───

export interface PlayerInfo {
  name: string;
  color: string;
  skinId: string;
}

export interface RoomMeta {
  roomCode: string;
  hostId: string;
  guestId: string | null;
  status: 'waiting' | 'playing' | 'finished' | 'abandoned';
  createdAt: object | number;
  difficulty: Difficulty;
  mapId: string;
  host: PlayerInfo;
  guest: PlayerInfo | null;
}

export interface RoomState {
  snapshot: string; // JSON-stringified GameStateSnapshot
  turnStartedAt: object | number;
  startingPlayer: 1 | 2;
}

// ─── Room code generation ───

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to reduce confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── RoomManager ───

export class RoomManager {
  private roomId: string | null = null;
  private unsubs: Unsubscribe[] = [];

  getRoomId(): string | null {
    return this.roomId;
  }

  /**
   * Authenticate anonymously and return the UID.
   */
  async authenticate(): Promise<string> {
    const user = await signInAnon();
    return user.uid;
  }

  /**
   * Create a new room. Returns the room code.
   */
  async createRoom(
    player: PlayerInfo,
    difficulty: Difficulty,
    mapId: string,
  ): Promise<string> {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');

    const db = getDb();
    const roomCode = generateRoomCode();

    // Create a unique room entry
    const roomRef = push(ref(db, 'rooms'));
    this.roomId = roomRef.key!;

    const meta: RoomMeta = {
      roomCode,
      hostId: uid,
      guestId: null,
      status: 'waiting',
      createdAt: serverTimestamp(),
      difficulty,
      mapId,
      host: player,
      guest: null,
    };

    await set(ref(db, `rooms/${this.roomId}/meta`), meta);
    return roomCode;
  }

  /**
   * Join a room by code. Returns the room meta.
   */
  async joinRoom(roomCode: string, player: PlayerInfo): Promise<RoomMeta> {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');

    const db = getDb();
    const roomsRef = query(
      ref(db, 'rooms'),
      orderByChild('meta/roomCode'),
      equalTo(roomCode.toUpperCase()),
    );
    const snapshot = await get(roomsRef);

    if (!snapshot.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    let foundRoomId: string | null = null;
    let foundMeta: RoomMeta | null = null;

    snapshot.forEach((child) => {
      const meta = child.child('meta').val() as RoomMeta;
      if (meta.status === 'waiting' && !meta.guestId) {
        foundRoomId = child.key;
        foundMeta = meta;
      }
    });

    if (!foundRoomId || !foundMeta) {
      throw new Error('ROOM_FULL_OR_STARTED');
    }

    const meta = foundMeta as RoomMeta;

    // Validate color not same as host
    if (player.color === meta.host.color) {
      throw new Error('COLOR_CONFLICT');
    }

    this.roomId = foundRoomId;

    await update(ref(db, `rooms/${this.roomId}/meta`), {
      guestId: uid,
      guest: player,
    });

    return { ...meta, guestId: uid, guest: player };
  }

  /**
   * Subscribe to room meta changes. Returns unsubscribe fn.
   */
  onMetaChange(callback: (meta: RoomMeta) => void): () => void {
    if (!this.roomId) throw new Error('No room');
    const db = getDb();
    const unsub = onValue(ref(db, `rooms/${this.roomId}/meta`), (snap) => {
      if (snap.exists()) callback(snap.val() as RoomMeta);
    });
    this.unsubs.push(unsub);
    return unsub;
  }

  /**
   * Host starts the game — write initial state and set status='playing'.
   */
  async startGame(stateSnapshot: string, startingPlayer: 1 | 2): Promise<void> {
    if (!this.roomId) throw new Error('No room');
    const db = getDb();

    const state: RoomState = {
      snapshot: stateSnapshot,
      turnStartedAt: serverTimestamp(),
      startingPlayer,
    };

    await update(ref(db, `rooms/${this.roomId}`), {
      state,
      'meta/status': 'playing',
    });
  }

  /**
   * Push a command to the room's command log.
   */
  async pushCommand(command: object): Promise<string | null> {
    if (!this.roomId) throw new Error('No room');
    const db = getDb();
    const cmdRef = push(ref(db, `rooms/${this.roomId}/commands`));
    await set(cmdRef, { ...command, timestamp: serverTimestamp() });
    return cmdRef.key;
  }

  /**
   * Subscribe to new commands. Returns unsubscribe fn.
   */
  onCommand(callback: (cmd: Record<string, unknown>, key: string | null) => void): () => void {
    if (!this.roomId) throw new Error('No room');
    const db = getDb();
    let initialLoadDone = false;

    // Use onValue once to know how many children exist, then switch to onChildAdded
    // Skip commands already present when subscribing (they were already executed)
    const existingKeys = new Set<string>();
    const cmdRef = ref(db, `rooms/${this.roomId}/commands`);

    // First, snapshot existing keys to skip them
    get(cmdRef).then((snap) => {
      if (snap.exists()) {
        snap.forEach((child) => {
          existingKeys.add(child.key!);
        });
      }
      initialLoadDone = true;
    });

    const unsub = onChildAdded(cmdRef, (snap) => {
      if (!snap.exists()) return;
      const key = snap.key;
      // Skip commands that existed before we subscribed
      if (!initialLoadDone || (key && existingKeys.has(key))) {
        existingKeys.delete(key!);
        return;
      }
      callback(snap.val() as Record<string, unknown>, key);
    });
    this.unsubs.push(unsub);
    return unsub;
  }

  /**
   * Write updated state snapshot (host only, for reconnect fallback).
   */
  async writeState(stateSnapshot: string): Promise<void> {
    if (!this.roomId) throw new Error('No room');
    const db = getDb();
    await update(ref(db, `rooms/${this.roomId}/state`), {
      snapshot: stateSnapshot,
      turnStartedAt: serverTimestamp(),
    });
  }

  /**
   * Read the latest state snapshot (for reconnect).
   */
  async readState(): Promise<RoomState | null> {
    if (!this.roomId) throw new Error('No room');
    const db = getDb();
    const snap = await get(ref(db, `rooms/${this.roomId}/state`));
    return snap.exists() ? (snap.val() as RoomState) : null;
  }

  /**
   * Set room status to finished.
   */
  async finishGame(winnerId: 1 | 2): Promise<void> {
    if (!this.roomId) throw new Error('No room');
    const db = getDb();
    await update(ref(db, `rooms/${this.roomId}/meta`), {
      status: 'finished',
      winnerId,
    });
  }

  /**
   * Leave the room (abandon).
   */
  async leaveRoom(): Promise<void> {
    if (!this.roomId) return;
    const db = getDb();
    const uid = getCurrentUserId();
    const metaSnap = await get(ref(db, `rooms/${this.roomId}/meta`));
    if (metaSnap.exists()) {
      const meta = metaSnap.val() as RoomMeta;
      if (meta.status === 'waiting') {
        if (meta.hostId === uid) {
          // Host abandons the room
          await update(ref(db, `rooms/${this.roomId}/meta`), { status: 'abandoned' });
        } else if (meta.guestId === uid) {
          // Guest leaves — clear guest data so host sees the change
          await update(ref(db, `rooms/${this.roomId}/meta`), {
            guestId: null,
            guest: null,
          });
        }
      }
    }
    this.dispose();
  }

  /**
   * Clean up all Firebase listeners.
   */
  dispose(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.roomId = null;
  }
}
