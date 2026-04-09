import type { TrailSkin } from '../types';
import type { Position } from '../../core';

/** How many trailing points for the bright tail */
const BASE_TAIL_LENGTH = 30;
/** Base orb radius in screen pixels */
const ORB_RADIUS = 5;

/**
 * Renders projectile trail + orb on Phaser Graphics context.
 * Each style produces a different visual while keeping the same API.
 */
export const TrailStyleRenderer = {
  /**
   * Draw the trail up to `currentIndex` and the orb at that index.
   */
  drawFrame(
    trailGraphics: Phaser.GameObjects.Graphics,
    orbGraphics: Phaser.GameObjects.Graphics,
    trajectory: Position[],
    currentIndex: number,
    skin: TrailSkin,
    color: number,
  ): void {
    const tailLength = Math.round(BASE_TAIL_LENGTH * skin.fadeSpeed);
    const tailStart = Math.max(0, currentIndex - tailLength);

    trailGraphics.clear();

    // Dim trail behind the tail
    if (tailStart > 0) {
      trailGraphics.lineStyle(1, color, 0.15);
      trailGraphics.beginPath();
      trailGraphics.moveTo(trajectory[0]!.x, trajectory[0]!.y);
      for (let i = 1; i <= tailStart; i++) {
        trailGraphics.lineTo(trajectory[i]!.x, trajectory[i]!.y);
      }
      trailGraphics.strokePath();
    }

    // Style-specific bright tail
    drawTrailStyle(trailGraphics, trajectory, tailStart, currentIndex, skin, color);

    // Orb
    drawOrb(orbGraphics, trajectory[currentIndex]!, skin, color);
  },

  /**
   * Draw the final static trail after animation finishes.
   */
  drawStatic(
    trailGraphics: Phaser.GameObjects.Graphics,
    trajectory: Position[],
    color: number,
  ): void {
    trailGraphics.clear();
    trailGraphics.lineStyle(1, color, 0.25);
    trailGraphics.beginPath();
    trailGraphics.moveTo(trajectory[0]!.x, trajectory[0]!.y);
    for (let i = 1; i < trajectory.length; i++) {
      trailGraphics.lineTo(trajectory[i]!.x, trajectory[i]!.y);
    }
    trailGraphics.strokePath();
  },
} as const;

// ─── Trail style implementations ───

function drawTrailStyle(
  g: Phaser.GameObjects.Graphics,
  pts: Position[],
  tailStart: number,
  currentIndex: number,
  skin: TrailSkin,
  color: number,
): void {
  const tailLength = Math.round(BASE_TAIL_LENGTH * skin.fadeSpeed);
  const wMul = skin.widthMultiplier;

  switch (skin.style) {
    case 'solid':
      drawSolid(g, pts, tailStart, currentIndex, tailLength, wMul, color);
      break;
    case 'neon':
      drawNeon(g, pts, tailStart, currentIndex, tailLength, wMul, color);
      break;
    case 'rainbow':
      drawRainbow(g, pts, tailStart, currentIndex, tailLength, wMul);
      break;
    case 'fire':
      drawFire(g, pts, tailStart, currentIndex, tailLength, wMul);
      break;
    case 'ice':
      drawIce(g, pts, tailStart, currentIndex, tailLength, wMul);
      break;
    case 'sparkle':
      drawSparkle(g, pts, tailStart, currentIndex, tailLength, wMul, color);
      break;
  }
}

/** Phase 1 original — gradient tail with fading alpha. */
function drawSolid(
  g: Phaser.GameObjects.Graphics,
  pts: Position[],
  tailStart: number,
  currentIndex: number,
  tailLength: number,
  wMul: number,
  color: number,
): void {
  for (let i = tailStart; i < currentIndex; i++) {
    const t = (i - tailStart) / tailLength;
    const alpha = 0.1 + t * 0.7;
    const width = (1 + t * 2) * wMul;
    g.lineStyle(width, color, alpha);
    g.beginPath();
    g.moveTo(pts[i]!.x, pts[i]!.y);
    g.lineTo(pts[i + 1]!.x, pts[i + 1]!.y);
    g.strokePath();
  }
}

/** Like solid but higher alpha + width for glowing neon look. */
function drawNeon(
  g: Phaser.GameObjects.Graphics,
  pts: Position[],
  tailStart: number,
  currentIndex: number,
  tailLength: number,
  wMul: number,
  color: number,
): void {
  for (let i = tailStart; i < currentIndex; i++) {
    const t = (i - tailStart) / tailLength;
    const alpha = Math.min(1, 0.3 + t * 0.7);
    const width = (1.5 + t * 3) * wMul;
    g.lineStyle(width, color, alpha);
    g.beginPath();
    g.moveTo(pts[i]!.x, pts[i]!.y);
    g.lineTo(pts[i + 1]!.x, pts[i + 1]!.y);
    g.strokePath();
  }
}

