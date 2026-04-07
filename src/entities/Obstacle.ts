import type { Position } from '../core';
import { ObstacleType } from '../config';

/**
 * Obstacle entity — rendered as a rectangle on the Phaser canvas.
 * Hard obstacles are solid fill, soft obstacles use dashed outline.
 */
export class Obstacle {
  private graphics: Phaser.GameObjects.Graphics | null = null;

  constructor(
    public readonly id: string,
    public readonly type: ObstacleType,
    public readonly position: Position,
    public readonly width: number,
    public readonly height: number,
  ) {}

  create(scene: Phaser.Scene): void {
    this.graphics = scene.add.graphics();
    this.draw();
  }

  draw(): void {
    if (!this.graphics) return;
    this.graphics.clear();

    const x = this.position.x - this.width / 2;
    const y = this.position.y - this.height / 2;

    if (this.type === ObstacleType.Hard) {
      this.graphics.fillStyle(0x888888, 1);
      this.graphics.lineStyle(2, 0xaaaaaa, 1);
      this.graphics.fillRect(x, y, this.width, this.height);
      this.graphics.strokeRect(x, y, this.width, this.height);
    } else {
      this.graphics.fillStyle(0x666666, 0.4);
      this.graphics.lineStyle(2, 0x999999, 0.6);
      this.graphics.fillRect(x, y, this.width, this.height);
      this.graphics.strokeRect(x, y, this.width, this.height);
    }
  }

  setDestroyed(): void {
    this.graphics?.setVisible(false);
  }

  destroy(): void {
    this.graphics?.destroy();
    this.graphics = null;
  }
}
