import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TurnPhase } from '../config';
import { FormulaInput } from './FormulaInput';
import { IconChevronLeft, IconChevronRight, IconPlay, IconFire, IconMove } from '../common/icons';
import type { GameStateSnapshot } from '../core';

interface ControlFooterProps {
  snapshot: GameStateSnapshot;
  onMove: (expression: string, direction: 1 | -1) => void;
  onFire: (expression: string, direction: 1 | -1) => void;
  disabled?: boolean;
}

export function ControlFooter({ snapshot, onMove, onFire, disabled }: ControlFooterProps) {
  const { t } = useTranslation();
  const expressionRef = useRef('');
  const [canFire, setCanFire] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Reset stale state when turn changes (FormulaInput remounts via key)
  useEffect(() => {
    expressionRef.current = '';
    setCanFire(false);
  }, [snapshot.turnNumber]);

  const currentPlayer = snapshot.players[snapshot.currentPlayerId - 1];
  const canMove =
    currentPlayer && currentPlayer.moveCharges > 0 && snapshot.phase === TurnPhase.Idle;

  const playerColor = snapshot.currentPlayerId === 1 ? 'text-accent' : 'text-danger';

  return (
    <footer className="px-4 h-20 bg-surface border-t border-border flex items-center">
      <div className="flex items-center gap-3 w-full">
        {/* Left: turn info */}
        <div className="flex flex-col justify-center gap-0.5 min-w-[120px]">
          <span className={`font-semibold text-sm flex items-center gap-1 ${playerColor}`}>
            <IconPlay size={12} /> {t('footer.playerTurn', { name: currentPlayer?.name })}
          </span>
          <span className="text-[11px] text-text-muted">
            {t('footer.movesLeft', { count: currentPlayer?.moveCharges ?? 0 })}
          </span>
        </div>

        {/* Center: formula input (expands) */}
        <div className="flex-1 min-w-0">
          <FormulaInput
            key={snapshot.turnNumber}
            difficulty={snapshot.difficulty}
            onSubmit={(expr) => onFire(expr, direction)}
            onChange={(expr, valid) => {
              expressionRef.current = expr;
              setCanFire(valid && expr.trim() !== '');
            }}
            placeholder={t('formula.placeholder')}
          />
        </div>

        {/* Right: controls group */}
        <div className="flex items-center gap-2">
          {/* Direction toggle */}
          <button
            className="w-8 h-10 rounded cursor-pointer border-none flex items-center justify-center transition-all duration-150 bg-accent/20 text-accent ring-1 ring-accent/40 hover:bg-accent/30"
            onClick={() => setDirection((d) => (d === 1 ? -1 : 1))}
            title={direction === 1 ? t('button.dirRightTitle') : t('button.dirLeftTitle')}
          >
            {direction === 1 ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
          </button>

          {/* Divider */}
          <div className="w-px h-10 bg-border" />

          {/* Move button */}
          <button
            className="w-10 h-10 rounded-lg cursor-pointer border-none bg-warning/90 text-black flex items-center justify-center transition-all duration-150 hover:bg-warning hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!canMove || !canFire || disabled}
            onClick={() => onMove(expressionRef.current, direction)}
            title={`${t('button.move')} (${currentPlayer?.moveCharges ?? 0})`}
          >
            <IconMove size={18} />
          </button>

          {/* Fire button */}
          <button
            className="w-10 h-10 rounded-lg cursor-pointer border-none bg-danger/90 text-white flex items-center justify-center transition-all duration-150 hover:bg-danger hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!canFire || disabled}
            onClick={() => onFire(expressionRef.current, direction)}
            title={t('button.fire')}
          >
            <IconFire size={18} />
          </button>
        </div>
      </div>
    </footer>
  );
}
