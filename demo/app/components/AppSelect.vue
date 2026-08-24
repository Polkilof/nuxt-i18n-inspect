<script setup lang="ts">
/**
 * Список замість нативного <select>.
 *
 * Причина не косметична. Нативний список опцій малює операційна система:
 * у ньому немає текстових вузлів, які можна навести курсором, тому модуль
 * туди не дістає і підписи опцій не редагуються прямо на сторінці.
 * Тут опції - звичайні елементи з текстом, тож маркери в них живі
 * і панель відкривається по них так само, як по будь-якому іншому рядку.
 */
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

defineProps<{
  /** Доступна назва поля: обгортковий <label> кастомну кнопку не озвучує */
  label: string
  options: { value: string, label: string }[]
  /** Варіант для шапки: по ширині вмісту, а не на всю колонку форми */
  compact?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      class="trigger"
      :class="{ compact }"
      :aria-label="label"
    >
      <SelectValue />
      <SelectIcon class="chev">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        ><path d="m6 9 6 6 6-6" /></svg>
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="ui-select-pop"
        position="popper"
        :side-offset="6"
      >
        <SelectViewport class="ui-select-viewport">
          <SelectItem
            v-for="option in options"
            :key="option.value"
            class="ui-select-item"
            :value="option.value"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
            <SelectItemIndicator class="ui-select-check">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              ><path d="M20 6 9 17l-5-5" /></svg>
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
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

.trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: var(--ctl-h);
  padding: 0 10px;
  font: inherit;
  font-size: 14px;
  text-align: left;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line-2);
  border-radius: var(--r-1);
  cursor: pointer;
  transition: border-color .16s var(--ease), box-shadow .16s var(--ease);
}

.trigger:hover { border-color: var(--ink-4); }

.trigger[data-state='open'] {
  border-color: var(--brand);
  box-shadow: var(--ring);
}

.chev { display: grid; place-items: center; color: var(--ink-3); transition: transform .18s var(--ease); }
.trigger[data-state='open'] .chev { transform: rotate(180deg); }

/* у шапці контрол стоїть у ряд з іншими, тож ширина по вмісту */
.trigger.compact {
  width: auto;
  height: 38px;
  padding: 0 8px 0 11px;
  font-size: 13px;
  color: var(--ink-2);
}

.trigger.compact:hover { color: var(--ink); }
.trigger.compact .chev svg { width: 14px; height: 14px; }

@media (max-width: 720px) {
  /* на дотик - повні 44px, як і в сусідньої кнопки GitHub */
  .trigger.compact { height: 44px; }
}
</style>

<style>
/**
 * Список навмисно не scoped. SelectPortal виносить його в кінець body,
 * і атрибут data-v-* туди не доїжджає - scoped-правила просто не збігаються.
 * Звідси префікс ui-select-: це глобальні імена, вони мають бути свої.
 */
.ui-select-pop {
  z-index: 60;
  min-width: var(--reka-select-trigger-width);
  max-height: var(--reka-select-content-available-height);
  padding: 4px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  box-shadow: var(--sh-2);
  overflow: hidden;
}

/* коротка поява, щоб було видно, звідки список приїхав */
.ui-select-pop[data-state='open'] { animation: ui-select-pop .14s var(--ease); }

@keyframes ui-select-pop {
  from { opacity: 0; transform: translateY(-4px) scale(.98); }
  to { opacity: 1; transform: none; }
}

.ui-select-viewport { display: flex; flex-direction: column; gap: 1px; }

.ui-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 34px;
  padding: 0 10px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-2);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
}

/* один стан підсвітки і для миші, і для стрілок на клавіатурі */
.ui-select-item[data-highlighted] { outline: none; background: var(--brand-soft); color: var(--brand-ink); }
.ui-select-item[data-state='checked'] { color: var(--ink); font-weight: 500; }

.ui-select-check { display: grid; place-items: center; color: var(--brand); }

.ui-select-check svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
