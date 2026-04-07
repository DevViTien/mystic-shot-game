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
import { PowerUpType } from '../config';
import type { GameStateSnapshot, ActiveBuff } from '../core';

interface HudHeaderProps {
  snapshot: GameStateSnapshot;
  timer: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function HudHeader({ snapshot, timer, theme, onToggleTheme }: HudHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
      <div
        className={`flex items-center gap-2${snapshot.currentPlayerId === 1 ? ' bg-white/5 dark:bg-white/5 rounded-md px-2.5 py-1 outline-2 outline-offset-2 outline-accent animate-pulse-glow' : ''}`}
      >
        <span className="font-semibold text-sm text-accent">{snapshot.players[0].name}</span>
        {snapshot.currentPlayerId === 1 && (
          <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent text-black animate-pulse-glow">
            {t('hud.yourTurn')}
          </span>
        )}
        <div className="w-30 h-3 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-[width] duration-300"
            style={{ width: `${snapshot.players[0].hp}%` }}
          />
        </div>
        <span className="text-xs min-w-12 flex items-center gap-0.5">
          <IconHeart size={10} /> {t('hud.hp', { hp: snapshot.players[0].hp })}
        </span>
        <BuffBadges buffs={snapshot.players[0].buffs} />
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`text-2xl font-bold tabular-nums flex items-center gap-1${timer <= 10 ? ' text-danger' : ' text-text-primary'}`}
        >
          <IconClock size={18} /> {t('hud.timer', { seconds: timer })}
        </div>
        <LanguageSwitcher />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div
        className={`flex items-center gap-2${snapshot.currentPlayerId === 2 ? ' bg-white/5 dark:bg-white/5 rounded-md px-2.5 py-1 outline-2 outline-offset-2 outline-danger animate-pulse-glow' : ''}`}
      >
        <BuffBadges buffs={snapshot.players[1].buffs} />
        {snapshot.currentPlayerId === 2 && (
          <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-danger text-white animate-pulse-glow">
            {t('hud.yourTurn')}
          </span>
        )}
        <span className="font-semibold text-sm text-danger">{snapshot.players[1].name}</span>
        <div className="w-30 h-3 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-danger rounded-full transition-[width] duration-300"
            style={{ width: `${snapshot.players[1].hp}%` }}
          />
        </div>
        <span className="text-xs min-w-12 flex items-center gap-0.5">
          <IconHeart size={10} /> {t('hud.hp', { hp: snapshot.players[1].hp })}
        </span>
      </div>
    </header>
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
          <span
            key={`${buff.type}-${i}`}
            title={`${label}${buff.remainingTurns > 0 ? ` (${buff.remainingTurns})` : ''}`}
            className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-medium"
          >
            <Icon size={10} />
            {buff.remainingTurns > 0 && <span>{buff.remainingTurns}</span>}
          </span>
        );
      })}
    </div>
  );
}
