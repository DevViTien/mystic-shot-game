import type { Position } from '../core';

/** How many trajectory points to advance per frame (~60fps) */
const POINTS_PER_FRAME = 12;
/** How many trailing points to keep for the glow tail */
const TAIL_LENGTH = 30;
/** Orb radius in screen pixels */
const ORB_RADIUS = 5;

/**
 * Projectile entity — animated orb traveling along a trajectory with glowing trail.
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

    // Draw trail (fading tail)
    this.trailGraphics.clear();
    const tailStart = Math.max(0, this.currentIndex - TAIL_LENGTH);

    // Dim trail behind the tail
    if (tailStart > 0) {
      this.trailGraphics.lineStyle(1, this.color, 0.15);
      this.trailGraphics.beginPath();
      this.trailGraphics.moveTo(this.trajectory[0]!.x, this.trajectory[0]!.y);
      for (let i = 1; i <= tailStart; i++) {
        this.trailGraphics.lineTo(this.trajectory[i]!.x, this.trajectory[i]!.y);
      }
      this.trailGraphics.strokePath();
    }

    // Bright gradient tail
    for (let i = tailStart; i < this.currentIndex; i++) {
      const t = (i - tailStart) / TAIL_LENGTH; // 0 → 1 (dim → bright)
      const alpha = 0.1 + t * 0.7;
      const width = 1 + t * 2;
      this.trailGraphics.lineStyle(width, this.color, alpha);
      this.trailGraphics.beginPath();
      this.trailGraphics.moveTo(this.trajectory[i]!.x, this.trajectory[i]!.y);
      this.trailGraphics.lineTo(this.trajectory[i + 1]!.x, this.trajectory[i + 1]!.y);
      this.trailGraphics.strokePath();
    }

    // Draw orb (glowing circle)
    const pos = this.trajectory[this.currentIndex]!;
    this.orb.clear();
    // Outer glow
    this.orb.fillStyle(this.color, 0.15);
    this.orb.fillCircle(pos.x, pos.y, ORB_RADIUS * 3);
    // Mid glow
    this.orb.fillStyle(this.color, 0.35);
    this.orb.fillCircle(pos.x, pos.y, ORB_RADIUS * 1.8);
    // Core
    this.orb.fillStyle(0xffffff, 0.9);
    this.orb.fillCircle(pos.x, pos.y, ORB_RADIUS * 0.7);

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
          this.orb?.fillCircle(pos.x, pos.y, ORB_RADIUS * 3);
          this.orb?.fillStyle(this.color, 0.35 * target.alpha);
          this.orb?.fillCircle(pos.x, pos.y, ORB_RADIUS * 1.8);
          this.orb?.fillStyle(0xffffff, 0.9 * target.alpha);
          this.orb?.fillCircle(pos.x, pos.y, ORB_RADIUS * 0.7);
        },
        onComplete: () => {
          this.orb?.clear();
          this.onComplete?.();
        },
      });
    } else {
      this.onComplete?.();
    }

    // Fade trail to static dim line
    if (this.trailGraphics) {
      this.trailGraphics.clear();
      this.trailGraphics.lineStyle(1, this.color, 0.25);
      this.trailGraphics.beginPath();
      this.trailGraphics.moveTo(this.trajectory[0]!.x, this.trajectory[0]!.y);
      for (let i = 1; i < this.trajectory.length; i++) {
        this.trailGraphics.lineTo(this.trajectory[i]!.x, this.trajectory[i]!.y);
      }
      this.trailGraphics.strokePath();
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
