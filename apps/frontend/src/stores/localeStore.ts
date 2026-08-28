import { create } from 'zustand';
import { translations, type Locale } from '../i18n/index.js';

interface LocaleState {
  locale: Locale;
  t: typeof translations.bn;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => {
  const initial = (localStorage.getItem('hotspot_locale') as Locale) || 'bn';

  return {
    locale: initial,
    t: translations[initial],
    setLocale: (locale: Locale) => {
      localStorage.setItem('hotspot_locale', locale);
      set({ locale, t: translations[locale] });
    },
    toggleLocale: () => {
      set((state) => {
        const next: Locale = state.locale === 'bn' ? 'en' : 'bn';
        localStorage.setItem('hotspot_locale', next);
        return { locale: next, t: translations[next] };
      });
    }
  };
});
