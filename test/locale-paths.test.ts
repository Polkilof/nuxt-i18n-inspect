import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { langDirs, localeFiles } from '../src/locale-paths'

const dirs = { rootDir: resolve('/app'), srcDir: resolve('/app/app') }

/** Диск, якого немає: список наявних файлів задається тестом. */
const disk = (...paths: string[]) => (path: string) => paths.map(p => resolve(p)).includes(path)

const nothing = () => false

describe('пошук каталогу з локалями', () => {
  it('бере <rootDir>/i18n/locales, коли restructureDir не заданий — так робить i18n v9 і v10', () => {
    expect(langDirs(dirs, {})[0]).toBe(resolve('/app/i18n/locales'))
  })

  it('пробує ще й srcDir: у i18n v8 restructureDir не існував', () => {
    expect(langDirs(dirs, { langDir: 'locales' })).toEqual([
      resolve('/app/i18n/locales'),
      resolve('/app/app/locales'),
    ])
  })

  it('рахує restructureDir від rootDir, а не від srcDir', () => {
    expect(langDirs(dirs, { restructureDir: 'lang' })).toEqual([resolve('/app/lang/locales')])
  })

  it('restructureDir: false повертає до srcDir — так вимикали переїзд у i18n v9', () => {
    expect(langDirs(dirs, { restructureDir: false, langDir: 'locales' })).toEqual([
      resolve('/app/app/locales'),
    ])
  })

  it('без restructureDir і без langDir лишається сам srcDir: у i18n v8 langDir не мав дефолту', () => {
    expect(langDirs(dirs, { restructureDir: false })).toEqual([resolve('/app/app')])
  })

  it('не гадає, коли розкладку задано явно', () => {
    expect(langDirs(dirs, { restructureDir: 'lang' })).toHaveLength(1)
    expect(langDirs(dirs, { restructureDir: false })).toHaveLength(1)
  })
})

describe('шляхи до файлів локалей', () => {
  const locales = [{ code: 'en', file: 'en.json' }]

  it('знаходить сучасну розкладку i18n v9/v10', () => {
    const files = localeFiles(dirs, { locales }, disk('/app/i18n/locales/en.json'))

    expect(files).toEqual({ en: [resolve('/app/i18n/locales/en.json')] })
  })

  it('знаходить розкладку i18n v8, де локалі лежать під srcDir', () => {
    const i18n = { langDir: 'locales', locales }
    const files = localeFiles(dirs, i18n, disk('/app/app/locales/en.json'))

    expect(files).toEqual({ en: [resolve('/app/app/locales/en.json')] })
  })

  it('віддає сучасну розкладку, коли файла немає ніде: помилка має вказувати на неї', () => {
    const files = localeFiles(dirs, { langDir: 'locales', locales }, nothing)

    expect(files).toEqual({ en: [resolve('/app/i18n/locales/en.json')] })
  })

  it('розбирає files[] і пропускає локалі без файлів', () => {
    const i18n = {
      locales: [
        { code: 'en', files: ['common.json', { path: 'errors.json' }] },
        { code: 'de' },
        'fr',
      ],
    }
    const files = localeFiles(dirs, i18n, disk('/app/i18n/locales/common.json'))

    expect(files).toEqual({
      en: [resolve('/app/i18n/locales/common.json'), resolve('/app/i18n/locales/errors.json')],
    })
  })

  it('не чіпає абсолютний langDir', () => {
    const langDir = resolve('/elsewhere/locales')
    const files = localeFiles(dirs, { langDir, locales }, disk('/elsewhere/locales/en.json'))

    expect(files).toEqual({ en: [resolve('/elsewhere/locales/en.json')] })
  })
})
