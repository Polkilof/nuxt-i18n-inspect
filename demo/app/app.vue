<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()

// Дашборд і секція підписки живуть тільки в dev, тож у статиці вести до них
// нікуди. Сам маршрут /app там теж не збирається - див. hooks у nuxt.config.
// Натомість у вітрині з'являється посилання на StackBlitz: там demo працює.
const dev = import.meta.dev

// перемикач мов навмисно компактний: у шапці для нього є місце на одну кнопку
const current = computed<string>({
  get: () => locale.value,
  // тип коду локалі @nuxtjs/i18n виводить із конфігу, тож повертаємо його туди
  set: code => setLocale(code as typeof locale.value),
})

// назви мов приходять з nuxt.config і навмисно не проходять через t():
// мову в перемикачі показують її ж словом, а не перекладеним
const languages = computed(() => locales.value.map(item => ({
  value: item.code,
  label: item.name ?? item.code,
})))
</script>

<template>
  <div class="shell">
    <header class="bar">
      <NuxtLink
        to="/"
        class="brand"
      >
        <AppMark :size="26" />
        <code>nuxt-i18n-inspect</code>
      </NuxtLink>

      <nav class="nav">
        <NuxtLink to="/">
          {{ t('nav.overview') }}
        </NuxtLink>
        <NuxtLink
          v-if="dev"
          to="/app"
        >
          {{ t('nav.app') }}
        </NuxtLink>
        <a
          class="docs"
          :href="REPO + '#readme'"
        >{{ t('nav.docs') }}</a>
        <span class="version">v0.1.0</span>
      </nav>

      <div class="tools">
        <AppSelect
          v-model="current"
          compact
          label="Language"
          :options="languages"
        />

        <a
          class="icon"
          :href="REPO"
          aria-label="GitHub"
        >
          <svg
            viewBox="0 0 16 16"
            width="17"
            height="17"
            aria-hidden="true"
          ><path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          /></svg>
        </a>
      </div>
    </header>

    <NuxtPage />

    <footer class="foot">
      <div class="cols">
        <div class="about">
          <div class="line">
            <AppMark :size="22" />
            <code>nuxt-i18n-inspect</code>
          </div>
          <p>{{ t('footer.tagline') }}</p>
        </div>

        <div class="col">
          <h4>{{ t('footer.product') }}</h4>
          <NuxtLink to="/">
            {{ t('footer.overview') }}
          </NuxtLink>
          <NuxtLink
            v-if="dev"
            to="/app"
          >
            {{ t('footer.app') }}
          </NuxtLink>
          <a
            v-else
            :href="STACKBLITZ"
            target="_blank"
            rel="noreferrer"
          >{{ t('footer.demo') }}</a>
          <NuxtLink
            v-if="dev"
            to="/#signup"
          >
            {{ t('footer.pro') }}
          </NuxtLink>
        </div>

        <div class="col">
          <h4>{{ t('footer.resources') }}</h4>
          <a :href="REPO + '#readme'">{{ t('footer.docs') }}</a>
          <a :href="REPO + '#controls'">{{ t('footer.start') }}</a>
          <a :href="REPO + '#limitations'">{{ t('footer.limits') }}</a>
        </div>

        <div class="col">
          <h4>{{ t('footer.project') }}</h4>
          <a :href="REPO">{{ t('footer.github') }}</a>
          <a :href="REPO + '/issues'">{{ t('footer.issues') }}</a>
          <a href="https://www.npmjs.com/package/nuxt-i18n-inspect">{{ t('footer.npm') }}</a>
        </div>
      </div>

      <div class="bottom">
        <span>{{ t('footer.rights') }}</span>
        <span class="note">{{ t('footer.note') }}</span>
      </div>
    </footer>
  </div>
</template>

<style>
/**
 * Токени. Кольори, радіуси й тіні лежать тільки тут - у розмітці нижче
 * і на сторінках стоять var(), щоб відтінок правився в одному місці.
 */
