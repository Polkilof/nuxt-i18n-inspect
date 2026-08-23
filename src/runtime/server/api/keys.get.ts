import { defineEventHandler } from 'h3'
import { loadLocale, localeFilesOf } from '../locales'

/**
 * Множина ключів кожної локалі — з файлів.
 *
 * Потрібна режиму аудиту: щоб сказати «цей рядок не перекладено цією мовою»,
 * треба знати, чи є ключ у локалі. Рантайм на це питання надійно не
 * відповідає — повідомлення там уже скомпільовані в AST.
 *
 * Роут реєструється лише коли модуль увімкнений, тобто в dev.
 */
export default defineEventHandler(async (event) => {
  const locales: Record<string, string[]> = {}

  for (const [locale, files] of Object.entries(localeFilesOf(event))) {
    locales[locale] = [...(await loadLocale(files)).keys()]
  }

  return { locales }
})
