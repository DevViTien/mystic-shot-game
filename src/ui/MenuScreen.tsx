import { useState } from 'react';
import { Difficulty } from '../config';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SkinPicker } from './SkinPicker';
import { MapPicker } from './MapPicker';
import { useTranslation } from 'react-i18next';
import { AppImage, Modal, Tooltip } from '../common/components';
import {
  IconChevronLeft,
  IconChevronRight,
  IconTarget,
  IconHowItWorks,
  IconActions,
  IconPowerUp,
  IconObstacle,
  IconDifficulty,
  IconDoubleDamage,
  IconKnockback,
  IconExtraMove,
  IconShield,
  IconPiercing,
  IconGuide,
  IconBack,
} from '../common/icons';

export interface PlayerConfig {
  name: string;
  color: string;
  skinId: string;
}

export interface MenuResult {
  player1: PlayerConfig;
  player2: PlayerConfig;
  difficulty: Difficulty;
  mapId: string;
}

const COLOR_OPTIONS = [
  { labelKey: 'color.cyan', value: '#00ccff' },
  { labelKey: 'color.pink', value: '#ff4466' },
  { labelKey: 'color.green', value: '#44ff66' },
  { labelKey: 'color.orange', value: '#ff9933' },
  { labelKey: 'color.purple', value: '#aa66ff' },
  { labelKey: 'color.yellow', value: '#ffdd33' },
];

interface MenuScreenProps {
  onStart: (config: MenuResult) => void;
  onBack?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function MenuScreen({ onStart, onBack, theme, onToggleTheme }: MenuScreenProps) {
  const { t } = useTranslation();
  const [p1Name, setP1Name] = useState(t('menu.player1'));
  const [p2Name, setP2Name] = useState(t('menu.player2'));
  const [p1Color, setP1Color] = useState('#00ccff');
  const [p2Color, setP2Color] = useState('#ff4466');
  const [p1Skin, setP1Skin] = useState('classic');
  const [p2Skin, setP2Skin] = useState('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);
  const [mapId, setMapId] = useState('random');
  const [showGuide, setShowGuide] = useState(false);

  const handleStart = () => {
    onStart({
      player1: { name: p1Name || t('menu.player1'), color: p1Color, skinId: p1Skin },
      player2: { name: p2Name || t('menu.player2'), color: p2Color, skinId: p2Skin },
      difficulty,
      mapId,
    });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-overlay p-3 md:p-4">
      <div className="bg-surface border border-border rounded-xl px-4 py-4 md:px-6 md:py-5 max-w-[720px] max-h-[90vh] overflow-y-auto w-full flex flex-col items-center gap-4 md:gap-6 relative">
        <div className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <AppImage
          name="logo.png"
          alt="Mystic Shot"
          className="w-16 h-16 md:w-24 md:h-24 rounded-xl"
        />
        <h1 className="text-2xl md:text-4xl font-extrabold text-accent font-mono tracking-[3px] md:tracking-[4px] -mt-2 md:-mt-4">
          {t('menu.title')}
        </h1>
        <p className="text-[12px] md:text-[13px] text-text-muted -mt-2 md:-mt-4">
          {t('menu.subtitle')}
        </p>

        <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4 md:gap-6 w-full">
          {/* Player 1 */}
          <div className="flex-1 flex flex-col items-center gap-2.5">
            <h2 className="text-base font-bold" style={{ color: p1Color }}>
              {t('menu.player1')}
            </h2>
            <input
              className="w-full px-3 py-2 text-sm bg-surface-input text-text-primary border border-border-input rounded-md outline-none text-center focus:border-accent font-[inherit]"
              type="text"
              value={p1Name}
              onChange={(e) => setP1Name(e.target.value)}
              placeholder={t('menu.playerNamePlaceholder')}
              maxLength={16}
            />
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  className={`w-9 h-9 md:w-7 md:h-7 rounded-full border-2 cursor-pointer transition-transform duration-100 ${p1Color === c.value ? 'border-white scale-120' : 'border-transparent'} ${p2Color === c.value ? 'opacity-25 cursor-not-allowed' : 'hover:scale-115'}`}
                  style={{ background: c.value }}
                  onClick={() => p2Color !== c.value && setP1Color(c.value)}
                  title={t(c.labelKey)}
                  disabled={p2Color === c.value}
                />
              ))}
            </div>
            <SkinPicker skinId={p1Skin} onChange={setP1Skin} color={p1Color} />
          </div>