:root {
  color-scheme: light;

  /* три ролі шрифтів: заголовок, текст, код */
  --font-display: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif;
  --font-body: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;

  /* чорнило: одна шкала на весь сайт, від основного тексту до підписів */
  --ink: #12131c;
  --ink-2: #4a4d60;
  --ink-3: #6f7387;
  --ink-4: #9a9eb1;

  /* поверхні й лінії */
  --bg: #fff;
  --bg-soft: #f8f8fc;
  --line: #e9e9f2;
  --line-2: #dcdcea;

  /* бренд: індиго з двома сусідами в одному градієнті */
  --brand: #4f46e5;
  --brand-ink: #3b32bd;
  --brand-soft: #eef0ff;
  --brand-2: #8b5cf6;
  --brand-3: #ec4899;
  --grad: linear-gradient(135deg, #4f46e5, #8b5cf6 55%, #ec4899);

  /* стани: колір ніколи не єдиний носій сенсу, поруч завжди значок */
  --ok: #0f9d6e;

  /* темніший варіант для тексту: світлий зелений на білому дає лише 3.2:1 */
  --ok-ink: #0a7551;
  --bad: #dc2626;

  /* одна висота на всі контроли форми: інакше select, поле дати
     й текстове поле стоять на різних рівнях */
  --ctl-h: 40px;

  --r-1: 8px;
  --r-2: 12px;
  --r-3: 18px;
  --r-4: 26px;

  /* тінь з бренд-відтінком, а не сіра: на білому сірі тіні виглядають брудно */
  --sh-1: 0 1px 2px rgb(24 20 60 / 6%), 0 1px 1px rgb(24 20 60 / 4%);
  --sh-2: 0 8px 20px -6px rgb(24 20 60 / 10%), 0 2px 6px -2px rgb(24 20 60 / 6%);
  --sh-3: 0 30px 64px -20px rgb(41 33 120 / 24%), 0 12px 26px -14px rgb(41 33 120 / 14%);

  --ring: 0 0 0 3px rgb(79 70 229 / 24%);
  --ease: cubic-bezier(.2, .7, .3, 1);
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -.02em;
}

a { color: inherit; text-decoration: none; }
code, kbd { font-family: var(--font-mono); }
::selection { background: rgb(79 70 229 / 16%); }

/* фокус видно завжди: обвідку не знімаємо, а замінюємо на кільце в бренді */
:where(a, button, input, select, textarea):focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

/* підпис для тих, хто слухає сторінку, а не дивиться на неї */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }

  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
</style>

<style scoped>
.shell { min-height: 100vh; display: flex; flex-direction: column; }

/* ------------------------------------------------------------------ шапка */

.bar {
  display: flex;
  align-items: center;
  gap: 28px;
  height: 60px;
  padding: 0 clamp(16px, 4vw, 32px);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgb(255 255 255 / 82%);
  backdrop-filter: blur(10px) saturate(160%);
}

/* вертикальні padding тут заради пальця: знак 26px, а тиснути треба по 44 */
.brand { display: flex; align-items: center; gap: 9px; padding: 9px 0; }
.brand code { font-size: 13.5px; font-weight: 500; letter-spacing: -.01em; }

.nav {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-right: auto;
  font-size: 14px;
  color: var(--ink-3);
}

.nav a {
  position: relative;
  padding: 13px 0;
  transition: color .16s var(--ease);
}

.nav a:hover { color: var(--ink); }

/* поточний розділ підкреслений, а не лише іншого кольору */
.nav a.router-link-exact-active { color: var(--ink); font-weight: 500; }

.nav a.router-link-exact-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  height: 2px;
  border-radius: 2px;
  background: var(--brand);
}

.version {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 2px 7px;
}

.tools { display: flex; align-items: center; gap: 8px; }

.icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--r-1);
  border: 1px solid var(--line-2);
  color: var(--ink-2);
  transition: color .16s var(--ease), border-color .16s var(--ease);
}

.icon:hover { color: var(--ink); border-color: var(--ink-4); }

/* ----------------------------------------------------------------- підвал */

.foot {
  margin-top: auto;
  border-top: 1px solid var(--line);
  background: var(--bg-soft);
  padding: 56px clamp(16px, 4vw, 32px) 28px;
}

.cols {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.7fr repeat(3, 1fr);
  gap: 32px;
}

.about .line { display: flex; align-items: center; gap: 8px; }
.about code { font-size: 13.5px; font-weight: 500; }
.about p { margin: 14px 0 0; font-size: 13.5px; line-height: 1.65; color: var(--ink-3); max-width: 38ch; }

.col { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }

.col h4 {
  margin: 0 0 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-weight: 500;
}

/* padding замість gap: відступ між пунктами лишається той самий на око,
   але клікабельна зона доростає до пальця */
.col a { font-size: 13.5px; color: var(--ink-3); padding: 9px 0; transition: color .16s var(--ease); }
.col a:hover { color: var(--brand); }

.bottom {
  max-width: 1080px;
  margin: 40px auto 0;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 12.5px;
  color: var(--ink-3);
}

.note { text-align: right; }

@media (max-width: 900px) {
  .cols { grid-template-columns: 1fr 1fr; }
  .bottom { flex-direction: column; }
  .note { text-align: left; }
}

@media (max-width: 720px) {
  .bar { gap: 16px; }
  .nav { gap: 16px; font-size: 13.5px; }
  .nav .docs, .version { display: none; }

  /* на дотик - повні 44px, місця в шапці на це вистачає
     (перемикач мови тягне ту саму висоту зі свого компонента) */
  .icon { width: 44px; height: 44px; }
}

@media (max-width: 520px) {
  /* на найвужчому лишається сам знак: він тепер щось означає */
  .brand code { display: none; }
  .cols { grid-template-columns: 1fr; gap: 26px; }
}
</style>
