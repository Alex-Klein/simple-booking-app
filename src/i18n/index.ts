import { createI18n } from 'vue-i18n'
import en from './en'
import de from './de'

const browserLang = navigator.language.slice(0, 2)
const savedLang = localStorage.getItem('lang')
const locale = savedLang ?? (browserLang === 'de' ? 'de' : 'en')

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: { en, de },
})

export function setLocale(lang: 'en' | 'de') {
  i18n.global.locale.value = lang
  localStorage.setItem('lang', lang)
}
