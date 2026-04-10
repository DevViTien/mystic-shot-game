import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TurnPhase } from '../config';
import { FormulaInput } from './FormulaInput';
import { IconChevronLeft, IconChevronRight, IconPlay, IconFire, IconMove } from '../common/icons';
import { Tooltip } from '../common/components';
import type { GameStateSnapshot } from '../core';

interface ControlFooterProps {
  snapshot: GameStateSnapshot;
  onMove: (expression: string, direction: 1 | -1) => void;
  onFire: (expression: string, direction: 1 | -1) => void;
  onPreview?: (expression: string, direction: 1 | -1, mode: 'fire' | 'move') => void;
  disabled?: boolean;
}

export function ControlFooter({
  snapshot,
  onMove,
  onFire,
  onPreview,
  disabled,
}: ControlFooterProps) {
  const { t } = useTranslation();
  const expressionRef = useRef('');
  const [canFire, setCanFire] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentPlayer = snapshot.players[snapshot.currentPlayerId - 1];
  const opponent = snapshot.players[snapshot.currentPlayerId === 1 ? 1 : 0];

  // Reset stale state when turn changes (FormulaInput remounts via key)
  // Default direction: face toward opponent
  useEffect(() => {
    expressionRef.current = '';
    setCanFire(false);
    setDirection(
      currentPlayer && opponent ? (currentPlayer.position.x <= opponent.position.x ? 1 : -1) : 1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.turnNumber]);
  const canMove =
    currentPlayer && currentPlayer.moveCharges > 0 && snapshot.phase === TurnPhase.Idle;

  const playerColor = snapshot.currentPlayerId === 1 ? 'text-accent' : 'text-danger';

  return (
    <footer className="px-2 md:px-4 py-2 md:py-0 md:h-20 bg-surface border-t border-border flex items-center">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full">
        {/* Turn info — hidden on mobile, shown on desktop left */}
        <div className="hidden md:flex flex-col justify-center gap-0.5 min-w-[120px]">
          <span className={`font-semibold text-sm flex items-center gap-1 ${playerColor}`}>
            <IconPlay size={12} /> {t('footer.playerTurn', { name: currentPlayer?.name })}
          </span>
          <span className="text-[11px] text-text-muted">
            {t('footer.movesLeft', { count: currentPlayer?.moveCharges ?? 0 })}
          </span>
        </div>

        {/* Row 1 on mobile / Center on desktop: formula input */}
        <div className="flex-1 min-w-0">
          <FormulaInput
            key={snapshot.turnNumber}
            difficulty={snapshot.difficulty}
            onSubmit={(expr) => {
              onPreview?.('', direction, 'fire');
              onFire(expr, direction);
            }}
            onMove={(expr) => {
              onPreview?.('', direction, 'move');
              onMove(expr, direction);
            }}
            onDirectionToggle={() => {
              setDirection((d) => {
                const next = d === 1 ? -1 : 1;
                if (expressionRef.current.trim() && canFire) {
                  onPreview?.(expressionRef.current, next, 'fire');
                }
                return next;
              });
            }}
            canMove={!!canMove && canFire && !disabled}
            disabled={disabled}
            onChange={(expr, valid) => {
              expressionRef.current = expr;
              setCanFire(valid && expr.trim() !== '');
              if (valid && expr.trim() !== '') {
                onPreview?.(expr, direction, 'fire');
              } else {
                onPreview?.('', direction, 'fire');
              }
            }}
            placeholder={t('formula.placeholder')}
          />
        </div>

        {/* Row 2 on mobile / Right on desktop: move info + controls */}
        <div className="flex items-center gap-2 justify-between md:justify-end">
          {/* Mobile-only: move count badge */}
          <span className="md:hidden text-[11px] text-text-muted">
            {t('footer.movesLeft', { count: currentPlayer?.moveCharges ?? 0 })}
          </span>

          <div className="flex items-center gap-2">
            {/* Direction toggle */}
            <Tooltip
              content={`${direction === 1 ? t('button.dirRightTitle') : t('button.dirLeftTitle')} [Tab]`}
            >
              <button
                className="w-10 h-10 md:w-8 md:h-10 rounded cursor-pointer border-none flex flex-col items-center justify-center transition-all duration-150 bg-accent/20 text-accent ring-1 ring-accent/40 hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-accent/20"
                disabled={disabled}
                onClick={() => {
                  setDirection((d) => {
                    const next = d === 1 ? -1 : 1;
                    if (expressionRef.current.trim() && canFire) {
                      onPreview?.(expressionRef.current, next, 'fire');
                    }
                    return next;
                  });
                }}
              >
                {direction === 1 ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
                <span className="text-[8px] text-accent/60 leading-none hidden [@media(hover:hover)]:block">
                  Tab
                </span>
              </button>
            </Tooltip>

            {/* Divider */}
            <div className="w-px h-10 bg-border" />

            {/* Move button */}
            <Tooltip
              content={`${t('button.move')} (${currentPlayer?.moveCharges ?? 0}) [Shift+Enter]`}
            >
              <button
                className="w-11 h-11 md:w-10 md:h-10 rounded-lg cursor-pointer border-none bg-warning/90 text-black flex flex-col items-center justify-center transition-all duration-150 hover:bg-warning hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={!canMove || !canFire || disabled}
                onClick={() => {
                  onPreview?.('', direction, 'move');
                  onMove(expressionRef.current, direction);
                }}
              >
                <IconMove size={16} />
                <span className="text-[7px] text-black/50 leading-none hidden [@media(hover:hover)]:block">
                  ⇧↵
                </span>
              </button>
            </Tooltip>

            {/* Fire button */}
            <Tooltip content={`${t('button.fire')} [Enter]`}>
              <button
                className="w-11 h-11 md:w-10 md:h-10 rounded-lg cursor-pointer border-none bg-danger/90 text-white flex flex-col items-center justify-center transition-all duration-150 hover:bg-danger hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={!canFire || disabled}
                onClick={() => {
                  onPreview?.('', direction, 'fire');
                  onFire(expressionRef.current, direction);
                }}
              >
                <IconFire size={16} />
                <span className="text-[7px] text-white/50 leading-none hidden [@media(hover:hover)]:block">
                  ↵
                </span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </footer>
  );
}
