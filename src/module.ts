import { addPlugin, addServerHandler, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { I18nOptions } from './locale-paths'
import { localeFiles } from './locale-paths'

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

function i18nOptions(nuxt: Nuxt): I18nOptions {
  return (nuxt.options as unknown as { i18n?: I18nOptions }).i18n ?? {}
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

    const { rootDir, srcDir } = nuxt.options
    const i18n = i18nOptions(nuxt)
    const files = localeFiles({ rootDir, srcDir }, i18n)

    // Локалі оголошені, а файлів не видно — так поводиться @nuxtjs/i18n v8:
    // він прибирає `file` з конфігу ще до того, як нас запустять, тож імен
    // файлів нам просто нема звідки взяти. Мовчати про це — гірший варіант:
    // панель відкриється й нічого не знайде.
    if (i18n.locales?.length && !Object.keys(files).length) {
      useLogger('nuxt-i18n-inspect').warn(
        'No JSON locale files found in the @nuxtjs/i18n config. Editing will be unavailable; @nuxtjs/i18n v9 or newer is required.',
      )
    }

    // приватна частина: шляхи до файлів на клієнт не потрапляють
    nuxt.options.runtimeConfig.i18nInspect = {
      localeFiles: files,
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
