import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Та частина конфігу @nuxtjs/i18n, яка нас цікавить. Описано тут, а не взято
 * з типів модуля, щоб не тягнути @nuxtjs/i18n у залежності: він у користувача
 * уже є, а нам від нього треба чотири поля.
 */
export type DeclaredFile = string | { path?: string }
export interface I18nOptions {
  restructureDir?: string | false
  langDir?: string
  defaultLocale?: string
  locales?: (string | { code?: string, file?: DeclaredFile, files?: DeclaredFile[] })[]
}

/** Корені проєкту, від яких @nuxtjs/i18n рахує шляхи до локалей. */
export interface Dirs {
  rootDir: string
  srcDir: string
}

/**
 * Куди @nuxtjs/i18n складає локалі. Правило різне в трьох поколіннях модуля,
 * а версію ми з конфігу не бачимо — там лише опції користувача:
 *
 *   v10   rootDir / (restructureDir ?? 'i18n') / (langDir ?? 'locales')
 *   v9    те саме, але restructureDir: false повертає до srcDir / (langDir ?? '')
 *   v8    restructureDir за замовчуванням немає, тож srcDir / (langDir ?? '')
 *
 * Коли restructureDir заданий явно — рядком чи false — розкладка однозначна.
 * Коли його немає, це або v9/v10 із дефолтом 'i18n', або v8 без нього;
 * розрізнити їх можна лише по диску, цим і займається resolveDeclaredFile.
 */
export function langDirs(dirs: Dirs, i18n: I18nOptions): string[] {
  const { restructureDir, langDir } = i18n

  if (typeof restructureDir === 'string' && restructureDir) {
    return [resolve(dirs.rootDir, restructureDir, langDir ?? 'locales')]
  }

  // v9: явна відмова від переїзду локалей у <rootDir>/i18n
  if (restructureDir === false) {
    return [resolve(dirs.srcDir, langDir ?? '')]
  }

  return [
    resolve(dirs.rootDir, 'i18n', langDir ?? 'locales'),
    resolve(dirs.srcDir, langDir ?? ''),
  ]
}

/**
 * Оголошений у конфізі шлях → абсолютний. З кількох можливих розкладок беремо
 * ту, де файл справді лежить: якщо i18n його читає, то на диску він є.
 * Не знайшли ніде — повертаємо перший варіант, щоб помилка вказувала на
 * сучасну розкладку, а не на історичну.
 */
export function resolveDeclaredFile(
  dirs: string[],
  path: string,
  exists: (path: string) => boolean = existsSync,
): string {
  const candidates = dirs.map(dir => resolve(dir, path))
  return candidates.find(exists) ?? candidates[0]!
}

/**
 * Абсолютні шляхи до JSON-локалей із конфігу @nuxtjs/i18n.
 * Панель читає значення з файлу, бо в рантаймі повідомлення вже скомпільовані.
 */
export function localeFiles(
  dirs: Dirs,
  i18n: I18nOptions,
  exists: (path: string) => boolean = existsSync,
): Record<string, string[]> {
  const searched = langDirs(dirs, i18n)
  const files: Record<string, string[]> = {}

  for (const locale of i18n.locales ?? []) {
    if (typeof locale === 'string' || !locale?.code) continue
    const declared = locale.files ?? (locale.file ? [locale.file] : [])
    const paths = declared
      .map(file => (typeof file === 'string' ? file : file?.path))
      .filter((path): path is string => !!path)
      .map(path => resolveDeclaredFile(searched, path, exists))
    if (paths.length) files[locale.code] = paths
  }

  return files
}
