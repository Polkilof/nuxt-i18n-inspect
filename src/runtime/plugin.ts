import { defineNuxtPlugin } from '#app'
import { encodeKey } from './marker'

type PostTranslationHandler = (translated: unknown, key: string) => unknown

interface MarkableComposer {
  getPostTranslationHandler?: () => PostTranslationHandler | null
  setPostTranslationHandler?: (handler: PostTranslationHandler | null) => void
}

/**
 * Чіпляє маркери до результату кожного t().
 *
 * Хук ставиться в рантаймі, а не через i18n.config.ts, щоб користувачеві
 * модуля не треба було нічого дописувати руками. Плагін універсальний:
 * серверний рендер і гідрація мають бачити однакові рядки.
 */
export default defineNuxtPlugin({
  name: 'i18n-inspect:markers',
  // Ім'я плагіна @nuxtjs/i18n: чекаємо, поки composer з'явиться в застосунку.
  // Каст — бо в типах Nuxt перелічені лише вбудовані плагіни, чужі туди не потрапляють.
  dependsOn: ['i18n:plugin' as 'nuxt:head'],
  setup(nuxtApp) {
    const i18n = nuxtApp.$i18n as MarkableComposer | undefined

    if (!i18n?.setPostTranslationHandler) {
      console.warn('[i18n-inspect] vue-i18n composer not found. This module requires @nuxtjs/i18n.')
      return
    }

    // Чужий хук, якщо він уже стоїть, не викидаємо — обгортаємо.
    const previous = i18n.getPostTranslationHandler?.() ?? null

    i18n.setPostTranslationHandler((translated, key) => {
      const value = previous ? previous(translated, key) : translated
      if (typeof value !== 'string' || !key) return value
      return value + encodeKey(key)
    })
  },
})
