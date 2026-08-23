/**
 * Кодування ключа перекладу в невидимий хвіст із zero-width символів.
 *
 * Алфавіт:
 *   U+2060 WORD JOINER            -> біт 0
 *   U+200C ZERO WIDTH NON-JOINER  -> біт 1
 *   U+FEFF ZERO WIDTH NO-BREAK SP -> межа маркера
 *
 * Дві відмови від алфавіту з брифу, обидві перевірені на мінному полі:
 *
 * U+200D (ZWJ) не використовуємо: це той самий символ, яким склеюються
 * складені емодзі, — маркер одразу після емодзі ризикує змінити графему.
 *
 * U+200B (ZWSP) не використовуємо: це zero-width *space*, тобто дозволена
 * точка переносу рядка. Хвіст із 40+ таких символів у вузькій колонці
 * додавав зайвий рядок (виміряно: 2 рядки замість 1). Усі три символи
 * нижче переносу не створюють.
 */
export const BIT_0 = '⁠'
export const BIT_1 = '‌'
export const FENCE = '﻿'

const MARKER_SOURCE = FENCE + '[' + BIT_0 + BIT_1 + ']+' + FENCE
const markerRe = () => new RegExp(MARKER_SOURCE, 'g')

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/** Ключ -> невидимий хвіст. */
export function encodeKey(key: string): string {
  let bits = ''
  for (const byte of encoder.encode(key)) {
    bits += byte.toString(2).padStart(8, '0')
  }
  return FENCE + bits.replace(/0/g, BIT_0).replace(/1/g, BIT_1) + FENCE
}

/** Невидимий хвіст -> ключ. Повертає null, якщо маркер побитий. */
export function decodeMarker(marker: string): string | null {
  const body = marker.split(FENCE).join('')
  if (!body.length || body.length % 8 !== 0) return null
  const bytes = new Uint8Array(body.length / 8)
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | (body[i * 8 + b] === BIT_1 ? 1 : 0)
    }
    bytes[i] = byte
  }
  try {
    return decoder.decode(bytes)
  }
  catch {
    return null
  }
}

/** Прибрати всі маркери — те, що мав би робити код перед відправкою на бекенд. */
export function stripMarkers(text: string): string {
  return text.replace(markerRe(), '')
}

export function hasMarker(text: string): boolean {
  return markerRe().test(text)
}

/** Усі ключі в рядку — для діагностики. */
export function allKeys(text: string): string[] {
  return [...text.matchAll(markerRe())].map(m => decodeMarker(m[0]) ?? '<побитий маркер>')
}

/** Усі маркери рядка з позиціями — потрібні, щоб відміряти межі сегментів. */
export function markerMatches(text: string): { key: string, index: number, length: number }[] {
  const found: { key: string, index: number, length: number }[] = []
  for (const m of text.matchAll(markerRe())) {
    const key = decodeMarker(m[0])
    if (key) found.push({ key, index: m.index, length: m[0].length })
  }
  return found
}

export interface MarkerMatch {
  key: string
  /** Індекс, де починається сам маркер — і де закінчується видимий текст. */
  index: number
  /** Початок видимого сегмента: кінець попереднього маркера або 0. */
  segmentStart: number
}

/**
 * Маркер, якому належить позиція в тексті.
 *
 * Маркер — суфікс, тож сегменту під офсетом належить найближчий маркер
 * ПРАВОРУЧ. Саме це правило розрулює конкатенацію t('a') + ' ' + t('b')
 * усередині однієї текстової ноди.
 */
export function markerAt(text: string, offset: number): MarkerMatch | null {
  let segmentStart = 0
  let fallback: MarkerMatch | null = null

  for (const m of text.matchAll(markerRe())) {
    const key = decodeMarker(m[0])
    const end = m.index + m[0].length
    if (key) {
      const match: MarkerMatch = { key, index: m.index, segmentStart }
      if (end >= offset) return match
      fallback = match
    }
    segmentStart = end
  }
  return fallback
}

/** Ключ рядка під курсором. */
export function keyAtOffset(text: string, offset: number): string | null {
  return markerAt(text, offset)?.key ?? null
}
