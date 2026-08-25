/**
 * Сторонній слухач `i18nInspect:write` — рівно те, що робитиме надбудова:
 * бере запис на себе й у файл нічого не пише.
 *
 * Реєструється за конвенцією `server/plugins/`, тобто ззовні модуля,
 * без жодної правки в ядрі — саме це тест і має довести.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('i18nInspect:write', (context) => {
    context.result = {
      files: [],
      placement: context.entries.map(entry => ({
        key: entry.key,
        file: 'merge-request',
        created: false,
      })),
    }
  })
})
