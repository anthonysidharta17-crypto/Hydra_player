import { useEffect } from 'react'
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]'
const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' }
const center = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
function nextFocus(direction) {
  const items = [...document.querySelectorAll(FOCUSABLE)].filter(visible), current = document.activeElement
  if (!current || !items.includes(current)) return items[0] || null
  const from = center(current.getBoundingClientRect()); let best = null, bestScore = Infinity
  for (const el of items) {
    if (el === current) continue
    const to = center(el.getBoundingClientRect()), dx = to.x - from.x, dy = to.y - from.y
    const along = direction === 'ArrowRight' ? dx : direction === 'ArrowLeft' ? -dx : direction === 'ArrowDown' ? dy : -dy
    const across = direction === 'ArrowRight' || direction === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx)
    if (along < 2) continue
    const score = along + across * 2
    if (score < bestScore) { bestScore = score; best = el }
  }
  return best
}
export function useDpad() {
  useEffect(() => {
    const onKey = event => {
      if (!event.key.startsWith('Arrow') || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      const typing = target instanceof HTMLInputElement && !['checkbox', 'radio', 'button'].includes(target.type)
      if (typing && ['ArrowLeft', 'ArrowRight'].includes(event.key)) return
      if (target instanceof HTMLVideoElement) return
      const next = nextFocus(event.key)
      if (next) { event.preventDefault(); next.focus({ preventScroll: false }); next.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
