import { createError, defineEventHandler, readBody } from 'h3'
// саме з nitropack/runtime, а не з '#imports': кореневий vue-tsc перевіряє
// цей файл у застосунковому контексті, де серверних автоімпортів немає
import { useNitroApp } from 'nitropack/runtime'
import { localeFilesOf, writeEntries } from '../locales'
import type { WriteContext } from '../locales'

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

  // Шов для сторонніх модулів: слухач або просто дізнається про правку,
  // або бере запис на себе, заповнивши context.result.
  const context: WriteContext = { locale, entries: [{ key, value }], files, result: null }
  await useNitroApp().hooks.callHook('i18nInspect:write', context)

  const { placement } = context.result ?? await writeEntries(files, context.entries)

  // placement тепер може прийти ззовні, тож порожній масив — не «не буває»
  const written = placement[0]
  if (!written) {
    throw createError({ statusCode: 500, statusMessage: 'The write handler reported no placement' })
  }

  return { file: written.file, created: written.created }
})
