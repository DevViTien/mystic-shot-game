import type { InputAdapter } from './InputAdapter';
import type { SerializableCommand } from '../core/CommandQueue';
import {
  GameState,
  MoveCommand,
  FireCommand,
  CollisionSystem,
} from '../core';
import { RoomManager } from './RoomManager';
import { getCurrentUserId } from './firebase';

/**
 * InputAdapter for online play via Firebase.
 * - Active player pushes commands to Firebase and executes locally.
 * - Both clients subscribe to commands and execute received ones.
 */
export class FirebaseInputAdapter implements InputAdapter {
  private myPlayerId: 1 | 2;
  private unsubCommand: (() => void) | null = null;
  private commandCallback: ((cmd: SerializableCommand) => void) | null = null;
  private processedCommandIds = new Set<string>();

  constructor(
    private gameState: GameState,
    private collisionSystem: CollisionSystem,
    private roomManager: RoomManager,
    private hostId: string,
  ) {
    const uid = getCurrentUserId();
    this.myPlayerId = uid === hostId ? 1 : 2;

    // Subscribe to commands from Firebase
    this.unsubCommand = this.roomManager.onCommand((raw, key) => {
      const cmd = raw as unknown as SerializableCommand & { timestamp?: number };

      // Avoid double-execute: active player already executed locally
      if (key && this.processedCommandIds.has(key)) {
        this.processedCommandIds.delete(key);
        return;
      }

      // Validate turn — only execute if playerId matches current turn
      const p = cmd.payload as { playerId?: number };
      if (p.playerId !== null && p.playerId !== this.gameState.getSnapshot().currentPlayerId) {
        return;
      }

      // Execute opponent's command locally
      this.executeCommand(cmd);
      this.commandCallback?.(cmd);
    });
  }

  submitMove(expression: string, direction: 1 | -1): void {
    const snap = this.gameState.getSnapshot();
    const cmd = new MoveCommand(this.gameState, snap.currentPlayerId, expression, direction);
    const serialized = cmd.serialize();

    // Pre-register key BEFORE execute to prevent onChildAdded double-execute
    const pushKey = this.roomManager.allocateCommandKey();
    this.processedCommandIds.add(pushKey);

    cmd.execute();

    this.roomManager.writeCommand(pushKey, serialized);

    // Host writes state backup
    if (this.isHost()) {
      this.roomManager.writeState(JSON.stringify(this.gameState.getSnapshot()));
    }
  }

  submitFire(expression: string, direction: 1 | -1): void {
    const snap = this.gameState.getSnapshot();
    const cmd = new FireCommand(
      this.gameState,
      this.collisionSystem,
      snap.currentPlayerId,
      expression,
      direction,
    );
    const serialized = cmd.serialize();

    // Pre-register key BEFORE execute to prevent onChildAdded double-execute
    const pushKey = this.roomManager.allocateCommandKey();
    this.processedCommandIds.add(pushKey);

    cmd.execute();

    this.roomManager.writeCommand(pushKey, serialized);

    if (this.isHost()) {
      this.roomManager.writeState(JSON.stringify(this.gameState.getSnapshot()));
    }
  }

  onCommand(callback: (cmd: SerializableCommand) => void): () => void {
    this.commandCallback = callback;
    return () => {
      this.commandCallback = null;
    };
  }

  isMyTurn(): boolean {
    return this.gameState.getSnapshot().currentPlayerId === this.myPlayerId;
  }

  getMyPlayerId(): 1 | 2 {
    return this.myPlayerId;
  }

  dispose(): void {
    this.unsubCommand?.();
    this.unsubCommand = null;
    this.commandCallback = null;
    this.processedCommandIds.clear();
  }

  private isHost(): boolean {
    return getCurrentUserId() === this.hostId;
  }

  private executeCommand(cmd: SerializableCommand): void {
    const { type, payload } = cmd;
    const p = payload as { playerId: 1 | 2; expression: string; direction: 1 | -1 };

    if (type === 'move') {
      new MoveCommand(this.gameState, p.playerId, p.expression, p.direction).execute();
    } else if (type === 'fire') {
      new FireCommand(
        this.gameState,
        this.collisionSystem,
        p.playerId,
        p.expression,
        p.direction,
      ).execute();
    }
  }
}
