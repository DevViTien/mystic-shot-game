/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map event names to their argument tuples. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type EventMap = {};

type Listener<Args extends any[]> = (...args: Args) => void;

/**
 * Lightweight **typed** event emitter for decoupling game systems.
 * React UI + Phaser renderer subscribe to state changes through this.
 *
 * Subclasses provide a concrete EventMap:
 * ```ts
 * interface MyEvents { 'count': [number]; 'done': [] }
 * class MyEmitter extends EventEmitter<MyEvents> {}
 * ```
 */
export class EventEmitter<T extends EventMap = EventMap> {
  private listeners = new Map<string, Set<Listener<any>>>();

  on<K extends keyof T & string>(
    event: K,
    listener: Listener<T[K] extends any[] ? T[K] : any[]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  off<K extends keyof T & string>(
    event: K,
    listener: Listener<T[K] extends any[] ? T[K] : any[]>,
  ): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit<K extends keyof T & string>(event: K, ...args: T[K] extends any[] ? T[K] : any[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
