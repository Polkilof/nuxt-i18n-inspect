<script setup lang="ts">
const { t, locale } = useI18n()

/**
 * Статична збірка для GitHub Pages - це вітрина, а не демо: модуль там вимкнений
 * (він dev-only), а запис у файли йде через серверний роут, якого в статиці немає.
 * Тому все, що обіцяє редагування чи підписку, живе тільки в dev, а на вітрині
 * замість обіцянок стоїть посилання на StackBlitz, де все справді працює.
 */
const dev = import.meta.dev
const tryKey = dev ? 'hero.tryLine' : 'hero.sampleLine'

const copied = ref(false)

async function copyInstall() {
  try {
    await navigator.clipboard.writeText('npm i nuxt-i18n-inspect')
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  }
  catch {
    // буфер може бути недоступний - тоді просто нічого не показуємо
  }
}

const email = ref('')
const error = ref<'empty' | 'format' | null>(null)
const done = ref(false)

function subscribe() {
  const value = email.value.trim()
  done.value = false

  if (!value) {
    error.value = 'empty'
    return
  }
  // без регулярки навмисно: вкладені квантифікатори на пошті дають
  // катастрофічний бектрекінг, а перевірка тут потрібна найгрубіша
  const at = value.indexOf('@')
  const dot = value.lastIndexOf('.')
  if (at < 1 || dot < at + 2 || dot > value.length - 2 || /\s/.test(value)) {
    error.value = 'format'
    return
  }
  error.value = null
  done.value = true
}
</script>

