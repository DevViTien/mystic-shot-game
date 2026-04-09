import { MAP } from '../config';
import { distance } from '../utils/MathUtils';
import type { PresetMap } from './types';

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a preset map against game constraints.
 * Intended for build-time / test-time validation, not runtime.
 */
export function validatePresetMap(map: PresetMap): ValidationError[] {
  const errors: ValidationError[] = [];

  // Spawn within bounds
  if (!inBounds(map.player1Spawn)) {
    errors.push({ field: 'player1Spawn', message: 'Player 1 spawn out of bounds' });
  }
  if (!inBounds(map.player2Spawn)) {
    errors.push({ field: 'player2Spawn', message: 'Player 2 spawn out of bounds' });
  }

  // Spawn distance ≥ 10
  const spawnDist = distance(map.player1Spawn, map.player2Spawn);
  if (spawnDist < 10) {
    errors.push({
      field: 'spawns',
      message: `Spawn distance ${spawnDist.toFixed(1)} < 10 minimum`,
    });
  }

  // Obstacles within bounds + no overlap with spawns
  const spawns = [map.player1Spawn, map.player2Spawn];
  for (let i = 0; i < map.obstacles.length; i++) {
    const obs = map.obstacles[i]!;
    if (!inBounds(obs.position)) {
      errors.push({ field: `obstacles[${i}]`, message: 'Obstacle out of bounds' });
    }
    for (const spawn of spawns) {
      if (
        Math.abs(obs.position.x - spawn.x) < obs.width / 2 + 1 &&
        Math.abs(obs.position.y - spawn.y) < obs.height / 2 + 1
      ) {
        errors.push({ field: `obstacles[${i}]`, message: 'Obstacle overlaps spawn' });
      }
    }
    // No overlap with other obstacles
    for (let j = i + 1; j < map.obstacles.length; j++) {
      const other = map.obstacles[j]!;
      if (
        Math.abs(obs.position.x - other.position.x) < (obs.width + other.width) / 2 + 0.5 &&
        Math.abs(obs.position.y - other.position.y) < (obs.height + other.height) / 2 + 0.5
      ) {
        errors.push({
          field: `obstacles[${i}]`,
          message: `Overlaps obstacle[${j}]`,
        });
      }
    }
  }

  // Power-ups within bounds + no overlap with spawns/obstacles
  for (let i = 0; i < map.powerUps.length; i++) {
    const pu = map.powerUps[i]!;
    if (!inBounds(pu.position)) {
      errors.push({ field: `powerUps[${i}]`, message: 'Power-up out of bounds' });
    }
    for (const spawn of spawns) {
      if (distance(pu.position, spawn) < 1.5) {
        errors.push({ field: `powerUps[${i}]`, message: 'Power-up too close to spawn' });
      }
    }
    for (const obs of map.obstacles) {
      if (
        Math.abs(pu.position.x - obs.position.x) < obs.width / 2 + 0.5 &&
        Math.abs(pu.position.y - obs.position.y) < obs.height / 2 + 0.5
      ) {
        errors.push({ field: `powerUps[${i}]`, message: 'Power-up overlaps obstacle' });
      }
    }
  }

  return errors;
}

function inBounds(pos: { x: number; y: number }): boolean {
  return pos.x >= MAP.MIN_X && pos.x <= MAP.MAX_X && pos.y >= MAP.MIN_Y && pos.y <= MAP.MAX_Y;
}
