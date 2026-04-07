/**
 * Command pattern — all player actions are commands.
 * Commands are serializable for future multiplayer support.
 */
export interface Command {
  readonly type: string;
  execute(): void | Promise<void>;
}

export interface SerializableCommand {
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Queues and executes commands sequentially.
 * Designed to be extended for network synchronization.
 */
export class CommandQueue {
  private queue: Command[] = [];
  private history: Command[] = [];
  private processing = false;

  enqueue(command: Command): void {
    this.queue.push(command);
  }

  async processNext(): Promise<boolean> {
    if (this.processing || this.queue.length === 0) return false;

    this.processing = true;
    const command = this.queue.shift()!;

    try {
      await command.execute();
      this.history.push(command);
    } finally {
      this.processing = false;
    }

    return true;
  }

  async processAll(): Promise<void> {
    while (this.queue.length > 0) {
      await this.processNext();
    }
  }

  isProcessing(): boolean {
    return this.processing;
  }

  getHistory(): readonly Command[] {
    return this.history;
  }

  clear(): void {
    this.queue = [];
  }

  clearHistory(): void {
    this.history = [];
  }
}
