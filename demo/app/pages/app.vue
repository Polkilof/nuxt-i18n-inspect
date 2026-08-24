<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

const { t, locale } = useI18n()

interface Request {
  id: number
  person: string
  type: 'vacation' | 'sick' | 'parental'
  from: string
  to: string
  status: 'pending' | 'approved' | 'declined'
}

const requests = ref<Request[]>([
  { id: 1, person: 'Marie Dupont', type: 'vacation', from: '12 Sep', to: '23 Sep', status: 'pending' },
  { id: 2, person: 'Jonas Weber', type: 'sick', from: '3 Sep', to: '4 Sep', status: 'approved' },
  { id: 3, person: 'Olena Kravets', type: 'parental', from: '1 Oct', to: '31 Dec', status: 'pending' },
  { id: 4, person: 'Tom Hale', type: 'vacation', from: '28 Aug', to: '30 Aug', status: 'declined' },
])

const tab = ref<'active' | 'archive'>('active')
const pending = computed(() => requests.value.filter(r => r.status === 'pending').length)
const approved = computed(() => requests.value.filter(r => r.status === 'approved').length)

// помилки з'являються лише після невдалої відправки - рядки, яких на екрані немає
const form = reactive({ type: 'vacation', comment: '' })

// дати навмисно не в reactive: там лежить інстанс CalendarDate, а глибокий
// проксі Vue такому класу ні до чого - shallowRef тримає його як є
const from = shallowRef<DateValue>()
const to = shallowRef<DateValue>()

const types = computed(() => [
  { value: 'vacation', label: t('type.vacation') },
  { value: 'sick', label: t('type.sick') },
  { value: 'parental', label: t('type.parental') },
])

const errors = reactive({ dates: false, comment: false })
const sent = ref(false)

function submit() {
  errors.dates = !from.value || !to.value
  errors.comment = form.comment.trim().length < 10
  sent.value = !errors.dates && !errors.comment
}

// модалка - теж прихований текст: до кліку його в DOM немає
const cancelling = ref<Request | null>(null)

function confirmCancel() {
  const target = cancelling.value
  if (target) requests.value = requests.value.filter(r => r.id !== target.id)
  cancelling.value = null
}
</script>

