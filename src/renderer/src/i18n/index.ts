import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { AppLanguage } from '@shared/types/settings'
import ar from './locales/ar.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import hi from './locales/hi.json'
import ja from './locales/ja.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import uk from './locales/uk.json'
import zh from './locales/zh.json'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    hi: { translation: hi },
    es: { translation: es },
    fr: { translation: fr },
    ar: { translation: ar },
    pt: { translation: pt },
    ru: { translation: ru },
    uk: { translation: uk },
    ja: { translation: ja },
    de: { translation: de }
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

export function setAppLanguage(language: AppLanguage): void {
  void i18n.changeLanguage(language)
}

export default i18n
