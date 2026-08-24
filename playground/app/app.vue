<script setup lang="ts">
import { allKeys, hasMarker, stripMarkers } from '../../src/runtime/marker'

const { t, locale, locales, setLocale } = useI18n()

const userName = 'Marie'
const appleCount = ref(2)

// Кейс 6: перекладений рядок потрапляє в стан форми через v-model
const formValue = ref(t('form.label'))

// Кейс 13: те саме, але багаторядкове — <textarea> замість <input>
const bio = ref(t('bio'))

// Кейс 14: contenteditable — DOM редагує сам користувач, а не Vue
const editedText = ref('')
const onEdit = (event: Event) => {
  editedText.value = (event.target as HTMLElement).textContent ?? ''
}

watch(locale, () => {
  formValue.value = t('form.label')
  bio.value = t('bio')
  editedText.value = ''
})

// Кейс 6b: переклад як value в <option> + порівняння рядків
const answer = ref('')

/** Перевірки, яких не видно наведенням миші — їх рахує сам застосунок. */
type Check = { title: string, code: string, result: string, verdict: 'ok' | 'fail' }

const YES: Record<string, string> = { en: 'Yes', fr: 'Oui', de: 'Ja' }

const checks = computed<Check[]>(() => {
  const yes = t('form.yes')
  const plain = t('plain')
  const sliced = plain.slice(0, 25)
  const expected = YES[locale.value] ?? YES.en!
  const plural = t('apples', appleCount.value)
  const greeting = t('greeting', { name: userName })

  return [
    {
      title: 'Direct string comparison',
      code: `t('form.yes') === '${expected}'`,
      result: String(yes === expected),
      verdict: yes === expected ? 'ok' : 'fail',
    },
    {
      title: 'Comparison after stripMarkers()',
      code: `stripMarkers(t('form.yes')) === '${expected}'`,
      result: String(stripMarkers(yes) === expected),
      verdict: stripMarkers(yes) === expected ? 'ok' : 'fail',
    },
    {
      title: 'String length',
      code: 't(\'plain\').length',
      result: `${plain.length} instead of ${stripMarkers(plain).length} (+${plain.length - stripMarkers(plain).length} invisible characters)`,
      verdict: 'fail',
    },
    {
      title: 'Truncation with .slice()',
      code: 't(\'plain\').slice(0, 25)',
      result: hasMarker(sliced) ? 'marker survived' : 'marker lost — the key cannot be resolved',
      verdict: hasMarker(sliced) ? 'ok' : 'fail',
    },
    {
      title: 'Form state through v-model',
      code: 'JSON.stringify(formValue)',
      result: hasMarker(formValue.value)
        ? 'invisible characters will travel in the payload'
        : 'clean (the marker is gone after manual editing)',
      verdict: hasMarker(formValue.value) ? 'fail' : 'ok',
    },
    {
      title: '<select> value comparison',
      code: 'answer === t(\'form.yes\')',
      result: answer.value === '' ? 'pick an option in case 6' : String(answer.value === yes),
      verdict: answer.value === '' || answer.value === yes ? 'ok' : 'fail',
    },
    {
      title: 'Textarea state through v-model',
      code: 'hasMarker(bio)',
      result: hasMarker(bio.value)
        ? 'invisible characters will travel in the payload'
        : 'clean (the marker is gone after manual editing)',
      verdict: hasMarker(bio.value) ? 'fail' : 'ok',
    },
    {
      title: 'contenteditable after typing',
      code: 'hasMarker(el.textContent)',
      result: editedText.value === ''
        ? 'type inside case 14'
        : hasMarker(editedText.value)
          ? `the marker survived editing — key: ${allKeys(editedText.value).join(', ')}`
          : 'the marker is gone — the string can no longer be opened from the page',
      verdict: editedText.value === '' || hasMarker(editedText.value) ? 'ok' : 'fail',
    },
    {
      title: 'Marker after pluralization',
      code: `t('apples', ${appleCount.value})`,
      result: hasMarker(plural) ? `key: ${allKeys(plural).join(', ')}` : 'no marker',
      verdict: hasMarker(plural) ? 'ok' : 'fail',
    },
    {
      title: 'Marker after interpolation',
      code: 't(\'greeting\', { name })',
      result: hasMarker(greeting) ? `key: ${allKeys(greeting).join(', ')}` : 'no marker',
      verdict: hasMarker(greeting) ? 'ok' : 'fail',
    },
  ]
})
</script>

