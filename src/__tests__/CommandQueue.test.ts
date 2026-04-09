import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandQueue, type Command } from '@/core/CommandQueue';

function createMockCommand(type: string, executeFn = () => {}): Command {
  return { type, execute: executeFn };
}

describe('CommandQueue', () => {
  let queue: CommandQueue;

  beforeEach(() => {
    queue = new CommandQueue();
  });

  describe('enqueue / processNext', () => {
    it('should execute enqueued command', async () => {
      const fn = vi.fn();
      queue.enqueue(createMockCommand('test', fn));

      const processed = await queue.processNext();

      expect(processed).toBe(true);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return false when queue is empty', async () => {
      const processed = await queue.processNext();
      expect(processed).toBe(false);
    });

    it('should execute commands in order', async () => {
      const order: number[] = [];
      queue.enqueue(createMockCommand('a', () => order.push(1)));
      queue.enqueue(createMockCommand('b', () => order.push(2)));

      await queue.processNext();
      await queue.processNext();

      expect(order).toEqual([1, 2]);
    });
  });

  describe('processAll', () => {
    it('should execute all enqueued commands', async () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      queue.enqueue(createMockCommand('a', fn1));
      queue.enqueue(createMockCommand('b', fn2));

      await queue.processAll();

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('history', () => {
    it('should track executed commands in history', async () => {
      const cmd = createMockCommand('test');
      queue.enqueue(cmd);
      await queue.processNext();

      expect(queue.getHistory()).toContain(cmd);
    });

    it('should clear history', async () => {
      queue.enqueue(createMockCommand('test'));
      await queue.processNext();

      queue.clearHistory();
      expect(queue.getHistory()).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should remove pending commands', async () => {
      queue.enqueue(createMockCommand('a'));
      queue.enqueue(createMockCommand('b'));
      queue.clear();

      const processed = await queue.processNext();
      expect(processed).toBe(false);
    });
  });
});
