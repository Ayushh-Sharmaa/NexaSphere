import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en.json';

const resources = {
  en: { translation: translationEN },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en'],
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.dir = 'ltr';
document.documentElement.lang = 'en';

export default i18n;
