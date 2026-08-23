import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { allKeys, hasMarker, stripMarkers } from '../src/runtime/marker'

describe('маркери в серверному рендері', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('дописує маркер до перекладу без жодного налаштування', async () => {
    const html = await $fetch<string>('/')

    expect(hasMarker(html)).toBe(true)
    expect(allKeys(html)).toContain('hello')
  })

  it('не змінює видимий текст', async () => {
    const html = await $fetch<string>('/')

    expect(stripMarkers(html)).toContain('<div>Hello</div>')
  })
})
