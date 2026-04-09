import { EventEmitter } from './EventEmitter';
import { PLAYER, PowerUpType, Difficulty, TurnPhase, type ObstacleType } from '../config';

// --- Interfaces ---

export interface Position {
  x: number;
  y: number;
}

export interface PlayerState {
  id: 1 | 2;
  name: string;
  hp: number;
  position: Position;
  moveCharges: number;
  damage: number;
  buffs: ActiveBuff[];
  skinId: string;
}

export interface ActiveBuff {
  type: PowerUpType;
  remainingTurns: number; // -1 = permanent until triggered (e.g. Shield)
}

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  position: Position;
  width: number;
  height: number;
  destroyed: boolean;
}

export interface PowerUpState {
  id: string;
  type: PowerUpType;
  position: Position;
  collected: boolean;
}

// --- Events ---

export enum GameEvent {
  StateChanged = 'state:changed',
  PlayerHit = 'player:hit',
  PlayerMoved = 'player:moved',
  TurnChanged = 'turn:changed',
  PhaseChanged = 'phase:changed',
  ObstacleDestroyed = 'obstacle:destroyed',
  PowerUpCollected = 'powerup:collected',
  GameOver = 'game:over',
  FireComplete = 'fire:complete',
  FireAnimationDone = 'fire:animation:done',
  PreviewUpdate = 'preview:update',
}

export interface PreviewData {
  points: Position[];
  mode: 'fire' | 'move';
}

export interface GameEventMap {
  [GameEvent.StateChanged]: [GameStateSnapshot];
  [GameEvent.PlayerHit]: [
    { targetId: 1 | 2; damage?: number; remainingHp?: number; blocked?: boolean },
  ];
  [GameEvent.PlayerMoved]: [{ playerId: 1 | 2; position: Position }];
  [GameEvent.TurnChanged]: [{ currentPlayerId: 1 | 2; turnNumber: number }];
  [GameEvent.PhaseChanged]: [TurnPhase];
  [GameEvent.ObstacleDestroyed]: [{ obstacleId: string }];
  [GameEvent.PowerUpCollected]: [{ playerId: 1 | 2; powerUp: PowerUpState }];
  [GameEvent.GameOver]: [{ winnerId: 1 | 2 }];
  [GameEvent.FireComplete]: [{ trajectory: Position[]; playerId: 1 | 2 }];
  [GameEvent.FireAnimationDone]: [];
  [GameEvent.PreviewUpdate]: [PreviewData | null];
}

// --- GameState ---

export interface GameStateSnapshot {
  players: [PlayerState, PlayerState];
  currentPlayerId: 1 | 2;
  phase: TurnPhase;
  difficulty: Difficulty;
  obstacles: ObstacleState[];
  powerUps: PowerUpState[];
  turnNumber: number;
}

export class GameState extends EventEmitter<GameEventMap> {
  private players: [PlayerState, PlayerState];
  private currentPlayerId: 1 | 2 = 1;
  private phase: TurnPhase = TurnPhase.Idle;
  private difficulty: Difficulty = Difficulty.Easy;
  private obstacles: ObstacleState[] = [];
  private powerUps: PowerUpState[] = [];
  private turnNumber = 0;
  private batchDepth = 0;
  private batchDirty = false;

  constructor() {
    super();
    this.players = [
      this.createDefaultPlayer(1, 'Player 1', { x: -10, y: 0 }),
      this.createDefaultPlayer(2, 'Player 2', { x: 10, y: 0 }),
    ];
  }

  private createDefaultPlayer(id: 1 | 2, name: string, position: Position, skinId = 'classic'): PlayerState {
    return {
      id,
      name,
      hp: PLAYER.MAX_HP,
      position,
      moveCharges: PLAYER.INITIAL_MOVE_CHARGES,
      damage: PLAYER.DEFAULT_DAMAGE,
      buffs: [],
      skinId,
    };
  }

  // --- Initialization ---

  init(config: {
    player1Name: string;
    player2Name: string;
    difficulty: Difficulty;
    obstacles: ObstacleState[];
    powerUps: PowerUpState[];
    startingPlayer: 1 | 2;
    player1Pos: Position;
    player2Pos: Position;
    player1SkinId?: string;
    player2SkinId?: string;
  }): void {
    this.difficulty = config.difficulty;
    this.obstacles = config.obstacles;
    this.powerUps = config.powerUps;
    this.currentPlayerId = config.startingPlayer;
    this.turnNumber = 1;
    this.phase = TurnPhase.Idle;

    this.players = [
      this.createDefaultPlayer(1, config.player1Name, config.player1Pos, config.player1SkinId),
      this.createDefaultPlayer(2, config.player2Name, config.player2Pos, config.player2SkinId),
    ];

    this.emitStateChanged();
  }

  // --- Getters ---

  getSnapshot(): GameStateSnapshot {
    return {
      players: [this.clonePlayer(this.players[0]), this.clonePlayer(this.players[1])],
      currentPlayerId: this.currentPlayerId,
      phase: this.phase,
      difficulty: this.difficulty,
      obstacles: this.obstacles.map((o) => ({ ...o })),
      powerUps: this.powerUps.map((p) => ({ ...p })),
      turnNumber: this.turnNumber,
    };
  }

  getPlayer(id: 1 | 2): PlayerState {
    return this.clonePlayer(this.players[id === 1 ? 0 : 1]);
  }

