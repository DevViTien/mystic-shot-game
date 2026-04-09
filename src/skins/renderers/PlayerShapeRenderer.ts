import type { PlayerSkin, PlayerShape } from '../types';
import type { Position } from '../../core';

/**
 * Renders a player shape on a Phaser Graphics context.
 * Supports circle, star, diamond, hexagon + optional glow/pulse effects.
 */
export const PlayerShapeRenderer = {
  /**
   * Draw the player shape onto the given graphics object.
   */
  draw(
    graphics: Phaser.GameObjects.Graphics,
    position: Position,
    radius: number,
    skin: PlayerSkin,
    color: number,
  ): void {
    graphics.clear();

    // Glow effect — outer glow circle behind the shape
    if (skin.glowEffect) {
      graphics.fillStyle(color, 0.15);
      graphics.fillCircle(position.x, position.y, radius * 2);
    }

    // Main shape
    graphics.fillStyle(color, 1);
    drawShape(graphics, position, radius, skin.shape);
  },

  /**
   * Set up a pulse tween on the graphics container.
   * Call once after entity creation.
   */
  setupPulse(scene: Phaser.Scene, graphics: Phaser.GameObjects.Graphics, skin: PlayerSkin): void {
    if (!skin.pulseAnimation) return;
    scene.tweens.add({
      targets: graphics,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  },
} as const;

function drawShape(
  graphics: Phaser.GameObjects.Graphics,
  pos: Position,
  radius: number,
  shape: PlayerShape,
): void {
  switch (shape) {
    case 'circle':
      graphics.fillCircle(pos.x, pos.y, radius);
      break;

    case 'star':
      fillStar(graphics, pos.x, pos.y, 5, radius, radius * 0.45);
      break;

    case 'diamond':
      fillPolygon(graphics, pos.x, pos.y, 4, radius, Math.PI / 4);
      break;

    case 'hexagon':
      fillPolygon(graphics, pos.x, pos.y, 6, radius, 0);
      break;
  }
}

/** Fill a regular polygon (flat-top for hexagon when angleOffset=0). */
function fillPolygon(
  graphics: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  sides: number,
  radius: number,
  angleOffset: number,
): void {
  const points: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = angleOffset + (2 * Math.PI * i) / sides;
    points.push(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
  }
  graphics.beginPath();
  graphics.moveTo(points[0]!, points[1]!);
  for (let i = 2; i < points.length; i += 2) {
    graphics.lineTo(points[i]!, points[i + 1]!);
  }
  graphics.closePath();
  graphics.fillPath();
}

/** Fill a star with `points` outer vertices. */
function fillStar(
  graphics: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number,
): void {
  const coords: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    coords.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  graphics.beginPath();
  graphics.moveTo(coords[0]!, coords[1]!);
  for (let i = 2; i < coords.length; i += 2) {
    graphics.lineTo(coords[i]!, coords[i + 1]!);
  }
  graphics.closePath();
  graphics.fillPath();
}
