export default defineNuxtConfig({
  // ось той самий «один рядок» — жодного i18n.config.ts, жодних налаштувань
  modules: ['@nuxtjs/i18n', 'nuxt-i18n-inspect'],
  devtools: { enabled: true },
  compatibilityDate: '2025-07-15',
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    // сценарій «нова мова»: de заповнена на п'ять ключів із п'ятнадцяти,
    // решта падає у фолбек на англійську. Сам fallbackLocale живе
    // в i18n.config.ts — тут його ставити марно, модуль його не читає.
    vueI18n: './i18n.config.ts',
    // вимкнено, щоб перемикач локалі на стенді поводився передбачувано
    detectBrowserLanguage: false,
    // інакше unplugin-vue-i18n валить збірку клієнтського чанка локалі
    // через кейс 8 (HTML у повідомленні) — і на клієнті немає жодного перекладу
    compilation: { strictMessage: false },
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'de', name: 'Deutsch (new language)', file: 'de.json' },
    ],
  },
})
