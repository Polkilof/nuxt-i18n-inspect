import { allKeys, hasMarker, keyAtOffset, markerAt, markerMatches, stripMarkers } from './marker'

/**
 * Як отримати переклад за ключем. Задає плагін, бо доступ до composer
 * має він; probe лишається чистою роботою з DOM.
 */
let translate: ((key: string) => string) | null = null

export function setTranslationResolver(resolver: (key: string) => string) {
  translate = resolver
}

/**
 * Текст для звірки: без маркерів, без розмітки, зі злитими пробілами.
 * Теги прибираємо, бо саме заради них існує цей фолбек: у v-html переклад
 * містить <b> і <a>, а в DOM від них лишається тільки текст.
 */
const squash = (text: string) => stripMarkers(text)
  .replace(/<[^>]*>/g, '')
  .replace(/\s+/g, ' ')
  .trim()

export type HitSource = 'text' | 'inherited' | 'attribute'

export interface InspectHit {
  key: string
  source: HitSource
  /** Яка DOM-API знайшла ноду — знадобиться в баг-репортах. */
  api: string
  /** Людський опис джерела для мітки. */
  label: string
  /** Прямокутники підсвітки: у рядка їх кілька, якщо він переноситься. */
  rects: DOMRect[]
}

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'value'] as const

interface CaretHit { node: Text, offset: number, api: string }

/** Перетин двох прямокутників; null, якщо вони не перетинаються. */
function intersect(a: DOMRect, b: DOMRect): DOMRect | null {
  const left = Math.max(a.left, b.left)
  const top = Math.max(a.top, b.top)
  const right = Math.min(a.right, b.right)
  const bottom = Math.min(a.bottom, b.bottom)
  if (right <= left || bottom <= top) return null
  return new DOMRect(left, top, right - left, bottom - top)
}

/**
 * Обрізає підсвітку по предках, які ховають переповнення.
 *
 * getClientRects() віддає геометрію повного тексту, а не видимого: при
 * text-overflow: ellipsis рядок обрізаний візуально, але в розкладці
 * лишається на всю довжину, і рамка вилазила в сусідній блок.
 */
function clipToAncestors(rects: DOMRect[], start: Element | null): DOMRect[] {
  let out = rects
  let el = start
  for (let depth = 0; el && out.length && depth < 12; depth++, el = el.parentElement) {
    const style = getComputedStyle(el)
    if (style.overflowX === 'visible' && style.overflowY === 'visible') continue
    const box = el.getBoundingClientRect()
    out = out.map(r => intersect(r, box)).filter((r): r is DOMRect => r !== null)
  }
  return out
}

/** Текстова нода під точкою. Дві різні API — у старих WebKit своя. */
function caretHit(x: number, y: number): CaretHit | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node, offset: number } | null
    caretRangeFromPoint?: (x: number, y: number) => Range | null
  }

  if (typeof doc.caretPositionFromPoint === 'function') {
    const pos = doc.caretPositionFromPoint(x, y)
    if (pos?.offsetNode?.nodeType === Node.TEXT_NODE) {
      return { node: pos.offsetNode as Text, offset: pos.offset, api: 'caretPositionFromPoint' }
    }
  }
  if (typeof doc.caretRangeFromPoint === 'function') {
    const range = doc.caretRangeFromPoint(x, y)
    if (range?.startContainer?.nodeType === Node.TEXT_NODE) {
      return { node: range.startContainer as Text, offset: range.startOffset, api: 'caretRangeFromPoint' }
    }
  }
  return null
}

/**
 * Прямокутники саме того сегмента, якому належить маркер, а не всієї ноди.
 * У конкатенації t('a') + t('b') це різниця між підсвіткою половини рядка
 * і підсвіткою всього абзацу.
 */
function segmentRects(node: Text, offset: number): DOMRect[] {
  const marker = markerAt(node.data, offset)
  if (!marker) return []

  const range = document.createRange()
  range.setStart(node, marker.segmentStart)
  range.setEnd(node, marker.index)
  return clipToAncestors([...range.getClientRects()], node.parentElement)
}

