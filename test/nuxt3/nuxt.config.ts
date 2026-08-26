export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', 'nuxt-i18n-inspect'],

  // Локалі під srcDir — розкладка, яку i18n v9 лишив як restructureDir: false.
  // Сучасну (<rootDir>/i18n) тримає test/fixtures/basic.
  i18n: {
    restructureDir: false,
    langDir: 'locales',
    strategy: 'no_prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: [{ code: 'en', file: 'en.json' }],
  },

  // у тестах Nuxt не в dev-режимі, тож вмикаємо явно
  i18nInspect: { enabled: true },
})
