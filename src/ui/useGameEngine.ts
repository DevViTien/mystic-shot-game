import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  GameEvent,
  CollisionSystem,
  MoveCommand,
  FireCommand,
  TurnManager,
  TurnEvent,
  ReplayRecorder,
  type GameStateSnapshot,
  type ReplayData,
} from '../core';
import { Difficulty, MAP, PLAYER, PREVIEW } from '../config';
import { MapGenerator } from '../utils/MapGenerator';
import { MapStorage } from '../maps';
import { FunctionParser, GraphRenderer } from '../math';
import type { PhaserGameHandle } from './PhaserGame';
import type { MenuResult } from './MenuScreen';
import type { InputAdapter } from '../network/InputAdapter';
import { LocalInputAdapter } from '../network/LocalInputAdapter';
import {
  RoomManager,
  PresenceManager,
  FirebaseInputAdapter,
  getCurrentUserId,
  type RoomMeta,
  type PlayerInfo,
} from '../network';

export type AppScreen =
  | 'mainMenu'
  | 'localMenu'
  | 'lobby'
  | 'waiting'
  | 'game'
  | 'gameOver'
  | 'replay';

export function useGameEngine() {
  const gameState = useMemo(() => new GameState(), []);
  const turnManager = useMemo(() => new TurnManager(gameState), [gameState]);
  const collisionSystem = useMemo(() => new CollisionSystem(), []);
  const phaserRef = useRef<PhaserGameHandle>(null);

  const [snapshot, setSnapshot] = useState<GameStateSnapshot>(gameState.getSnapshot());
  const [timer, setTimer] = useState(60);
  const [screen, setScreen] = useState<AppScreen>('mainMenu');
  const [winnerId, setWinnerId] = useState<1 | 2 | null>(null);
  const [animating, setAnimating] = useState(false);
  const pendingTurnAction = useRef<'end' | 'reset' | null>(null);

  // Replay state
  const replayRecorder = useMemo(() => new ReplayRecorder(gameState), [gameState]);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [replayProgress, setReplayProgress] = useState({ current: 0, total: 0 });
  const [replayFinished, setReplayFinished] = useState(false);

  // Online state
  const [roomManager] = useState(() => new RoomManager());
  const [presenceManager] = useState(() => new PresenceManager());
  const adapterRef = useRef<InputAdapter | null>(null);
  const [roomMeta, setRoomMeta] = useState<RoomMeta | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [onlineMode, setOnlineMode] = useState(false);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [opponentOnline, setOpponentOnline] = useState(true);
  const guestInitialized = useRef(false);

  // Core event subscriptions (stable deps only)
  useEffect(() => {
    const unsubState = gameState.on(GameEvent.StateChanged, (s) => {
      setSnapshot(s);
    });

    const unsubTimer = turnManager.on(TurnEvent.TimerTick, (seconds) => {
      setTimer(seconds);
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

    // Subscribe to FireComplete — handles timer/animation for ALL fires (local + remote)
    const unsubFireComplete = gameState.on(GameEvent.FireComplete, ({ collectedPowerUps }) => {
      turnManager.pauseTimer();
      setAnimating(true);
      pendingTurnAction.current = collectedPowerUps.length > 0 ? 'reset' : 'end';
    });

    return () => {
      unsubState();
      unsubTimer();
      unsubAnimDone();
      unsubFireComplete();
      turnManager.destroy();
    };
  }, [gameState, turnManager]);

  // GameOver handler — separate effect because it depends on online state
  useEffect(() => {
    const unsubGameOver = gameState.on(GameEvent.GameOver, ({ winnerId }) => {
      replayRecorder.stop();
      setReplayData(replayRecorder.getData());
      setScreen('gameOver');
      setWinnerId(winnerId);
      turnManager.stopTurn();
      if (onlineMode && isHost) {
        roomManager.finishGame(winnerId);
      }
    });
    return () => {
      unsubGameOver();
    };
  }, [gameState, turnManager, onlineMode, isHost, roomManager, replayRecorder]);

  // ── Local play handlers ──

  const handleMove = useCallback(
    (expression: string, direction: 1 | -1) => {
      if (!expression.trim()) return;
      if (onlineMode && adapterRef.current && !adapterRef.current.isMyTurn()) return;
      gameState.emit(GameEvent.PreviewUpdate, null);

      if (onlineMode && adapterRef.current) {
        adapterRef.current.submitMove(expression, direction);
      } else {
        const snap = gameState.getSnapshot();
        new MoveCommand(gameState, snap.currentPlayerId, expression, direction).execute();
      }
    },
    [gameState, onlineMode],
  );

  const handleFire = useCallback(
    (expression: string, direction: 1 | -1) => {
      if (!expression.trim() || animating) return;
      if (onlineMode && adapterRef.current && !adapterRef.current.isMyTurn()) return;
      gameState.emit(GameEvent.PreviewUpdate, null);

      if (onlineMode && adapterRef.current) {
        // Online: adapter handles execute + push to Firebase
        // FireComplete event will handle timer pause + animation state
        adapterRef.current.submitFire(expression, direction);
      } else {
        const snap = gameState.getSnapshot();
        const cmd = new FireCommand(
          gameState,
          collisionSystem,
          snap.currentPlayerId,
          expression,
          direction,
        );
        cmd.execute();
        // FireComplete event handles timer pause + animation state
      }
    },
    [gameState, collisionSystem, animating, onlineMode],
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

      if (evalFn(player.position.x) === undefined) {
        gameState.emit(GameEvent.PreviewUpdate, null);
        return;
      }

      if (mode === 'fire') {
        const startX = player.position.x;
        const endX = direction === 1 ? MAP.MAX_X : MAP.MIN_X;
        const points = GraphRenderer.generatePoints(
          evalFn,
          Math.min(startX, endX),
          Math.max(startX, endX),
          PREVIEW.SAMPLE_STEP,
        );
        const filtered =
          direction === 1
            ? points.filter((p) => p.x >= startX)
            : points.filter((p) => p.x <= startX).reverse();
        gameState.emit(GameEvent.PreviewUpdate, { points: filtered, mode });
      } else {
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

  // ── Local menu start ──

  const handleMenuStart = useCallback(
    (config: MenuResult) => {
      const preset =
        config.mapId && config.mapId !== 'random' ? MapStorage.get(config.mapId) : undefined;
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

      setOnlineMode(false);
      adapterRef.current = new LocalInputAdapter(gameState, collisionSystem);
      replayRecorder.reset();
      replayRecorder.start();
      setScreen('game');
      setWinnerId(null);
      setTimer(60);
      turnManager.startTurn();
    },
    [gameState, turnManager, collisionSystem, replayRecorder],
  );

  // ── Online handlers ──

  const handleCreateRoom = useCallback(
    async (player: PlayerInfo, difficulty: Difficulty, mapId: string) => {
      setLobbyError(null);
      setLobbyLoading(true);
      try {
        await roomManager.authenticate();
        const code = await roomManager.createRoom(player, difficulty, mapId);
        setIsHost(true);
        setOnlineMode(true);

        // Subscribe to meta changes
        roomManager.onMetaChange((meta) => {
          setRoomMeta(meta);
          if (meta.status === 'playing') {
            // Game started — handled by handleOnlineStart
          }
        });

        // Set initial meta for display
        setRoomMeta({
          roomCode: code,
          hostId: getCurrentUserId()!,
          guestId: null,
          status: 'waiting',
          createdAt: Date.now(),
          difficulty,
          mapId,
          host: player,
          guest: null,
        });

        setScreen('waiting');
      } catch (err) {
        setLobbyError(err instanceof Error ? err.message : 'Failed to create room');
      } finally {
        setLobbyLoading(false);
      }
    },
    [roomManager],
  );

  const handleJoinRoom = useCallback(
    async (player: PlayerInfo, roomCode: string) => {
      setLobbyError(null);
      setLobbyLoading(true);
      try {
        await roomManager.authenticate();
        const meta = await roomManager.joinRoom(roomCode, player);
        setIsHost(false);
        setOnlineMode(true);
        setRoomMeta(meta);

        // Subscribe to meta changes (wait for host to start)
        roomManager.onMetaChange((updatedMeta) => {
          setRoomMeta(updatedMeta);
        });

        setScreen('waiting');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to join room';
        if (msg === 'ROOM_NOT_FOUND') setLobbyError('Room not found');
        else if (msg === 'ROOM_FULL_OR_STARTED') setLobbyError('Room is full or already started');
        else if (msg === 'COLOR_CONFLICT') setLobbyError('Choose a different color than the host');
        else setLobbyError(msg);
      } finally {
        setLobbyLoading(false);
      }
    },
    [roomManager],
  );

  const handleOnlineStart = useCallback(async () => {
    if (!roomMeta) return;

    const hostPlayer = roomMeta.host;
    const guestPlayer = roomMeta.guest;
    if (!guestPlayer) return;

    const preset =
      roomMeta.mapId && roomMeta.mapId !== 'random' ? MapStorage.get(roomMeta.mapId) : undefined;
    const map = preset ? MapGenerator.fromPreset(preset) : MapGenerator.generate();
    const startingPlayer: 1 | 2 = Math.random() < 0.5 ? 1 : 2;

    gameState.init({
      player1Name: hostPlayer.name,
      player2Name: guestPlayer.name,
      difficulty: roomMeta.difficulty || Difficulty.Easy,
      obstacles: map.obstacles,
      powerUps: map.powerUps,
      startingPlayer,
      player1Pos: map.player1Pos,
      player2Pos: map.player2Pos,
      player1SkinId: hostPlayer.skinId,
      player2SkinId: guestPlayer.skinId,
    });

    const game = phaserRef.current?.getGame();
    if (game) {
      game.registry.set('p1Color', parseInt(hostPlayer.color.replace('#', ''), 16));
      game.registry.set('p2Color', parseInt(guestPlayer.color.replace('#', ''), 16));
      game.registry.set('p1Skin', hostPlayer.skinId ?? 'classic');
      game.registry.set('p2Skin', guestPlayer.skinId ?? 'classic');

      const menuScene = game.scene.getScene('MenuScene');
      if (menuScene) menuScene.scene.start('GameScene');
    }

    // Write state to Firebase for guest to load
    const stateJson = JSON.stringify(gameState.getSnapshot());
    await roomManager.startGame(stateJson, startingPlayer);

    // Create Firebase adapter
    adapterRef.current = new FirebaseInputAdapter(
      gameState,
      collisionSystem,
      roomManager,
      roomMeta.hostId,
    );

    // Register presence
    const roomId = roomManager.getRoomId();
    if (roomId && roomMeta.guestId) {
      presenceManager.register(roomId);
      presenceManager.onOpponentPresence(roomId, roomMeta.guestId, (online) => {
        setOpponentOnline(online);
      });
    }

    replayRecorder.reset();
    replayRecorder.start();
    setScreen('game');
    setWinnerId(null);
    setTimer(60);
    turnManager.startTurn();
  }, [
    gameState,
    turnManager,
    collisionSystem,
    roomManager,
    presenceManager,
    roomMeta,
    replayRecorder,
  ]);

  // Guest: watch for status='playing' → load state and start local game
  useEffect(() => {
    if (!onlineMode || isHost || !roomMeta || roomMeta.status !== 'playing') return;
    if (guestInitialized.current) return;

    const initGuest = async () => {
      guestInitialized.current = true;
      const roomState = await roomManager.readState();
      if (!roomState) return;

      const snap = JSON.parse(roomState.snapshot);
      // Re-initialize game from host's state
      gameState.init({
        player1Name: snap.players[0].name,
        player2Name: snap.players[1].name,
        difficulty: snap.difficulty || Difficulty.Easy,
        obstacles: snap.obstacles,
        powerUps: snap.powerUps,
        startingPlayer: snap.currentPlayerId,
        player1Pos: snap.players[0].position,
        player2Pos: snap.players[1].position,
        player1SkinId: snap.players[0].skinId,
        player2SkinId: snap.players[1].skinId,
      });

      const game = phaserRef.current?.getGame();
      if (game) {
        game.registry.set('p1Color', parseInt(roomMeta.host.color.replace('#', ''), 16));
        game.registry.set(
          'p2Color',
          parseInt((roomMeta.guest?.color || '#ff4466').replace('#', ''), 16),
        );
        game.registry.set('p1Skin', roomMeta.host.skinId ?? 'classic');
        game.registry.set('p2Skin', roomMeta.guest?.skinId ?? 'classic');

        const menuScene = game.scene.getScene('MenuScene');
        if (menuScene) menuScene.scene.start('GameScene');
      }

      adapterRef.current = new FirebaseInputAdapter(
        gameState,
        collisionSystem,
        roomManager,
        roomMeta.hostId,
      );

      // Presence
      const roomId = roomManager.getRoomId();
      if (roomId) {
        presenceManager.register(roomId);
        presenceManager.onOpponentPresence(roomId, roomMeta.hostId, (online) => {
          setOpponentOnline(online);
        });
      }

      replayRecorder.reset();
      replayRecorder.start();
      setScreen('game');
      setWinnerId(null);
      setTimer(60);
      turnManager.startTurn();
    };

    initGuest();
  }, [
    onlineMode,
    isHost,
    roomMeta,
    gameState,
    turnManager,
    collisionSystem,
    roomManager,
    presenceManager,
    replayRecorder,
  ]);

  // ── Navigation ──

  const handleBackToMenu = useCallback(() => {
    adapterRef.current?.dispose();
    adapterRef.current = null;
    roomManager.dispose();
    presenceManager.dispose();
    guestInitialized.current = false;
    setOnlineMode(false);
    setRoomMeta(null);
    setLobbyError(null);
    setScreen('mainMenu');
    setWinnerId(null);

    const game = phaserRef.current?.getGame();
    if (game) {
      const active = game.scene.getScenes(true)[0];
      active?.scene.start('MenuScene');
    }
  }, [roomManager, presenceManager]);

  const handleCancelRoom = useCallback(async () => {
    await roomManager.leaveRoom();
    presenceManager.dispose();
    setOnlineMode(false);
    setRoomMeta(null);
    setScreen('lobby');
  }, [roomManager, presenceManager]);

  const handleLeaveGame = useCallback(() => {
    turnManager.stopTurn();
    if (onlineMode) {
      // Forfeit: opponent wins
      const myId: 1 | 2 = isHost ? 1 : 2;
      const opponentId: 1 | 2 = myId === 1 ? 2 : 1;
      gameState.emit(GameEvent.GameOver, { winnerId: opponentId });
    } else {
      // Offline: just go back to menu
      handleBackToMenu();
    }
  }, [onlineMode, isHost, gameState, turnManager, handleBackToMenu]);

  // ── Replay handlers ──

  const handleStartReplay = useCallback(() => {
    if (!replayData) return;

    const game = phaserRef.current?.getGame();
    if (!game) return;

    game.registry.set('replayData', replayData);
    game.registry.set('replaySpeed', 1);
    game.registry.set('replayPaused', false);
    game.registry.set('replayFinished', false);
    game.registry.set('replayProgress', { current: 0, total: replayData.entries.length });

    setReplayProgress({ current: 0, total: replayData.entries.length });
    setReplayFinished(false);

    // Listen for progress updates from ReplayScene
    const onProgress = (_: unknown, value: { current: number; total: number }) => {
      setReplayProgress(value);
    };
    const onFinished = (_: unknown, value: boolean) => {
      if (value) setReplayFinished(true);
    };
    game.registry.events.on('changedata-replayProgress', onProgress);
    game.registry.events.on('changedata-replayFinished', onFinished);

    // Start ReplayScene
    const active = game.scene.getScenes(true)[0];
    active?.scene.start('ReplayScene');

    setScreen('replay');
  }, [replayData]);

  const handleReplaySetSpeed = useCallback((speed: number) => {
    const game = phaserRef.current?.getGame();
    game?.registry.set('replaySpeed', speed);
  }, []);

  const handleReplaySetPaused = useCallback((paused: boolean) => {
    const game = phaserRef.current?.getGame();
    game?.registry.set('replayPaused', paused);
  }, []);

  const handleExitReplay = useCallback(() => {
    const game = phaserRef.current?.getGame();
    if (game) {
      game.registry.events.off('changedata-replayProgress');
      game.registry.events.off('changedata-replayFinished');
    }
    setScreen('gameOver');
  }, []);

  return {
    gameState,
    phaserRef,
    snapshot,
    timer,
    screen,
    winnerId,
    animating,
    onlineMode,
    opponentOnline,
    // Online state
    roomMeta,
    isHost,
    lobbyError,
    lobbyLoading,
    // Handlers
    handleMove,
    handleFire,
    handlePreview,
    handleMenuStart,
    handleBackToMenu,
    handleCreateRoom,
    handleJoinRoom,
    handleOnlineStart,
    handleCancelRoom,
    handleLeaveGame,
    // Replay
    replayData,
    replayProgress,
    replayFinished,
    handleStartReplay,
    handleReplaySetSpeed,
    handleReplaySetPaused,
    handleExitReplay,
    setScreen,
  };
}
