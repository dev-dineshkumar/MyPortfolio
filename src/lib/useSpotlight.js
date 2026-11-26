import { useEffect } from 'react'
import { addFrameTask, view } from './runtime'

/**
 * Pointer-follow spotlight: sets --mx / --my on the hovered element, coalesced to one write per frame.
 * The element rect is cached on enter so pointermove never forces a layout.
 */
export function useSpotlight(containerRef, selector) {
  useEffect(() => {
    const root = containerRef.current
    if (!root) return undefined
    const items = [...root.querySelectorAll(selector)]
    let el = null
    let x = 0
    let y = 0
    let dirty = false
    const offs = items.map((p) => {
      let L = 0
      let TD = 0
      const rect = () => { const r = p.getBoundingClientRect(); L = r.left; TD = r.top + view.y }
      const move = (e) => { el = p; x = Math.round(e.clientX - L); y = Math.round(e.clientY - (TD - view.y)); dirty = true }
      p.addEventListener('pointerenter', rect, { passive: true })
      p.addEventListener('pointermove', move, { passive: true })
      return () => { p.removeEventListener('pointerenter', rect); p.removeEventListener('pointermove', move) }
    })
    const off = addFrameTask(() => {
      if (!dirty) return
      dirty = false
      el.style.setProperty('--mx', x + 'px')
      el.style.setProperty('--my', y + 'px')
    })
    return () => { off(); offs.forEach((f) => f()) }
  }, [containerRef, selector])
}
