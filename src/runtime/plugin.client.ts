import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { createApp, watch } from 'vue'
import { scanDocument } from './audit'
import type { Finding } from './audit'
import InspectPanel from './components/InspectPanel.vue'
import { createOverlay } from './overlay'
import { probe, setTranslationResolver } from './probe'
import { hasUnsaved, state } from './state'
import type { InspectHit } from './probe'

/**
 * Dev-only режим інспектування:
 *   гаряча клавіша — увімкнути/вимкнути,
 *   наведення     — рамка з ключем,
 *   Alt+click     — панель із ключем і значенням (поки що на читання).
 */

interface Composer {
  locale: { value: string }
  setLocale?: (code: string) => Promise<void>
  t: (key: string) => string
}

interface ReportResponse {
  base: string
  locales: {
    locale: string
    total: number
    filled: number
    missing: { key: string, kind: 'absent' | 'empty', base: string }[]
    copies: { key: string, kind: 'absent' | 'empty', base: string }[]
    dead: string[]
  }[]
  reason: string | null
}

interface MessageResponse {
  key: string
  locales: {
    locale: string
    value: string
    exists: boolean
    file: string | null
    fileName: string
  }[]
  reason: string | null
}

/** Чи натиснута саме та комбінація, наприклад 'alt+shift+i'. */
function matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey.toLowerCase().split('+').map(p => p.trim())
  const key = parts[parts.length - 1]!
  return event.key.toLowerCase() === key
    && event.altKey === parts.includes('alt')
    && event.shiftKey === parts.includes('shift')
    && event.ctrlKey === parts.includes('ctrl')
    && event.metaKey === parts.includes('meta')
}

