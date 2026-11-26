import { useEffect, useRef } from 'react'
import { finePointer, onRealResize, reduce } from '../lib/runtime'

/** Golden spark cursor: fading trail, jagged lightning bolts, spark streaks and a soft glow (mouse only). */
export default function SparkCursor() {
  const ref = useRef(null)

  useEffect(() => {
    if (!finePointer || reduce) return undefined
    const cv = ref.current
    const cx = cv.getContext('2d')
    const NP = 160
    const NB = 24
    const TRAIL = 14
    const WHITE = '255,255,255'
    const GOLD = '255,196,64'
    const DEEP = '170,110,0'
    const rnd = Math.random
    const parts = Array.from({ length: NP }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, hot: false }))
    const bolts = Array.from({ length: NB }, () => ({ pts: [], life: 0, max: 1, width: 1, bright: false }))
    const trail = []
    let pi = 0
    let bi = 0
    let mx = -9999
    let my = -9999
    let lx = -9999
    let ly = -9999
    let energy = 0
    let glow = 0
    let running = false
    let last = 0
    let dpr = 1
    let raf = 0

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2)
      cv.width = Math.round(innerWidth * dpr)
      cv.height = Math.round(innerHeight * dpr)
    }
    size()
    const offResize = onRealResize(size)

    const zigzag = (x, y, ang, len, out) => {
      out.length = 0
      const n = 4 + Math.floor(rnd() * 4)
      let px = x
      let py = y
      out.push(px, py)
      for (let i = 1; i <= n; i++) {
        const a = ang + (rnd() - 0.5) * 1.1
        px += Math.cos(a) * (len / n)
        py += Math.sin(a) * (len / n)
        out.push(px, py)
      }
    }
    const spark = (x, y, dx, dy, e) => {
      const p = parts[pi]
      pi = (pi + 1) % NP
      const a = Math.atan2(dy, dx) + Math.PI + (rnd() - 0.5) * 2.6
      const v = 0.05 + rnd() * 0.25 * (0.5 + e)
      p.x = x; p.y = y
      p.vx = Math.cos(a) * v + dx * 0.02
      p.vy = Math.sin(a) * v + dy * 0.02
      p.max = p.life = 250 + rnd() * 400
      p.size = 0.6 + rnd() * 1.6
      p.hot = rnd() < 0.15
    }
    const bolt = (x, y, e, big) => {
      const b = bolts[bi]
      bi = (bi + 1) % NB
      zigzag(x, y, rnd() * 6.2832, (10 + rnd() * 28) * (big ? 1.8 : 1) * (0.6 + e * 0.6), b.pts)
      b.max = b.life = big ? 160 : 70 + rnd() * 80
      b.width = big ? 1.6 : 0.6 + rnd() * 0.8
      b.bright = big
    }
    const wake = (now) => {
      if (!running) { running = true; last = now; raf = requestAnimationFrame(frame) }
    }
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      mx = e.clientX; my = e.clientY
      if (lx < -999) { lx = mx; ly = my }
      const dx = mx - lx
      const dy = my - ly
      const d = Math.hypot(dx, dy)
      energy = Math.min(1.5, energy * 0.6 + d / 40)
      const now = performance.now()
      trail.push({ x: mx, y: my, t: now })
      if (trail.length > TRAIL) trail.shift()
      const n = Math.min(8, Math.floor(d / 6) + (rnd() < 0.4 ? 1 : 0))
      for (let i = 0; i < n; i++) { const f = rnd(); spark(lx + dx * f, ly + dy * f, dx, dy, energy) }
      if (rnd() < 0.15 + energy * 0.4) bolt(mx, my, energy, false)
      if (d > 45 && rnd() < 0.25) bolt(mx, my, energy, true)
      glow = Math.min(1, glow + d / 120)
      lx = mx; ly = my
      wake(now)
    }
    // bigger burst, used when the contact form is sent
    window.sparkBurst = (x, y, n = 24) => {
      for (let i = 0; i < n; i++) {
        const p = parts[pi]
        const a = rnd() * 6.2832
        const v = 0.1 + rnd() * 0.4
        pi = (pi + 1) % NP
        p.x = x; p.y = y
        p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v
        p.max = p.life = 300 + rnd() * 500
        p.size = 0.8 + rnd() * 1.8
        p.hot = rnd() < 0.3
      }
      for (let i = 0; i < 6; i++) bolt(x, y, 1.2, true)
      mx = x; my = y; glow = 1
      wake(performance.now())
    }

    function frame(now) {
      const dt = Math.min(48, now - last)
      last = now
      cx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cx.clearRect(0, 0, innerWidth, innerHeight)
      cx.globalCompositeOperation = 'lighter'
      let live = false

      glow *= Math.pow(0.992, dt)
      if (glow > 0.02) {
        live = true
        const g = cx.createRadialGradient(mx, my, 0, mx, my, 70)
        g.addColorStop(0, `rgba(255,190,40,${0.14 * glow})`)
        g.addColorStop(1, 'rgba(255,190,40,0)')
        cx.fillStyle = g
        cx.fillRect(mx - 70, my - 70, 140, 140)
      }
      while (trail.length && now - trail[0].t > 220) trail.shift()
      if (trail.length > 1) {
        live = true
        cx.lineCap = 'round'
        for (let i = 1; i < trail.length; i++) {
          const r = 1 - (now - trail[i].t) / 220
          cx.strokeStyle = `rgba(${DEEP},${r * 0.6})`
          cx.lineWidth = 3 * r
          cx.beginPath()
          cx.moveTo(trail[i - 1].x, trail[i - 1].y)
          cx.lineTo(trail[i].x, trail[i].y)
          cx.stroke()
          cx.strokeStyle = `rgba(${GOLD},${r * 0.5})`
          cx.lineWidth = 0.8 * r
          cx.stroke()
        }
      }
      for (const b of bolts) {
        if (b.life <= 0) continue
        b.life -= dt
        live = true
        const r = Math.max(0, b.life / b.max) * (rnd() < 0.25 ? 0.4 : 1)
        cx.beginPath()
        cx.moveTo(b.pts[0], b.pts[1])
        for (let i = 2; i < b.pts.length; i += 2) cx.lineTo(b.pts[i], b.pts[i + 1])
        cx.shadowBlur = b.bright ? 14 : 8
        cx.shadowColor = 'rgba(255,190,40,0.35)'
        cx.strokeStyle = `rgba(${GOLD},${r * 0.85})`
        cx.lineWidth = b.width * 2
        cx.stroke()
        cx.shadowBlur = 0
        cx.strokeStyle = `rgba(${WHITE},${r * (b.bright ? 0.8 : 0.45)})`
        cx.lineWidth = b.width * 0.5
        cx.stroke()
      }
      const damp = Math.pow(0.985, dt / 16.7)
      for (const p of parts) {
        if (p.life <= 0) continue
        p.life -= dt
        live = true
        const r = Math.max(0, p.life / p.max)
        const ox = p.x
        const oy = p.y
        p.x += p.vx * dt; p.y += p.vy * dt
        p.vx *= damp; p.vy *= damp
        cx.strokeStyle = `rgba(${p.hot ? WHITE : GOLD},${r * 0.9})`
        cx.lineWidth = p.size * r
        cx.beginPath()
        cx.moveTo(ox - p.vx * 18, oy - p.vy * 18)
        cx.lineTo(p.x, p.y)
        cx.stroke()
      }
      energy *= Math.pow(0.95, dt / 16)
      if (live) raf = requestAnimationFrame(frame)
      else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight) }
    }

    addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      offResize()
      delete window.sparkBurst
    }
  }, [])

  if (!finePointer || reduce) return null
  return <canvas className="spark-cursor" ref={ref} aria-hidden="true" />
}
