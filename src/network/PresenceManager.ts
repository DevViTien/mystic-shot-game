import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/database';
import { getDb, getCurrentUserId } from './firebase';

/**
 * Tracks player presence / connection status in a room.
 * Uses Firebase onDisconnect for automatic cleanup.
 */
export class PresenceManager {
  private unsubs: Unsubscribe[] = [];
  private presenceRef: ReturnType<typeof ref> | null = null;

  /**
   * Register this client as present in the room.
   */
  async register(roomId: string): Promise<void> {
    const uid = getCurrentUserId();
    if (!uid) return;

    const db = getDb();
    this.presenceRef = ref(db, `rooms/${roomId}/presence/${uid}`);

    // Register disconnect handler FIRST to avoid race condition
    await onDisconnect(this.presenceRef).set({ online: false, lastSeen: serverTimestamp() });
    await set(this.presenceRef, { online: true, lastSeen: serverTimestamp() });
  }

  /**
   * Subscribe to opponent's presence changes.
   */
  onOpponentPresence(
    roomId: string,
    opponentUid: string,
    callback: (online: boolean) => void,
  ): () => void {
    const db = getDb();
    const opRef = ref(db, `rooms/${roomId}/presence/${opponentUid}/online`);
    const unsub = onValue(opRef, (snap) => {
      callback(snap.val() === true);
    });
    this.unsubs.push(unsub);
    return unsub;
  }

  /**
   * Cleanup all listeners and remove presence.
   */
  dispose(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.presenceRef = null;
  }
}
