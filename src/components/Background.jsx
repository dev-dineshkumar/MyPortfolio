import { useEffect, useRef } from 'react'
import DevBackground from './DevBackground'
import ScrollFX from './ScrollFX'
import FlowBackdrop from './FlowBackdrop'
import { addFrameTask, clamp, mouse, onRealResize, reduce, view } from '../lib/runtime'

/** Ambient orbs + a field of golden bokeh particles that fly from the back toward the viewer. */
export default function Background() {
  const canvas = useRef(null)

  useEffect(() => {
    const cv = canvas.current
    const bx = cv.getContext('2d')
    let bokeh = []
    let W = 1
    let H = 1
    let lastT = 0
    let lastSY = 0

    const spawn = (p, far) => {
      p.X = Math.random() * 2 - 1
      p.Y = Math.random() * 2 - 1
      p.Z = far ? 0.92 + Math.random() * 0.2 : 0.08 + Math.random() * 0.95
    }
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      W = innerWidth
      H = innerHeight
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      bx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const N = Math.round(clamp((W * H) / 7500, 70, 210))
      bokeh = Array.from({ length: N }, () => {
        const k = Math.random()
        const tier = k < 0.62 ? 0 : k < 0.9 ? 1 : 2
        const p = {
          tier,
          r: tier === 0 ? 0.9 + Math.random() * 1.1 : tier === 1 ? 2.2 + Math.random() * 2.6 : 7 + Math.random() * 7,
          sp: 0.0006 + Math.random() * 0.0012,
          tw: Math.random() * 6.28,
          ts: 0.01 + Math.random() * 0.02,
          a: tier === 2 ? 0.16 + Math.random() * 0.16 : 0.6 + Math.random() * 0.4,
        }
        spawn(p, false)
        return p
      })
    }

    const draw = (now) => {
      const dt = Math.min((now - lastT) / 16.7 || 1, 3)
      lastT = now || lastT
      const dsy = Math.abs(view.y - lastSY)
      lastSY = view.y
      const cx = W / 2 + mouse.nx * -26
      const cy = H / 2 + mouse.ny * -18
      const F = Math.max(W, H) * 0.52
      bx.clearRect(0, 0, W, H)
      bx.globalCompositeOperation = 'lighter'
      for (const p of bokeh) {
        p.Z -= p.sp * dt + dsy * 0.00035
        p.tw += p.ts
        if (p.Z < 0.07) spawn(p, true)
        const sc = 1 / p.Z
        const x = cx + p.X * F * sc * 0.55
        const y = cy + p.Y * F * sc * 0.55
        if (x < -80 || x > W + 80 || y < -80 || y > H + 80) { spawn(p, true); continue }
        const fade = clamp((1.05 - p.Z) / 0.25, 0, 1) * clamp((p.Z - 0.07) / 0.12, 0, 1)
        const a = p.a * fade * (0.75 + 0.25 * Math.sin(p.tw))
        if (a < 0.005) continue
        const R = Math.min(p.r * Math.pow(sc, 0.95), p.tier === 2 ? 90 : 42)
        if (p.tier === 2) {
          const g = bx.createRadialGradient(x, y, R * 0.15, x, y, R)
          g.addColorStop(0, `rgba(255,190,50,${a * 0.5})`)
          g.addColorStop(0.82, `rgba(255,190,50,${a * 0.8})`)
          g.addColorStop(1, 'rgba(255,190,50,0)')
          bx.fillStyle = g
          bx.beginPath()
          bx.arc(x, y, R, 0, 6.2832)
          bx.fill()
        } else {
          const RR = R * (p.tier ? 3.2 : 2.8)
          const g = bx.createRadialGradient(x, y, 0, x, y, RR)
          g.addColorStop(0, `rgba(255,${p.tier ? 225 : 235},${p.tier ? 150 : 190},${a})`)
          g.addColorStop(0.22, `rgba(255,184,46,${a * 0.75})`)
          g.addColorStop(1, 'rgba(255,170,30,0)')
          bx.fillStyle = g
          bx.beginPath()
          bx.arc(x, y, RR, 0, 6.2832)
          bx.fill()
        }
      }
    }

    size()
    const offResize = onRealResize(size)
    let offTask = () => {}
    if (reduce) draw(performance.now()) // one static frame, no loop
    else offTask = addFrameTask(draw)
    return () => { offResize(); offTask() }
  }, [])

  return (
    <>
    <FlowBackdrop />
    <div className="bg-layer" aria-hidden="true">
      <div className="ambient">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
      </div>
      <div className="light-drift" />
      <ScrollFX />
      <canvas ref={canvas} id="bokeh" />
      <DevBackground />
    </div>
    </>
  )
}
