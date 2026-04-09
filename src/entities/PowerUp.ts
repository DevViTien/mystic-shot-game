import type { Position } from '../core';
import { PowerUpType } from '../config';
import type { PowerUpTheme } from '../skins';
import {
  getThemedPowerUpIconKey,
  getThemeBgColor,
  getThemeBgAlpha,
} from '../skins';

/**
 * Power-up entity — rendered as an icon on the Phaser canvas.
 * Supports themed textures via PowerUpThemeRenderer.
 * Falls back to legacy `powerup_{type}` key for backward compat.
 */
export class PowerUp {
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private icon: Phaser.GameObjects.Image | null = null;

  constructor(
    public readonly id: string,
    public readonly type: PowerUpType,
    public readonly position: Position,
    private theme: PowerUpTheme = 'classic',
  ) {}

  create(scene: Phaser.Scene): void {
    // Themed background circle
    const bgColor = getThemeBgColor(this.theme);
    const bgAlpha = getThemeBgAlpha(this.theme);

    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(bgColor, bgAlpha);
    this.graphics.fillCircle(this.position.x, this.position.y, 12);

    // Try themed texture key first, fallback to legacy
    const themedKey = getThemedPowerUpIconKey(this.theme, this.type);
    const legacyKey = 'powerup_' + this.type;
    const key = scene.textures.exists(themedKey) ? themedKey : legacyKey;

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