<template>
  <main>
    <!-- ------------------------------------------------------------ герой -->
    <section class="hero">
      <div
        class="glow"
        aria-hidden="true"
      >
        <span class="a" />
        <span class="b" />
      </div>

      <div class="inner">
        <span class="badge">
          <span class="pip" />
          {{ t('hero.badge') }}
        </span>

        <h1>{{ t('hero.title') }}</h1>

        <p class="lede">
          {{ t('hero.subtitle') }}
        </p>

        <div class="cta">
          <!-- команда навмисно повз t(): це не текст, а команда, і аудит
               підсвітить її бурштиновим як «поза i18n» - так і має бути -->
          <button
            class="btn install"
            type="button"
            @click="copyInstall"
          >
            <span class="prompt">npm i</span>
            <span>nuxt-i18n-inspect</span>
            <span class="sr-only">{{ t('hero.copy') }}</span>
            <svg
              v-if="copied"
              class="ico done"
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><path d="M20 6 9 17l-5-5" /></svg>
            <svg
              v-else
              class="ico"
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><rect
              x="9"
              y="9"
              width="12"
              height="12"
              rx="2"
            /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          </button>

          <a
            class="btn ghost"
            :href="REPO"
          >
            {{ t('hero.github') }}
            <svg
              class="ico"
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </a>
        </div>

        <!-- галочка після копіювання має aria-hidden, тож для тих, хто слухає
             сторінку, це єдине підтвердження, що клік узагалі щось зробив -->
        <p
          class="sr-only"
          aria-live="polite"
        >
          {{ copied ? t('hero.copied') : '' }}
        </p>

        <p class="hint">
          {{ t('hero.hint') }}
        </p>

        <!-- Вітрина. Усередині немає жодного вигаданого напису: тільки справжній
             перекладений рядок, ім'я його ключа і шлях до файлу - тобто код.
             У dev речення в рамці робоче й саме себе пояснює: спершу Alt+Shift+I,
             потім Alt-клік. У статиці натомість другий рядок і кнопка на StackBlitz,
             бо тут ні режим інспекції, ні збереження не працюють. -->
        <figure class="stage">
          <div class="window">
            <div class="chrome">
              <span class="dot r" />
              <span class="dot y" />
              <span class="dot g" />
              <code class="url">localhost:3000</code>
            </div>

            <div class="canvas">
              <span class="keytag">
                <svg
                  class="ico cursor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                ><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
                {{ tryKey }}
              </span>

              <p class="target">
                <span class="pick">{{ t(tryKey) }}</span>
              </p>

              <div class="chip">
                <span class="live" />
                <code>i18n/locales/{{ locale }}.json</code>
              </div>
            </div>
          </div>

          <figcaption v-if="!dev">
            <a
              class="btn tryout"
              :href="STACKBLITZ"
              target="_blank"
              rel="noreferrer"
            >
              {{ t('hero.live') }}
              <svg
                class="ico"
                viewBox="0 0 24 24"
                aria-hidden="true"
              ><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- ---------------------------------------------------------- цінності -->
    <section class="values">
      <header class="head">
        <span class="idx">01</span>
        <h2>{{ t('value.heading') }}</h2>
      </header>

      <div class="cards">
        <article class="card">
          <span class="tile indigo">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><line
              x1="6"
              y1="3"
              x2="6"
              y2="15"
            /><circle
              cx="18"
              cy="6"
              r="3"
            /><circle
              cx="6"
              cy="18"
              r="3"
            /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
          </span>
          <h3>{{ t('value.git.title') }}</h3>
          <p>{{ t('value.git.body') }}</p>
        </article>

        <article class="card">
          <span class="tile teal">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </span>
          <h3>{{ t('value.nothing.title') }}</h3>
          <p>{{ t('value.nothing.body') }}</p>
        </article>

        <article class="card">
          <span class="tile amber">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </span>
          <h3>{{ t('value.writer.title') }}</h3>
          <p>{{ t('value.writer.body') }}</p>
        </article>
      </div>
    </section>

    <!-- ------------------------------------------------------------- кроки -->
    <section class="steps">
      <header class="head">
        <span class="idx">02</span>
        <h2>{{ t('steps.heading') }}</h2>
      </header>

      <ol class="flow">
        <li>
          <span class="num">1</span>
          <p>{{ t('steps.one') }}</p>
        </li>
        <li>
          <span class="num">2</span>
          <p>{{ t('steps.two') }}</p>
        </li>
        <li>
          <span class="num">3</span>
          <p>{{ t('steps.three') }}</p>
        </li>
      </ol>
    </section>

    <!-- ---------------------------------------------------------- підписка -->
    <!-- Форма існує заради чотирьох рядків, яких на екрані немає, поки щось не
         сталося: дві помилки, повідомлення про успіх і підпис до поля для читалок
         екрана. Обходом сторінки їх не знайти - тільки списком ключів, який читає
         файли. Але адреса нікуди не летить: бекенду немає і не буде. На локальному
         демо це стенд, а на публічній адресі це вже збір пошти під обіцянку, якої
         ніхто не виконає - тому в статиці секції просто немає. -->
    <section
      v-if="dev"
      id="signup"
      class="signup"
    >
      <div class="panel">
        <h2>{{ t('signup.heading') }}</h2>
        <p class="body">
          {{ t('signup.body') }}
        </p>

        <form
          class="form"
          novalidate
          @submit.prevent="subscribe"
        >
          <label
            class="sr-only"
            for="signup-email"
          >{{ t('signup.label') }}</label>
          <input
            id="signup-email"
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            :aria-invalid="error !== null"
            :placeholder="t('signup.placeholder')"
          >
          <button
            class="btn primary"
            type="submit"
          >
            {{ t('signup.button') }}
          </button>
        </form>

        <!-- висота зарезервована: повідомлення не має штовхати сторінку -->
        <div
          class="msg"
          aria-live="polite"
        >
          <p
            v-if="error"
            class="error"
            role="alert"
          >
            <svg
              class="ico"
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><circle
              cx="12"
              cy="12"
              r="10"
            /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
            {{ error === 'empty' ? t('errors.empty') : t('errors.format') }}
          </p>
          <p
            v-else-if="done"
            class="ok"
          >
            <svg
              class="ico"
              viewBox="0 0 24 24"
              aria-hidden="true"
            ><circle
              cx="12"
              cy="12"
              r="10"
            /><path d="m9 12 2 2 4-4" /></svg>
            {{ t('signup.success') }}
          </p>
          <p
            v-else
            class="privacy"
          >
            {{ t('signup.privacy') }}
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* значки однією рукою: сітка 24, обведення 1.75, без заливки */
.ico {
  width: 1em;
  height: 1em;
  flex: none;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

section { padding-inline: clamp(16px, 4vw, 32px); }

/* спільна шапка розділу: монономер задає ритм, заголовок - розмір */
.head { max-width: 1080px; margin: 0 auto 34px; display: flex; align-items: baseline; gap: 14px; }
.idx { font-family: var(--font-mono); font-size: 12px; color: var(--brand); letter-spacing: .08em; }
.head h2 { margin: 0; font-size: clamp(24px, 3.2vw, 32px); font-weight: 600; }

/* ------------------------------------------------------------------ герой */

.hero {
  position: relative;
  overflow: hidden;
  padding-top: clamp(52px, 8vw, 96px);
  padding-bottom: clamp(64px, 9vw, 104px);
  text-align: center;
}

/* точкова сітка під героєм, згасає до країв */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgb(79 70 229 / 14%) 1px, transparent 0);
  background-size: 24px 24px;
  mask-image: radial-gradient(ellipse 68% 58% at 50% 26%, #000 15%, transparent 72%);
  pointer-events: none;
}