<template>
  <main class="main">
    <h1>{{ t('page.title') }}</h1>
    <p class="sub">
      {{ t('page.subtitle') }}
    </p>

    <section class="stats">
      <article>
        <b>{{ pending }}</b>
        <span>{{ t('stats.pending') }}</span>
      </article>
      <article>
        <b>{{ approved }}</b>
        <span>{{ t('stats.approved') }}</span>
      </article>
      <article>
        <b>14</b>
        <span>{{ t('stats.daysLeft') }}</span>
      </article>
    </section>

    <div class="tabs">
      <button
        :class="{ on: tab === 'active' }"
        @click="tab = 'active'"
      >
        {{ t('tabs.active') }}
      </button>
      <button
        :class="{ on: tab === 'archive' }"
        @click="tab = 'archive'"
      >
        {{ t('tabs.archive') }}
      </button>
    </div>

    <section
      v-if="tab === 'active'"
      class="card"
    >
      <table>
        <thead>
          <tr>
            <th>{{ t('table.person') }}</th>
            <th>{{ t('table.type') }}</th>
            <th>{{ t('table.dates') }}</th>
            <th>{{ t('table.status') }}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in requests"
            :key="r.id"
          >
            <td>{{ r.person }}</td>
            <td>{{ t('type.' + r.type) }}</td>
            <td class="dim">
              {{ r.from }} - {{ r.to }}
            </td>
            <td>
              <span :class="['pill', r.status]">{{ t('status.' + r.status) }}</span>
            </td>
            <td class="right">
              <button
                v-if="r.status === 'pending'"
                class="ghost"
                @click="cancelling = r"
              >
                {{ t('action.cancel') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- порожній стан: його рядків не побачити, доки не відкрито вкладку -->
    <section
      v-else
      class="card empty"
    >
      <h3>{{ t('empty.title') }}</h3>
      <p>{{ t('empty.body') }}</p>
    </section>

    <section class="card form">
      <h2>{{ t('form.title') }}</h2>

      <div class="grid">
        <div class="control">
          <span>{{ t('form.type') }}</span>
          <AppSelect
            v-model="form.type"
            :label="t('form.type')"
            :options="types"
          />
        </div>
        <div class="control">
          <span>{{ t('form.from') }}</span>
          <AppDate
            v-model="from"
            :label="t('form.from')"
            :locale="locale"
          />
        </div>
        <div class="control">
          <span>{{ t('form.to') }}</span>
          <AppDate
            v-model="to"
            :label="t('form.to')"
            :locale="locale"
          />
        </div>
      </div>

      <p
        v-if="errors.dates"
        class="error"
      >
        {{ t('form.errorDates') }}
      </p>

      <label class="block">
        <span>{{ t('form.comment') }}</span>
        <textarea
          v-model="form.comment"
          rows="3"
        />
        <small>{{ t('form.commentHint') }}</small>
      </label>

      <p
        v-if="errors.comment"
        class="error"
      >
        {{ t('form.errorComment') }}
      </p>

      <div class="row">
        <button
          class="primary"
          @click="submit"
        >
          {{ t('form.submit') }}
        </button>
        <span
          v-if="sent"
          class="ok"
        >{{ t('form.sent') }}</span>
      </div>
    </section>

    <!-- модалка: до кліку цих рядків у DOM немає -->
    <div
      v-if="cancelling"
      class="backdrop"
      @click.self="cancelling = null"
    >
      <div class="modal">
        <h3>{{ t('modal.title') }}</h3>
        <p>{{ t('modal.body') }}</p>
        <div class="row end">
          <button
            class="ghost"
            @click="cancelling = null"
          >
            {{ t('modal.keep') }}
          </button>
          <button
            class="danger"
            @click="confirmCancel"
          >
            {{ t('modal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.main { max-width: 940px; margin: 0 auto; padding: 40px clamp(16px, 4vw, 32px) 80px; }
h1 { margin: 0 0 6px; font-size: clamp(22px, 3vw, 28px); }
.sub { margin: 0 0 28px; color: var(--ink-3); font-size: 15px; }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 26px; }
.stats article { background: var(--bg-soft); border: 1px solid var(--line); border-radius: var(--r-2); padding: 16px 18px; }
.stats b { display: block; font-family: var(--font-display); font-size: 26px; font-weight: 600; letter-spacing: -.02em; margin-bottom: 2px; }
.stats span { color: var(--ink-3); font-size: 13px; }

.tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.tabs button { padding: 8px 14px; border: 1px solid transparent; background: none; border-radius: var(--r-1); cursor: pointer; font: inherit; font-size: 14px; color: var(--ink-3); transition: color .16s var(--ease), background-color .16s var(--ease); }
.tabs button:hover { color: var(--ink); }
.tabs button.on { background: #fff; border-color: var(--line-2); color: var(--ink); box-shadow: var(--sh-1); }

.card { background: #fff; border: 1px solid var(--line); border-radius: var(--r-2); margin-bottom: 18px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; font-weight: 500; color: var(--ink-3); font-size: 12px; padding: 12px 18px; border-bottom: 1px solid var(--line); }
td { padding: 13px 18px; border-bottom: 1px solid var(--line); }
tr:last-child td { border-bottom: 0; }
.dim { color: var(--ink-3); font-variant-numeric: tabular-nums; }
.right { text-align: right; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
.pill.pending { background: #fef3c7; color: #92400e; }
.pill.approved { background: #dcfce7; color: #166534; }
.pill.declined { background: #fee2e2; color: #991b1b; }

.empty { padding: 48px 24px; text-align: center; }
.empty h3 { margin: 0 0 6px; font-size: 16px; }
.empty p { margin: 0 auto; max-width: 46ch; color: var(--ink-3); font-size: 14px; line-height: 1.6; }

.form { padding: 22px 22px 24px; }
.form h2 { margin: 0 0 18px; font-size: 16px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

label, .control { display: block; font-size: 13px; }
label span, .control span { display: block; margin-bottom: 6px; color: var(--ink-3); }
label.block { margin-top: 16px; }
label small { display: block; margin-top: 6px; color: var(--ink-3); font-size: 12px; }

textarea {
  width: 100%;
  font: inherit;
  font-size: 14px;
  line-height: 1.55;
  padding: 9px 10px;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line-2);
  border-radius: var(--r-1);
  resize: vertical;
  transition: border-color .16s var(--ease), box-shadow .16s var(--ease);
}

textarea:hover { border-color: var(--ink-4); }
textarea:focus-visible { outline: none; border-color: var(--brand); box-shadow: var(--ring); }

.error { margin: 10px 0 0; color: var(--bad); font-size: 13px; }
.ok { color: var(--ok-ink); font-size: 13px; }
.row { display: flex; align-items: center; gap: 12px; margin-top: 18px; }
.row.end { justify-content: flex-end; margin-top: 20px; }

button.primary { min-height: var(--ctl-h); background: var(--brand); color: #fff; border: 0; padding: 0 18px; border-radius: var(--r-1); font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color .16s var(--ease), box-shadow .16s var(--ease); }
button.primary:hover { background: var(--brand-ink); box-shadow: var(--sh-2); }
button.ghost { background: #fff; border: 1px solid var(--line-2); padding: 7px 13px; border-radius: var(--r-1); font: inherit; font-size: 13px; cursor: pointer; color: var(--ink-2); transition: border-color .16s var(--ease), color .16s var(--ease); }
button.ghost:hover { border-color: var(--ink-4); color: var(--ink); }
button.danger { background: var(--bad); color: #fff; border: 0; padding: 8px 15px; border-radius: var(--r-1); font: inherit; font-size: 13px; cursor: pointer; transition: background-color .16s var(--ease); }
button.danger:hover { background: #b91c1c; }

.backdrop { position: fixed; inset: 0; z-index: 40; background: rgb(16 18 34 / 50%); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal { background: #fff; border-radius: var(--r-3); padding: 24px 26px; max-width: 420px; box-shadow: var(--sh-3); }
.modal h3 { margin: 0 0 8px; font-size: 17px; }
.modal p { margin: 0; color: var(--ink-2); font-size: 14px; line-height: 1.6; }

@media (max-width: 720px) {
  .stats, .grid { grid-template-columns: 1fr; }

  /* прокрутка тільки на картці з таблицею: на картці форми overflow
     обрізав би випадайку календаря, яка малюється поруч із полем */
  .card:has(> table) { overflow-x: auto; }
  table { min-width: 560px; }
}
</style>