          <div className="hidden md:block text-2xl font-extrabold text-text-muted pt-9">
            {t('menu.versus')}
          </div>
          <div className="md:hidden w-full h-px bg-border" />

          {/* Player 2 */}
          <div className="flex-1 flex flex-col items-center gap-2.5">
            <h2 className="text-base font-bold" style={{ color: p2Color }}>
              {t('menu.player2')}
            </h2>
            <input
              className="w-full px-3 py-2 text-sm bg-surface-input text-text-primary border border-border-input rounded-md outline-none text-center focus:border-accent font-[inherit]"
              type="text"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              placeholder={t('menu.playerNamePlaceholder')}
              maxLength={16}
            />
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  className={`w-9 h-9 md:w-7 md:h-7 rounded-full border-2 cursor-pointer transition-transform duration-100 ${p2Color === c.value ? 'border-white scale-120' : 'border-transparent'} ${p1Color === c.value ? 'opacity-25 cursor-not-allowed' : 'hover:scale-115'}`}
                  style={{ background: c.value }}
                  onClick={() => p1Color !== c.value && setP2Color(c.value)}
                  title={t(c.labelKey)}
                  disabled={p1Color === c.value}
                />
              ))}
            </div>
            <SkinPicker skinId={p2Skin} onChange={setP2Skin} color={p2Color} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-[13px] text-text-muted uppercase tracking-[2px]">
            {t('menu.difficulty')}
          </span>
          <div className="flex gap-2">
            {Object.values(Difficulty).map((d) => (
              <Tooltip key={d} content={t(`menu.difficultyTooltip.${d}`)}>
                <button
                  className={`px-4 py-1.5 text-[13px] font-semibold rounded cursor-pointer border-none transition-opacity duration-150 ${difficulty === d ? 'bg-accent text-black' : 'bg-surface-alt text-text-muted'}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        <MapPicker mapId={mapId} onChange={setMapId} />

        <button
          className="mt-2 px-8 md:px-12 py-3 text-base md:text-lg font-bold tracking-[2px] rounded-md bg-accent text-black cursor-pointer border-none hover:opacity-85 transition-opacity duration-150 w-full md:w-auto max-w-[320px] min-h-[44px]"
          onClick={handleStart}
        >
          {t('menu.startGame')}
        </button>

        <div className="flex items-center gap-3">
          {onBack && (
            <button
              className="bg-transparent text-text-muted text-[13px] px-3 py-1 border border-border-input rounded cursor-pointer hover:text-text-primary hover:border-text-muted transition-colors duration-150 flex items-center gap-1"
              onClick={onBack}
            >
              <IconBack size={14} /> {t('button.back')}
            </button>
          )}
          <button
            className="bg-transparent text-text-muted text-[13px] px-3 py-1 border border-border-input rounded cursor-pointer hover:text-text-primary hover:border-text-muted transition-colors duration-150 flex items-center gap-1"
            onClick={() => setShowGuide(true)}
          >
            <IconGuide size={14} /> <span>{t('menu.showGuide')}</span>
          </button>
        </div>

        <Modal open={showGuide} onClose={() => setShowGuide(false)} title={t('menu.showGuide')}>
          <div className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-accent m-0 flex items-center gap-1.5">
                <IconTarget size={14} /> {t('guide.objective.heading')}
              </h3>
              <p className="text-[13px] text-text-soft leading-relaxed m-0">
                {t('guide.objective.description')}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-accent m-0 flex items-center gap-1.5">
                <IconHowItWorks size={14} /> {t('guide.howItWorks.heading')}
              </h3>
              <ul className="m-0 pl-5 flex flex-col gap-0.5 text-[13px] text-text-soft leading-relaxed">
                <li
                  dangerouslySetInnerHTML={{
                    __html: t('guide.howItWorks.step1', {
                      interpolation: { escapeValue: false },
                    }).replace(
                      '<code>',
                      '<code class="bg-surface-alt px-1 rounded font-mono text-xs text-warning">',
                    ),
                  }}
                />
                <li>{t('guide.howItWorks.step2')}</li>
                <li>{t('guide.howItWorks.step3')}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-accent m-0 flex items-center gap-1.5">
                <IconActions size={14} /> {t('guide.actions.heading')}
              </h3>
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2.5 items-baseline">
                  <span className="font-bold text-[13px] min-w-10 text-warning">
                    {t('guide.actions.fireLabel')}
                  </span>
                  <span className="text-[13px] text-text-soft">
                    {t('guide.actions.fireDesc').split('<chevronLeft/>')[0]}
                    <IconChevronLeft size={12} className="inline" /> /{' '}
                    <IconChevronRight size={12} className="inline" />
                    {t('guide.actions.fireDesc').split('<chevronRight/>')[1]}
                  </span>
                </div>
                <div className="flex gap-2.5 items-baseline">
                  <span className="font-bold text-[13px] min-w-10 text-warning">
                    {t('guide.actions.moveLabel')}
                  </span>
                  <span className="text-[13px] text-text-soft">
                    {t('guide.actions.moveDesc').split('<chevronLeft/>')[0]}
                    <IconChevronLeft size={12} className="inline" /> /{' '}
                    <IconChevronRight size={12} className="inline" />
                    {t('guide.actions.moveDesc').split('<chevronRight/>')[1]}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-accent m-0 flex items-center gap-1.5">
                <IconPowerUp size={14} /> {t('guide.powerUps.heading')}
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-surface px-2.5 py-0.5 rounded border border-border text-xs text-text-soft inline-flex items-center gap-1">
                  <IconDoubleDamage size={12} className="text-accent" />{' '}
                  {t('guide.powerUps.doubleDamage')}
                </span>
                <span className="bg-surface px-2.5 py-0.5 rounded border border-border text-xs text-text-soft inline-flex items-center gap-1">
                  <IconKnockback size={12} className="text-accent" />{' '}
                  {t('guide.powerUps.knockback')}
                </span>
                <span className="bg-surface px-2.5 py-0.5 rounded border border-border text-xs text-text-soft inline-flex items-center gap-1">
                  <IconExtraMove size={12} className="text-accent" />{' '}
                  {t('guide.powerUps.extraMove')}
                </span>
                <span className="bg-surface px-2.5 py-0.5 rounded border border-border text-xs text-text-soft inline-flex items-center gap-1">
                  <IconShield size={12} className="text-accent" /> {t('guide.powerUps.shield')}
                </span>
                <span className="bg-surface px-2.5 py-0.5 rounded border border-border text-xs text-text-soft inline-flex items-center gap-1">
                  <IconPiercing size={12} className="text-accent" /> {t('guide.powerUps.piercing')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-accent m-0 flex items-center gap-1.5">
                <IconObstacle size={14} /> {t('guide.obstacles.heading')}
              </h3>
              <ul className="m-0 pl-5 flex flex-col gap-0.5 text-[13px] text-text-soft leading-relaxed">
                <li
                  dangerouslySetInnerHTML={{
                    __html: t('guide.obstacles.hard', { interpolation: { escapeValue: false } }),
                  }}
                />
                <li
                  dangerouslySetInnerHTML={{
                    __html: t('guide.obstacles.soft', { interpolation: { escapeValue: false } }),
                  }}
                />
              </ul>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-accent m-0 flex items-center gap-1.5">
                <IconDifficulty size={14} /> {t('guide.difficulty.heading')}
              </h3>
              <ul className="m-0 pl-5 flex flex-col gap-0.5 text-[13px] text-text-soft leading-relaxed">
                <li
                  dangerouslySetInnerHTML={{
                    __html: t('guide.difficulty.easy', {
                      interpolation: { escapeValue: false },
                    }).replace(
                      /<code>/g,
                      '<code class="bg-surface-alt px-1 rounded font-mono text-xs text-warning">',
                    ),
                  }}
                />
                <li
                  dangerouslySetInnerHTML={{
                    __html: t('guide.difficulty.medium', {
                      interpolation: { escapeValue: false },
                    }).replace(
                      /<code>/g,
                      '<code class="bg-surface-alt px-1 rounded font-mono text-xs text-warning">',
                    ),
                  }}
                />
                <li
                  dangerouslySetInnerHTML={{
                    __html: t('guide.difficulty.hard', { interpolation: { escapeValue: false } }),
                  }}
                />
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
