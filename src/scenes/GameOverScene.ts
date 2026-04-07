import Phaser from 'phaser';

/**
 * Game over scene — idle placeholder while React GameOverOverlay is active.
 * All game-over UI is handled by React; this scene is intentionally blank.
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    // Intentionally empty — React GameOverOverlay handles all UI and input.
  }
}
