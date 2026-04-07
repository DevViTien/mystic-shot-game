import type { Position } from '../core';
import { MAP, PROJECTILE } from '../config';

/**
 * GraphRenderer — generates points for drawing function graphs on the Phaser canvas.
 * Actual Phaser drawing is done by the scene; this module provides the data.
 */
export class GraphRenderer {
  /**
   * Generate an array of points for rendering a function graph.
   *
   * @param evalFn - Evaluator function (already translated to player origin)
   * @param startX - Starting x coordinate
   * @param endX - Ending x coordinate (defaults to map bounds)
   * @param step - Sampling step (defaults to PROJECTILE.SAMPLE_STEP)
   */
  static generatePoints(
    evalFn: (x: number) => number | undefined,
    startX: number = MAP.MIN_X,
    endX: number = MAP.MAX_X,
    step: number = PROJECTILE.SAMPLE_STEP,
  ): Position[] {
    const points: Position[] = [];

    for (let x = startX; x <= endX; x += step) {
      const y = evalFn(x);
      if (y === undefined || !Number.isFinite(y)) continue;
      if (y < MAP.MIN_Y || y > MAP.MAX_Y) continue;
      points.push({ x, y });
    }

    return points;
  }
}
