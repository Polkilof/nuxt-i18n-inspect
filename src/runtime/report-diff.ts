/**
 * Порівняння локалі з базовою. Чиста функція без Nuxt і без файлової системи —
 * саме тут вирішується, що вважати незаповненим, тож це має бути під тестами.
 *
 * Використовує серверний роут /__i18n-inspect/report.
 */

export interface ReportItem {
  key: string
  /** 'absent' — ключа немає у файлі, 'empty' — є, але порожній рядок. */
  kind: 'absent' | 'empty'
  /** Текст базової локалі: з нього копірайтер і перекладає. */
  base: string
}

export interface LocaleDiff {
  total: number
  filled: number
  missing: ReportItem[]
  copies: ReportItem[]
  dead: string[]
}

/** Плоска мапа значень: { search: { title: 'Пошук' } } -> 'search.title' => 'Пошук'. */
export function flatten(node: unknown, prefix = '', out = new Map<string, string>()): Map<string, string> {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) return out
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out.set(path, value)
    else flatten(value, path, out)
  }
  return out
}

/**
 * Що вважати незаповненим:
 *   немає ключа        -> absent
 *   є, але порожній    -> empty
 *   дорівнює базовому  -> copies, ОКРЕМО і в покриття не б'є.
 *
 * Останнє свідомо не рахується за незаповнене: у реальному проєкті купа
 * однакових рядків легітимна (OK, Email, PDF, назви брендів, числа). Якщо
 * змішати їх із порожніми, список стане шумним, і ним перестануть користуватись.
 */
export function diffLocale(base: Map<string, string>, own: Map<string, string>, isBase = false): LocaleDiff {
  const missing: ReportItem[] = []
  const copies: ReportItem[] = []

  for (const [key, baseValue] of base) {
    const value = own.get(key)

    if (value === undefined) missing.push({ key, kind: 'absent', base: baseValue })
    else if (!value.trim()) missing.push({ key, kind: 'empty', base: baseValue })
    else if (!isBase && value === baseValue && baseValue.trim()) copies.push({ key, kind: 'empty', base: baseValue })
  }

  // Зворотна різниця: є тут, немає в базовій — залишки видалених фіч.
  const dead = isBase ? [] : [...own.keys()].filter(key => !base.has(key))

  return { total: base.size, filled: base.size - missing.length, missing, copies, dead }
}