/** Усі текстові ноди елемента в порядку документа. */
function textNodesOf(el: Element): Text[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) nodes.push(node as Text)
  return nodes
}

/** Позиція в склеєному тексті -> конкретна нода й офсет у ній. */
function locate(nodes: Text[], target: number): { node: Text, offset: number } | null {
  let seen = 0
  for (const node of nodes) {
    if (seen + node.data.length >= target) return { node, offset: target - seen }
    seen += node.data.length
  }
  return null
}

/**
 * Ключ із предка — для розмітки, яка розриває один переклад на кілька нод.
 * Так виглядає v-html: маркер лишається в останній ноді, а курсор стоїть у першій.
 *
 * Ключ приймається за двох умов разом: нода під курсором лежить усередині
 * діапазону маркера І текст цього діапазону дослівно збігається з перекладом.
 *
 * Друга умова обов'язкова. Між двома маркерами лежить будь-який сторонній
 * текст сторінки, тож без звірки наведення на сусідній неперекладений рядок
 * отримувало б чужий ключ.
 */
export function inheritedMarkerFor(node: Text): { key: string, range: Range, owner: Element } | null {
  if (!translate) return null
  let el = node.parentElement

  for (let depth = 0; el && depth < 4; depth++, el = el.parentElement) {
    const nodes = textNodesOf(el)
    const text = nodes.map(n => n.data).join('')
    if (!hasMarker(text)) continue

    let segmentStart = 0
    for (const match of markerMatches(text)) {
      const from = locate(nodes, segmentStart)
      const to = locate(nodes, match.index)
      const segment = text.slice(segmentStart, match.index)
      segmentStart = match.index + match.length

      if (!from || !to) continue
      if (squash(segment) !== squash(translate(match.key))) continue

      const range = document.createRange()
      range.setStart(from.node, from.offset)
      range.setEnd(to.node, to.offset)

      if (!range.intersectsNode(node)) continue

      return { key: match.key, range, owner: el }
    }
  }
  return null
}

function inheritedHit(node: Text, api: string): InspectHit | null {
  const found = inheritedMarkerFor(node)
  if (!found) return null

  return {
    key: found.key,
    source: 'inherited',
    api,
    label: `inherited from <${found.owner.tagName.toLowerCase()}>`,
    rects: clipToAncestors([...found.range.getClientRects()], node.parentElement),
  }
}

/** Фолбек для атрибутів: текстової ноди там немає, курсором не потрапиш. */
function attributeHit(x: number, y: number): InspectHit | null {
  let el = document.elementFromPoint(x, y) as HTMLElement | null
  for (let depth = 0; el && depth < 3; depth++, el = el.parentElement) {
    for (const attr of ATTRS) {
      const raw = attr === 'value' && 'value' in el
        ? (el as HTMLInputElement).value
        : el.getAttribute(attr)
      if (raw && hasMarker(raw)) {
        return {
          key: allKeys(raw)[0]!,
          source: 'attribute',
          api: 'elementFromPoint',
          label: `@${attr} attribute`,
          rects: clipToAncestors([...el.getClientRects()], el.parentElement),
        }
      }
    }
  }
  return null
}

/** Що саме перекладене лежить під точкою екрана. */
export function probe(x: number, y: number): InspectHit | null {
  const caret = caretHit(x, y)

  if (caret) {
    const key = keyAtOffset(caret.node.data, caret.offset)
    if (key) {
      const rects = segmentRects(caret.node, caret.offset)
      if (rects.length) {
        return { key, source: 'text', api: caret.api, label: 'text', rects }
      }
    }

    // Маркера в ноді немає. Так виглядає v-html: один переклад розпадається
    // на кілька текстових нод, а маркер лишається в останній.
    const inherited = inheritedHit(caret.node, caret.api)
    if (inherited) return inherited
  }

  return attributeHit(x, y)
}
