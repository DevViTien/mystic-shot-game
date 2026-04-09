import { PLAYER, MAP, POWERUPS, PowerUpType } from '../config';
import { GameState, GameEvent, type Position } from './GameState';
import { CollisionSystem } from './CollisionSystem';
import { FunctionParser } from '../math/FunctionParser';
import type { Command } from './CommandQueue';

// ─── MoveCommand ───

/**
 * Move a player along a function graph, limited by arc length.
 */
export class MoveCommand implements Command {
  readonly type = 'move';

  constructor(
    private gameState: GameState,
    private playerId: 1 | 2,
    private expression: string,
    private direction: 1 | -1,
  ) {}

  execute(): void {
    const player = this.gameState.getPlayer(this.playerId);

    const evalFn = FunctionParser.createTranslatedEvaluator(
      this.expression,
      player.position.x,
      player.position.y,
    );

    const step = PLAYER.MOVE_SAMPLE_STEP;
    const maxArc = PLAYER.MOVE_ARC_LENGTH;
    let arcLength = 0;
    let prev = { ...player.position };
    let lastValid = { ...player.position };

    for (
      let x = player.position.x + step * this.direction;
      this.direction === 1 ? x <= MAP.MAX_X : x >= MAP.MIN_X;
      x += step * this.direction
    ) {
      const y = evalFn(x);
      if (y === undefined || !Number.isFinite(y)) break;
      if (y > MAP.MAX_Y || y < MAP.MIN_Y) break;

      const dx = x - prev.x;
      const dy = y - prev.y;
      arcLength += Math.sqrt(dx * dx + dy * dy);

      if (arcLength > maxArc) break;

      prev = { x, y };
      lastValid = { x, y };
    }

    this.gameState.movePlayer(this.playerId, lastValid);
  }

  serialize() {
    return {
      type: this.type,
      payload: {
        playerId: this.playerId,
        expression: this.expression,
        direction: this.direction,
      },
    };
  }
}

// ─── FireCommand ───

export interface FireResult {
  hit: boolean;
  targetId?: 1 | 2;
  collectedPowerUps: string[];
  destroyedObstacles: string[];
  finalPosition: Position;
  trajectoryPoints: Position[];
}

/**
 * Fire a projectile along a function graph.
 * Handles collision detection, damage, knockback, power-up collection,
 * obstacle destruction, and trajectory emission.
 */
export class FireCommand implements Command {
  readonly type = 'fire';

  private result: FireResult | null = null;

  constructor(
    private gameState: GameState,
    private collisionSystem: CollisionSystem,
    private playerId: 1 | 2,
    private expression: string,
    private direction: 1 | -1,
  ) {}

  execute(): void {
    const snap = this.gameState.getSnapshot();
    const currentP = snap.players[this.playerId - 1]!;
    const opponentP = snap.players[this.playerId === 1 ? 1 : 0]!;

    // Create translated evaluator (function origin = player position)
    const evalFn = FunctionParser.createTranslatedEvaluator(
      this.expression,
      currentP.position.x,
      currentP.position.y,
    );

    // Run collision detection
    this.result = this.collisionSystem.trace(
      evalFn,
      currentP.position,
      opponentP,
      snap.obstacles,
      snap.powerUps,
      this.gameState.hasBuff(this.playerId, PowerUpType.Piercing),
      this.direction,
    );

    // Batch all mutations → one StateChanged emit
    this.gameState.beginBatch();
    try {
      // Apply damage if hit (BEFORE collecting power-ups — GDD: buffs apply from next turn)
      if (this.result.hit && this.result.targetId) {
        const dmg = this.gameState.hasBuff(this.playerId, PowerUpType.DoubleDamage)
          ? PLAYER.DEFAULT_DAMAGE * POWERUPS.DOUBLE_DAMAGE_MULTIPLIER
          : PLAYER.DEFAULT_DAMAGE;
        this.gameState.applyDamage(this.result.targetId, dmg);

        // Knockback: push opponent in fire direction
        if (this.gameState.hasBuff(this.playerId, PowerUpType.Knockback)) {
          const opponent = this.gameState.getPlayer(this.result.targetId);
          const newX = Math.max(
            MAP.MIN_X,
            Math.min(MAP.MAX_X, opponent.position.x + this.direction * POWERUPS.KNOCKBACK_DISTANCE),
          );
          this.gameState.knockbackPlayer(this.result.targetId, {
            x: newX,
            y: opponent.position.y,
          });
        }
      }

      // Apply collected power-ups (take effect next turn)
      for (const puId of this.result.collectedPowerUps) {
        this.gameState.collectPowerUp(this.playerId, puId);
      }

      // Destroy soft obstacles
      for (const obsId of this.result.destroyedObstacles) {
        this.gameState.destroyObstacle(obsId);
      }
    } finally {
      this.gameState.endBatch();
    }

    // Emit trajectory for rendering (after batch so Phaser sees final state)
    this.gameState.emit(GameEvent.FireComplete, {
      trajectory: this.result.trajectoryPoints,
      playerId: this.playerId,
      collectedPowerUps: this.result.collectedPowerUps,
    });
  }

  getResult(): FireResult | null {
    return this.result;
  }

  serialize() {
    return {
      type: this.type,
      payload: {
        playerId: this.playerId,
        expression: this.expression,
        direction: this.direction,
      },
    };
  }
}
