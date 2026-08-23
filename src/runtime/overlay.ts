import type { Finding } from './audit'
import type { InspectHit } from './probe'

/**
 * Підсвітка рядка під курсором: рамка по його прямокутниках плюс мітка з ключем.
 *
 * Малюється звичайним DOM повз Vue-дерево застосунку — оверлей не має
 * жодного шансу вплинути на рендер сторінки, яку інспектує.
 */

const ACCENT = '#7c3aed'
const Z = 2147483646

export interface Overlay {
  show: (hit: InspectHit) => void
  hide: () => void
  /** Підсвітка аудиту — окремий шар, живе незалежно від рамки під курсором. */
  showAudit: (findings: Finding[]) => void
  hideAudit: () => void
  destroy: () => void
}

const AUDIT_COLORS: Record<Finding['kind'], { line: string, fill: string }> = {
  untranslated: { line: '#dc2626', fill: 'rgba(220,38,38,.14)' },
  foreign: { line: '#d97706', fill: 'rgba(217,119,6,.12)' },
}

function styleBox(el: HTMLElement, rect: DOMRect) {
  el.style.cssText = [
    'position:fixed',
    `left:${rect.left}px`, `top:${rect.top}px`,
    `width:${rect.width}px`, `height:${rect.height}px`,
    `outline:1.5px solid ${ACCENT}`,
    'outline-offset:1px',
    'border-radius:2px',
    'background:rgba(124,58,237,.10)',
    'pointer-events:none',
  ].join(';')
}

function styleLabel(el: HTMLElement) {
  el.style.cssText = [
    'position:fixed', 'pointer-events:none',
    'padding:3px 7px', 'border-radius:4px',
    `background:${ACCENT}`, 'color:#fff',
    'font:500 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
    'white-space:nowrap', 'box-shadow:0 2px 8px rgba(0,0,0,.25)',
    'max-width:min(420px, 90vw)', 'overflow:hidden', 'text-overflow:ellipsis',
  ].join(';')
}

export function createOverlay(): Overlay {
  const root = document.createElement('div')
  root.setAttribute('data-i18n-inspect', 'overlay')
  root.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${Z}`

  const label = document.createElement('div')
  styleLabel(label)
  root.appendChild(label)

  const boxes: HTMLElement[] = []

  // окремий контейнер: аудит перемальовується цілком, рамка під курсором — ні
  const auditLayer = document.createElement('div')
  root.appendChild(auditLayer)

  document.body.appendChild(root)

  function boxAt(index: number): HTMLElement {
    let box = boxes[index]
    if (!box) {
      box = document.createElement('div')
      boxes.push(box)
      root.appendChild(box)
    }
    return box
  }

  function hide() {
    label.style.display = 'none'
    for (const box of boxes) box.style.display = 'none'
  }

  function show(hit: InspectHit) {
    const rects = hit.rects.filter(r => r.width > 0 && r.height > 0)
    if (!rects.length) return hide()

    rects.forEach((rect, i) => {
      const box = boxAt(i)
      styleBox(box, rect)
      box.style.display = 'block'
    })
    for (let i = rects.length; i < boxes.length; i++) {
      boxes[i]!.style.display = 'none'
    }

    label.textContent = hit.source === 'text' ? hit.key : `${hit.key} · ${hit.label}`
    label.style.display = 'block'

    // мітка над першим прямокутником, а якщо зверху не влазить — під ним
    const first = rects[0]!
    const height = label.offsetHeight || 20
    const above = first.top - height - 4
    label.style.top = `${above > 4 ? above : first.bottom + 4}px`
    label.style.left = `${Math.max(4, Math.min(first.left, window.innerWidth - label.offsetWidth - 4))}px`
  }

  function showAudit(findings: Finding[]) {
    auditLayer.textContent = ''
    for (const finding of findings) {
      const colors = AUDIT_COLORS[finding.kind]
      for (const rect of finding.range.getClientRects()) {
        if (rect.width <= 0 || rect.height <= 0) continue
        const box = document.createElement('div')
        box.style.cssText = [
          'position:fixed',
          `left:${rect.left}px`, `top:${rect.top}px`,
          `width:${rect.width}px`, `height:${rect.height}px`,
          `outline:1px dashed ${colors.line}`,
          `background:${colors.fill}`,
          'border-radius:2px',
          'pointer-events:none',
        ].join(';')
        auditLayer.appendChild(box)
      }
    }
  }

  function hideAudit() {
    auditLayer.textContent = ''
  }

  hide()
  return { show, hide, showAudit, hideAudit, destroy: () => root.remove() }
}