export default defineNuxtPlugin({
  name: 'i18n-inspect:overlay',
  setup(nuxtApp) {
    const hotkey = useRuntimeConfig().public.i18nInspect?.hotkey ?? 'alt+shift+i'

    nuxtApp.hook('app:mounted', () => {
      const i18n = nuxtApp.$i18n as unknown as Composer
      const overlay = createOverlay()

      // probe звіряє текст під курсором із перекладом — доступ до t() лише тут
      setTranslationResolver(key => i18n.t(key))

      // перемикач мови в панелі: дає побачити, як переклад лягає у верстку
      state.setLocale = code => void i18n.setLocale?.(code)
      state.refreshAudit = () => void loadKeys().then(rescan)
      state.loadReport = () => void loadReport()
      state.locale = i18n.locale.value
      watch(() => i18n.locale.value, (code) => {
        state.locale = code
        refresh()
        // інша мова — інша множина відсутніх ключів
        scheduleRescan()
      })

      const host = document.createElement('div')
      host.setAttribute('data-i18n-inspect', 'panel')
      document.body.appendChild(host)
      createApp(InspectPanel, { hotkey }).mount(host)

      let pointer: { x: number, y: number } | null = null
      let hovered: InspectHit | null = null
      let scheduled = false

      // ---- режим аудиту -------------------------------------------------

      let localeKeys: Record<string, string[]> = {}
      let findings: Finding[] = []
      let auditScheduled = false

      async function loadKeys() {
        try {
          const data = await $fetch<{ locales: Record<string, string[]> }>('/__i18n-inspect/keys')
          localeKeys = data.locales
        }
        catch {
          localeKeys = {}
        }
      }

      /**
       * Звіт по файлах локалей. Читається на відкриття списку й після кожного
       * запису: заповнений ключ має зникати з переліку, а лічильник — рости.
       */
      async function loadReport() {
        const report = state.report
        report.loading = true
        report.note = null
        try {
          const data = await $fetch<ReportResponse>('/__i18n-inspect/report')
          report.base = data.base
          report.locales = data.locales.map(locale => ({
            ...locale,
            missing: locale.missing.map(item => ({
              ...item,
              draft: '',
              saving: false,
              saved: false,
              error: null,
            })),
            copies: locale.copies.map(item => ({
              ...item,
              draft: '',
              saving: false,
              saved: false,
              error: null,
            })),
          }))
          report.note = data.reason
          // за замовчуванням заповнюємо поточну мову застосунку
          if (!report.locales.some(locale => locale.locale === report.target)) {
            report.target = report.locales.some(locale => locale.locale === state.locale)
              ? state.locale
              : (report.locales.find(locale => locale.locale !== report.base)?.locale ?? report.base)
          }
        }
        catch (error) {
          report.note = `Could not read the locale files: ${(error as Error).message}`
        }
        finally {
          report.loading = false
        }
      }

      /** Повне сканування сторінки. Дороге — тільки на реальні зміни. */
      function rescan() {
        const { untranslated, foreign } = state.audit
        if (!state.enabled || (!untranslated && !foreign)) {
          findings = []
          state.audit.counts = { untranslated: 0, foreign: 0 }
          return overlay.hideAudit()
        }

        const known = new Set(localeKeys[state.locale] ?? [])
        findings = scanDocument({
          hasKey: key => known.has(key),
          untranslated,
          foreign,
        })

        state.audit.counts = {
          untranslated: findings.filter(f => f.kind === 'untranslated').length,
          foreign: findings.filter(f => f.kind === 'foreign').length,
        }
        overlay.showAudit(findings)
      }

      /** Перемалювати вже знайдене — прямокутники живуть у координатах вікна. */
      function redrawAudit() {
        if (findings.length) overlay.showAudit(findings)
      }

      function scheduleRescan() {
        if (auditScheduled) return
        auditScheduled = true
        setTimeout(() => {
          auditScheduled = false
          rescan()
        }, 200)
      }

      watch(() => [state.audit.untranslated, state.audit.foreign, state.enabled], async () => {
        if ((state.audit.untranslated || state.audit.foreign) && !Object.keys(localeKeys).length) {
          await loadKeys()
        }
        rescan()
      })

      // Текст на сторінці змінюють і HMR після збереження, і сам застосунок.
      const observer = new MutationObserver((records) => {
        if (!state.audit.untranslated && !state.audit.foreign) return
        const ours = records.every(r => (r.target as Element).closest?.('[data-i18n-inspect]'))
        if (ours) return
        scheduleRescan()
      })
      observer.observe(document.body, { childList: true, characterData: true, subtree: true })

      function refresh() {
        if (scheduled) return
        scheduled = true
        requestAnimationFrame(() => {
          scheduled = false
          if (!state.enabled || !pointer) {
            hovered = null
            return overlay.hide()
          }
          hovered = probe(pointer.x, pointer.y)
          if (hovered) overlay.show(hovered)
          else overlay.hide()
        })
      }

      function track(x: number, y: number) {
        pointer = { x, y }
        refresh()
      }

      async function select(hit: InspectHit) {
        // Незбережена правка важливіша за нову вибірку: мовчки викинути
        // текст, який людина щойно набрала, — найдорожча з можливих дрібниць.
        if (hasUnsaved(state.selection)) {
          state.selection!.note = 'Save or revert your changes first'
          return
        }

        state.selection = {
          key: hit.key,
          source: hit.source,
          label: hit.label,
          entries: [],
          note: null,
          loading: true,
        }
        // саме проксі, а не сирий об'єкт: інакше мутації нижче не реактивні
        const current = state.selection

        try {
          const message = await $fetch<MessageResponse>('/__i18n-inspect/message', {
            query: { key: hit.key },
          })
          // поки читали файли, користувач міг клацнути на інший рядок
          if (state.selection !== current) return

          current.entries = message.locales.map(entry => ({
            ...entry,
            draft: entry.value,
            saving: false,
            saved: false,
          }))
          current.note = message.reason
        }
        catch (error) {
          if (state.selection !== current) return
          current.note = `Could not read the locale files: ${(error as Error).message}`
        }
        finally {
          if (state.selection === current) current.loading = false
        }
      }

      document.addEventListener('mousemove', e => track(e.clientX, e.clientY), { passive: true })

      // Тач-пристрої: без цього гілка caret-API у WebKit не виконується жодного разу.
      document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0]
        if (touch) track(touch.clientX, touch.clientY)
      }, { passive: true })

      // Прямокутники рахуються у viewport-координатах, тож після прокрутки
      // рамка лишилась би висіти на старому місці.
      const onViewportChange = () => {
        refresh()
        redrawAudit()
      }
      document.addEventListener('scroll', onViewportChange, { passive: true, capture: true })
      window.addEventListener('resize', onViewportChange, { passive: true })

      document.addEventListener('mouseleave', () => {
        pointer = null
        overlay.hide()
      })

      // Alt+click: перехоплюємо до того, як застосунок відреагує — інакше
      // клік по перекладеному посиланню просто піде на інший роут.
      document.addEventListener('click', (event) => {
        if (!state.enabled || !event.altKey) return
        const hit = probe(event.clientX, event.clientY)
        if (!hit) return
        event.preventDefault()
        event.stopPropagation()
        select(hit)
      }, { capture: true })

      document.addEventListener('keydown', (event) => {
        if (matchesHotkey(event, hotkey)) {
          event.preventDefault()
          state.enabled = !state.enabled
          if (!state.enabled) state.selection = null
          refresh()
          return
        }
        // Escape у полі вводу панелі — справа панелі, не наша
        if (host.contains(event.target as Node)) return

        if (event.key === 'Escape' && state.enabled) {
          if (state.selection) state.selection = null
          else if (state.report.open) state.report.open = false
          else state.enabled = false
          refresh()
        }
      })
    })
  },
})
