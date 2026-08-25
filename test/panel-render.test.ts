// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InspectPanel from '../src/runtime/components/InspectPanel.vue'
import { state } from '../src/runtime/state'
import type { PanelAction, Selection } from '../src/runtime/state'

/**
 * Рендер кнопок надбудови. Тест на `visibleActions` перевіряє відбір, цей —
 * що відібране справді доходить до розмітки: без нього шов міг би «працювати»
 * при непідключеному шаблоні.
 */

function selection(): Selection {
  return {
    key: 'hero.title',
    source: 'text',
    label: 'text',
    entries: [],
    note: null,
    loading: false,
  }
}

function action(id: string, extra: Partial<PanelAction> = {}): PanelAction {
  return { id, label: id, run: () => {}, ...extra }
}

function render() {
  return mount(InspectPanel, { props: { hotkey: 'alt+shift+i' } })
}

/** Кнопка за підписом: у панелі є й власні кнопки, шукаємо саме наші. */
function button(wrapper: ReturnType<typeof render>, label: string) {
  return wrapper.findAll('button').find(item => item.text() === label)
}

beforeEach(() => {
  state.enabled = true
  state.report.open = false
  state.selection = selection()
  state.actions = []
})

describe('рендер дій надбудови', () => {
  it('малює кнопку для видимої дії й не малює для схованої', () => {
    state.actions = [action('create MR'), action('hidden', { visible: () => false })]

    const wrapper = render()

    expect(button(wrapper, 'create MR')).toBeDefined()
    expect(button(wrapper, 'hidden')).toBeUndefined()
  })

  it('передає стан disabled у розмітку', () => {
    state.actions = [action('blocked', { disabled: () => true })]

    expect(button(render(), 'blocked')!.attributes('disabled')).toBeDefined()
  })

  it('віддає у run поточну вибірку', async () => {
    const run = vi.fn()
    state.actions = [action('create MR', { run })]

    await button(render(), 'create MR')!.trigger('click')

    expect(run).toHaveBeenCalledTimes(1)
    expect(run.mock.calls[0]![0]).toMatchObject({ key: 'hero.title' })
  })
})
