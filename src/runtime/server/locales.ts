import { readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { createError } from 'h3'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { WritePathError, detectIndent, getAtPath, setAtPath } from '../json-path'
import { flatten } from '../report-diff'

/**
 * Спільна робота з файлами локалей: читання, злиття, атомарний запис.
 *
 * Винесено з роутів, бо запис однієї правки й запис усього списку — та сама
 * операція з різною кількістю ключів. Дублювати її двічі означало б мати
 * два різні способи зіпсувати чужий файл.
 */

export interface WriteEntry {
  key: string
  value: string
}

/** Абсолютні шляхи до файлів кожної локалі — їх кладе модуль на етапі setup. */
export function localeFilesOf(event: H3Event): Record<string, string[]> {
  return (useRuntimeConfig(event).i18nInspect?.localeFiles as Record<string, string[]>) ?? {}
}

/** Локаль, з якою порівнюємо решту. defaultLocale @nuxtjs/i18n або перша оголошена. */
export function baseLocaleOf(event: H3Event, locales: string[]): string {
  const declared = useRuntimeConfig(event).i18nInspect?.defaultLocale as string | undefined
  return declared && locales.includes(declared) ? declared : (locales[0] ?? '')
}

/**
 * Значення всієї локалі. Файли зливаються в тому ж порядку, що й у vue-i18n:
 * пізніший перекриває ранішній.
 */
export async function loadLocale(files: string[]): Promise<Map<string, string>> {
  const merged = new Map<string, string>()
  for (const file of files) {
    try {
      for (const [key, value] of flatten(JSON.parse(await readFile(file, 'utf8')))) {
        merged.set(key, value)
      }
    }
    catch {
      // нечитабельний або побитий файл не має валити звіт по решті локалей
      continue
    }
  }
  return merged
}

/**
 * Запис ключів у файли локалі: одне читання-запис на файл, скільки б ключів
 * туди не йшло. Ключ лягає у файл, де він уже є; якщо ніде — у перший оголошений.
 *
 * Кожен файл пишеться через тимчасовий із заміною: обрив на півдорозі не має
 * лишати порізану локаль. Крапка на початку імені — щоб не смикати вотчер.
 */
export async function writeEntries(files: string[], entries: WriteEntry[]) {
  const sources = new Map<string, { text: string, json: Record<string, unknown> }>()

  for (const file of files) {
    let text: string
    try {
      text = await readFile(file, 'utf8')
    }
    catch {
      continue
    }
    try {
      sources.set(file, { text, json: JSON.parse(text) as Record<string, unknown> })
    }
    catch {
      throw createError({ statusCode: 422, statusMessage: `${basename(file)} is not valid JSON` })
    }
  }

  const fallback = files[0]!
  if (!sources.has(fallback)) sources.set(fallback, { text: '', json: {} })

  const touched = new Set<string>()
  const placement: { key: string, file: string, created: boolean }[] = []

  for (const entry of entries) {
    let target = fallback
    let created = true
    for (const [file, source] of sources) {
      if (getAtPath(source.json, entry.key) !== null) {
        target = file
        created = false
      }
    }

    try {
      setAtPath(sources.get(target)!.json, entry.key, entry.value)
    }
    catch (error) {
      if (error instanceof WritePathError) {
        throw createError({ statusCode: 409, statusMessage: error.message })
      }
      throw error
    }

    touched.add(target)
    placement.push({ key: entry.key, file: target, created })
  }

  for (const file of touched) {
    const { text, json } = sources.get(file)!
    const output = JSON.stringify(json, null, detectIndent(text)) + (text.endsWith('\n') || !text ? '\n' : '')
    const temp = join(dirname(file), `.${basename(file)}.i18n-inspect-tmp`)
    await writeFile(temp, output, 'utf8')
    await rename(temp, file)
  }

  return { files: [...touched], placement }
}
