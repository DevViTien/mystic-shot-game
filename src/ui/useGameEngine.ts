import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  GameEvent,
  CollisionSystem,
  MoveCommand,
  FireCommand,
  TurnManager,
  TurnEvent,
  type GameStateSnapshot,
} from '../core';
import { Difficulty } from '../config';
import { MapGenerator } from '../utils/MapGenerator';
import type { PhaserGameHandle } from './PhaserGame';
import type { MenuResult } from './MenuScreen';

export function useGameEngine() {
  const gameState = useMemo(() => new GameState(), []);
  const turnManager = useMemo(() => new TurnManager(gameState), [gameState]);
  const collisionSystem = useMemo(() => new CollisionSystem(), []);
  const phaserRef = useRef<PhaserGameHandle>(null);

  const [snapshot, setSnapshot] = useState<GameStateSnapshot>(gameState.getSnapshot());
  const [timer, setTimer] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winnerId, setWinnerId] = useState<1 | 2 | null>(null);
  const [animating, setAnimating] = useState(false);
  const pendingTurnAction = useRef<'end' | 'reset' | null>(null);

  useEffect(() => {
    const unsubState = gameState.on(GameEvent.StateChanged, (s) => {
      setSnapshot(s);
    });

    const unsubTimer = turnManager.on(TurnEvent.TimerTick, (seconds) => {
      setTimer(seconds);
    });

    const unsubGameOver = gameState.on(GameEvent.GameOver, ({ winnerId }) => {
      setGameOver(true);
      setWinnerId(winnerId);
      turnManager.stopTurn();
    });

    const unsubAnimDone = gameState.on(GameEvent.FireAnimationDone, () => {
      setAnimating(false);
      const action = pendingTurnAction.current;
      pendingTurnAction.current = null;
      if (action === 'reset') {
        turnManager.resetTimer();
      } else if (action === 'end') {
        turnManager.endTurn();
      }
    });

    return () => {
      unsubState();
      unsubTimer();
      unsubGameOver();
      unsubAnimDone();
      turnManager.destroy();
    };
  }, [gameState, turnManager]);

  const handleMove = useCallback(
    (expression: string, direction: 1 | -1) => {
      if (!expression.trim()) return;
      const snap = gameState.getSnapshot();
      new MoveCommand(gameState, snap.currentPlayerId, expression, direction).execute();
    },
    [gameState],
  );

  const handleFire = useCallback(
    (expression: string, direction: 1 | -1) => {
      if (!expression.trim() || animating) return;
      const snap = gameState.getSnapshot();
      const cmd = new FireCommand(
        gameState,
        collisionSystem,
        snap.currentPlayerId,
        expression,
        direction,
      );
      cmd.execute();

      // Pause timer during animation
      turnManager.pauseTimer();
      setAnimating(true);

      const result = cmd.getResult();
      pendingTurnAction.current = result && result.collectedPowerUps.length > 0 ? 'reset' : 'end';
    },
    [gameState, turnManager, collisionSystem, animating],
  );

  const handleMenuStart = useCallback(
    (config: MenuResult) => {
      const map = MapGenerator.generate();
      const startingPlayer: 1 | 2 = Math.random() < 0.5 ? 1 : 2;
      gameState.init({
        player1Name: config.player1.name || 'Player 1',
        player2Name: config.player2.name || 'Player 2',
        difficulty: config.difficulty || Difficulty.Easy,
        obstacles: map.obstacles,
        powerUps: map.powerUps,
        startingPlayer,
        player1Pos: map.player1Pos,
        player2Pos: map.player2Pos,
      });

      const game = phaserRef.current?.getGame();
      if (game) {
        game.registry.set('p1Color', parseInt(config.player1.color.replace('#', ''), 16));
        game.registry.set('p2Color', parseInt(config.player2.color.replace('#', ''), 16));

        const menuScene = game.scene.getScene('MenuScene');
        if (menuScene) {
          menuScene.scene.start('GameScene');
        }
      }

      setGameStarted(true);
      setGameOver(false);
      setWinnerId(null);
      setTimer(60);
      turnManager.startTurn();
    },
    [gameState, turnManager],
  );

  const handleBackToMenu = useCallback(() => {
    setGameStarted(false);
    setGameOver(false);
    setWinnerId(null);
    const game = phaserRef.current?.getGame();
    if (game) {
      const active = game.scene.getScenes(true)[0];
      active?.scene.start('MenuScene');
    }
  }, []);

  return {
    gameState,
    phaserRef,
    snapshot,
    timer,
    gameStarted,
    gameOver,
    winnerId,
    animating,
    handleMove,
    handleFire,
    handleMenuStart,
    handleBackToMenu,
  };
}