/** Trail cycles through HSL hue values. */
function drawRainbow(
  g: Phaser.GameObjects.Graphics,
  pts: Position[],
  tailStart: number,
  currentIndex: number,
  tailLength: number,
  wMul: number,
): void {
  for (let i = tailStart; i < currentIndex; i++) {
    const t = (i - tailStart) / tailLength;
    const hue = (i * 6) % 360;
    const rgb = hslToRgb(hue, 90, 55);
    const alpha = 0.2 + t * 0.6;
    const width = (1 + t * 2) * wMul;
    g.lineStyle(width, rgb, alpha);
    g.beginPath();
    g.moveTo(pts[i]!.x, pts[i]!.y);
    g.lineTo(pts[i + 1]!.x, pts[i + 1]!.y);
    g.strokePath();
  }
}

/** Orange-to-red gradient trail. */
function drawFire(
  g: Phaser.GameObjects.Graphics,
  pts: Position[],
  tailStart: number,
  currentIndex: number,
  tailLength: number,
  wMul: number,
): void {
  for (let i = tailStart; i < currentIndex; i++) {
    const t = (i - tailStart) / tailLength;
    // Lerp from orange (0xff6600) to red (0xff0000)
    const r = 0xff;
    const gv = Math.round(0x66 * (1 - t));
    const color = (r << 16) | (gv << 8);
    const alpha = 0.15 + t * 0.7;
    const width = (1 + t * 2.5) * wMul;
    g.lineStyle(width, color, alpha);
    g.beginPath();
    g.moveTo(pts[i]!.x, pts[i]!.y);
    g.lineTo(pts[i + 1]!.x, pts[i + 1]!.y);
    g.strokePath();
  }
}

/** Blue-to-white gradient trail. */
function drawIce(
  g: Phaser.GameObjects.Graphics,
  pts: Position[],
  tailStart: number,
  currentIndex: number,
  tailLength: number,
  wMul: number,
): void {
  for (let i = tailStart; i < currentIndex; i++) {
    const t = (i - tailStart) / tailLength;
    // Lerp from blue (0x0066ff) to white (0xffffff)
    const r = Math.round(0x00 + 0xff * t);
    const gv = Math.round(0x66 + (0xff - 0x66) * t);
    const b = 0xff;
    const color = (r << 16) | (gv << 8) | b;
    const alpha = 0.15 + t * 0.65;
    const width = (1 + t * 2) * wMul;
    g.lineStyle(width, color, alpha);
    g.beginPath();
    g.moveTo(pts[i]!.x, pts[i]!.y);
    g.lineTo(pts[i + 1]!.x, pts[i + 1]!.y);
    g.strokePath();
  }
}

/** Solid trail + small sparkle dots at intervals. */
function drawSparkle(
  g: Phaser.GameObjects.Graphics,
  pts: Position[],
  tailStart: number,
  currentIndex: number,
  tailLength: number,
  wMul: number,
  color: number,
): void {
  // Base solid trail
  drawSolid(g, pts, tailStart, currentIndex, tailLength, wMul, color);

  // Sparkle dots every 4th point
  for (let i = tailStart; i < currentIndex; i += 4) {
    const t = (i - tailStart) / tailLength;
    const alpha = 0.3 + t * 0.5;
    // Small random offset for sparkle feel using deterministic seed
    const ox = ((i * 7) % 7) - 3;
    const oy = ((i * 13) % 7) - 3;
    g.fillStyle(0xffffff, alpha);
    g.fillCircle(pts[i]!.x + ox, pts[i]!.y + oy, 1.5);
  }
}

// ─── Orb rendering ───

function drawOrb(
  orbGraphics: Phaser.GameObjects.Graphics,
  pos: Position,
  skin: TrailSkin,
  color: number,
): void {
  orbGraphics.clear();
  const glowMul = skin.style === 'neon' ? 1.5 : 1.0;

  // Outer glow
  orbGraphics.fillStyle(color, 0.15);
  orbGraphics.fillCircle(pos.x, pos.y, ORB_RADIUS * 3 * glowMul);
  // Mid glow
  orbGraphics.fillStyle(color, 0.35);
  orbGraphics.fillCircle(pos.x, pos.y, ORB_RADIUS * 1.8 * glowMul);
  // Core
  orbGraphics.fillStyle(0xffffff, 0.9);
  orbGraphics.fillCircle(pos.x, pos.y, ORB_RADIUS * 0.7);
}

// ─── Color utils ───

function hslToRgb(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}
