<script setup lang="ts">
import { computed, ref } from 'vue'
import { state, visibleActions } from '../state'
import type { LocaleEntry, PanelAction, ReportItem } from '../state'

const props = defineProps<{ hotkey: string }>()

const copied = ref(false)
const selection = computed(() => state.selection)
const report = computed(() => state.report)

/** Локаль, з якої є що взяти за основу: перша заповнена. */
const donor = computed(() => selection.value?.entries.find(entry => entry.value.trim()) ?? null)

const dirty = (entry: LocaleEntry) => entry.draft !== entry.value

/** Кнопки від сторонніх модулів: дописані через хук `i18nInspect:actions`. */
const actions = computed(() => visibleActions(state.actions, state.selection))

function runAction(action: PanelAction) {
  if (state.selection) void action.run(state.selection)
}

function shortFile(entry: LocaleEntry) {
  return entry.file?.split(/[/\\]/).slice(-2).join('/') ?? ''
}

async function copyKey() {
  if (!selection.value) return
  try {
    await navigator.clipboard.writeText(selection.value.key)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  }
  catch {
    // копіювання тут — зручність, не функція; фолбек не робимо
  }
}

function takeFrom(entry: LocaleEntry) {
  if (donor.value) entry.draft = donor.value.value
}

function revert(entry: LocaleEntry) {
  entry.draft = entry.value
  if (selection.value) selection.value.note = null
}

async function save(entry: LocaleEntry) {
  const current = selection.value
  if (!current || entry.saving || !dirty(entry)) return

  entry.saving = true
  current.note = null
  try {
    const result = await $fetch<{ file: string, created: boolean }>('/__i18n-inspect/message', {
      method: 'PUT',
      body: { locale: entry.locale, key: current.key, value: entry.draft },
    })
    entry.value = entry.draft
    entry.file = result.file
    entry.exists = true
    entry.saved = true
    setTimeout(() => (entry.saved = false), 2000)
    // щойно збережений ключ більше не «неперекладений»
    state.refreshAudit?.()
  }
  catch (error) {
    const failure = error as { statusMessage?: string, message?: string }
    current.note = failure.statusMessage ?? failure.message ?? 'Could not write the file'
  }
  finally {
    entry.saving = false
  }
}

// ---- список незаповнених ключів -------------------------------------------

const target = computed(() => report.value.locales.find(l => l.locale === report.value.target) ?? null)

const coverage = computed(() => {
  const locale = target.value
  if (!locale?.total) return 0
  return Math.round((locale.filled / locale.total) * 100)
})

/**
 * Групування по неймспейсу, а не за алфавітом: перекладати checkout.* підряд —
 * це один контекст, а стрибати між auth і zones — гарантія неузгодженого тону.
 */
function group(items: ReportItem[]) {
  const query = report.value.query.trim().toLowerCase()
  const matched = query
    ? items.filter(i => i.key.toLowerCase().includes(query) || i.base.toLowerCase().includes(query))
    : items

  const groups = new Map<string, ReportItem[]>()
  for (const item of matched) {
    const dot = item.key.indexOf('.')
    const namespace = dot > 0 ? item.key.slice(0, dot) : 'no namespace'
    const bucket = groups.get(namespace)
    if (bucket) bucket.push(item)
    else groups.set(namespace, [item])
  }
  return [...groups].map(([name, list]) => ({ name, items: list }))
}

const missingGroups = computed(() => group(target.value?.missing ?? []))
const copyGroups = computed(() => group(target.value?.copies ?? []))

function openReport() {
  report.value.open = true
  state.selection = null
  if (!report.value.locales.length) state.loadReport?.()
}

/**
 * Запис одного рядка. Свідомо без «зберегти все»: сесія правок у пам'яті
 * вкладки, яка в dev перезавантажується від будь-якої зміни коду, — це
 * гарантована втрата роботи. Один рядок — один запис.
 */
async function saveItem(item: ReportItem) {
  const value = item.draft.trim()
  if (!value || item.saving || item.saved) return

  item.saving = true
  item.error = null
  try {
    await $fetch('/__i18n-inspect/message', {
      method: 'PUT',
      body: { locale: report.value.target, key: item.key, value: item.draft },
    })
    item.saved = true
    if (target.value) target.value.filled++
    state.refreshAudit?.()
  }
  catch (error) {
    const failure = error as { statusMessage?: string, message?: string }
    item.error = failure.statusMessage ?? failure.message ?? 'Could not write the file'
  }
  finally {
    item.saving = false
  }
}
</script>

