/**
 * Символи, які vue-i18n читає як синтаксис, а копірайтер - як звичайний текст.
 *
 * Панель кладе у файл рівно те, що набрали. Але у vue-i18n «@» починає
 * зв'язане повідомлення (@:key), тож адреса пошти в тексті валить компіляцію
 * повідомлень цілком, а «|» розділяє форми множини й мовчки перетворює рядок
 * на плюралізований. Обидві помилки вилазять у консолі збірки - тобто їх
 * побачить розробник, а не той, хто їх зробив.
 *
 * Тому екранування автоматичне: користувач не має знати про синтаксис
 * vue-i18n, щоб написати «пишіть на support@example.com».
 */

/** Літерал vue-i18n: {'...'} - усередині нього синтаксис уже не діє. */
const LITERAL = /\{'[^']*'\}/g

/** Застосовує fn до всього, що лежить поза літералами. */
function outsideLiterals(value: string, fn: (chunk: string) => string): string {
  let out = ''
  let last = 0

  for (const match of value.matchAll(LITERAL)) {
    const at = match.index ?? 0
    out += fn(value.slice(last, at)) + match[0]
    last = at + match[0].length
  }

  return out + fn(value.slice(last))
}

/** Чи є неекранована вертикальна риска, тобто чи це форми множини. */
export function hasPluralBar(value: string): boolean {
  let found = false
  outsideLiterals(value, (chunk) => {
    if (chunk.includes('|')) found = true
    return chunk
  })
  return found
}

/**
 * Готує набраний текст до запису у файл локалі.
 *
 * previous - значення, яке лежало у файлі до правки. Воно потрібне рівно для
 * одного рішення: якщо ключ уже був плюралізованим, риски лишаються на місці,
 * бо користувач редагує форми, а не друкує риску. Для всіх інших ключів нова
 * риска - це друкарський знак, і її треба екранувати.
 */
export function escapeMessage(value: string, previous: string | null = null): string {
  const keepBars = previous !== null && hasPluralBar(previous)

  return outsideLiterals(value, (chunk) => {
    let out = ''

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i]!

      // «@:» і «@.» - навмисне посилання на інший ключ, його не чіпаємо
      if (char === '@' && chunk[i + 1] !== ':' && chunk[i + 1] !== '.') {
        out += '{\'@\'}'
        continue
      }
      if (char === '|' && !keepBars) {
        out += '{\'|\'}'
        continue
      }
      out += char
    }

    return out
  })
}

/**
 * Зворотна дія для показу в панелі: у полі має бути текст, а не екранування.
 * Розгортаються тільки ті два літерали, які ставить escapeMessage - решта
 * {'...'} у повідомленні написана руками й лишається як є.
 */
export function unescapeMessage(value: string): string {
  return value.replaceAll('{\'@\'}', '@').replaceAll('{\'|\'}', '|')
}