.glow { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.glow span { position: absolute; border-radius: 50%; filter: blur(72px); }

.glow .a {
  width: 560px;
  height: 420px;
  left: 50%;
  top: -170px;
  background: radial-gradient(circle, rgb(129 140 248 / 60%), transparent 70%);
  animation: drift-a 18s ease-in-out infinite alternate;
}

.glow .b {
  width: 420px;
  height: 380px;
  right: 4%;
  top: 40px;
  background: radial-gradient(circle, rgb(244 114 182 / 38%), transparent 70%);
  animation: drift-b 22s ease-in-out infinite alternate;
}

@keyframes drift-a {
  from { transform: translate3d(-58%, 0, 0) scale(1); }
  to { transform: translate3d(-52%, 26px, 0) scale(1.08); }
}

@keyframes drift-b {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(-26px, 24px, 0) scale(1.1); }
}

.inner { position: relative; max-width: 820px; margin: 0 auto; }

/* поява знизу вгору, по черзі - один раз, на першому кадрі */
@keyframes rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: none; }
}

.badge, .hero h1, .lede, .cta, .hint, .stage { animation: rise .75s var(--ease) both; }
.hero h1 { animation-delay: .06s; }
.lede { animation-delay: .12s; }
.cta { animation-delay: .18s; }
.hint { animation-delay: .24s; }
.stage { animation-delay: .3s; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--brand-ink);
  background: rgb(255 255 255 / 70%);
  border: 1px solid rgb(79 70 229 / 18%);
  box-shadow: var(--sh-1);
  border-radius: 999px;
  padding: 5px 14px 5px 11px;
  margin-bottom: 24px;
}

/* крапка тут декоративна: зелена читалась би як «сервіс живий», а це ліцензія */
.pip { width: 6px; height: 6px; border-radius: 50%; background: var(--grad); box-shadow: 0 0 0 3px rgb(79 70 229 / 12%); }

.hero h1 {
  font-size: clamp(36px, 6vw, 60px);
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -.035em;
  margin: 0 0 20px;
  text-wrap: balance;
}

.lede {
  font-size: clamp(16px, 1.6vw, 18px);
  line-height: 1.65;
  color: var(--ink-2);
  margin: 0 auto 30px;
  max-width: 58ch;
  text-wrap: pretty;
}

.cta { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 16px; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 46px;
  padding: 0 20px;
  border-radius: var(--r-2);
  font: inherit;
  font-size: 14.5px;
  font-weight: 500;
  border: 1px solid var(--line-2);
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  transition: transform .18s var(--ease), box-shadow .18s var(--ease), border-color .18s var(--ease), background-color .18s var(--ease);
}

.btn:hover { transform: translateY(-1px); box-shadow: var(--sh-2); }
.btn:active { transform: translateY(0); }

.btn.install {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 400;
  box-shadow: var(--sh-2);
}

