import { defineEventHandler } from 'h3'
import { diffLocale } from '../../report-diff'
import { baseLocaleOf, loadLocale, localeFilesOf } from '../locales'

/**
 * Повний звіт по локалях — із файлів, а не з обходу сторінок.
 *
 * Обхід сайту принципово не дає покриття: щоб рядок потрапив у підсвітку,
 * він має відрендеритись. Тексти помилок, порожніх станів і модалок так не
 * знайти ніколи. Тут множина ключів береться з базової локалі цілком.
 *
 * Роут реєструється лише коли модуль увімкнений, тобто в dev.
 */
export default defineEventHandler(async (event) => {
  const files = localeFilesOf(event)
  const codes = Object.keys(files)

  if (!codes.length) {
    return { base: '', locales: [], reason: 'No locale files found.' }
  }

  const base = baseLocaleOf(event, codes)
  const values = new Map<string, Map<string, string>>()
  for (const code of codes) {
    values.set(code, await loadLocale(files[code]!))
  }

  const baseValues = values.get(base) ?? new Map<string, string>()
  const locales = codes.map(locale => ({
    locale,
    ...diffLocale(baseValues, values.get(locale)!, locale === base),
  }))

  return { base, locales, reason: null }
})
