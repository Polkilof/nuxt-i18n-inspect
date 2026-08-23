import { createError, defineEventHandler, readBody } from 'h3'
import { localeFilesOf, writeEntries } from '../locales'

/**
 * Запис одного ключа у файл локалі. Джерело істини — файл у репозиторії,
 * бази й бекенду немає; HMR @nuxtjs/i18n підхоплює зміну сам.
 *
 * Свідомо по одному ключу за раз: пакетний запис вимагав би тримати сесію
 * правок у пам'яті вкладки, а вкладка в dev перезавантажується від будь-якої
 * зміни коду. Один рядок — один запис, втратити можна щонайбільше одне поле.
 *
 * Роут реєструється лише коли модуль увімкнений, тобто в dev.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ locale?: string, key?: string, value?: string }>(event)
  const { locale, key, value } = body ?? {}

  if (!locale || !key || typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Потрібні locale, key і рядкове value' })
  }

  const files = localeFilesOf(event)[locale]
  if (!files?.length) {
    throw createError({ statusCode: 404, statusMessage: `No files found for locale “${locale}”` })
  }

  const { placement } = await writeEntries(files, [{ key, value }])
  return { file: placement[0]!.file, created: placement[0]!.created }
})
