import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import translationEN from "./locales/en.json";
import translationHI from "./locales/hi.json";
import translationES from "./locales/es.json";
import translationFR from "./locales/fr.json";

const resources = {
  en: { translation: translationEN },
  hi: { translation: translationHI },
  es: { translation: translationES },
  fr: { translation: translationFR },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "es", "fr"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", (lng) => {
  const dir = i18n.dir(lng);
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

export default i18n;
