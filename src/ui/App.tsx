import { PhaserGame } from './PhaserGame';
import { MenuScreen } from './MenuScreen';
import { MainMenu } from './MainMenu';
import { LobbyScreen } from './LobbyScreen';
import { WaitingRoom } from './WaitingRoom';
import { useTheme } from './ThemeToggle';
import { useGameEngine } from './useGameEngine';
import { HudHeader } from './HudHeader';
import { ControlFooter } from './ControlFooter';
import { GameOverOverlay } from './GameOverOverlay';

export function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const {
    gameState,
    phaserRef,
    snapshot,
    timer,
    screen,
    winnerId,
    animating,
    onlineMode,
    opponentOnline,
    roomMeta,
    isHost,
    lobbyError,
    lobbyLoading,
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
    setScreen,
  } = useGameEngine();

  const isMyTurn = !onlineMode || snapshot.currentPlayerId === (isHost ? 1 : 2);

  return (
    <div className="flex flex-col h-screen">
      {screen === 'mainMenu' && (
        <MainMenu
          onLocal={() => setScreen('localMenu')}
          onOnline={() => setScreen('lobby')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {screen === 'localMenu' && (
        <MenuScreen
          onStart={handleMenuStart}
          onBack={() => setScreen('mainMenu')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          onCreateRoom={(cfg) => handleCreateRoom(cfg.player, cfg.difficulty, cfg.mapId)}
          onJoinRoom={(cfg) => handleJoinRoom(cfg.player, cfg.roomCode)}
          onBack={() => setScreen('mainMenu')}
          loading={lobbyLoading}
          error={lobbyError}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {screen === 'waiting' && roomMeta && (
        <WaitingRoom
          meta={roomMeta}
          isHost={isHost}
          onStart={handleOnlineStart}
          onCancel={handleCancelRoom}
        />
      )}

      {screen === 'game' && (
        <HudHeader
          snapshot={snapshot}
          timer={timer}
          theme={theme}
          onToggleTheme={toggleTheme}
          onlineMode={onlineMode}
          opponentOnline={opponentOnline}
          onLeave={handleLeaveGame}
        />
      )}

      <main
        style={{ display: screen === 'game' ? 'flex' : 'none' }}
        className="flex-1 flex items-center justify-center overflow-x-auto overflow-y-hidden min-h-0 py-2"
      >
        <PhaserGame ref={phaserRef} gameState={gameState} />
      </main>

      {screen === 'game' && (
        <ControlFooter
          snapshot={snapshot}
          onMove={handleMove}
          onFire={handleFire}
          onPreview={handlePreview}
          disabled={animating || (onlineMode && !isMyTurn)}
        />
      )}

      {screen === 'gameOver' && (
        <GameOverOverlay snapshot={snapshot} winnerId={winnerId} onBackToMenu={handleBackToMenu} />
      )}
    </div>
  );
}
