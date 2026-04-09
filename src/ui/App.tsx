import { PhaserGame } from './PhaserGame';
import { MenuScreen } from './MenuScreen';
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
    gameStarted,
    gameOver,
    winnerId,
    animating,
    handleMove,
    handleFire,
    handlePreview,
    handleMenuStart,
    handleBackToMenu,
  } = useGameEngine();

  return (
    <div className="flex flex-col h-screen">
      {!gameStarted && (
        <MenuScreen onStart={handleMenuStart} theme={theme} onToggleTheme={toggleTheme} />
      )}

      {gameStarted && !gameOver && (
        <HudHeader snapshot={snapshot} timer={timer} theme={theme} onToggleTheme={toggleTheme} />
      )}

      <main
        style={{ display: gameStarted && !gameOver ? 'flex' : 'none' }}
        className="flex-1 flex items-center justify-center overflow-x-auto overflow-y-hidden min-h-0 py-2"
      >
        <PhaserGame ref={phaserRef} gameState={gameState} />
      </main>

      {gameStarted && !gameOver && (
        <ControlFooter
          snapshot={snapshot}
          onMove={handleMove}
          onFire={handleFire}
          onPreview={handlePreview}
          disabled={animating}
        />
      )}

      {gameOver && (
        <GameOverOverlay snapshot={snapshot} winnerId={winnerId} onBackToMenu={handleBackToMenu} />
      )}
    </div>
  );
}
