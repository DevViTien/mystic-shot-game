import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSun, IconMoon } from '../common/icons';
import { useLocalStorage } from '../common/hooks';

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('theme', 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onToggle}
      className={`w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-base cursor-pointer hover:opacity-80 transition-opacity duration-150 ${className}`}
      title={t('theme.toggleTitle', {
        mode: theme === 'dark' ? t('theme.light') : t('theme.dark'),
      })}
      aria-label={t('theme.toggleAriaLabel')}
    >
      {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  );
}
