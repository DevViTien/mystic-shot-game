import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameState, GameEvent } from '@/core/GameState';
import { Difficulty, TurnPhase, PowerUpType, ObstacleType } from '@/config';

function createInitConfig(overrides = {}) {
  return {
    player1Name: 'Alice',
    player2Name: 'Bob',
    difficulty: Difficulty.Easy,
    obstacles: [],
    powerUps: [],
    startingPlayer: 1 as const,
    player1Pos: { x: -10, y: 0 },
    player2Pos: { x: 10, y: 0 },
    ...overrides,
  };
}

describe('GameState', () => {
  let gs: GameState;

  beforeEach(() => {
    gs = new GameState();
    gs.init(createInitConfig());
  });

  describe('init', () => {
    it('should set player names and positions', () => {
      const snap = gs.getSnapshot();
      expect(snap.players[0].name).toBe('Alice');
      expect(snap.players[1].name).toBe('Bob');
      expect(snap.players[0].position).toEqual({ x: -10, y: 0 });
      expect(snap.players[1].position).toEqual({ x: 10, y: 0 });
    });

    it('should set starting player and turn number', () => {
      const snap = gs.getSnapshot();
      expect(snap.currentPlayerId).toBe(1);
      expect(snap.turnNumber).toBe(1);
    });

    it('should set difficulty', () => {
      gs.init(createInitConfig({ difficulty: Difficulty.Hard }));
      expect(gs.getDifficulty()).toBe(Difficulty.Hard);
    });

    it('should set default HP and damage', () => {
      const p = gs.getPlayer(1);
      expect(p.hp).toBe(100);
      expect(p.damage).toBe(25);
    });
  });

  describe('getSnapshot', () => {
    it('should return a deep copy (mutations do not affect state)', () => {
      const snap = gs.getSnapshot();
      snap.players[0].hp = 0;
      expect(gs.getPlayer(1).hp).toBe(100);
    });
  });

  describe('getCurrentPlayer / getOpponent', () => {
    it('should return current player as player 1 initially', () => {
      expect(gs.getCurrentPlayer().id).toBe(1);
    });

    it('should return opponent as player 2 initially', () => {
      expect(gs.getOpponent().id).toBe(2);
    });
  });

  describe('setPhase', () => {
    it('should update phase and emit PhaseChanged', () => {
      const listener = vi.fn();
      gs.on(GameEvent.PhaseChanged, listener);

      gs.setPhase(TurnPhase.Move);

      expect(listener).toHaveBeenCalledWith(TurnPhase.Move);
      expect(gs.getSnapshot().phase).toBe(TurnPhase.Move);
    });
  });

  describe('applyDamage', () => {
    it('should reduce target HP', () => {
      gs.applyDamage(2, 25);
      expect(gs.getPlayer(2).hp).toBe(75);
    });

    it('should not reduce HP below 0', () => {
      gs.applyDamage(2, 200);
      expect(gs.getPlayer(2).hp).toBe(0);
    });

    it('should emit PlayerHit with damage info', () => {
      const listener = vi.fn();
      gs.on(GameEvent.PlayerHit, listener);

      gs.applyDamage(2, 25);

      expect(listener).toHaveBeenCalledWith({
        targetId: 2,
        damage: 25,
        remainingHp: 75,
      });
    });

    it('should emit GameOver when HP reaches 0', () => {
      const listener = vi.fn();
      gs.on(GameEvent.GameOver, listener);

      gs.applyDamage(2, 100);

      expect(listener).toHaveBeenCalledWith({ winnerId: 1 });
    });

    it('should block damage when target has Shield buff', () => {
      // Give player 2 a shield
      gs.init(
        createInitConfig({
          powerUps: [
            { id: 'pu1', type: PowerUpType.Shield, position: { x: 0, y: 0 }, collected: false },
          ],
        }),
      );
      gs.collectPowerUp(2, 'pu1');

      const hitListener = vi.fn();
      gs.on(GameEvent.PlayerHit, hitListener);

      gs.applyDamage(2, 25);

      expect(gs.getPlayer(2).hp).toBe(100); // No damage
      expect(hitListener).toHaveBeenCalledWith({ targetId: 2, blocked: true });
    });
  });

  describe('movePlayer', () => {
    it('should update position and reduce moveCharges', () => {
      gs.movePlayer(1, { x: -8, y: 2 });

      const p = gs.getPlayer(1);
      expect(p.position).toEqual({ x: -8, y: 2 });
      expect(p.moveCharges).toBe(1); // 2 - 1
    });

    it('should emit PlayerMoved', () => {
      const listener = vi.fn();
      gs.on(GameEvent.PlayerMoved, listener);

      gs.movePlayer(1, { x: -5, y: 1 });

      expect(listener).toHaveBeenCalledWith({ playerId: 1, position: { x: -5, y: 1 } });
    });
  });

  describe('collectPowerUp', () => {
    it('should mark power-up as collected and add buff', () => {
      gs.init(
        createInitConfig({
          powerUps: [
            {
              id: 'pu1',
              type: PowerUpType.DoubleDamage,
              position: { x: 0, y: 0 },
              collected: false,
            },
          ],
        }),
      );

      gs.collectPowerUp(1, 'pu1');

      expect(gs.hasBuff(1, PowerUpType.DoubleDamage)).toBe(true);
    });

    it('should grant ExtraMove as +1 moveCharges (no buff stored)', () => {
      gs.init(
        createInitConfig({
          powerUps: [
            {
              id: 'pu1',
              type: PowerUpType.ExtraMove,
              position: { x: 0, y: 0 },
              collected: false,
            },
          ],
        }),
      );

      gs.collectPowerUp(1, 'pu1');

      expect(gs.getPlayer(1).moveCharges).toBe(3); // 2 + 1
      expect(gs.hasBuff(1, PowerUpType.ExtraMove)).toBe(false);
    });

    it('should give Shield as permanent buff (remainingTurns=-1)', () => {
      gs.init(
        createInitConfig({
          powerUps: [
            { id: 'pu1', type: PowerUpType.Shield, position: { x: 0, y: 0 }, collected: false },
          ],
        }),
      );

      gs.collectPowerUp(1, 'pu1');

      const p = gs.getPlayer(1);
      expect(p.buffs).toEqual([{ type: PowerUpType.Shield, remainingTurns: -1 }]);
    });

    it('should not collect already collected power-up', () => {
      gs.init(
        createInitConfig({
          powerUps: [
            {
              id: 'pu1',
              type: PowerUpType.DoubleDamage,
              position: { x: 0, y: 0 },
              collected: true,
            },
          ],
        }),
      );

      gs.collectPowerUp(1, 'pu1');
      expect(gs.hasBuff(1, PowerUpType.DoubleDamage)).toBe(false);
    });
  });

  describe('destroyObstacle', () => {
    it('should mark obstacle as destroyed', () => {
      gs.init(
        createInitConfig({
          obstacles: [
            {
              id: 'obs1',
              type: ObstacleType.Soft,
              position: { x: 0, y: 0 },
              width: 2,
              height: 2,
              destroyed: false,
            },
          ],
        }),
      );

      gs.destroyObstacle('obs1');

      const snap = gs.getSnapshot();
      expect(snap.obstacles[0]?.destroyed).toBe(true);
    });
  });

  describe('nextTurn', () => {
    it('should switch current player', () => {
      gs.nextTurn();
      expect(gs.getSnapshot().currentPlayerId).toBe(2);
    });

    it('should increment turn number', () => {
      gs.nextTurn();
      expect(gs.getSnapshot().turnNumber).toBe(2);
    });

    it('should tick down buff durations and remove expired buffs', () => {
      gs.init(
        createInitConfig({
          powerUps: [
            {
              id: 'pu1',
              type: PowerUpType.DoubleDamage,
              position: { x: 0, y: 0 },
              collected: false,
            },
          ],
        }),
      );
      gs.collectPowerUp(1, 'pu1'); // remainingTurns = 2

      gs.nextTurn(); // p1 buffs tick: 2→1

      // Player 1 still has the buff after first nextTurn
      expect(gs.hasBuff(1, PowerUpType.DoubleDamage)).toBe(true);

      // Now it's player 2's turn. After endTurn → nextTurn switches back to player 1
      gs.nextTurn(); // p2 buffs tick (none), switch to p1

      // Turn is back to p1, but buff was already ticked in the first nextTurn
      // p1's buff was at 1 after first tick. Second nextTurn ticks p2 (no buffs).
      // So p1 still has the buff from first tick (remainingTurns=1)
      // Actually: nextTurn ticks the CURRENT player's buffs before switching
      // First nextTurn: current=1, tick p1 buffs (2→1), switch to 2
      // Second nextTurn: current=2, tick p2 buffs (none), switch to 1
      expect(gs.hasBuff(1, PowerUpType.DoubleDamage)).toBe(true);

      // Third nextTurn: current=1, tick p1 buffs (1→0 → removed), switch to 2
      gs.nextTurn();
      expect(gs.hasBuff(1, PowerUpType.DoubleDamage)).toBe(false);
    });

    it('should keep Shield buff (permanent) across turns', () => {
      gs.init(
        createInitConfig({
          powerUps: [
            { id: 'pu1', type: PowerUpType.Shield, position: { x: 0, y: 0 }, collected: false },
          ],
        }),
      );
      gs.collectPowerUp(1, 'pu1');

      gs.nextTurn(); // tick p1
      gs.nextTurn(); // tick p2
      gs.nextTurn(); // tick p1

      expect(gs.hasBuff(1, PowerUpType.Shield)).toBe(true);
    });
  });

  describe('endGameByTimeout', () => {
    it('should emit GameOver with opponent as winner', () => {
      const listener = vi.fn();
      gs.on(GameEvent.GameOver, listener);

      gs.endGameByTimeout(); // Current player is 1, so opponent (2) wins

      expect(listener).toHaveBeenCalledWith({ winnerId: 2 });
    });
  });

  describe('batch', () => {
    it('should suppress StateChanged during batch', () => {
      const listener = vi.fn();
      gs.on(GameEvent.StateChanged, listener);

      gs.beginBatch();
      gs.applyDamage(2, 10);
      gs.applyDamage(2, 10);

      // StateChanged should not have been called yet (only PlayerHit events)
      const stateChangedCalls = listener.mock.calls.length;
      expect(stateChangedCalls).toBe(0);

      gs.endBatch();

      // Now exactly 1 StateChanged
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle nested batches (only outer endBatch emits)', () => {
      const listener = vi.fn();
      gs.on(GameEvent.StateChanged, listener);

      gs.beginBatch();
      gs.beginBatch();
      gs.applyDamage(2, 10);
      gs.endBatch(); // inner — no emit
      expect(listener).not.toHaveBeenCalled();

      gs.endBatch(); // outer — emit
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
