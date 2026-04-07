import Phaser from 'phaser';

/**
 * Menu scene — idle placeholder while React MenuScreen overlay is active.
 * All menu logic is handled by React; this scene is intentionally blank.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Intentionally empty — React MenuScreen handles all menu UI and input.
  }
}
