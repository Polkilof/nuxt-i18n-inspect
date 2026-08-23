import I18nInspect from '../../../src/module'

export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', I18nInspect],
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: [{ code: 'en', file: 'en.json' }],
  },
  // у тестах Nuxt не в dev-режимі, тож вмикаємо явно
  i18nInspect: { enabled: true },
})
