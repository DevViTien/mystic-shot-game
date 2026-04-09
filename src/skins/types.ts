// ─── Skin Type Definitions ───

export type PlayerShape = 'circle' | 'star' | 'diamond' | 'hexagon';
export type TrailStyle = 'solid' | 'sparkle' | 'rainbow' | 'fire' | 'ice' | 'neon';
export type PowerUpTheme = 'classic' | 'pixel' | 'magical' | 'tech';

export interface PlayerSkin {
  shape: PlayerShape;
  glowEffect: boolean;
  pulseAnimation: boolean;
}

export interface TrailSkin {
  style: TrailStyle;
  particleEmitter: boolean;
  /** Width multiplier for trail (0.5–2.0) */
  widthMultiplier: number;
  /** Fade speed multiplier (0.5–2.0) */
  fadeSpeed: number;
}

export interface PowerUpSkin {
  theme: PowerUpTheme;
}

export interface SkinSet {
  id: string;
  nameKey: string;
  player: PlayerSkin;
  trail: TrailSkin;
  powerUp: PowerUpSkin;
}
