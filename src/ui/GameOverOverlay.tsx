import { useTranslation } from 'react-i18next';
import { IconTrophy, IconBack, IconPlay } from '../common/icons';
import type { GameStateSnapshot } from '../core';

interface GameOverOverlayProps {
  snapshot: GameStateSnapshot;
  winnerId: 1 | 2 | null;
  onBackToMenu: () => void;
  onWatchReplay?: () => void;
}

export function GameOverOverlay({ snapshot, winnerId, onBackToMenu, onWatchReplay }: GameOverOverlayProps) {
  const { t } = useTranslation();
  const winner =
    winnerId !== null ? snapshot.players[winnerId - 1] : snapshot.players.find((p) => p.hp > 0);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-overlay-heavy">
      <div className="flex flex-col items-center gap-6 px-16 py-12 bg-surface border border-border rounded-xl">
        <IconTrophy size={48} className="text-warning" />
        <h2 className="text-[32px] text-warning font-mono">
          {t('game.wins', { name: winner?.name ?? 'Unknown' })}
        </h2>
        <div className="flex items-center gap-3">
          {onWatchReplay && (
            <button
              className="px-8 py-3 text-lg font-bold tracking-wider rounded-md bg-accent/20 text-accent cursor-pointer border-none hover:bg-accent/30 transition-colors flex items-center gap-2"
              onClick={onWatchReplay}
            >
              <IconPlay size={18} /> {t('replay.watchReplay')}
            </button>
          )}
          <button
            className="px-12 py-3 text-lg font-bold tracking-wider rounded-md bg-accent text-black cursor-pointer border-none hover:opacity-85 transition-opacity duration-150 flex items-center gap-2"
            onClick={onBackToMenu}
          >
            <IconBack size={18} /> {t('button.backToMenu')}
          </button>
        </div>
      </div>
    </div>
  );
}
