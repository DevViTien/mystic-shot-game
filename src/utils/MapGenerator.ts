import { MAP, OBSTACLES, POWERUPS, ObstacleType, PowerUpType } from '../config';
import type { Position, ObstacleState, PowerUpState } from '../core';
import type { PresetMap } from '../maps';

export interface MapData {
  obstacles: ObstacleState[];
  powerUps: PowerUpState[];
  player1Pos: Position;
  player2Pos: Position;
}

/**
 * Generates random map content: obstacle and power-up placement.
 * Ensures no overlapping and minimum distance between elements.
 */
export class MapGenerator {
  private static nextId = 0;

  static generate(): MapData {
    this.nextId = 0;
    const occupied: { pos: Position; w: number; h: number }[] = [];

    // Place players on opposite sides
    const player1Pos: Position = {
      x: this.randomRange(MAP.MIN_X + 3, MAP.MIN_X + 8),
      y: this.randomRange(-5, 5),
    };
    const player2Pos: Position = {
      x: this.randomRange(MAP.MAX_X - 8, MAP.MAX_X - 3),
      y: this.randomRange(-5, 5),
    };

    occupied.push({ pos: player1Pos, w: 2, h: 2 });
    occupied.push({ pos: player2Pos, w: 2, h: 2 });

    // Generate obstacles
    const obstacleCount = this.randomInt(OBSTACLES.MIN_COUNT, OBSTACLES.MAX_COUNT);
    const obstacles: ObstacleState[] = [];

    for (let i = 0; i < obstacleCount; i++) {
      const width = this.randomRange(1, 3);
      const height = this.randomRange(1, 4);
      const pos = this.findFreePosition(occupied, width, height);
      if (!pos) continue;

      const type = Math.random() < 0.5 ? ObstacleType.Hard : ObstacleType.Soft;
      obstacles.push({
        id: `obs_${this.nextId++}`,
        type,
        position: pos,
        width,
        height,
        destroyed: false,
      });

      occupied.push({ pos, w: width + 1, h: height + 1 });
    }

    // Generate power-ups
    const powerUpCount = this.randomInt(POWERUPS.MIN_COUNT, POWERUPS.MAX_COUNT);
    const powerUpTypes = Object.values(PowerUpType);
    const powerUps: PowerUpState[] = [];

    for (let i = 0; i < powerUpCount; i++) {
      const pos = this.findFreePosition(occupied, 1, 1);
      if (!pos) continue;

      const type = powerUpTypes[this.randomInt(0, powerUpTypes.length - 1)]!;
      powerUps.push({
        id: `pu_${this.nextId++}`,
        type,
        position: pos,
        collected: false,
      });

      occupied.push({ pos, w: 1.5, h: 1.5 });
    }

    return { obstacles, powerUps, player1Pos, player2Pos };
  }

  private static findFreePosition(
    occupied: { pos: Position; w: number; h: number }[],
    width: number,
    height: number,
    maxAttempts = 80,
  ): Position | null {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const pos: Position = {
        x: this.randomRange(MAP.MIN_X + 3, MAP.MAX_X - 3),
        y: this.randomRange(MAP.MIN_Y + 3, MAP.MAX_Y - 3),
      };

      const overlaps = occupied.some(
        (o) =>
          Math.abs(pos.x - o.pos.x) < (width + o.w) / 2 + 1 &&
          Math.abs(pos.y - o.pos.y) < (height + o.h) / 2 + 1,
      );

      if (!overlaps) return pos;
    }

    return null;
  }

  private static randomRange(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
  }

  private static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Convert a preset map definition into game-ready map data.
   * Assigns unique IDs and initializes runtime state fields.
   */
  static fromPreset(preset: PresetMap): MapData {
    this.nextId = 0;

    const obstacles: ObstacleState[] = preset.obstacles.map((o) => ({
      id: `obs_${this.nextId++}`,
      type: o.type,
      position: { ...o.position },
      width: o.width,
      height: o.height,
      destroyed: false,
    }));

    const powerUps: PowerUpState[] = preset.powerUps.map((p) => ({
      id: `pu_${this.nextId++}`,
      type: p.type,
      position: { ...p.position },
      collected: false,
    }));

    return {
      obstacles,
      powerUps,
      player1Pos: { ...preset.player1Spawn },
      player2Pos: { ...preset.player2Spawn },
    };
  }
}
