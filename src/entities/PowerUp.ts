import type { Position } from '../core';
import { PowerUpType } from '../config';
import { getPowerUpIconKey } from '../common/icons/canvas-icons';

/**
 * Power-up entity — rendered as an icon on the Phaser canvas.
 * Uses CanvasTexture icons registered by `registerPowerUpIcons()`.
 */
export class PowerUp {
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private icon: Phaser.GameObjects.Image | null = null;

  constructor(
    public readonly id: string,
    public readonly type: PowerUpType,
    public readonly position: Position,
  ) {}

  create(scene: Phaser.Scene): void {
    // Yellow circle background
    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(0xffcc00, 0.8);
    this.graphics.fillCircle(this.position.x, this.position.y, 12);

    // Icon from registered texture
    const key = getPowerUpIconKey(this.type);
    if (scene.textures.exists(key)) {
      this.icon = scene.add.image(this.position.x, this.position.y, key);
      this.icon.setDisplaySize(16, 16);
    }
  }

  setCollected(): void {
    this.graphics?.setVisible(false);
    this.icon?.setVisible(false);
  }

  destroy(): void {
    this.graphics?.destroy();
    this.icon?.destroy();
    this.graphics = null;
    this.icon = null;
  }
}
