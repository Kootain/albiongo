import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en';
import zhTranslation from './locales/zh';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      zh: { translation: zhTranslation }
    },
    lng: 'zh', // Force default language
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
