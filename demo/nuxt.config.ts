// GitHub Pages віддає сайт із підкаталогу з іменем репозиторію, тож статичну
// збірку треба запускати з NUXT_APP_BASE_URL=/nuxt-i18n-inspect/. У dev змінної
// немає і база лишається коренем. Слеш у кінці дописуємо самі: посилання нижче
// склеюються з нею рядком, і без нього шлях зліпився б із іменем файлу.
const base = (process.env.NUXT_APP_BASE_URL || '/').replace(/\/?$/, '/')

// nuxt dev ставить development, nuxt generate - production
const isDev = process.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  // той самий один рядок, що й у README
  modules: ['@nuxtjs/i18n', 'nuxt-i18n-inspect'],
  // вимкнено навмисно: демо знімають на відео, зайвих плашок на екрані бути не має
  devtools: { enabled: false },
  app: {
    baseURL: base,
    head: {
      link: [
        // Знак на плашці, а не прозорий: сам по собі t{} лежить смугою
        // 2.2:1, і в квадратній іконці вкладки від нього лишалась тонка
        // риска. Плашка дає знаку тіло. SVG першим, PNG - для Safari,
        // який SVG-фавікони не підтримує взагалі.
        // Базу підставляємо вручну: рядки в head.link Nuxt не переписує,
        // і під підшляхом Pages вони дали б 404
        { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${base}favicon-32.png` },
        { rel: 'apple-touch-icon', sizes: '180x180', href: `${base}apple-touch-icon.png` },

        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        // три ролі: Space Grotesk - заголовки, Inter - текст, JetBrains Mono - код.
        // display=swap, бо текст важливіший за шрифт: сторінку читають, поки він їде
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap',
        },
      ],
    },
  },
  compatibilityDate: '2025-07-15',
  // Дашборд потрібен лише як піддослідний для модуля: без dev-режиму він нічого
  // не показує, а на публічній вітрині це просто зайва сторінка. Ховати саме
  // посилання мало - маршрут лишався б у бандлі й відкривався за прямою адресою,
  // тому викидаємо його з переліку сторінок ще до збірки.
  hooks: {
    'pages:extend': (pages) => {
      if (isDev) return
      const at = pages.findIndex(page => page.path === '/app')
      if (at !== -1) pages.splice(at, 1)
    },
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    // de заповнена частково - щоб аудит мав що підсвітити червоним,
    // а список ключів показав неповне покриття
    vueI18n: './i18n.config.ts',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Francais', file: 'fr.json' },
      { code: 'de', name: 'Deutsch', file: 'de.json' },
    ],
  },
})
