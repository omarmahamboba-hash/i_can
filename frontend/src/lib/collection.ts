export function moved<T>(list: T[], index: number, direction: -1 | 1): T[] | null {
  const target = index + direction
  if (target < 0 || target >= list.length) return null
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}
