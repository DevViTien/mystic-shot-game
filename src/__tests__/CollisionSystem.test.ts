import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '@/core/CollisionSystem';
import { ObstacleType, PowerUpType } from '@/config';
import type { PlayerState, ObstacleState, PowerUpState } from '@/core/GameState';

function makePlayer(id: 1 | 2, x: number, y: number): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    hp: 100,
    position: { x, y },
    moveCharges: 2,
    damage: 25,
    buffs: [],
    skinId: 'classic',
  };
}

function makeObstacle(
  id: string,
  x: number,
  y: number,
  type: ObstacleType = ObstacleType.Hard,
  w = 2,
  h = 2,
): ObstacleState {
  return { id, type, position: { x, y }, width: w, height: h, destroyed: false };
}

function makePowerUp(
  id: string,
  x: number,
  y: number,
  type = PowerUpType.DoubleDamage,
): PowerUpState {
  return { id, type, position: { x, y }, collected: false };
}

describe('CollisionSystem', () => {
  let cs: CollisionSystem;

  beforeEach(() => {
    cs = new CollisionSystem();
  });

  describe('trace — basic trajectory', () => {
    it('should generate trajectory points for a straight line y=0', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 100, 100); // far away, no hit
      const evalFn = (_x: number) => 0; // flat line y=0

      const result = cs.trace(evalFn, origin, opponent, [], [], false, 1);

      expect(result.trajectoryPoints.length).toBeGreaterThan(0);
      expect(result.hit).toBe(false);
    });

    it('should detect hit on opponent', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 0, 0); // directly on path y=0

      // Flat line y=0 — will pass through (0, 0)
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [], [], false, 1);

      expect(result.hit).toBe(true);
      expect(result.targetId).toBe(2);
    });
  });

  describe('trace — direction', () => {
    it('should trace in -x direction when direction=-1', () => {
      const origin = { x: 10, y: 0 };
      const opponent = makePlayer(2, 0, 0);
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [], [], false, -1);

      expect(result.hit).toBe(true);
      // All trajectory points should have x < origin.x
      expect(result.trajectoryPoints.every((p) => p.x < origin.x)).toBe(true);
    });
  });

  describe('trace — obstacle collision', () => {
    it('should stop at hard obstacle', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 20, 0);
      const obstacle = makeObstacle('obs1', 0, 0, ObstacleType.Hard);
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [obstacle], [], false, 1);

      expect(result.hit).toBe(false); // stopped by obstacle before reaching opponent
    });

    it('should destroy soft obstacle and stop (no piercing)', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 20, 0);
      const obstacle = makeObstacle('obs1', 0, 0, ObstacleType.Soft);
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [obstacle], [], false, 1);

      expect(result.hit).toBe(false);
      expect(result.destroyedObstacles).toContain('obs1');
    });

    it('should pierce soft obstacle with piercing buff', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 5, 0);
      const obstacle = makeObstacle('obs1', 0, 0, ObstacleType.Soft);
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [obstacle], [], true, 1);

      expect(result.hit).toBe(true);
      expect(result.destroyedObstacles).toContain('obs1');
    });

    it('should not pierce hard obstacle even with piercing', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 20, 0);
      const obstacle = makeObstacle('obs1', 0, 0, ObstacleType.Hard);
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [obstacle], [], true, 1);

      expect(result.hit).toBe(false);
    });

    it('should skip destroyed obstacles', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 5, 0);
      const obstacle: ObstacleState = {
        ...makeObstacle('obs1', 0, 0, ObstacleType.Hard),
        destroyed: true,
      };
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [obstacle], [], false, 1);

      expect(result.hit).toBe(true); // passes through destroyed obstacle
    });
  });

  describe('trace — power-up collection', () => {
    it('should collect power-ups along trajectory (projectile continues)', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 20, 0);
      const pu = makePowerUp('pu1', -5, 0);
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [], [pu], false, 1);

      expect(result.collectedPowerUps).toContain('pu1');
      // Projectile continues after collecting
      expect(result.trajectoryPoints.length).toBeGreaterThan(10);
    });

    it('should not collect already collected power-ups', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 20, 0);
      const pu: PowerUpState = { ...makePowerUp('pu1', -5, 0), collected: true };
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [], [pu], false, 1);

      expect(result.collectedPowerUps).not.toContain('pu1');
    });
  });

  describe('trace — collision priority', () => {
    it('should collect power-up before stopping at obstacle (power-up closer)', () => {
      const origin = { x: -10, y: 0 };
      const opponent = makePlayer(2, 20, 0);
      const pu = makePowerUp('pu1', -3, 0); // power-up before obstacle
      const obstacle = makeObstacle('obs1', 0, 0, ObstacleType.Hard);
      const evalFn = (_x: number) => 0;

      const result = cs.trace(evalFn, origin, opponent, [obstacle], [pu], false, 1);

      expect(result.collectedPowerUps).toContain('pu1');
      expect(result.hit).toBe(false); // stopped by obstacle
    });
  });
});
