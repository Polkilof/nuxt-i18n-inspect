/**
 * Робота з вкладеними ключами локалі: 'search.placeholder'.
 *
 * Винесено окремо від серверних роутів, щоб покрити тестами без Nuxt:
 * тут єдине місце, де модуль може зіпсувати чужий файл.
 */

export function getAtPath(root: unknown, key: string): string | null {
  let node: unknown = root
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return null
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : null
}

export class WritePathError extends Error {}

/**
 * Записує значення за вкладеним ключем, створюючи проміжні об'єкти.
 *
 * Кидає, якщо шлях упирається в чуже: не можна перетворити гілку на рядок
 * (ключ 'form', коли form — об'єкт) чи полізти всередину рядка
 * (ключ 'form.yes.short', коли form.yes — рядок).
 */
export function setAtPath(root: Record<string, unknown>, key: string, value: string): void {
  const parts = key.split('.')
  const last = parts.pop()!
  let node: Record<string, unknown> = root

  for (const part of parts) {
    const next = node[part]
    if (next === undefined) {
      node[part] = {}
    }
    else if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      throw new WritePathError(`Cannot write “${key}”: “${part}” already holds a value, not a branch.`)
    }
    node = node[part] as Record<string, unknown>
  }

  const current = node[last]
  if (current !== undefined && typeof current !== 'string') {
    throw new WritePathError(`Cannot write “${key}”: it already holds nested keys.`)
  }
  node[last] = value
}

/** Відступ вихідного файлу, щоб не перевзувати чужий стиль у git-діфі. */
export function detectIndent(source: string): string | number {
  const match = source.match(/\n([ \t]+)"/)
  if (!match) return 2
  const indent = match[1]!
  return indent.includes('\t') ? '\t' : indent.length
}
