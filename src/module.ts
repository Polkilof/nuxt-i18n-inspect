import { resolve } from 'node:path'
import { addPlugin, addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'

export interface ModuleOptions {
  /**
   * Вмикати модуль поза dev-режимом. За замовчуванням — тільки dev:
   * у прод-білді не підключається жоден плагін, тож нуль оверхеду й нуль ризику.
   * Знадобиться на кроці «режим копірайтера» для preview-деплоїв.
   */
  enabled?: boolean

  /**
   * Комбінація, яка вмикає й вимикає режим інспектування.
   * Формат: 'alt+shift+i', 'ctrl+k', 'meta+shift+e'.
   */
  hotkey?: string
}

/**
 * Та частина конфігу @nuxtjs/i18n, яка нас цікавить. Описано тут, а не взято
 * з типів модуля, щоб не тягнути @nuxtjs/i18n у залежності: він у користувача
 * уже є, а нам від нього треба чотири поля.
 */
type DeclaredFile = string | { path?: string }
interface I18nOptions {
  restructureDir?: string
  langDir?: string
  defaultLocale?: string
  locales?: (string | { code?: string, file?: DeclaredFile, files?: DeclaredFile[] })[]
}

function i18nOptions(nuxt: Nuxt): I18nOptions {
  return (nuxt.options as unknown as { i18n?: I18nOptions }).i18n ?? {}
}

/**
 * Абсолютні шляхи до JSON-локалей із конфігу @nuxtjs/i18n.
 * Панель читає значення з файлу, бо в рантаймі повідомлення вже скомпільовані.
 */
function localeFiles(nuxt: Nuxt): Record<string, string[]> {
  const i18n = i18nOptions(nuxt)
  const dir = resolve(nuxt.options.rootDir, i18n.restructureDir ?? 'i18n', i18n.langDir ?? 'locales')
  const files: Record<string, string[]> = {}

  for (const locale of i18n.locales ?? []) {
    if (typeof locale === 'string' || !locale?.code) continue
    const declared = locale.files ?? (locale.file ? [locale.file] : [])
    const paths = declared
      .map(file => (typeof file === 'string' ? file : file?.path))
      .filter((path): path is string => !!path)
      .map(path => resolve(dir, path))
    if (paths.length) files[locale.code] = paths
  }

  return files
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-i18n-inspect',
    configKey: 'i18nInspect',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {
    hotkey: 'alt+shift+i',
  },
  setup(options, nuxt) {
    const enabled = options.enabled ?? nuxt.options.dev
    if (!enabled) return

    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.i18nInspect = { hotkey: options.hotkey! }
    // приватна частина: шляхи до файлів на клієнт не потрапляють
    nuxt.options.runtimeConfig.i18nInspect = {
      localeFiles: localeFiles(nuxt),
      // локаль, з якою звіт порівнює решту: множина ключів береться з неї
      defaultLocale: i18nOptions(nuxt).defaultLocale ?? '',
    }

    // Універсальний: хук має віддавати однакові рядки на сервері й на клієнті,
    // інакше буде розбіжність гідрації.
    addPlugin({ src: resolver.resolve('./runtime/plugin'), mode: 'all' })

    // Оверлей і панель — тільки клієнт.
    addPlugin({ src: resolver.resolve('./runtime/plugin.client'), mode: 'client' })

    addServerHandler({
      route: '/__i18n-inspect/message',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/message.get'),
    })

    addServerHandler({
      route: '/__i18n-inspect/message',
      method: 'put',
      handler: resolver.resolve('./runtime/server/api/message.put'),
    })

    addServerHandler({
      route: '/__i18n-inspect/keys',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/keys.get'),
    })

    addServerHandler({
      route: '/__i18n-inspect/report',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/report.get'),
    })
  },
})

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    /** Приватна частина: шляхи до файлів на клієнт не потрапляють. */
    i18nInspect: {
      localeFiles: Record<string, string[]>
      defaultLocale: string
    }
  }
  interface PublicRuntimeConfig {
    i18nInspect: { hotkey: string }
  }
}
