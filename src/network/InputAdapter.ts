import type { SerializableCommand } from '../core/CommandQueue';

/**
 * Abstraction over how commands are submitted and received.
 * Local play executes directly; online play forwards via Firebase.
 */
export interface InputAdapter {
  /** Submit a move command. */
  submitMove(expression: string, direction: 1 | -1): void;
  /** Submit a fire command. */
  submitFire(expression: string, direction: 1 | -1): void;
  /** Subscribe to commands from the opponent (online). Returns unsubscribe fn. */
  onCommand(callback: (cmd: SerializableCommand) => void): () => void;
  /** Whether it is currently this player's turn. */
  isMyTurn(): boolean;
  /** Cleanup all listeners and connections. */
  dispose(): void;
}
