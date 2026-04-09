import type { ObstacleType, PowerUpType, Difficulty } from '../config';

export interface PresetMapObstacle {
  type: ObstacleType;
  position: { x: number; y: number };
  width: number;
  height: number;
}

export interface PresetMapPowerUp {
  type: PowerUpType;
  position: { x: number; y: number };
}

export interface PresetMap {
  id: string;
  nameKey: string;
  descriptionKey: string;
  player1Spawn: { x: number; y: number };
  player2Spawn: { x: number; y: number };
  obstacles: PresetMapObstacle[];
  powerUps: PresetMapPowerUp[];
  suggestedDifficulty?: Difficulty;
  tags?: string[];
}
