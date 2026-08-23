import { markerMatches } from './marker'
import { inheritedMarkerFor } from './probe'

/**
 * Аудит сторінки: два питання з одним механізмом.
 *
 *   untranslated — маркер є, але ключа немає в поточній локалі
 *                  (на екрані текст фолбеку);
 *   foreign      — маркера немає взагалі, тобто рядок не заведений в i18n.
 */
export type AuditKind = 'untranslated' | 'foreign'

export interface Finding {
  kind: AuditKind
  key: string | null
  range: Range
}

export interface ScanOptions {
  /** Чи є ключ у поточній локалі. */
  hasKey: (key: string) => boolean
  untranslated: boolean
  foreign: boolean
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TITLE'])

/**
 * Текст, який не варто чіпати навіть у режимі «поза i18n»: числа, розділові
 * знаки, поодинокі символи. Без цього фільтра сторінка перетворюється на
 * ялинку — на стенді таких нод 81 проти 11 перекладених.
 */
function looksTranslatable(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 2) return false
  return /\p{L}{2,}/u.test(trimmed)
}

function skipped(node: Text): boolean {
  const parent = node.parentElement
  if (!parent) return true
  if (SKIP_TAGS.has(parent.tagName)) return true
  // власний UI модуля й те, що застосунок позначив як «не перекладати»
  return !!parent.closest('[data-i18n-inspect], [data-i18n-ignore]')
}

/** Діапазон видимого сегмента всередині однієї текстової ноди. */
function segmentRange(node: Text, from: number, to: number): Range {
  const range = document.createRange()
  range.setStart(node, from)
  range.setEnd(node, to)
  return range
}

export function scanDocument(options: ScanOptions): Finding[] {
  const findings: Finding[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set<Element>()
  let node: Node | null

  while ((node = walker.nextNode())) {
    const text = node as Text
    if (skipped(text) || !text.data.trim()) continue

    const matches = markerMatches(text.data)

    if (matches.length) {
      if (!options.untranslated) continue
      let start = 0
      for (const match of matches) {
        if (!options.hasKey(match.key)) {
          findings.push({ kind: 'untranslated', key: match.key, range: segmentRange(text, start, match.index) })
        }
        start = match.index + match.length
      }
      continue
    }

    // Маркера в ноді немає — але вона може бути частиною перекладу,
    // розірваного розміткою (v-html). Тоді це не «поза i18n».
    const inherited = inheritedMarkerFor(text)
    if (inherited) {
      // один переклад на кілька нод — підсвічуємо його один раз
      if (options.untranslated && !options.hasKey(inherited.key) && !seen.has(inherited.owner)) {
        seen.add(inherited.owner)
        findings.push({ kind: 'untranslated', key: inherited.key, range: inherited.range })
      }
      continue
    }

    if (options.foreign && looksTranslatable(text.data)) {
      findings.push({ kind: 'foreign', key: null, range: segmentRange(text, 0, text.data.length) })
    }
  }

  return findings
}
