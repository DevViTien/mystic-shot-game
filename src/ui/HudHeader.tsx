import { useTranslation } from 'react-i18next';
import {
  IconHeart,
  IconClock,
  IconDoubleDamage,
  IconKnockback,
  IconExtraMove,
  IconShield,
  IconPiercing,
} from '../common/icons';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Tooltip } from '../common/components';
import { Difficulty, PowerUpType } from '../config';
import type { GameStateSnapshot, ActiveBuff } from '../core';

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  [Difficulty.Easy]:
    'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_6px_rgba(16,185,129,0.2)]',
  [Difficulty.Medium]:
    'border-amber-500/50 text-amber-400 bg-amber-500/10 shadow-[0_0_6px_rgba(245,158,11,0.2)]',
  [Difficulty.Hard]:
    'border-red-500/50 text-red-400 bg-red-500/10 shadow-[0_0_6px_rgba(239,68,68,0.2)]',
};

interface HudHeaderProps {
  snapshot: GameStateSnapshot;
  timer: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function HudHeader({ snapshot, timer, theme, onToggleTheme }: HudHeaderProps) {
  const { t } = useTranslation();
  const isP1Turn = snapshot.currentPlayerId === 1;
  const currentPlayer = snapshot.players[snapshot.currentPlayerId - 1];

  return (
    <header className="bg-surface border-b border-border">
      {/* Row 1: Difficulty + Turn indicator + Settings */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-1 border-b border-border/50">
        {/* Left: difficulty badge */}
        <div className="justify-self-start">
          <Tooltip content={t(`menu.difficultyTooltip.${snapshot.difficulty}`)}>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLE[snapshot.difficulty]}`}
            >
              {t(`hud.difficulty.${snapshot.difficulty}`)}
            </span>
          </Tooltip>
        </div>

        {/* Center: active turn indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-0.5 rounded-full ${isP1Turn ? 'bg-accent/10' : 'bg-danger/10'}`}
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse-glow ${isP1Turn ? 'bg-accent' : 'bg-danger'}`}
          />
          <span
            className={`text-xs font-semibold ${isP1Turn ? 'text-accent' : 'text-danger'}`}
          >
            {t('footer.playerTurn', { name: currentPlayer?.name })}
          </span>
        </div>

        {/* Right: settings */}
        <div className="flex items-center gap-1.5 justify-self-end">
          <LanguageSwitcher />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      {/* Row 2: Player panels + Timer */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-1.5">
        {/* P1 panel */}
        <div className="justify-self-start">
          <PlayerPanel
            player={snapshot.players[0]}
            color="accent"
            align="left"
            active={isP1Turn}
          />
        </div>

        {/* Timer — center focal point */}
        <div
          className={`text-2xl font-bold tabular-nums flex items-center gap-1.5 px-4${timer <= 10 ? ' text-danger animate-pulse' : ' text-text-primary'}`}
        >
          <IconClock size={18} />
          {t('hud.timer', { seconds: timer })}
        </div>

        {/* P2 panel */}
        <div className="justify-self-end">
          <PlayerPanel
            player={snapshot.players[1]}
            color="danger"
            align="right"
            active={!isP1Turn}
          />
        </div>
      </div>
    </header>
  );
}

/* ── Player Panel ── */

interface PlayerPanelProps {
  player: GameStateSnapshot['players'][0];
  color: 'accent' | 'danger';
  align: 'left' | 'right';
  active?: boolean;
}

const PLAYER_COLOR_CLASSES = {
  accent: { text: 'text-accent', bg: 'bg-accent', outline: 'outline-accent' },
  danger: { text: 'text-danger', bg: 'bg-danger', outline: 'outline-danger' },
};

function PlayerPanel({ player, color, align, active }: PlayerPanelProps) {
  const { t } = useTranslation();
  const isRight = align === 'right';
  const c = PLAYER_COLOR_CLASSES[color];

  return (
    <div
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-1 transition-all duration-1000 ${isRight ? 'flex-row-reverse' : ''}${active ? ` bg-white/5 outline-2 outline-offset-2 ${c.outline} animate-pulse-glow` : ''}`}
    >
      {/* Name */}
      <span className={`font-semibold text-sm ${c.text}`}>{player.name}</span>

      {/* HP bar + text */}
      <div className={`flex items-center gap-1.5 ${isRight ? 'flex-row-reverse' : ''}`}>
        <div className="w-36 h-2.5 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full ${c.bg} rounded-full transition-[width] duration-1000 ${isRight ? 'ml-auto' : ''}`}
            style={{ width: `${player.hp}%` }}
          />
        </div>
        <span className="text-[11px] text-text-muted flex items-center gap-0.5 tabular-nums">
          <IconHeart size={10} /> {t('hud.hp', { hp: player.hp })}
        </span>
      </div>

      {/* Buff badges */}
      <BuffBadges buffs={player.buffs} />
    </div>
  );
}

const BUFF_ICON_MAP: Record<PowerUpType, React.ComponentType<{ size?: number }>> = {
  [PowerUpType.DoubleDamage]: IconDoubleDamage,
  [PowerUpType.Knockback]: IconKnockback,
  [PowerUpType.ExtraMove]: IconExtraMove,
  [PowerUpType.Shield]: IconShield,
  [PowerUpType.Piercing]: IconPiercing,
};

const BUFF_I18N_KEY: Record<PowerUpType, string> = {
  [PowerUpType.DoubleDamage]: 'guide.powerUps.doubleDamage',
  [PowerUpType.Knockback]: 'guide.powerUps.knockback',
  [PowerUpType.ExtraMove]: 'guide.powerUps.extraMove',
  [PowerUpType.Shield]: 'guide.powerUps.shield',
  [PowerUpType.Piercing]: 'guide.powerUps.piercing',
};

function BuffBadges({ buffs }: { buffs: ActiveBuff[] }) {
  const { t } = useTranslation();
  if (buffs.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {buffs.map((buff, i) => {
        const Icon = BUFF_ICON_MAP[buff.type];
        const label = t(BUFF_I18N_KEY[buff.type]);
        return (
          <Tooltip
            key={`${buff.type}-${i}`}
            content={`${label}${buff.remainingTurns > 0 ? ` (${buff.remainingTurns})` : ''}`}
          >
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
              <Icon size={10} />
              {buff.remainingTurns > 0 && <span>{buff.remainingTurns}</span>}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}