<template>
  <div class="page">
    <header>
      <h1>Marker minefield</h1>
      <p class="lead">
        Press <kbd>Alt+Shift+I</kbd> to turn inspect mode on. Now hover over any block: the
        string under the cursor gets outlined and its key appears above the outline — it has
        to match the key in the case heading. <kbd>Alt+click</kbd> opens the panel for that
        key, <kbd>Alt+Shift+I</kbd> again turns the mode off.
      </p>
      <nav class="locales">
        <button
          v-for="l in locales"
          :key="l.code"
          :class="{ active: l.code === locale }"
          @click="setLocale(l.code)"
        >
          {{ l.name }}
        </button>
      </nav>
    </header>

    <section class="grid">
      <article>
        <h2>1. Plain text <code>plain</code></h2>
        <p>{{ t('plain') }}</p>
      </article>

      <article>
        <h2>2. Interpolation <code>greeting</code></h2>
        <p>{{ t('greeting', { name: userName }) }}</p>
      </article>

      <article>
        <h2>3. Attributes <code>search.placeholder</code> / <code>search.title</code></h2>
        <input
          :placeholder="t('search.placeholder')"
          :title="t('search.title')"
        >
        <small>Cursor inside the input — the attribute fallback must fire, not the caret API.</small>
      </article>

      <article>
        <h2>4. Concatenation <code>concat.a</code> + <code>concat.b</code></h2>
        <p>{{ t('concat.a') + ' ' + t('concat.b') }}</p>
        <small>Two halves — two different keys in one text node.</small>
      </article>

      <article>
        <h2>5. Truncation <code>ellipsis</code></h2>
        <p class="clipped">
          {{ t('ellipsis') }}
        </p>
        <small>CSS truncation. Hover the visible part and the «…».</small>
      </article>

      <article>
        <h2>6. v-model <code>form.label</code></h2>
        <input v-model="formValue">
        <select v-model="answer">
          <option value="">
            —
          </option>
          <option :value="t('form.yes')">
            {{ t('form.yes') }}
          </option>
          <option :value="t('form.no')">
            {{ t('form.no') }}
          </option>
        </select>
        <small>The marker travels into app state, and from there into the payload.</small>
      </article>

      <article>
        <h2>7. Pluralization <code>apples</code></h2>
        <p>{{ t('apples', appleCount) }}</p>
        <input
          v-model.number="appleCount"
          type="range"
          min="0"
          max="5"
        >
        <small>{{ appleCount }} — the form changes, the key must stay the same.</small>
      </article>

      <article>
        <h2>8. v-html <code>html</code></h2>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-html="t('html')" />
        <small>Hover the plain text, the bold part and the link separately.</small>
      </article>

      <article>
        <h2>9. Narrow column <code>narrow</code></h2>
        <div class="narrow">
          <p>{{ t('narrow') }}</p>
        </div>
        <small>With U+200B in the marker the word broke into two lines. After the alphabet change — one line.</small>
      </article>

      <article>
        <h2>10. Emoji <code>emoji</code></h2>
        <p class="big">
          {{ t('emoji') }}
        </p>
        <small>Marker right after the emoji. Check that the emoji itself did not change.</small>
      </article>

      <article>
        <h2>11. Untranslated key <code>onlyBase</code></h2>
        <p>{{ t('onlyBase') }}</p>
        <small>Missing from fr and de. With fallbackLocale set you see the English text — still clickable, and the page audit paints it red.</small>
      </article>

      <article>
        <h2>12. Text with no marker</h2>
        <p>This line is written in the template by hand, past t(). The badge must say there is no marker.</p>
      </article>

      <article>
        <h2>13. Textarea <code>bio</code></h2>
        <textarea
          v-model="bio"
          rows="3"
        />
        <small>A multi-line value carrying the marker. Whether the caret API reaches inside a textarea is engine-specific — if it does not, the @value fallback has to catch it, the same one that resolves placeholders.</small>
      </article>

      <article>
        <h2>14. contenteditable <code>editable</code></h2>
        <p
          class="editable"
          contenteditable="true"
          @input="onEdit"
        >
          {{ t('editable') }}
        </p>
        <small>Here the user edits the DOM by hand. Type in the middle of the sentence, then at the very end — the marker sits after the last character.</small>
      </article>
    </section>

    <section class="checks">
      <h2>What the mouse cannot show</h2>
      <table>
        <thead>
          <tr>
            <th>Check</th><th>Expression</th><th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in checks"
            :key="c.title"
            :class="c.verdict"
          >
            <td>{{ c.title }}</td>
            <td><code>{{ c.code }}</code></td>
            <td>{{ c.result }}</td>
          </tr>
        </tbody>
      </table>
      <p class="lead">
        SSR is checked separately: the console must be free of hydration warnings, and
        <code>view-source</code> must already contain the markers in the server HTML.
      </p>
    </section>
  </div>
</template>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 32px 24px 140px; font-family: system-ui, sans-serif; color: #1a1a1a; }
h1 { margin: 0 0 8px; font-size: 28px; }
h2 { margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #555; }
code { font-family: ui-monospace, Menlo, monospace; font-size: 12px; background: #f1f1f4; padding: 1px 5px; border-radius: 4px; }
.lead { color: #555; font-size: 14px; max-width: 70ch; }
kbd { font: 500 12px/1.4 ui-monospace, Menlo, monospace; background: #1a1a1a; color: #fff; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
.locales { display: flex; gap: 8px; margin: 16px 0 28px; }
.locales button { padding: 6px 14px; border: 1px solid #d0d0d6; background: #fff; border-radius: 999px; cursor: pointer; font-size: 14px; }
.locales button.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
article { border: 1px solid #e4e4e9; border-radius: 10px; padding: 16px; background: #fff; }
article p { margin: 0 0 8px; line-height: 1.55; }
small { display: block; color: #8a8a94; font-size: 12px; line-height: 1.4; }
input, select { font: inherit; padding: 6px 10px; border: 1px solid #d0d0d6; border-radius: 6px; margin: 0 6px 8px 0; max-width: 100%; }
textarea { font: inherit; box-sizing: border-box; width: 100%; padding: 6px 10px; border: 1px solid #d0d0d6; border-radius: 6px; margin-bottom: 8px; resize: vertical; }
.editable { border: 1px dashed #d0d0d6; border-radius: 6px; padding: 8px; margin-bottom: 8px; line-height: 1.55; outline: none; }
.editable:focus { border-style: solid; border-color: #1a1a1a; }
.clipped { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
.narrow { width: 90px; border: 1px dashed #d0d0d6; padding: 6px; }
.big { font-size: 28px; }
.checks { margin-top: 40px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ececf1; vertical-align: top; }
tr.fail td:last-child { color: #b3261e; font-weight: 600; }
tr.ok td:last-child { color: #1a7f37; font-weight: 600; }
</style>
