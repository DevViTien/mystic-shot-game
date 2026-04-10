import { GameState, GameEvent, type GameStateSnapshot, type Position } from './GameState';

// ─── Types ───

export interface ReplayEntry {
  type: 'move' | 'fire';
  playerId: 1 | 2;
  snapshotAfter: GameStateSnapshot;
  trajectory?: Position[];
}

export interface ReplayData {
  initialSnapshot: GameStateSnapshot;
  entries: ReplayEntry[];
}

// ─── ReplayRecorder ───

/**
 * Records game actions (move/fire) with snapshots for replay playback.
 * Listens to GameState events during gameplay and stores entries.
 */
export class ReplayRecorder {
  private data: ReplayData | null = null;
  private recording = false;
  private unsubscribers: (() => void)[] = [];

  constructor(private gameState: GameState) {}

  start(): void {
    this.data = {
      initialSnapshot: this.gameState.getSnapshot(),
      entries: [],
    };
    this.recording = true;

    // Record move actions
    const unsubMove = this.gameState.on(GameEvent.PlayerMoved, ({ playerId }) => {
      if (!this.recording || !this.data) return;
      this.data.entries.push({
        type: 'move',
        playerId,
        snapshotAfter: this.gameState.getSnapshot(),
      });
    });
    this.unsubscribers.push(unsubMove);

    // Record fire actions (with trajectory)
    const unsubFire = this.gameState.on(GameEvent.FireComplete, ({ trajectory, playerId }) => {
      if (!this.recording || !this.data) return;
      this.data.entries.push({
        type: 'fire',
        playerId,
        snapshotAfter: this.gameState.getSnapshot(),
        trajectory,
      });
    });
    this.unsubscribers.push(unsubFire);
  }

  stop(): void {
    this.recording = false;
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  getData(): ReplayData | null {
    return this.data;
  }

  reset(): void {
    this.stop();
    this.data = null;
  }
}
