import type { InputAdapter } from './InputAdapter';
import type { SerializableCommand } from '../core/CommandQueue';
import { GameState, MoveCommand, FireCommand, CollisionSystem } from '../core';

/**
 * InputAdapter for local (same-device) play.
 * Commands execute directly on the local GameState.
 */
export class LocalInputAdapter implements InputAdapter {
  constructor(
    private gameState: GameState,
    private collisionSystem: CollisionSystem,
  ) {}

  submitMove(expression: string, direction: 1 | -1): void {
    const snap = this.gameState.getSnapshot();
    new MoveCommand(this.gameState, snap.currentPlayerId, expression, direction).execute();
  }

  submitFire(expression: string, direction: 1 | -1): void {
    const snap = this.gameState.getSnapshot();
    new FireCommand(
      this.gameState,
      this.collisionSystem,
      snap.currentPlayerId,
      expression,
      direction,
    ).execute();
  }

  /** Local play: no remote commands. */
  onCommand(_callback: (cmd: SerializableCommand) => void): () => void {
    return () => {};
  }

  /** Local play: always your turn (both players share the device). */
  isMyTurn(): boolean {
    return true;
  }

  dispose(): void {
    // No-op for local.
  }
}
