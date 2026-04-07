import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

const STORAGE_KEY = 'mystic-shot-lang';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: localStorage.getItem(STORAGE_KEY) || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

/** Persist language choice to localStorage. */
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
