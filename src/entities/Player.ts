import type { Position } from '../core';

/**
 * Player entity — represents a player on the Phaser canvas.
 * Wraps a Phaser circle game object.
 */
export class Player {
  private graphics: Phaser.GameObjects.Graphics | null = null;

  constructor(
    public readonly id: 1 | 2,
    public position: Position,
    private color: number,
    private radius: number,
  ) {}

  create(scene: Phaser.Scene): void {
    this.graphics = scene.add.graphics();
    this.draw();
  }

  draw(): void {
    if (!this.graphics) return;
    this.graphics.clear();
    this.graphics.fillStyle(this.color, 1);
    this.graphics.fillCircle(this.position.x, this.position.y, this.radius);
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
