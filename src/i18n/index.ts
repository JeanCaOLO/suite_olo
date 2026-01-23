import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import messages from './local/index';

// Crear una instancia aislada para evitar conflictos con widgets externos
const i18nInstance = i18n.createInstance();

i18nInstance
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    resources: messages,
    interpolation: {
      escapeValue: false,
    },
    // Evitar conflictos con widgets externos
    react: {
      useSuspense: false,
    },
  });

export default i18nInstance;