/**
 * Canvas icon registry for Phaser.
 *
 * Generates Phaser CanvasTexture for each power-up type using paths
 * derived from lucide icons. These textures can be used with
 * `scene.add.image(x, y, textureKey)`.
 *
 * To swap an icon, update the draw function here — all Phaser consumers
 * stay unchanged.
 */
import { PowerUpType } from '../../config';

/** Texture key prefix — final key is `powerup_<type>` */
const PREFIX = 'powerup_';

/** Icon drawing size (matches lucide viewBox 24×24) */
const DRAW_SIZE = 24;

/** Texture output size (rendered at 2x for sharpness) */
const TEXTURE_SIZE = 48;

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

/**
 * Drawing functions for each power-up icon.
 * Coordinates are in lucide's 24×24 viewBox space.
 * The canvas is pre-scaled so you draw as if it's 24×24.
 */
const POWERUP_DRAWS: Record<PowerUpType, DrawFn> = {
  /* ── Swords (DoubleDamage) ── */
  [PowerUpType.DoubleDamage]: (ctx) => {
    ctx.beginPath();
    // polyline 1
    ctx.moveTo(14.5, 17.5);
    ctx.lineTo(3, 6);
    ctx.lineTo(3, 3);
    ctx.lineTo(6, 3);
    ctx.lineTo(17.5, 14.5);
    ctx.stroke();
    // polyline 2
    ctx.beginPath();
    ctx.moveTo(14.5, 6.5);
    ctx.lineTo(18, 3);
    ctx.lineTo(21, 3);
    ctx.lineTo(21, 6);
    ctx.lineTo(17.5, 9.5);
    ctx.stroke();
    // cross lines
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

  /* ── ArrowLeftToLine (Knockback) ── */
  [PowerUpType.Knockback]: (ctx) => {
    // vertical bar
    ctx.beginPath();
    ctx.moveTo(3, 19);
    ctx.lineTo(3, 5);
    ctx.stroke();
    // arrow head
    ctx.beginPath();
    ctx.moveTo(13, 6);
    ctx.lineTo(7, 12);
    ctx.lineTo(13, 18);
    ctx.stroke();
    // arrow shaft
    ctx.beginPath();
    ctx.moveTo(7, 12);
    ctx.lineTo(21, 12);
    ctx.stroke();
  },

  /* ── Plus (ExtraMove) ── */
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

  /* ── Shield ── */
  [PowerUpType.Shield]: (ctx) => {
    const p = new Path2D(
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    );
    ctx.stroke(p);
  },

  /* ── Flame (Piercing) ── */
  [PowerUpType.Piercing]: (ctx) => {
    const p = new Path2D(
      'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4',
    );
    ctx.stroke(p);
  },
};

/**
 * Register power-up icon textures in the Phaser scene.
 * Call once in `GameScene.create()`.
 *
 * Textures are keyed as `powerup_DoubleDamage`, `powerup_Shield`, etc.
 */
export function registerPowerUpIcons(scene: Phaser.Scene): void {
  const scale = TEXTURE_SIZE / DRAW_SIZE;

  for (const type of Object.values(PowerUpType)) {
    const key = PREFIX + type;

    // Skip if already registered (scene restart)
    if (scene.textures.exists(key)) continue;

    const canvasTex = scene.textures.createCanvas(key, TEXTURE_SIZE, TEXTURE_SIZE);
    const ctx = canvasTex!.getContext();

    ctx.save();
    ctx.scale(scale, scale);

    // Style matching lucide defaults
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'none';

    POWERUP_DRAWS[type](ctx);

    ctx.restore();
    canvasTex!.refresh();
  }
}

/**
 * Get the texture key for a given power-up type.
 */
export function getPowerUpIconKey(type: PowerUpType): string {
  return PREFIX + type;
}
