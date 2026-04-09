import type { Position } from '../core';
import type { PlayerSkin } from '../skins';
import { PlayerShapeRenderer } from '../skins';

/**
 * Player entity — represents a player on the Phaser canvas.
 * Delegates shape rendering to PlayerShapeRenderer for skin support.
 */
export class Player {
  private graphics: Phaser.GameObjects.Graphics | null = null;

  constructor(
    public readonly id: 1 | 2,
    public position: Position,
    private color: number,
    private radius: number,
    private skin: PlayerSkin = { shape: 'circle', glowEffect: false, pulseAnimation: false },
  ) {}

  create(scene: Phaser.Scene): void {
    this.graphics = scene.add.graphics();
    this.draw();
    PlayerShapeRenderer.setupPulse(scene, this.graphics, this.skin);
  }

  draw(): void {
    if (!this.graphics) return;
    PlayerShapeRenderer.draw(this.graphics, this.position, this.radius, this.skin, this.color);
  }

  updatePosition(pos: Position): void {
    this.position = { ...pos };
    this.draw();
  }

  destroy(): void {
    this.graphics?.destroy();
    this.graphics = null;
  }
}
