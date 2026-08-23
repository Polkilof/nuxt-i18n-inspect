/**
 * fallbackLocale читається ТІЛЬКИ звідси. В опціях модуля @nuxtjs/i18n
 * такого поля немає, а без цього файлу воно примусово стає false
 * (див. setupVueI18nOptions: `options.fallbackLocale ??= false`) —
 * і замість фолбеку на сторінці рендеряться сирі ключі.
 *
 * Заразом це перевірка, що модуль i18n-inspect уживається з користувацьким
 * vueI18n-конфігом: свій postTranslation він ставить у рантаймі й обгортає
 * чужий, якщо той є.
 */
export default defineI18nConfig(() => ({
  fallbackLocale: 'en',
}))
