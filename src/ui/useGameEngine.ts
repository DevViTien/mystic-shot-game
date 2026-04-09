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
import { Difficulty, MAP, PLAYER, PREVIEW } from '../config';
import { MapGenerator } from '../utils/MapGenerator';
import { MapStorage } from '../maps';
import { FunctionParser, GraphRenderer } from '../math';
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
      gameState.emit(GameEvent.PreviewUpdate, null);
      const snap = gameState.getSnapshot();
      new MoveCommand(gameState, snap.currentPlayerId, expression, direction).execute();
    },
    [gameState],
  );

  const handleFire = useCallback(
    (expression: string, direction: 1 | -1) => {
      if (!expression.trim() || animating) return;
      gameState.emit(GameEvent.PreviewUpdate, null);
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

  const handlePreview = useCallback(
    (expression: string, direction: 1 | -1, mode: 'fire' | 'move') => {
      if (!PREVIEW.ENABLED || !expression.trim()) {
        gameState.emit(GameEvent.PreviewUpdate, null);
        return;
      }

      const snap = gameState.getSnapshot();
      const player = snap.players[snap.currentPlayerId - 1]!;
      const evalFn = FunctionParser.createTranslatedEvaluator(
        expression,
        player.position.x,
        player.position.y,
      );

      // Quick validity check
      if (evalFn(player.position.x) === undefined) {
        gameState.emit(GameEvent.PreviewUpdate, null);
        return;
      }

      if (mode === 'fire') {
        const startX = player.position.x;
        const endX = direction === 1 ? MAP.MAX_X : MAP.MIN_X;
        const points = GraphRenderer.generatePoints(evalFn, Math.min(startX, endX), Math.max(startX, endX), PREVIEW.SAMPLE_STEP);
        // Filter to correct direction from player
        const filtered = direction === 1
          ? points.filter((p) => p.x >= startX)
          : points.filter((p) => p.x <= startX).reverse();
        gameState.emit(GameEvent.PreviewUpdate, { points: filtered, mode });
      } else {
        // Move mode: trace along arc length limit
        const step = PLAYER.MOVE_SAMPLE_STEP;
        const maxArc = PLAYER.MOVE_ARC_LENGTH;
        let arcLength = 0;
        let prev = { ...player.position };
        const movePoints: { x: number; y: number }[] = [{ ...player.position }];

        for (
          let x = player.position.x + step * direction;
          direction === 1 ? x <= MAP.MAX_X : x >= MAP.MIN_X;
          x += step * direction
        ) {
          const y = evalFn(x);
          if (y === undefined || !Number.isFinite(y)) break;
          if (y > MAP.MAX_Y || y < MAP.MIN_Y) break;

          const dx = x - prev.x;
          const dy = y - prev.y;
          arcLength += Math.sqrt(dx * dx + dy * dy);
          if (arcLength > maxArc) break;

          prev = { x, y };
          movePoints.push({ x, y });
        }

        gameState.emit(GameEvent.PreviewUpdate, { points: movePoints, mode });
      }
    },
    [gameState],
  );

  const handleMenuStart = useCallback(
    (config: MenuResult) => {
      const preset = config.mapId && config.mapId !== 'random' ? MapStorage.get(config.mapId) : undefined;
      const map = preset ? MapGenerator.fromPreset(preset) : MapGenerator.generate();
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
        player1SkinId: config.player1.skinId,
        player2SkinId: config.player2.skinId,
      });

      const game = phaserRef.current?.getGame();
      if (game) {
        game.registry.set('p1Color', parseInt(config.player1.color.replace('#', ''), 16));
        game.registry.set('p2Color', parseInt(config.player2.color.replace('#', ''), 16));
        game.registry.set('p1Skin', config.player1.skinId ?? 'classic');
        game.registry.set('p2Skin', config.player2.skinId ?? 'classic');

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
    handlePreview,
    handleMenuStart,
    handleBackToMenu,
  };
}
