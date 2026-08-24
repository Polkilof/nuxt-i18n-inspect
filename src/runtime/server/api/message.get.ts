import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { createError, defineEventHandler, getQuery } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getAtPath } from '../../json-path'
import { unescapeMessage } from '../../message-syntax'

/**
 * Значення ключа в усіх локалях — сирі, з файлів.
 *
 * Читаємо файли, а не рантаймові повідомлення: unplugin-vue-i18n компілює
 * JSON у AST-об'єкти ще на збірці, тож у застосунку сирого рядка вже немає.
 * Та й редагує копірайтер саме файл.
 *
 * Роут реєструється лише коли модуль увімкнений, тобто в dev.
 */
export default defineEventHandler(async (event) => {
  const { key } = getQuery(event) as { key?: string }
  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'The key parameter is required' })
  }

  const localeFiles = useRuntimeConfig(event).i18nInspect?.localeFiles as Record<string, string[]> | undefined
  const entries = Object.entries(localeFiles ?? {})

  if (!entries.length) {
    return {
      key,
      locales: [],
      reason: 'No locale files found. JSON locales of @nuxtjs/i18n are supported.',
    }
  }

  const locales = await Promise.all(entries.map(async ([locale, files]) => {
    let value = ''
    let file: string | null = null

    // Пізніший файл перекриває ранішній — так само, як їх зливає vue-i18n.
    for (const candidate of files) {
      let json: unknown
      try {
        json = JSON.parse(await readFile(candidate, 'utf8'))
      }
      catch {
        continue
      }
      const found = getAtPath(json, key)
      if (found !== null) {
        // у полі панелі має бути текст, а не {'@'} з екранування
        value = unescapeMessage(found)
        file = candidate
      }
    }

    return {
      locale,
      value,
      exists: file !== null,
      // якщо ключа немає ніде — показуємо, куди він потрапить при збереженні
      file: file ?? files[0] ?? null,
      fileName: basename(file ?? files[0] ?? ''),
    }
  }))

  return { key, locales, reason: null }
})
