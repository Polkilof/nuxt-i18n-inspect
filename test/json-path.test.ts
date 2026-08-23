import { describe, expect, it } from 'vitest'
import { WritePathError, detectIndent, getAtPath, setAtPath } from '../src/runtime/json-path'

const locale = () => ({
  plain: 'Звичайний абзац',
  search: { placeholder: 'Пошук', title: 'Підказка' },
  form: { yes: 'Так' },
})

describe('читання ключа', () => {
  it('дістає вкладене значення', () => {
    expect(getAtPath(locale(), 'search.placeholder')).toBe('Пошук')
    expect(getAtPath(locale(), 'plain')).toBe('Звичайний абзац')
  })

  it('на гілці й на відсутньому ключі повертає null', () => {
    expect(getAtPath(locale(), 'search')).toBeNull()
    expect(getAtPath(locale(), 'search.missing')).toBeNull()
    expect(getAtPath(locale(), 'зовсім.інший.ключ')).toBeNull()
  })
})

describe('запис ключа', () => {
  it('замінює наявне значення, не чіпаючи сусідів', () => {
    const messages = locale()
    setAtPath(messages, 'search.placeholder', 'Шукати')
    expect(messages.search.placeholder).toBe('Шукати')
    expect(messages.search.title).toBe('Підказка')
    expect(messages.plain).toBe('Звичайний абзац')
  })

  it('створює нову гілку для ключа, якого не було', () => {
    const messages = locale() as Record<string, unknown> as { checkout: { button: { submit: string } } }
    setAtPath(messages, 'checkout.button.submit', 'Оплатити')
    expect(messages.checkout.button.submit).toBe('Оплатити')
  })

  it('зберігає порядок ключів — щоб diff у git лишався читабельним', () => {
    const messages = locale()
    setAtPath(messages, 'form.yes', 'Гаразд')
    expect(Object.keys(messages)).toEqual(['plain', 'search', 'form'])
  })

  it('не перетворює гілку на рядок', () => {
    expect(() => setAtPath(locale(), 'search', 'ой')).toThrow(WritePathError)
  })

  it('не лізе всередину рядка', () => {
    expect(() => setAtPath(locale(), 'plain.nested', 'ой')).toThrow(WritePathError)
  })

  it('порожній рядок — припустиме значення', () => {
    const messages = locale()
    setAtPath(messages, 'form.yes', '')
    expect(messages.form.yes).toBe('')
  })
})

describe('відступ файлу', () => {
  it('розпізнає два пробіли, чотири й таб', () => {
    expect(detectIndent('{\n  "a": 1\n}')).toBe(2)
    expect(detectIndent('{\n    "a": 1\n}')).toBe(4)
    expect(detectIndent('{\n\t"a": 1\n}')).toBe('\t')
  })

  it('для однорядкового файлу бере два пробіли', () => {
    expect(detectIndent('{"a":1}')).toBe(2)
  })
})
