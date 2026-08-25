import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

const locale = fileURLToPath(new URL('./fixtures/hook/i18n/locales/en.json', import.meta.url))

describe('шов у записі', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/hook', import.meta.url)),
  })

  it('віддає клієнтові результат слухача, а не свій', async () => {
    const response = await $fetch<{ file: string, created: boolean }>('/__i18n-inspect/message', {
      method: 'PUT',
      body: { locale: 'en', key: 'hello', value: 'Перехоплено' },
    })

    expect(response).toEqual({ file: 'merge-request', created: false })
  })

  it('не чіпає файл локалі, коли слухач узяв запис на себе', async () => {
    await $fetch('/__i18n-inspect/message', {
      method: 'PUT',
      body: { locale: 'en', key: 'hello', value: 'Перехоплено' },
    })

    expect(JSON.parse(await readFile(locale, 'utf8'))).toEqual({ hello: 'Hello' })
  })
})
