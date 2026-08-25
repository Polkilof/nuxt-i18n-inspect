import { describe, expect, it } from 'vitest'
import { visibleActions } from '../src/runtime/state'
import type { PanelAction, Selection } from '../src/runtime/state'

const selection: Selection = {
  key: 'hero.title',
  source: 'text',
  label: 'text',
  entries: [],
  note: null,
  loading: false,
}

function action(id: string, extra: Partial<PanelAction> = {}): PanelAction {
  return { id, label: id, run: () => {}, ...extra }
}

describe('дії панелі', () => {
  it('без вибірки не показує нічого', () => {
    expect(visibleActions([action('mr')], null)).toEqual([])
  })

  it('без предикату показує дію завжди', () => {
    expect(visibleActions([action('mr')], selection).map(a => a.id)).toEqual(['mr'])
  })

  it('відсіює за предикатом і зберігає порядок реєстрації', () => {
    const actions = [
      action('first'),
      action('hidden', { visible: () => false }),
      action('last', { visible: sel => sel.key.startsWith('hero.') }),
    ]

    expect(visibleActions(actions, selection).map(a => a.id)).toEqual(['first', 'last'])
  })
})
