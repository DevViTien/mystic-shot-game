import { useTranslation } from 'react-i18next';
import { IconTrophy, IconBack, IconPlay } from '../common/icons';
import type { GameStateSnapshot } from '../core';

interface GameOverOverlayProps {
  snapshot: GameStateSnapshot;
  winnerId: 1 | 2 | null;
  onBackToMenu: () => void;
  onWatchReplay?: () => void;
}

export function GameOverOverlay({
  snapshot,
  winnerId,
  onBackToMenu,
  onWatchReplay,
}: GameOverOverlayProps) {
  const { t } = useTranslation();
  const winner =
    winnerId !== null ? snapshot.players[winnerId - 1] : snapshot.players.find((p) => p.hp > 0);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-overlay-heavy p-4">
      <div className="flex flex-col items-center gap-4 lg:gap-6 px-6 py-8 lg:px-16 lg:py-12 bg-surface border border-border rounded-xl w-full max-w-[480px] lg:max-w-[600px]">
        <IconTrophy size={36} className="text-warning lg:hidden" />
        <IconTrophy size={48} className="text-warning hidden lg:block" />
        <h2 className="text-xl lg:text-[32px] text-warning font-mono text-center">
          {t('game.wins', { name: winner?.name ?? 'Unknown' })}
        </h2>
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full lg:w-auto">
          {onWatchReplay && (
            <button
              className="px-6 lg:px-8 py-3 text-base lg:text-lg font-bold tracking-wider rounded-md bg-accent/20 text-accent cursor-pointer border-none hover:bg-accent/30 transition-colors flex items-center justify-center gap-2 w-full lg:w-auto min-h-[44px] whitespace-nowrap"
              onClick={onWatchReplay}
            >
              <IconPlay size={18} /> {t('replay.watchReplay')}
            </button>
          )}
          <button
            className="px-6 lg:px-12 py-3 text-base lg:text-lg font-bold tracking-wider rounded-md bg-accent text-black cursor-pointer border-none hover:opacity-85 transition-opacity duration-150 flex items-center justify-center gap-2 w-full lg:w-auto min-h-[44px] whitespace-nowrap"
            onClick={onBackToMenu}
          >
            <IconBack size={18} /> {t('button.backToMenu')}
          </button>
        </div>
      </div>
    </div>
  );
}
