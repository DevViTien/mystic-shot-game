import { PowerUpType } from '../../config';
import type { PowerUpTheme } from '../types';

/** Texture output size (rendered at 2×24 for sharpness) */
const DRAW_SIZE = 24;
const TEXTURE_SIZE = 48;

/** Theme → background color + stroke style config */
interface ThemeStyle {
  bgColor: string;
  bgAlpha: number;
  strokeColor: string;
  lineWidth: number;
  lineCap: CanvasLineCap;
}

const THEME_STYLES: Record<PowerUpTheme, ThemeStyle> = {
  classic: {
    bgColor: '#ffcc00',
    bgAlpha: 0.8,
    strokeColor: '#000000',
    lineWidth: 2,
    lineCap: 'round',
  },
  pixel: {
    bgColor: '#44ff66',
    bgAlpha: 0.8,
    strokeColor: '#000000',
    lineWidth: 3,
    lineCap: 'square',
  },
  magical: {
    bgColor: '#aa66ff',
    bgAlpha: 0.8,
    strokeColor: '#ffffff',
    lineWidth: 2,
    lineCap: 'round',
  },
  tech: {
    bgColor: '#00ccff',
    bgAlpha: 0.8,
    strokeColor: '#ffffff',
    lineWidth: 1.5,
    lineCap: 'butt',
  },
};

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

/**
 * Icon drawing functions — same as canvas-icons.ts originals.
 * Shared across all themes (only stroke/fill style differs).
 */
const POWERUP_DRAWS: Record<PowerUpType, DrawFn> = {
  [PowerUpType.DoubleDamage]: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(14.5, 17.5);
    ctx.lineTo(3, 6);
    ctx.lineTo(3, 3);
    ctx.lineTo(6, 3);
    ctx.lineTo(17.5, 14.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14.5, 6.5);
    ctx.lineTo(18, 3);
    ctx.lineTo(21, 3);
    ctx.lineTo(21, 6);
    ctx.lineTo(17.5, 9.5);
    ctx.stroke();
    const lines: [number, number, number, number][] = [
      [13, 19, 19, 13],
      [16, 16, 20, 20],
      [19, 21, 21, 19],
      [5, 14, 9, 18],
      [7, 17, 4, 20],
      [3, 19, 5, 21],
    ];
    for (const [x1, y1, x2, y2] of lines) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  },
  [PowerUpType.Knockback]: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(3, 19);
    ctx.lineTo(3, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(13, 6);
    ctx.lineTo(7, 12);
    ctx.lineTo(13, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, 12);
    ctx.lineTo(21, 12);
    ctx.stroke();
  },
  [PowerUpType.ExtraMove]: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(5, 12);
    ctx.lineTo(19, 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, 5);
    ctx.lineTo(12, 19);
    ctx.stroke();
  },
  [PowerUpType.Shield]: (ctx) => {
    const p = new Path2D(
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    );
    ctx.stroke(p);
  },
  [PowerUpType.Piercing]: (ctx) => {
    const p = new Path2D(
      'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4',
    );
    ctx.stroke(p);
  },
};

/**
 * Register themed power-up icon textures in the Phaser scene.
 * Texture key format: `powerup_{theme}_{type}`.
 */
export function registerThemedPowerUpIcons(scene: Phaser.Scene, theme: PowerUpTheme): void {
  const scale = TEXTURE_SIZE / DRAW_SIZE;
  const style = THEME_STYLES[theme];

  for (const type of Object.values(PowerUpType)) {
    const key = getThemedPowerUpIconKey(theme, type);
    if (scene.textures.exists(key)) continue;

    const canvasTex = scene.textures.createCanvas(key, TEXTURE_SIZE, TEXTURE_SIZE);
    const ctx = canvasTex!.getContext();

    ctx.save();
    ctx.scale(scale, scale);

    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.lineWidth;
    ctx.lineCap = style.lineCap;
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'none';

    POWERUP_DRAWS[type](ctx);

    ctx.restore();
    canvasTex!.refresh();
  }
}

/**
 * Get the texture key for a themed power-up icon.
 */
export function getThemedPowerUpIconKey(theme: PowerUpTheme, type: PowerUpType): string {
  return `powerup_${theme}_${type}`;
}

/**
 * Get the background color for a power-up theme.
 */
export function getThemeBgColor(theme: PowerUpTheme): number {
  const hex = THEME_STYLES[theme].bgColor;
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Get the background alpha for a power-up theme.
 */
export function getThemeBgAlpha(theme: PowerUpTheme): number {
  return THEME_STYLES[theme].bgAlpha;
}
