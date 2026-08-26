import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * Конфіг з'явився заради одного: змонтувати InspectPanel.vue у тесті.
 * Без плагіна Vitest не вміє читати SFC, а решта тестів — чистий TypeScript
 * і e2e через @nuxt/test-utils, тож їм цей конфіг нічого не змінює.
 *
 * Середовище задається пофайлово (`// @vitest-environment happy-dom`):
 * піднімати DOM для решти тестів немає причин.
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    // test/nuxt3 — окремий проєкт зі своїми залежностями (Nuxt 3 + i18n v9).
    // Кореневим запуском його не підняти: тут стоять Nuxt 4 та i18n v10.
    exclude: ['**/node_modules/**', '**/dist/**', 'test/nuxt3/**'],
  },
})