.btn.install:hover { box-shadow: 0 12px 26px -10px rgb(18 19 28 / 55%); }
.btn.install .prompt { color: #a5b4fc; }
.btn.install .ico { font-size: 15px; color: var(--ink-4); transition: color .18s var(--ease); }
.btn.install:hover .ico { color: #fff; }
.btn.install .ico.done { color: #6ee7b7; }

.btn.ghost { color: var(--ink-2); }
.btn.ghost:hover { color: var(--ink); border-color: var(--ink-4); }
.btn.ghost .ico { font-size: 15px; transition: transform .18s var(--ease); }
.btn.ghost:hover .ico { transform: translateX(2px); }

/* головний заклик статичної вітрини: там, де людина щойно прочитала,
   що цей рядок можна переписати, і хоче спробувати.
   Не .live - цей клас нижче вже зайнятий крапкою в чипі */
.btn.tryout {
  background: var(--brand);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 10px 24px -10px rgb(79 70 229 / 55%);
}
.btn.tryout:hover { background: var(--brand-ink); box-shadow: 0 14px 30px -10px rgb(79 70 229 / 60%); }
.btn.tryout .ico { font-size: 15px; transition: transform .18s var(--ease); }
.btn.tryout:hover .ico { transform: translateX(2px); }

.hint { font-size: 13px; color: var(--ink-3); margin: 0; }

/* --------------------------------------------------------------- вітрина */

.stage { margin: clamp(40px, 6vw, 68px) auto 0; max-width: 760px; }
.stage figcaption { display: flex; justify-content: center; margin-top: 22px; }

.window {
  border-radius: var(--r-4);
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: var(--sh-3);
  overflow: hidden;
  text-align: left;
}

.chrome {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(#fdfdff, #f7f7fc);
}

.chrome .dot { width: 10px; height: 10px; border-radius: 50%; }
.chrome .r { background: #ff5f57; }
.chrome .y { background: #febc2e; }
.chrome .g { background: #28c840; }

.url {
  margin-left: 12px;
  font-size: 11.5px;
  color: var(--ink-3);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 12px;
}

.canvas { position: relative; padding: clamp(30px, 5vw, 46px) clamp(22px, 5vw, 44px) clamp(46px, 6vw, 58px); }

.keytag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: #fff;
  background: var(--ink);
  padding: 4px 10px;
  border-radius: 6px;
  margin-bottom: 14px;
}

.keytag .cursor { font-size: 12px; stroke: none; fill: currentcolor; }

.target { margin: 0; }

/* та сама рамка, яку модуль малює на наведеному рядку */
.pick {
  font-family: var(--font-display);
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -.015em;
  background: rgb(79 70 229 / 7%);
  outline: 2px solid rgb(79 70 229 / 42%);
  outline-offset: 4px;
  border-radius: 2px;
  box-decoration-break: clone;
  animation: ring 3.4s ease-in-out infinite;
}

@keyframes ring {
  0%, 100% { outline-color: rgb(79 70 229 / 42%); }
  50% { outline-color: rgb(79 70 229 / 14%); }
}

.chip {
  position: absolute;
  right: clamp(16px, 4vw, 26px);
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: var(--sh-2);
  border-radius: 999px;
  padding: 6px 14px 6px 11px;
  font-size: 11.5px;
  color: var(--ink-3);
}

.live { width: 6px; height: 6px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 0 3px rgb(15 157 110 / 16%); }

/* --------------------------------------------------------------- цінності */

.values { padding-bottom: clamp(64px, 8vw, 96px); }
.cards { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

.card {
  position: relative;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-3);
  padding: 26px 24px 28px;
  overflow: hidden;
  transition: transform .22s var(--ease), box-shadow .22s var(--ease), border-color .22s var(--ease);
}

/* тонка кольорова риска згори з'являється тільки під курсором */
.card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: var(--grad);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .32s var(--ease);
}

.card:hover { transform: translateY(-3px); box-shadow: var(--sh-2); border-color: var(--line-2); }
.card:hover::before { transform: scaleX(1); }

.tile {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-2);
  margin-bottom: 18px;
  transition: transform .22s var(--ease);
}

.card:hover .tile { transform: scale(1.06); }
.tile svg { width: 20px; height: 20px; fill: none; stroke: currentcolor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
.tile.indigo { background: #eef0ff; color: #4338ca; }
.tile.teal { background: #e4fbf7; color: #0d7d6c; }
.tile.amber { background: #fff3e4; color: #b45309; }

.card h3 { margin: 0 0 9px; font-size: 17px; font-weight: 600; }
.card p { margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--ink-2); }

/* ------------------------------------------------------------------ кроки */

.steps { padding-bottom: clamp(72px, 9vw, 110px); }

.flow {
  position: relative;
  max-width: 1080px;
  margin: 0 auto;
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 26px;
}

.flow li { position: relative; }

/* пунктир від номера до наступного номера: останній крок його не малює,
   інакше лінія повисає в порожнечі праворуч */
.flow li:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 19px;
  left: 50px;
  right: -26px;
  border-top: 1px dashed var(--line-2);
}

.num {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--line-2);
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--brand);
  margin-bottom: 16px;
  box-shadow: var(--sh-1);
}

.flow p { margin: 0; font-size: 15px; line-height: 1.65; color: var(--ink-2); max-width: 34ch; }

/* --------------------------------------------------------------- підписка */

.signup { padding-bottom: clamp(72px, 9vw, 110px); }

.panel {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
  border-radius: var(--r-4);
  padding: clamp(40px, 6vw, 60px) clamp(24px, 5vw, 48px) clamp(34px, 4vw, 44px);
  color: #fff;
  background:
    radial-gradient(ellipse 70% 90% at 15% 0%, rgb(139 92 246 / 55%), transparent 60%),
    radial-gradient(ellipse 60% 80% at 90% 100%, rgb(236 72 153 / 38%), transparent 62%),
    #14142b;
  box-shadow: var(--sh-3);
  overflow: hidden;
}

.panel h2 { margin: 0 0 14px; font-size: clamp(24px, 3.4vw, 34px); font-weight: 600; letter-spacing: -.025em; }
.panel .body { font-size: 15px; line-height: 1.65; color: rgb(255 255 255 / 72%); margin: 0 auto 28px; max-width: 50ch; }

.form { display: flex; flex-wrap: wrap; gap: 9px; justify-content: center; }

.form input {
  flex: 1 1 260px;
  max-width: 340px;
  font: inherit;
  font-size: 15px;
  min-height: 46px;
  padding: 0 15px;
  border-radius: var(--r-2);
  border: 1px solid rgb(255 255 255 / 20%);
  background: rgb(255 255 255 / 8%);
  color: #fff;
  transition: border-color .18s var(--ease), background-color .18s var(--ease);
}

.form input::placeholder { color: rgb(255 255 255 / 42%); }
.form input:hover { border-color: rgb(255 255 255 / 32%); }

.form input:focus-visible {
  border-color: rgb(255 255 255 / 55%);
  background: rgb(255 255 255 / 12%);
  box-shadow: 0 0 0 3px rgb(255 255 255 / 16%);
}

.form input[aria-invalid='true'] { border-color: rgb(252 165 165 / 70%); }

.btn.primary {
  background: #fff;
  border-color: #fff;
  color: var(--ink);
  font-weight: 500;
}

.btn.primary:hover { box-shadow: 0 12px 28px -10px rgb(0 0 0 / 45%); }

/* місце під повідомлення тримається завжди - інакше форма стрибає */
.msg { min-height: 26px; margin-top: 16px; }
.msg p { display: inline-flex; align-items: center; gap: 7px; margin: 0; font-size: 13.5px; }
.msg .ico { font-size: 15px; }
.privacy { color: rgb(255 255 255 / 58%); }
.error { color: #fca5a5; }
.ok { color: #6ee7b7; }

/* ----------------------------------------------------------------- вужче */

@media (max-width: 900px) {
  .cards { grid-template-columns: 1fr; }
  .flow { grid-template-columns: 1fr; gap: 20px; }
  .flow li:not(:last-child)::after { display: none; }
  .flow li { display: flex; align-items: flex-start; gap: 16px; }
  .num { margin-bottom: 0; flex: none; }
  .flow p { max-width: none; padding-top: 7px; }
}

@media (max-width: 560px) {
  .cta .btn { width: 100%; justify-content: center; }
  .form input { max-width: none; }
  .btn.primary { width: 100%; justify-content: center; }
  .chip { display: none; }
}
</style>
