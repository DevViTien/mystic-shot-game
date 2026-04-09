import { useTranslation } from 'react-i18next';
import { AppImage } from '../common/components';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { isFirebaseConfigured } from '../network';

interface MainMenuProps {
  onLocal: () => void;
  onOnline: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function MainMenu({ onLocal, onOnline, theme, onToggleTheme }: MainMenuProps) {
  const { t } = useTranslation();
  const firebaseReady = isFirebaseConfigured();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-overlay">
      <div className="bg-surface border border-border rounded-xl px-12 py-10 max-w-[480px] w-full flex flex-col items-center gap-6 relative">
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>

        <AppImage name="logo.png" alt="Mystic Shot" className="w-24 h-24 rounded-xl" />
        <h1 className="text-4xl font-extrabold text-accent font-mono tracking-[4px] -mt-4">
          {t('menu.title')}
        </h1>
        <p className="text-[13px] text-text-muted -mt-4">{t('menu.subtitle')}</p>

        <div className="flex flex-col gap-3 w-full max-w-[280px] mt-2">
          <button
            className="px-8 py-3 text-lg font-bold tracking-[2px] rounded-md bg-accent text-black cursor-pointer border-none hover:opacity-85 transition-opacity duration-150"
            onClick={onLocal}
          >
            {t('mainMenu.localPlay')}
          </button>

          <button
            className="px-8 py-3 text-lg font-bold tracking-[2px] rounded-md bg-purple-600 text-white cursor-pointer border-none hover:opacity-85 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onOnline}
            disabled={!firebaseReady}
            title={!firebaseReady ? t('mainMenu.onlineNotConfigured') : undefined}
          >
            {t('mainMenu.onlinePlay')}
          </button>

          {!firebaseReady && (
            <p className="text-[11px] text-text-muted text-center">
              {t('mainMenu.onlineNotConfigured')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
