import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Phaser from 'phaser';
import { PHASER_CONFIG } from '../config';
import { GameScene } from '../scenes/GameScene';
import { MenuScene } from '../scenes/MenuScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { ReplayScene } from '../scenes/ReplayScene';
import type { GameState } from '../core';

interface PhaserGameProps {
  gameState: GameState;
}

export interface PhaserGameHandle {
  getGame(): Phaser.Game | null;
}

/**
 * React component that mounts the Phaser game canvas.
 * Passes GameState to scenes for bidirectional communication.
 */
export const PhaserGame = forwardRef<PhaserGameHandle, PhaserGameProps>(function PhaserGame(
  { gameState },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useImperativeHandle(ref, () => ({
    getGame: () => gameRef.current,
  }));

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: PHASER_CONFIG.CANVAS_WIDTH,
      height: PHASER_CONFIG.CANVAS_HEIGHT,
      parent: containerRef.current,
      backgroundColor: PHASER_CONFIG.BACKGROUND_COLOR,
      scene: [MenuScene, GameScene, GameOverScene, ReplayScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Share GameState with all Phaser scenes via registry
    game.registry.set('gameState', gameState);

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [gameState]);

  return <div ref={containerRef} id="phaser-container" />;
});
