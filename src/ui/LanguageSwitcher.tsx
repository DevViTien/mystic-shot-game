import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'vi', label: 'VI' },
] as const;

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  return (
    <div className={`flex gap-0.5 ${className}`}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-1.5 py-0.5 text-[11px] font-semibold rounded cursor-pointer border-none transition-opacity duration-150 ${
            i18n.language === code
              ? 'bg-accent text-black'
              : 'bg-surface-alt text-text-muted hover:opacity-80'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