<template>
  <div
    v-if="state.enabled"
    class="i18n-inspect"
    :class="{ wide: report.open }"
  >
    <div class="card toolbar">
      <p class="caption">
        page audit
      </p>
      <div class="line">
        <button
          class="btn toggle red"
          :class="{ on: state.audit.untranslated }"
          :aria-pressed="state.audit.untranslated"
          title="Highlight strings missing from the current locale — you are seeing the fallback"
          @click="state.audit.untranslated = !state.audit.untranslated"
        >
          <i class="box" />
          <span class="label">not translated</span>
          <b class="count">{{ state.audit.untranslated ? state.audit.counts.untranslated : '' }}</b>
        </button>
        <button
          class="btn toggle amber"
          :class="{ on: state.audit.foreign }"
          :aria-pressed="state.audit.foreign"
          title="Highlight text with no marker — it never went through t()"
          @click="state.audit.foreign = !state.audit.foreign"
        >
          <i class="box" />
          <span class="label">outside i18n</span>
          <b class="count">{{ state.audit.foreign ? state.audit.counts.foreign : '' }}</b>
        </button>
      </div>
      <button
        v-if="!report.open"
        class="btn wide-btn"
        title="Every missing key — read from the locale files, not from walking the page"
        @click="openReport"
      >
        missing keys
      </button>
    </div>

    <!-- ---- список по файлах ---- -->
    <section
      v-if="report.open"
      class="card report"
    >
      <div class="line">
        <button
          class="btn ghost"
          title="Back"
          @click="report.open = false"
        >
          ←
        </button>
        <b class="brand">missing keys</b>
        <span class="grow" />
        <button
          class="btn"
          :disabled="report.loading"
          @click="state.loadReport?.()"
        >
          {{ report.loading ? 'reading…' : 'refresh' }}
        </button>
      </div>

      <div class="line locales">
        <button
          v-for="locale in report.locales"
          :key="locale.locale"
          class="btn chip-locale"
          :class="{ on: locale.locale === report.target }"
          :aria-pressed="locale.locale === report.target"
          :title="locale.locale === report.base ? 'Base locale: the key set is taken from it' : ''"
          @click="report.target = locale.locale"
        >
          {{ locale.locale }}<b class="num">{{ locale.filled }}/{{ locale.total }}</b>
        </button>
      </div>

      <div
        class="bar"
        :title="`Coverage ${coverage}%`"
      >
        <i :style="{ width: `${coverage}%` }" />
      </div>

      <div class="line">
        <input
          v-model="report.query"
          class="field search"
          placeholder="filter by key or text"
        >
      </div>

      <div class="body">
        <p
          v-if="report.loading"
          class="meta"
        >
          reading locale files…
        </p>
        <p
          v-else-if="!target"
          class="meta"
        >
          No locales to report on.
        </p>
        <p
          v-else-if="!target.missing.length"
          class="meta ok"
        >
          All filled in: {{ target.filled }} of {{ target.total }}.
        </p>
        <p
          v-else-if="!missingGroups.length"
          class="meta"
        >
          Nothing matches “{{ report.query }}”.
        </p>

        <div
          v-for="section in missingGroups"
          :key="section.name"
          class="group"
        >
          <p class="ns">
            {{ section.name }} <span class="dim">{{ section.items.length }}</span>
          </p>
          <div
            v-for="item in section.items"
            :key="item.key"
            class="item"
          >
            <div class="line">
              <code class="key">{{ item.key }}</code>
              <span class="grow" />
              <span
                v-if="item.kind === 'empty'"
                class="meta"
              >empty string</span>
              <span
                class="meta status"
                :class="{ ok: item.saved }"
              >
                {{ item.saving ? 'saving…' : (item.saved ? 'saved' : '') }}
              </span>
            </div>
            <p class="base">
              {{ item.base }}
            </p>
            <textarea
              v-model="item.draft"
              rows="1"
              spellcheck="true"
              :placeholder="`${report.target} translation`"
              @input="item.saved = false"
              @blur="saveItem(item)"
              @keydown.enter.exact.prevent="saveItem(item)"
            />
            <p
              v-if="item.error"
              class="note"
            >
              {{ item.error }}
            </p>
          </div>
        </div>

        <!-- Копії базового тексту: часто легітимні (OK, Email, PDF),
             тому окремо й згорнуто — інакше список стає таким же шумним,
             як режим «поза i18n». -->
        <div
          v-if="target?.copies.length"
          class="section"
        >
          <button
            class="btn section-head"
            :aria-expanded="report.showCopies"
            @click="report.showCopies = !report.showCopies"
          >
            <span class="label">looks like a copy of the base</span>
            <b class="count">{{ target.copies.length }}</b>
          </button>
          <template v-if="report.showCopies">
            <div
              v-for="section in copyGroups"
              :key="section.name"
              class="group"
            >
              <p class="ns">
                {{ section.name }} <span class="dim">{{ section.items.length }}</span>
              </p>
              <div
                v-for="item in section.items"
                :key="item.key"
                class="item"
              >
                <div class="line">
                  <code class="key">{{ item.key }}</code>
                  <span class="grow" />
                  <span
                    class="meta status"
                    :class="{ ok: item.saved }"
                  >
                    {{ item.saving ? 'saving…' : (item.saved ? 'saved' : '') }}
                  </span>
                </div>
                <p class="base">
                  {{ item.base }}
                </p>
                <textarea
                  v-model="item.draft"
                  rows="1"
                  spellcheck="true"
                  :placeholder="`${report.target} translation`"
                  @input="item.saved = false"
                  @blur="saveItem(item)"
                  @keydown.enter.exact.prevent="saveItem(item)"
                />
              </div>
            </div>
          </template>
        </div>

        <!-- Зворотна різниця: є тут, немає в базовій. Показуємо, але не
             видаляємо — чистка чужого файлу не діло dev-оверлея. -->
        <div
          v-if="target?.dead.length"
          class="section"
        >
          <button
            class="btn section-head"
            :aria-expanded="report.showDead"
            @click="report.showDead = !report.showDead"
          >
            <span class="label">not in “{{ report.base }}” — dead keys</span>
            <b class="count">{{ target.dead.length }}</b>
          </button>
          <div
            v-if="report.showDead"
            class="group"
          >
            <code
              v-for="key in target.dead"
              :key="key"
              class="dead"
            >{{ key }}</code>
          </div>
        </div>
      </div>

      <p
        v-if="report.note"
        class="note"
      >
        {{ report.note }}
      </p>
    </section>

    <!-- ---- один ключ під курсором ---- -->
    <div
      v-else-if="!selection"
      class="card hint"
    >
      <div class="line">
        <b class="brand">i18n-inspect</b>
        <span class="chip">{{ state.locale }}</span>
      </div>
      <p class="meta">
        Alt+click text — panel · {{ props.hotkey }} — turn off
      </p>
    </div>

    <section
      v-else
      class="card"
    >
      <div class="line">
        <code class="field key">{{ selection.key }}</code>
        <button
          class="btn"
          @click="copyKey"
        >
          {{ copied ? 'ok' : 'copy' }}
        </button>
        <button
          class="btn ghost"
          title="Close"
          @click="state.selection = null"
        >
          ×
        </button>
      </div>
      <p class="meta">
        {{ selection.label }}
      </p>

      <div class="body">
        <p
          v-if="selection.loading"
          class="meta"
        >
          reading locale files…
        </p>

        <div
          v-for="entry in selection.entries"
          :key="entry.locale"
          class="entry"
        >
          <div class="line">
            <b
              class="locale"
              :class="{ active: entry.locale === state.locale }"
            >{{ entry.locale }}</b>
            <span
              v-if="!entry.exists"
              class="chip danger"
            >no key</span>
            <span class="grow" />
            <span
              class="meta file"
              :title="entry.file ?? ''"
            >{{ shortFile(entry) }}</span>
            <button
              v-if="entry.locale !== state.locale && state.setLocale"
              class="btn"
              title="Switch the app language — see how the translation fits the layout"
              @click="state.setLocale(entry.locale)"
            >
              switch
            </button>
            <span
              v-else
              class="chip muted"
            >current</span>
          </div>

          <textarea
            v-model="entry.draft"
            rows="2"
            spellcheck="true"
            @keydown.ctrl.enter.prevent="save(entry)"
            @keydown.meta.enter.prevent="save(entry)"
          />

          <div class="line">
            <button
              class="btn primary"
              :disabled="!dirty(entry) || entry.saving"
              @click="save(entry)"
            >
              {{ entry.saving ? 'saving…' : 'save' }}
            </button>
            <button
              class="btn"
              :disabled="!dirty(entry) || entry.saving"
              @click="revert(entry)"
            >
              revert
            </button>
            <button
              class="btn"
              :disabled="!!entry.draft.trim() || !donor || donor.locale === entry.locale"
              @click="takeFrom(entry)"
            >
              copy from {{ donor?.locale ?? '—' }}
            </button>
            <span class="grow" />
            <span
              class="meta status"
              :class="{ ok: entry.saved }"
            >
              {{ entry.saved ? 'saved' : (dirty(entry) ? 'Ctrl+Enter' : '') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Дії надбудов. Нижче полів, бо стосуються ключа цілком, а не рядка. -->
      <div
        v-if="actions.length"
        class="line"
      >
        <button
          v-for="action in actions"
          :key="action.id"
          class="btn"
          :disabled="action.disabled?.(selection) ?? false"
          @click="runAction(action)"
        >
          {{ action.label }}
        </button>
      </div>

      <p
        v-if="selection.note"
        class="note"
      >
        {{ selection.note }}
      </p>
    </section>
  </div>
</template>

<style scoped>
/*
 * Сітка панелі: один розмір контролу, один масштаб відступів.
 *   --h    висота ВСІХ інтерактивних елементів
 *   --gap  відступ між елементами в рядку
 *   --pad  внутрішній відступ карток
 * Місце під усе, що з'являється й зникає, зарезервоване — панель не стрибає.
 */
.i18n-inspect {
  --h: 26px;
  --gap: 6px;
  --pad: 12px;
  --radius: 5px;
  --bg: #18181b;
  --surface: #27272a;
  --border: #3f3f46;
  --text: #f4f4f5;
  --dim: #a1a1aa;
  --accent: #7c3aed;

  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  width: 380px;
  max-width: calc(100vw - 32px);
  max-height: min(80vh, 760px);
  font: 12px/1.5 system-ui, sans-serif;
  color: var(--text);
  box-sizing: border-box;
}
/* у списку працюють довго й багато — вузька колонка тут заважає */
.i18n-inspect.wide { width: 560px; max-height: min(88vh, 900px); }
.i18n-inspect *, .i18n-inspect *::before, .i18n-inspect *::after { box-sizing: border-box; }

/* ---- картки ---- */
.card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: var(--pad);
  box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
}
/* прокручується лише список — ключ і перемикачі лишаються на місці */
.body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* Firefox: власного оформлення смуги він не дає, лише товщину й два кольори */
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
/* Chrome і Safari: смуга поверх вмісту, без власної підкладки й стрілок */
.body::-webkit-scrollbar { width: 8px; }
.body::-webkit-scrollbar-track { background: transparent; }
.body::-webkit-scrollbar-thumb {
  background: var(--border);
  border: 2px solid transparent;
  background-clip: content-box;
  border-radius: 8px;
}
.body::-webkit-scrollbar-thumb:hover { background: var(--dim); background-clip: content-box; }
.hint { display: flex; flex-direction: column; gap: 4px; }
.brand { font-size: 12px; }

/* ---- рядок: усе по одній базовій лінії, однакова висота ---- */
.line {
  display: flex;
  align-items: center;
  gap: var(--gap);
  min-height: var(--h);
}
.grow { flex: 1; min-width: 0; }

/* ---- контроли: одна висота, один шрифт, різниця лише в кольорі ---- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: var(--h);
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font: 500 11px/1 system-ui, sans-serif;
  white-space: nowrap;
  cursor: pointer;
}
.btn:hover:not(:disabled) { background: #3f3f46; }
.btn:disabled { color: #52525b; cursor: default; }
.btn.primary { background: var(--accent); }
.btn.primary:hover:not(:disabled) { background: #8b5cf6; }
.btn.primary:disabled { background: var(--surface); }
/* іконкова кнопка — квадратна, інакше гліф здається зміщеним */
.btn.ghost {
  width: var(--h);
  padding: 0;
  background: transparent;
  font-size: 14px;
}
.btn.ghost:hover { background: var(--surface); }
.wide-btn { width: 100%; margin-top: var(--gap); }

/* ---- перемикачі аудиту ----
 * Сітка з однаковими бічними колонками: підпис стоїть точно по центру
 * незалежно від того, є лічильник чи ні.
 */
/* тулбар не стискається: висоту віддає список, а не перемикачі */
.toolbar { gap: 4px; flex: none; }
.report { flex: 1; }
.toolbar .line { gap: var(--gap); }
.caption {
  margin: 0 0 2px;
  font: 500 10px/1 system-ui, sans-serif;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--dim);
}
.toggle {
  flex: 1;
  display: grid;
  grid-template-columns: 16px 1fr 16px;
  align-items: center;
  gap: var(--gap);
  background: var(--bg);
  border-color: var(--border);
}
.toggle .label { text-align: center; }
.toggle:hover:not(.on) { background: var(--surface); }
.toggle.on { border-color: currentcolor; }
.toggle.red.on { color: #f87171; }
.toggle.amber.on { color: #fbbf24; }
.count {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
/* квадратик стану: порожній — вимкнено, залитий кольором підсвітки — увімкнено */
.box {
  width: 12px;
  height: 12px;
  border: 1.5px solid #52525b;
  border-radius: 3px;
}
.toggle.on .box { border-color: currentcolor; background: currentcolor; }

/* ---- звіт ---- */
.locales { flex-wrap: wrap; margin-top: var(--gap); }
.chip-locale {
  gap: var(--gap);
  background: var(--bg);
  border-color: var(--border);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.chip-locale .num { color: var(--dim); font-variant-numeric: tabular-nums; }
.chip-locale:hover:not(.on) { background: var(--surface); }
.chip-locale.on { border-color: var(--accent); background: var(--surface); }
.chip-locale.on .num { color: var(--text); }
.bar {
  height: 3px;
  margin: var(--gap) 0;
  border-radius: 2px;
  background: var(--surface);
  overflow: hidden;
}
.bar i { display: block; height: 100%; background: #4ade80; transition: width .2s; }

.group { margin-top: var(--gap); }
/* заголовок неймспейсу липне до верху: у довгому списку видно, де ти */
.ns {
  position: sticky;
  top: 0;
  z-index: 1;
  margin: 0;
  padding: 6px 0 4px;
  background: var(--bg);
  font: 600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #c4b5fd;
}
.ns .dim { color: var(--dim); font-weight: 500; }
.item {
  padding: 4px 0 8px;
  border-top: 1px solid var(--surface);
}
.item .base {
  margin: 2px 0 4px;
  font-size: 12px;
  color: var(--dim);
  word-break: break-word;
}
.section { margin-top: var(--gap); }
.section-head {
  display: grid;
  grid-template-columns: 1fr auto;
  width: 100%;
  background: var(--bg);
  border-color: var(--border);
}
.section-head .label { text-align: left; }
.dead {
  display: block;
  padding: 3px 0;
  font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dim);
  word-break: break-all;
}

/* ---- поля ---- */
.field {
  display: flex;
  align-items: center;
  height: var(--h);
  padding: 0 8px;
  border-radius: var(--radius);
  background: var(--surface);
  font: 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
}
.key { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search {
  width: 100%;
  border: 1px solid var(--border);
  color: var(--text);
  font-family: system-ui, sans-serif;
}
.search::placeholder { color: #52525b; }
.search:focus { outline: 1px solid var(--accent); outline-offset: -1px; }
textarea {
  display: block;
  width: 100%;
  height: 56px;
  margin: 4px 0;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  resize: vertical;
}
/* у списку поле низьке, поки в ньому не працюють: більше рядків на екран */
.item textarea { height: 32px; margin: 0; transition: height .15s; }
.item textarea:focus { height: 64px; }
textarea:focus { outline: 1px solid var(--accent); outline-offset: -1px; }
textarea::placeholder { color: #52525b; }

/* ---- дрібні позначки: та сама висота, що й кнопки ---- */
.chip {
  display: inline-flex;
  align-items: center;
  height: var(--h);
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font: 500 11px/1 system-ui, sans-serif;
  color: var(--dim);
  white-space: nowrap;
}
.chip.muted { border-color: transparent; }
.chip.danger { color: #fca5a5; border-color: #7f1d1d; }
.locale {
  min-width: 24px;
  font: 600 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dim);
}
.locale.active { color: #c4b5fd; }

/* ---- текст ---- */
.meta { margin: 4px 0 0; font-size: 11px; color: var(--dim); }
.meta.ok { color: #86efac; }
.file {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 45%;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  opacity: .75;
}
.status { margin: 0; min-width: 64px; text-align: right; }
.status.ok { color: #86efac; }
.note { margin: var(--gap) 0 0; font-size: 11px; color: #fca5a5; }

/* ---- локалі ---- */
.entry {
  margin-top: var(--gap);
  padding-top: var(--gap);
  border-top: 1px solid var(--surface);
}
</style>
