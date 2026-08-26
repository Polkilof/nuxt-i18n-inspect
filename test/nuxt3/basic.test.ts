import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
// з установленого пакета, а не з src: перевіряємо саме те, що йде в npm
import { allKeys, hasMarker, stripMarkers } from 'nuxt-i18n-inspect/runtime/marker'

/**
 * Заявлено `nuxt: '>=3.0.0'` — тут це підтверджується на живому застосунку:
 * Nuxt 3, @nuxtjs/i18n v9 і локалі в тій розкладці, яка була до переїзду
 * в <rootDir>/i18n. Решта тестів іде на Nuxt 4 з i18n v10.
 */
describe('Nuxt 3 з @nuxtjs/i18n v9', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('.', import.meta.url)),
  })

  it('дописує маркер до перекладу', async () => {
    const html = await $fetch<string>('/')

    expect(hasMarker(html)).toBe(true)
    expect(allKeys(html)).toContain('hello')
  })

  it('не змінює видимий текст', async () => {
    const html = await $fetch<string>('/')

    expect(stripMarkers(html)).toContain('<div>Hello</div>')
  })

  it('знаходить локалі під srcDir, а не тільки в <rootDir>/i18n', async () => {
    const message = await $fetch<{
      locales: { locale: string, value: string, exists: boolean, file: string, fileName: string }[]
    }>('/__i18n-inspect/message', { query: { key: 'hello' } })

    expect(message.locales).toEqual([
      { locale: 'en', value: 'Hello', exists: true, file: expect.any(String), fileName: 'en.json' },
    ])
  })
})
