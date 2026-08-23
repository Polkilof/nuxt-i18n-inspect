import { describe, expect, it } from 'vitest'
import { allKeys, encodeKey, hasMarker, keyAtOffset, markerAt, markerMatches, stripMarkers } from '../src/runtime/marker'

const mark = (text: string, key: string) => text + encodeKey(key)

describe('кодування ключа', () => {
  it('переживає зворотне перетворення', () => {
    for (const key of ['plain', 'search.placeholder', 'ключ.з.кирилицею', 'a', 'емодзі🎉']) {
      expect(allKeys(mark('текст', key))).toEqual([key])
    }
  })

  it('не змінює видимий текст', () => {
    expect(stripMarkers(mark('Привіт', 'greeting'))).toBe('Привіт')
  })

  it('не використовує символів, що дозволяють перенос рядка', () => {
    // U+200B (ZWSP) додавав зайвий рядок у вузькій колонці,
    // U+200D (ZWJ) склеювався з емодзі — обох в алфавіті бути не має
    const marker = encodeKey('any')
    expect(marker).not.toContain('​')
    expect(marker).not.toContain('‍')
  })

  it('обрізаний маркер не декодується', () => {
    const cut = mark('текст', 'plain').slice(0, -3)
    expect(hasMarker(cut)).toBe(false)
  })
})

describe('вибір ключа під курсором', () => {
  const a = mark('Перша частина,', 'concat.a')
  const b = mark(' друга частина.', 'concat.b')
  const joined = a + b

  it('бере найближчий маркер праворуч', () => {
    expect(keyAtOffset(joined, 3)).toBe('concat.a')
    expect(keyAtOffset(joined, a.length + 5)).toBe('concat.b')
  })

  it('віддає межі саме свого сегмента, а не всієї ноди', () => {
    const first = markerAt(joined, 3)!
    expect(first.segmentStart).toBe(0)
    expect(joined.slice(first.segmentStart, first.index)).toBe('Перша частина,')

    const second = markerAt(joined, a.length + 5)!
    expect(joined.slice(second.segmentStart, second.index)).toBe(' друга частина.')
  })

  it('після останнього маркера повертає останній ключ', () => {
    expect(keyAtOffset(joined, joined.length)).toBe('concat.b')
  })

  it('у тексті без маркерів не знаходить нічого', () => {
    expect(keyAtOffset('звичайний текст', 4)).toBeNull()
    expect(markerMatches('звичайний текст')).toEqual([])
  })

  it('перелічує маркери з позиціями', () => {
    const matches = markerMatches(joined)
    expect(matches.map(m => m.key)).toEqual(['concat.a', 'concat.b'])
    expect(matches[0]!.index).toBe('Перша частина,'.length)
  })
})
