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
  // Тільки рядковий літерал: dependsOn Nuxt розбирає статично, і будь-який
  // каст ламає розбір метаданих (NUXT_B2003 і слідом NUXT_B2010).
  // Саме @ts-ignore, а не @ts-expect-error: у типах цього репозиторію @nuxtjs/i18n
  // немає, а в застосунку користувача є — і там expect-error падав би як зайвий.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  dependsOn: ['i18n:plugin'],
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
