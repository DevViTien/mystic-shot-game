import { PLAYER, PROJECTILE, MAP, ObstacleType } from '../config';
import { distance } from '../utils/MathUtils';
import type { Position, ObstacleState, PowerUpState, PlayerState } from './GameState';

export interface CollisionResult {
  hit: boolean;
  targetId?: 1 | 2;
  collectedPowerUps: string[];
  destroyedObstacles: string[];
  finalPosition: Position;
  trajectoryPoints: Position[];
}

/**
 * Samples a function graph at small Δx steps and checks collisions
 * against obstacles, power-ups, and the opponent player.
 */
export class CollisionSystem {
  /**
   * Trace a projectile path and detect collisions.
   *
   * @param evalFn - Translated function: given x, returns y (already offset to player origin)
   * @param origin - Player's position (start of trajectory)
   * @param opponent - Opponent player state
   * @param obstacles - Current obstacle states
   * @param powerUps - Current power-up states
   * @param hasPiercing - Whether the projectile pierces soft obstacles
   * @param direction - Horizontal direction: 1 for +x (left→right), -1 for -x (right→left)
   */
  trace(
    evalFn: (x: number) => number | undefined,
    origin: Position,
    opponent: PlayerState,
    obstacles: ObstacleState[],
    powerUps: PowerUpState[],
    hasPiercing: boolean,
    direction: 1 | -1 = 1,
  ): CollisionResult {
    const result: CollisionResult = {
      hit: false,
      collectedPowerUps: [],
      destroyedObstacles: [],
      finalPosition: { ...origin },
      trajectoryPoints: [],
    };

    const step = PROJECTILE.SAMPLE_STEP;
    const limit = direction === 1 ? MAP.MAX_X : MAP.MIN_X;
    const collected = new Set<string>();

    for (
      let x = origin.x + step * direction;
      direction === 1 ? x <= limit : x >= limit;
      x += step * direction
    ) {
      const y = evalFn(x);

      // Skip undefined points (e.g. 1/0)
      if (y === undefined || !Number.isFinite(y)) continue;

      // Skip if outside Y bounds, but don't stop (sin can re-enter)
      if (y > MAP.MAX_Y || y < MAP.MIN_Y) continue;

      const point: Position = { x, y };
      result.trajectoryPoints.push(point);
      result.finalPosition = point;

      // --- Check power-ups (priority 1: collect and continue) ---
      for (const pu of powerUps) {
        if (pu.collected || collected.has(pu.id)) continue;
        if (this.pointInRect(point, pu.position, 0.5, 0.5)) {
          result.collectedPowerUps.push(pu.id);
          collected.add(pu.id);
        }
      }

      // --- Check obstacles (priority 2) ---
      let hitObstacle = false;
      for (const obs of obstacles) {
        if (obs.destroyed) continue;
        if (this.pointInRect(point, obs.position, obs.width / 2, obs.height / 2)) {
          if (obs.type === ObstacleType.Soft) {
            result.destroyedObstacles.push(obs.id);
            if (!hasPiercing) {
              hitObstacle = true;
              break;
            }
            // Piercing: destroy but continue
          } else {
            // Hard obstacle: always stop
            hitObstacle = true;
            break;
          }
        }
      }
      if (hitObstacle) break;

      // --- Check opponent hit (priority 3) ---
      const dist = distance(point, opponent.position);
      if (dist <= PLAYER.HITBOX_RADIUS) {
        result.hit = true;
        result.targetId = opponent.id;
        break;
      }
    }

    return result;
  }

  private pointInRect(point: Position, center: Position, halfW: number, halfH: number): boolean {
    return Math.abs(point.x - center.x) <= halfW && Math.abs(point.y - center.y) <= halfH;
  }
}
