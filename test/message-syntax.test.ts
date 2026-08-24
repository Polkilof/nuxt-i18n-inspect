import { describe, expect, it } from 'vitest'
import { escapeMessage, hasPluralBar, unescapeMessage } from '../src/runtime/message-syntax'

describe('escapeMessage', () => {
  it('екранує пошту, бо @ починає зв\'язане повідомлення', () => {
    expect(escapeMessage('write to support@example.com')).toBe('write to support{\'@\'}example.com')
  })

  it('лишає навмисне посилання на інший ключ', () => {
    expect(escapeMessage('@:brand.name is here')).toBe('@:brand.name is here')
    expect(escapeMessage('@.lower:brand.name')).toBe('@.lower:brand.name')
  })

  it('не екранує вдруге те, що вже екрановано', () => {
    expect(escapeMessage('you{\'@\'}company.com')).toBe('you{\'@\'}company.com')
  })

  it('не чіпає підстановки', () => {
    expect(escapeMessage('Hello, {name}!')).toBe('Hello, {name}!')
  })

  it('екранує риску, якщо ключ не був плюралізованим', () => {
    expect(escapeMessage('Mon | Tue', 'Monday')).toBe('Mon {\'|\'} Tue')
  })

  it('лишає риски, якщо ключ уже мав форми множини', () => {
    const previous = 'no apples | one apple | {count} apples'
    expect(escapeMessage('no apples | one apple | {count} apples', previous)).toBe(previous)
  })

  it('екранує риску в новому ключі, якого ще немає у файлі', () => {
    expect(escapeMessage('a | b', null)).toBe('a {\'|\'} b')
  })
})

describe('hasPluralBar', () => {
  it('бачить неекрановану риску', () => {
    expect(hasPluralBar('one | many')).toBe(true)
  })

  it('не рахує екрановану', () => {
    expect(hasPluralBar('a {\'|\'} b')).toBe(false)
  })
})

describe('unescapeMessage', () => {
  it('повертає текст у вигляді, придатному для показу', () => {
    expect(unescapeMessage('you{\'@\'}company.com')).toBe('you@company.com')
    expect(unescapeMessage('a {\'|\'} b')).toBe('a | b')
  })

  it('не чіпає інші літерали', () => {
    expect(unescapeMessage('{\'{\'}not a placeholder{\'}\'}')).toBe('{\'{\'}not a placeholder{\'}\'}')
  })
})