  getCurrentPlayer(): PlayerState {
    return this.getPlayer(this.currentPlayerId);
  }

  getOpponent(): PlayerState {
    return this.getPlayer(this.currentPlayerId === 1 ? 2 : 1);
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  // --- Mutations ---

  setPhase(phase: TurnPhase): void {
    this.phase = phase;
    this.emit(GameEvent.PhaseChanged, phase);
    this.emitStateChanged();
  }

  applyDamage(targetId: 1 | 2, amount: number): void {
    const target = this.getPlayerMut(targetId);

    // Check shield
    const shieldIndex = target.buffs.findIndex((b) => b.type === PowerUpType.Shield);
    if (shieldIndex !== -1) {
      target.buffs.splice(shieldIndex, 1);
      this.emit(GameEvent.PlayerHit, { targetId, blocked: true });
      this.emitStateChanged();
      return;
    }

    target.hp = Math.max(0, target.hp - amount);
    this.emit(GameEvent.PlayerHit, {
      targetId,
      damage: amount,
      remainingHp: target.hp,
    });

    if (target.hp <= 0) {
      this.emit(GameEvent.GameOver, {
        winnerId: this.currentPlayerId,
      });
    }

    this.emitStateChanged();
  }

  movePlayer(playerId: 1 | 2, newPosition: Position): void {
    const player = this.getPlayerMut(playerId);
    player.position = { ...newPosition };
    player.moveCharges = Math.max(0, player.moveCharges - 1);
    this.emit(GameEvent.PlayerMoved, { playerId, position: newPosition });
    this.emitStateChanged();
  }

  knockbackPlayer(playerId: 1 | 2, newPosition: Position): void {
    const player = this.getPlayerMut(playerId);
    player.position = { ...newPosition };
    this.emit(GameEvent.PlayerMoved, { playerId, position: newPosition });
    this.emitStateChanged();
  }

  collectPowerUp(playerId: 1 | 2, powerUpId: string): void {
    const powerUp = this.powerUps.find((p) => p.id === powerUpId);
    if (!powerUp || powerUp.collected) return;

    powerUp.collected = true;
    const player = this.getPlayerMut(playerId);

    // Apply power-up as buff
    if (powerUp.type === PowerUpType.ExtraMove) {
      player.moveCharges += 1;
    } else {
      // Duration 2 accounts for the nextTurn tick at end of collection turn.
      // After tick: 2→1 (survives). Player uses it next turn. Then tick: 1→0 (removed).
      const duration = powerUp.type === PowerUpType.Shield ? -1 : 2;
      player.buffs.push({ type: powerUp.type, remainingTurns: duration });
    }

    this.emit(GameEvent.PowerUpCollected, { playerId, powerUp });
    this.emitStateChanged();
  }

  destroyObstacle(obstacleId: string): void {
    const obstacle = this.obstacles.find((o) => o.id === obstacleId);
    if (!obstacle) return;
    obstacle.destroyed = true;
    this.emit(GameEvent.ObstacleDestroyed, { obstacleId });
    this.emitStateChanged();
  }

  endGameByTimeout(): void {
    const winnerId: 1 | 2 = this.currentPlayerId === 1 ? 2 : 1;
    this.emit(GameEvent.GameOver, { winnerId });
  }

  nextTurn(): void {
    // Tick down buff durations for current player
    const current = this.getPlayerMut(this.currentPlayerId);
    current.buffs = current.buffs.filter((b) => {
      if (b.remainingTurns === -1) return true; // Permanent (like Shield)
      b.remainingTurns -= 1;
      return b.remainingTurns > 0;
    });

    // Switch player
    this.currentPlayerId = this.currentPlayerId === 1 ? 2 : 1;
    this.turnNumber += 1;
    this.phase = TurnPhase.Idle;

    this.emit(GameEvent.TurnChanged, {
      currentPlayerId: this.currentPlayerId,
      turnNumber: this.turnNumber,
    });
    this.emitStateChanged();
  }

  // --- Helpers ---

  hasBuff(playerId: 1 | 2, type: PowerUpType): boolean {
    return this.getPlayerMut(playerId).buffs.some((b) => b.type === type);
  }

  /**
   * Begin batching — suppress `StateChanged` emits until `endBatch()`.
   * Nestable: each `beginBatch()` must have a matching `endBatch()`.
   */
  beginBatch(): void {
    this.batchDepth += 1;
  }

  /**
   * End batching — emit one `StateChanged` if any mutations occurred.
   */
  endBatch(): void {
    this.batchDepth = Math.max(0, this.batchDepth - 1);
    if (this.batchDepth === 0 && this.batchDirty) {
      this.batchDirty = false;
      this.emit(GameEvent.StateChanged, this.getSnapshot());
    }
  }

  private getPlayerMut(id: 1 | 2): PlayerState {
    return this.players[id === 1 ? 0 : 1];
  }

  private clonePlayer(player: PlayerState): PlayerState {
    return {
      ...player,
      position: { ...player.position },
      buffs: player.buffs.map((b) => ({ ...b })),
      skinId: player.skinId,
    };
  }

  private emitStateChanged(): void {
    if (this.batchDepth > 0) {
      this.batchDirty = true;
      return;
    }
    this.emit(GameEvent.StateChanged, this.getSnapshot());
  }
}
