import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '@/core/EventEmitter';

interface TestEvents {
  count: [number];
  message: [string, number];
  done: [];
}

describe('EventEmitter', () => {
  describe('on / emit', () => {
    it('should call listener when event is emitted', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = vi.fn();

      emitter.on('count', listener);
      emitter.emit('count', 42);

      expect(listener).toHaveBeenCalledWith(42);
    });

    it('should support multiple listeners for the same event', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.on('count', listener1);
      emitter.on('count', listener2);
      emitter.emit('count', 7);

      expect(listener1).toHaveBeenCalledWith(7);
      expect(listener2).toHaveBeenCalledWith(7);
    });

    it('should pass multiple arguments to listener', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = vi.fn();

      emitter.on('message', listener);
      emitter.emit('message', 'hello', 42);

      expect(listener).toHaveBeenCalledWith('hello', 42);
    });

    it('should handle events with no arguments', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = vi.fn();

      emitter.on('done', listener);
      emitter.emit('done');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not call listeners for other events', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = vi.fn();

      emitter.on('count', listener);
      emitter.emit('done');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove a specific listener', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = vi.fn();

      emitter.on('count', listener);
      emitter.off('count', listener);
      emitter.emit('count', 1);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function from on()', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = vi.fn();

      const unsub = emitter.on('count', listener);
      unsub();
      emitter.emit('count', 1);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.on('count', listener1);
      emitter.on('count', listener2);
      emitter.removeAllListeners('count');
      emitter.emit('count', 1);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should remove all listeners when called without argument', () => {
      const emitter = new EventEmitter<TestEvents>();
      const countListener = vi.fn();
      const doneListener = vi.fn();

      emitter.on('count', countListener);
      emitter.on('done', doneListener);
      emitter.removeAllListeners();
      emitter.emit('count', 1);
      emitter.emit('done');

      expect(countListener).not.toHaveBeenCalled();
      expect(doneListener).not.toHaveBeenCalled();
    });
  });
});
