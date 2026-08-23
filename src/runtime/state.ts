import { reactive } from 'vue'
import type { HitSource } from './probe'

/** Рядок панелі: одна локаль одного ключа. */
export interface LocaleEntry {
  locale: string
  /** Значення, як воно лежить у файлі зараз. */
  value: string
  /** Те, що редагує користувач. draft !== value = є незбережені зміни. */
  draft: string
  /** Чи є ключ у цій локалі взагалі. */
  exists: boolean
  /** Файл, у якому ключ лежить або куди потрапить при збереженні. */
  file: string | null
  fileName: string
  saving: boolean
  saved: boolean
}

export interface Selection {
  key: string
  source: HitSource
  /** Людський опис джерела: «текст», «атрибут @placeholder» тощо. */
  label: string
  entries: LocaleEntry[]
  note: string | null
  loading: boolean
}

export interface AuditState {
  /** Маркер є, але ключа немає в поточній локалі — на екрані фолбек. */
  untranslated: boolean
  /** Маркера немає взагалі — рядок не заведений в i18n. */
  foreign: boolean
  /** Скільки знайдено останнім скануванням. */
  counts: { untranslated: number, foreign: number }
}

/** Рядок списку: один незаповнений ключ однієї локалі. */
export interface ReportItem {
  key: string
  /** 'absent' — ключа немає у файлі, 'empty' — є, але порожній. */
  kind: 'absent' | 'empty'
  /** Значення базової локалі: з нього й перекладають. */
  base: string
  draft: string
  saving: boolean
  saved: boolean
  error: string | null
}

export interface LocaleReport {
  locale: string
  /** Скільки ключів усього — за базовою локаллю. */
  total: number
  filled: number
  missing: ReportItem[]
  /** Значення збігається з базовим. Часто легітимно, тож окремою секцією. */
  copies: ReportItem[]
  /** Є тут, немає в базовій — залишки видалених фіч. */
  dead: string[]
}

export interface ReportState {
  open: boolean
  loading: boolean
  /** Локаль, за якою рахується множина ключів. */
  base: string
  /** Локаль, яку зараз заповнюють. Не обов'язково поточна мова застосунку. */
  target: string
  locales: LocaleReport[]
  note: string | null
  /** Фільтр по ключу й тексту — інакше на кількох сотнях рядків не знайти нічого. */
  query: string
  showCopies: boolean
  showDead: boolean
}

export interface InspectState {
  /** Режим інспектування: вмикається гарячою клавішею. */
  enabled: boolean
  /** Що відкрито в панелі. null — панель закрита. */
  selection: Selection | null
  /**
   * Локаль застосунку зараз. Живе тут, а не у вибірці: мову можна
   * перемкнути з панелі, і підсвітка поточного рядка має за цим встигати.
   */
  locale: string
  audit: AuditState
  /**
   * Список незаповнених ключів із файлів. Живе поруч з аудитом, але відповідає
   * на інше питання: аудит бачить лише те, що відрендерилось, звіт — усе.
   */
  report: ReportState
  /**
   * Перемикання мови застосунку з панелі — щоб одразу бачити,
   * як переклад лягає у верстку. Реєструє плагін: доступ до i18n має він.
   */
  setLocale: ((code: string) => void) | null
  /**
   * Перечитати множину ключів і пересканувати. Панель кличе після запису:
   * щойно збережений ключ більше не «неперекладений».
   */
  refreshAudit: (() => void) | null
  /** Перечитати звіт із файлів. Реєструє плагін. */
  loadReport: (() => void) | null
}

/**
 * Спільний стан оверлея й панелі.
 *
 * Живе окремим модулем, а не всередині Vue-застосунку панелі, бо писати в
 * нього має плагін (він слухає ввід), а читати — компонент.
 */
export const state = reactive<InspectState>({
  enabled: false,
  selection: null,
  locale: '',
  audit: {
    untranslated: false,
    foreign: false,
    counts: { untranslated: 0, foreign: 0 },
  },
  report: {
    open: false,
    loading: false,
    base: '',
    target: '',
    locales: [],
    note: null,
    query: '',
    showCopies: false,
    showDead: false,
  },
  setLocale: null,
  refreshAudit: null,
  loadReport: null,
})

/** Чи є незбережені правки — питає і панель, і плагін перед перемиканням. */
export function hasUnsaved(selection: Selection | null): boolean {
  return !!selection?.entries.some(entry => entry.draft !== entry.value)
}
