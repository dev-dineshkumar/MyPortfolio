import { useEffect, useRef } from 'react'
import { addFrameTask, clamp, finePointer, lerp, onRealResize, reduce, sStyle, view } from '../lib/runtime'

/**
 * Scroll-reactive depth layer that sits inside the fixed background.
 *  - a perspective grid floor that "travels" as you scroll
 *  - soft light pools that glide across the page as you move through the sections
 *  - thin data streams that stretch a little with scroll speed
 * Everything is transform / opacity only, driven from the shared rAF loop, and uses a smoothed
 * scroll value so it eases rather than snaps. With reduced motion it still follows scroll (that is the user own input) but the ambient drift and speed stretch stop.
 */

const STREAMS = [0.06, 0.27, 0.52, 0.71, 0.94]

export default function ScrollFX() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    const small = innerWidth < 760 || !finePointer
    const streams = [...el.querySelectorAll('.fx-stream')]
    const grid = el.querySelector('.fx-floor')
    const gridPlane = el.querySelector('.fx-plane')
    const gridTex = el.querySelector('.fx-tex')
    const pools = [...el.querySelectorAll('.fx-pool')]
    let sm = view.y // smoothed scroll
    let vel = 0
    let span = view.h + 360
    let docH = 1

    const measure = () => { span = view.h + 360; docH = Math.max(1, document.documentElement.scrollHeight - view.h) }
    measure()
    const offR = onRealResize(measure)
    window.addEventListener('load', measure)

    const paint = (t, still) => {
      const s = still ? view.y : sm
      const p = clamp(s / docH, 0, 1)
      const T = still || reduce ? 0 : t / 1000

      // data streams: slide with scroll, stretch with speed
      const stretch = 1 + Math.min(Math.abs(vel) * 0.02, 1.6)
      for (let i = 0; i < streams.length; i++) {
        const k = 0.18 + i * 0.07
        const py = (((i * 0.37 * span - s * k) % span) + span) % span - 200
        sStyle(streams[i], 'transform', `translate3d(0,${py.toFixed(1)}px,0) scaleY(${stretch.toFixed(2)})`)
      }

      // grid floor: tilts a little as you scroll; the texture slides one 72px tile at a time (transform only)
      if (grid) {
        sStyle(gridPlane, 'transform', `rotateX(${(66 + Math.sin(p * Math.PI * 2) * 4).toFixed(2)}deg) translateZ(0)`)
        sStyle(gridTex, 'transform', `translate3d(0,${((s * 0.35 + T * 6) % 72).toFixed(1)}px,0)`)
      }

      // light pools glide across the page, one sweep per pool
      for (let i = 0; i < pools.length; i++) {
        const dir = i % 2 ? -1 : 1
        const x = lerp(-18, 18, p) * dir
        const y = lerp(-14, 14, (p + i * 0.33) % 1)
        sStyle(pools[i], 'transform', `translate3d(${x.toFixed(2)}vw,${y.toFixed(2)}vh,0) scale(${(1 + 0.18 * Math.sin(p * 6 + i * 2)).toFixed(3)})`)
      }
    }

    paint(0, true)
    const off = addFrameTask((t) => {
      const target = view.y
      const prev = sm
      sm = lerp(sm, target, small ? 0.14 : 0.1)
      if (Math.abs(target - sm) < 0.05) sm = target
      vel = reduce ? 0 : lerp(vel, sm - prev, 0.2)
      paint(t, false)
    })
    return () => { off(); offR(); window.removeEventListener('load', measure) }
  }, [])

  const few = typeof window !== 'undefined' && (innerWidth < 760 || !finePointer)
  return (
    <div className="fx" ref={root} aria-hidden="true">
      <div className="fx-pool a" /><div className="fx-pool b" />
      <div className="fx-floor"><div className="fx-plane"><i className="fx-tex" /></div></div>
      <div className="fx-scene">
        {STREAMS.slice(0, few ? 3 : 5).map((x) => <i className="fx-stream" key={x} style={{ left: `${x * 100}%` }} />)}
      </div>
    </div>
  )
}
