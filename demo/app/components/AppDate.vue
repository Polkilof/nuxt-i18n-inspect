<script setup lang="ts">
/**
 * Поле дати замість <input type="date">.
 *
 * Нативне поле бере формат і плейсхолдер із локалі браузера, а не сторінки,
 * і атрибут lang його не переконує - перевірено, три варіанти дали однакове
 * «дд.мм.рррр» на англійській сторінці. Тут формат задає locale застосунку,
 * тож поле нарешті говорить тією ж мовою, що й усе навколо.
 */
import type { DateValue } from '@internationalized/date'
import {
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'reka-ui'

defineProps<{
  /** Доступна назва: обгортковий <label> кастомне поле не озвучує */
  label: string
  /** Код мови застосунку - від нього залежить порядок сегментів і назви місяців */
  locale: string
}>()

const model = defineModel<DateValue | undefined>()
</script>

<template>
  <DatePickerRoot
    v-model="model"
    :locale="locale"
  >
    <DatePickerField
      v-slot="{ segments }"
      class="field"
      :aria-label="label"
    >
      <DatePickerInput
        v-for="item in segments"
        :key="item.part"
        :part="item.part"
        :class="item.part === 'literal' ? 'literal' : 'segment'"
      >
        {{ item.value }}
      </DatePickerInput>

      <DatePickerTrigger
        class="open"
        :aria-label="label"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        ><rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="2"
        /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
      </DatePickerTrigger>
    </DatePickerField>

    <DatePickerContent
      class="ui-cal-pop"
      :side-offset="6"
    >
      <DatePickerCalendar v-slot="{ weekDays, grid }">
        <DatePickerHeader class="ui-cal-head">
          <DatePickerPrev class="ui-cal-nav">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><path d="m15 18-6-6 6-6" /></svg>
          </DatePickerPrev>
          <DatePickerHeading class="ui-cal-title" />
          <DatePickerNext class="ui-cal-nav">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><path d="m9 18 6-6-6-6" /></svg>
          </DatePickerNext>
        </DatePickerHeader>

        <DatePickerGrid
          v-for="month in grid"
          :key="month.value.toString()"
          class="ui-cal-grid"
        >
          <DatePickerGridHead>
            <DatePickerGridRow class="ui-cal-row">
              <DatePickerHeadCell
                v-for="day in weekDays"
                :key="day"
                class="ui-cal-weekday"
              >
                {{ day }}
              </DatePickerHeadCell>
            </DatePickerGridRow>
          </DatePickerGridHead>

          <DatePickerGridBody>
            <DatePickerGridRow
              v-for="(week, index) in month.rows"
              :key="index"
              class="ui-cal-row"
            >
              <DatePickerCell
                v-for="date in week"
                :key="date.toString()"
                :date="date"
              >
                <DatePickerCellTrigger
                  class="ui-cal-day"
                  :day="date"
                  :month="month.value"
                />
              </DatePickerCell>
            </DatePickerGridRow>
          </DatePickerGridBody>
        </DatePickerGrid>
      </DatePickerCalendar>
    </DatePickerContent>
  </DatePickerRoot>
</template>

<style scoped>
svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ------------------------------------------------------------------ поле */

.field {
  display: flex;
  align-items: center;
  width: 100%;
  height: var(--ctl-h);
  padding: 0 4px 0 8px;
  font-size: 14px;
  background: #fff;
  border: 1px solid var(--line-2);
  border-radius: var(--r-1);
  transition: border-color .16s var(--ease), box-shadow .16s var(--ease);
}

.field:hover { border-color: var(--ink-4); }

/* фокус живе на сегменті, тож підсвічуємо рамку поля, а не окрему цифру */
.field:focus-within { border-color: var(--brand); box-shadow: var(--ring); }

.segment {
  padding: 2px 3px;
  border-radius: 4px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  outline: none;
}

.segment[data-placeholder] { color: var(--ink-4); }
.segment:focus { background: var(--brand-soft); color: var(--brand-ink); }
.literal { color: var(--ink-4); padding: 0 1px; }

.open {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: auto;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--ink-3);
  cursor: pointer;
  transition: background-color .16s var(--ease), color .16s var(--ease);
}

.open:hover { background: var(--brand-soft); color: var(--brand); }
</style>

<style>
/**
 * Календар навмисно не scoped. DatePickerContent виносить спливайку в кінець
 * body, і атрибут data-v-* туди не доїжджає - scoped-правила не збігаються
 * і вікно лишається без тла й рамки. Звідси префікс ui-cal-: імена глобальні,
 * тож мають бути свої.
 */
.ui-cal-pop {
  z-index: 60;
  padding: 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  box-shadow: var(--sh-2);
}

.ui-cal-pop[data-state='open'] { animation: ui-cal-pop .14s var(--ease); }

@keyframes ui-cal-pop {
  from { opacity: 0; transform: translateY(-4px) scale(.98); }
  to { opacity: 1; transform: none; }
}

.ui-cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }

.ui-cal-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -.01em;
  color: var(--ink);
}

.ui-cal-nav {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  background: #fff;
  color: var(--ink-2);
  cursor: pointer;
  transition: border-color .16s var(--ease), color .16s var(--ease);
}

.ui-cal-nav:hover { border-color: var(--ink-4); color: var(--ink); }

.ui-cal-nav svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ui-cal-grid { width: 100%; border-collapse: collapse; }
.ui-cal-row { display: grid; grid-template-columns: repeat(7, 1fr); }

.ui-cal-weekday {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-4);
  padding-bottom: 6px;
  text-transform: uppercase;
}

.ui-cal-day {
  position: relative;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin: 1px auto;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
  cursor: pointer;
  user-select: none;
  transition: background-color .14s var(--ease), color .14s var(--ease);
}

.ui-cal-day:hover { background: var(--brand-soft); color: var(--brand-ink); }

/* дні сусідніх місяців приглушені, але клікабельні - їх не ховаємо */
.ui-cal-day[data-outside-view] { color: var(--ink-4); }
.ui-cal-day[data-disabled] { color: var(--ink-4); opacity: .4; cursor: default; }
.ui-cal-day[data-disabled]:hover { background: none; }

/* сьогодні позначене ще й крапкою, щоб сенс не тримався на самому кольорі */
.ui-cal-day[data-today]::after {
  content: '';
  position: absolute;
  bottom: 4px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentcolor;
}

.ui-cal-day[data-selected] {
  background: var(--brand);
  color: #fff;
  font-weight: 500;
}

.ui-cal-day[data-selected]:hover { background: var(--brand-ink); color: #fff; }
.ui-cal-day:focus-visible { outline: none; box-shadow: var(--ring); }
</style>
