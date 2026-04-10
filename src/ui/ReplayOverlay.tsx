import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { IconPlay, IconPause, IconFastForward, IconX } from '../common/icons';

interface ReplayOverlayProps {
  totalEntries: number;
  currentEntry: number;
  finished: boolean;
  onSetSpeed: (speed: number) => void;
  onSetPaused: (paused: boolean) => void;
  onExit: () => void;
}

const SPEED_OPTIONS = [1, 2, 4] as const;

export function ReplayOverlay({
  totalEntries,
  currentEntry,
  finished,
  onSetSpeed,
  onSetPaused,
  onExit,
}: ReplayOverlayProps) {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  const togglePause = useCallback(() => {
    const next = !paused;
    setPaused(next);
    onSetPaused(next);
  }, [paused, onSetPaused]);

  const cycleSpeed = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(speed as (typeof SPEED_OPTIONS)[number]);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]!;
    setSpeed(next);
    onSetSpeed(next);
  }, [speed, onSetSpeed]);

  // Auto-pause when finished
  useEffect(() => {
    if (finished && !paused) {
      setPaused(true);
      onSetPaused(true);
    }
  }, [finished, paused, onSetPaused]);

  const progress = totalEntries > 0 ? Math.round((currentEntry / totalEntries) * 100) : 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-6 py-3 bg-surface/95 border-t border-border backdrop-blur-sm">
      {/* Left: Replay label */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold tracking-wider text-accent uppercase">
          {t('replay.title')}
        </span>
        <span className="text-xs text-muted">
          {t('replay.action', { current: currentEntry, total: totalEntries })}
        </span>
      </div>

      {/* Center: Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-md bg-accent/20 text-accent hover:bg-accent/30 transition-colors cursor-pointer border-none"
          onClick={togglePause}
          title={paused ? t('replay.play') : t('replay.pause')}
        >
          {paused ? <IconPlay size={18} /> : <IconPause size={18} />}
        </button>

        {/* Speed */}
        <button
          className="flex items-center justify-center gap-1 h-9 px-3 rounded-md bg-accent/20 text-accent hover:bg-accent/30 transition-colors cursor-pointer border-none text-sm font-mono"
          onClick={cycleSpeed}
          title={t('replay.speed')}
        >
          <IconFastForward size={14} /> {speed}x
        </button>

        {/* Progress bar */}
        <div className="w-32 h-2 bg-border rounded-full overflow-hidden mx-2">
          <div
            className="h-full bg-accent transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {finished && (
          <span className="text-xs text-warning font-bold">{t('replay.finished')}</span>
        )}
      </div>

      {/* Right: Exit */}
      <button
        className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-error/20 text-error hover:bg-error/30 transition-colors cursor-pointer border-none text-sm font-semibold"
        onClick={onExit}
      >
        <IconX size={16} /> {t('replay.exit')}
      </button>
    </div>
  );
}
