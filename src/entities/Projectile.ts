import type { Position } from '../core';
import type { TrailSkin } from '../skins';
import { TrailStyleRenderer } from '../skins';

/** How many trajectory points to advance per frame (~60fps) */
const POINTS_PER_FRAME = 12;

/**
 * Projectile entity — animated orb traveling along a trajectory with glowing trail.
 * Delegates visual rendering to TrailStyleRenderer for skin support.
 */
export class Projectile {
  private trailGraphics: Phaser.GameObjects.Graphics | null = null;
  private orb: Phaser.GameObjects.Graphics | null = null;
  private scene: Phaser.Scene | null = null;
  private currentIndex = 0;
  private animating = false;
  private onComplete: (() => void) | null = null;

  constructor(
    private trajectory: Position[],
    private color: number,
    private skin: TrailSkin = {
      style: 'solid',
      particleEmitter: false,
      widthMultiplier: 1.0,
      fadeSpeed: 1.0,
    },
  ) {}

  create(scene: Phaser.Scene): void {
    this.scene = scene;
    this.trailGraphics = scene.add.graphics();
    this.trailGraphics.setDepth(500);
    this.orb = scene.add.graphics();
    this.orb.setDepth(501);
  }

  /**
   * Animate the projectile along the trajectory.
   * Calls `onComplete` when the animation finishes.
   */
  animate(onComplete: () => void): void {
    if (!this.scene || this.trajectory.length < 2) {
      onComplete();
      return;
    }
    this.onComplete = onComplete;
    this.currentIndex = 0;
    this.animating = true;
    this.scene.events.on('update', this.tick, this);
  }

  private tick = (): void => {
    if (!this.animating || !this.trailGraphics || !this.orb) return;

    // Advance along trajectory
    this.currentIndex = Math.min(this.currentIndex + POINTS_PER_FRAME, this.trajectory.length - 1);

    // Delegate rendering to skin-aware renderer
    TrailStyleRenderer.drawFrame(
      this.trailGraphics,
      this.orb,
      this.trajectory,
      this.currentIndex,
      this.skin,
      this.color,
    );

    // Check if done
    if (this.currentIndex >= this.trajectory.length - 1) {
      this.finishAnimation();
    }
  };

  private finishAnimation(): void {
    this.animating = false;
    this.scene?.events.off('update', this.tick, this);

    // Fade out orb
    if (this.orb && this.scene) {
      this.scene.tweens.add({
        targets: { alpha: 1 },
        alpha: 0,
        duration: 300,
        onUpdate: (_tween, target) => {
          const pos = this.trajectory[this.trajectory.length - 1]!;
          this.orb?.clear();
          this.orb?.fillStyle(this.color, 0.15 * target.alpha);
          this.orb?.fillCircle(pos.x, pos.y, 5 * 3);
          this.orb?.fillStyle(this.color, 0.35 * target.alpha);
          this.orb?.fillCircle(pos.x, pos.y, 5 * 1.8);
          this.orb?.fillStyle(0xffffff, 0.9 * target.alpha);
          this.orb?.fillCircle(pos.x, pos.y, 5 * 0.7);
        },
        onComplete: () => {
          this.orb?.clear();
          this.onComplete?.();
        },
      });
    } else {
      this.onComplete?.();
    }

    // Draw static trail
    if (this.trailGraphics) {
      TrailStyleRenderer.drawStatic(this.trailGraphics, this.trajectory, this.color);
    }
  }

  destroy(): void {
    this.animating = false;
    this.scene?.events.off('update', this.tick, this);
    this.trailGraphics?.destroy();
    this.orb?.destroy();
    this.trailGraphics = null;
    this.orb = null;
    this.scene = null;
    this.onComplete = null;
  }
}
