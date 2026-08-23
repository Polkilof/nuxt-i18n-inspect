import { describe, expect, it } from 'vitest'
import { diffLocale, flatten } from '../src/runtime/report-diff'

const base = () => flatten({
  plain: 'Звичайний абзац',
  form: { yes: 'Так', ok: 'OK' },
  search: { placeholder: 'Пошук' },
})

describe('розкладання локалі в плоскі ключі', () => {
  it('склеює вкладеність через крапку', () => {
    expect([...base().keys()]).toEqual(['plain', 'form.yes', 'form.ok', 'search.placeholder'])
    expect(base().get('form.yes')).toBe('Так')
  })

  it('ігнорує масиви й не-об\'єкти', () => {
    expect([...flatten({ list: ['a', 'b'], n: 1, ok: 'так' }).keys()]).toEqual(['ok'])
    expect(flatten(null).size).toBe(0)
    expect(flatten('рядок').size).toBe(0)
  })
})

describe('незаповнені ключі', () => {
  it('відсутній ключ і порожній рядок — обидва незаповнені', () => {
    const own = flatten({ plain: 'Plain', form: { yes: '   ' } })
    const diff = diffLocale(base(), own)

    expect(diff.missing.map(i => [i.key, i.kind])).toEqual([
      ['form.yes', 'empty'],
      ['form.ok', 'absent'],
      ['search.placeholder', 'absent'],
    ])
    expect(diff.missing[0]!.base).toBe('Так')
  })

  it('покриття рахується від базової локалі', () => {
    const own = flatten({ plain: 'Plain' })
    const diff = diffLocale(base(), own)

    expect(diff.total).toBe(4)
    expect(diff.filled).toBe(1)
  })
})

describe('копії базового тексту', () => {
  it('не рахуються за незаповнені й не б\'ють у покриття', () => {
    const own = flatten({ plain: 'Звичайний абзац', form: { yes: 'Ja', ok: 'OK' }, search: { placeholder: 'Suche' } })
    const diff = diffLocale(base(), own)

    expect(diff.missing).toEqual([])
    expect(diff.filled).toBe(4)
    expect(diff.copies.map(i => i.key)).toEqual(['plain', 'form.ok'])
  })

  it('у самій базовій локалі копій не буває', () => {
    const diff = diffLocale(base(), base(), true)

    expect(diff.copies).toEqual([])
    expect(diff.missing).toEqual([])
  })
})

describe('мертві ключі', () => {
  it('знаходить те, чого вже немає в базовій', () => {
    const own = flatten({ plain: 'Plain', legacy: { banner: 'Стара фіча' } })

    expect(diffLocale(base(), own).dead).toEqual(['legacy.banner'])
  })

  it('для базової локалі порожні за визначенням', () => {
    expect(diffLocale(base(), flatten({ extra: 'x' }), true).dead).toEqual([])
  })
})
