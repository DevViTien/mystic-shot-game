// Game-wide constants derived from the GDD

export const MAP = {
  MIN_X: -25,
  MAX_X: 25,
  MIN_Y: -18,
  MAX_Y: 18,
  WIDTH: 50, // MAX_X - MIN_X
  HEIGHT: 36, // MAX_Y - MIN_Y
} as const;

export const PLAYER = {
  MAX_HP: 100,
  DEFAULT_DAMAGE: 25,
  HITBOX_RADIUS: 0.5,
  INITIAL_MOVE_CHARGES: 2,
  MOVE_ARC_LENGTH: 5,
  MOVE_SAMPLE_STEP: 0.05,
} as const;

export const TURN = {
  DURATION_SECONDS: 60,
  WARNING_THRESHOLD: 10,
} as const;

export const PROJECTILE = {
  SAMPLE_STEP: 0.05, // Δx for collision sampling
} as const;

export const PREVIEW = {
  ENABLED: true, // Toggle trajectory preview on/off
  SAMPLE_STEP: 0.2, // Coarser step for preview performance
} as const;

export const OBSTACLES = {
  MIN_COUNT: 5,
  MAX_COUNT: 10,
} as const;

export const POWERUPS = {
  MIN_COUNT: 3,
  MAX_COUNT: 6,
  DOUBLE_DAMAGE_MULTIPLIER: 2,
  KNOCKBACK_DISTANCE: 2,
} as const;

export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export enum PowerUpType {
  DoubleDamage = 'double_damage',
  Knockback = 'knockback',
  ExtraMove = 'extra_move',
  Shield = 'shield',
  Piercing = 'piercing',
}

export enum ObstacleType {
  Hard = 'hard',
  Soft = 'soft',
}

export enum TurnPhase {
  Idle = 'idle',
  Move = 'move',
  Fire = 'fire',
  Resolve = 'resolve',
}

export const PHASER_CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 864,
  BACKGROUND_COLOR: 0x1a1a2e,
  GRID_COLOR: 0x333355,
  AXIS_COLOR: 0x6666aa,
  PLAYER1_COLOR: 0x00ccff,
  PLAYER2_COLOR: 0xff4466,
} as const;
