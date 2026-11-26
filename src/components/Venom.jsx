import { useEffect, useRef } from 'react'
import { addFrameTask, lerp, view } from '../lib/runtime'

/** Liquid-chrome button: a canvas-drawn blob outline that wobbles, reaches toward the pointer and shines. */
export default function Venom({ label, width = 220, height = 60, className = '', style, ...rest }) {
  const btn = useRef(null)
  const cv = useRef(null)

  useEffect(() => {
    const el = btn.current
    const c = cv.current
    const x = c.getContext('2d')
    const DPR = Math.min(devicePixelRatio || 1, 2)
    const W = el.offsetWidth || width
    const H = el.offsetHeight || height
    const PW = W + 120
    const PH = H + 120
    c.width = PW * DPR
    c.height = PH * DPR
    c.style.width = PW + 'px'
    c.style.height = PH + 'px'
    x.scale(DPR, DPR)

    let hov = 0
    let hovT = 0
    let press = 0
    let vis = true
    const lm = { x: PW / 2, y: PH / 2 }
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting })
    io.observe(el)
    const enter = () => { hovT = 1 }
    const leave = () => { hovT = 0 }
    const down = () => { press = 1 }
    const move = (e) => {
      const r = c.getBoundingClientRect()
      lm.x = e.clientX - r.left
      lm.y = e.clientY - r.top
    }
    el.addEventListener('pointerenter', enter, { passive: true })
    el.addEventListener('pointerleave', leave, { passive: true })
    el.addEventListener('pointerdown', down, { passive: true })
    el.addEventListener('pointermove', move, { passive: true })

    const N = 140
    const cx = PW / 2
    const cy = PH / 2
    const rr = H / 2
    const hw = W / 2 - rr

    const outline = (t) => {
      const pts = []
      const per = 2 * Math.PI * rr + 4 * hw
      for (let i = 0; i < N; i++) {
        let s = (i / N) * per
        let px, py, nx, ny
        if (s < 2 * hw) { px = cx - hw + s; py = cy - rr; nx = 0; ny = -1 }
        else if ((s -= 2 * hw) < Math.PI * rr) { const a = -Math.PI / 2 + s / rr; px = cx + hw + Math.cos(a) * rr; py = cy + Math.sin(a) * rr; nx = Math.cos(a); ny = Math.sin(a) }
        else if ((s -= Math.PI * rr) < 2 * hw) { px = cx + hw - s; py = cy + rr; nx = 0; ny = 1 }
        else { s -= 2 * hw; const a = Math.PI / 2 + s / rr; px = cx - hw + Math.cos(a) * rr; py = cy + Math.sin(a) * rr; nx = Math.cos(a); ny = Math.sin(a) }
        const wob = Math.sin(i * 0.31 + t * 2.1) * 1.2 + Math.sin(i * 0.13 - t * 1.4) * 1.4 + Math.sin(i * 0.7 + t * 3.3) * 0.6 * hov
        const dx = lm.x - px
        const dy = lm.y - py
        const d = Math.hypot(dx, dy)
        const pull = hov * Math.max(0, (dx * nx + dy * ny) / (d || 1)) * 22 * Math.exp((-d * d) / 2600)
        const tend = hov * Math.pow(Math.max(0, Math.sin(i * 0.9 + t * 1.7)), 18) * 14
        const off = wob * (1 + hov * 1.6) + pull + tend + press * 6
        pts.push([px + nx * off, py + ny * off])
      }
      return pts
    }

    const draw = (ms) => {
      if (!vis) return
      const t = ms / 1000
      hov = lerp(hov, hovT, 0.08)
      press = lerp(press, 0, 0.1)
      x.clearRect(0, 0, PW, PH)
      const pts = outline(t)
      x.beginPath()
      for (let i = 0; i < N; i++) {
        const a = pts[i]
        const b = pts[(i + 1) % N]
        const mx = (a[0] + b[0]) / 2
        const my = (a[1] + b[1]) / 2
        if (i) x.quadraticCurveTo(a[0], a[1], mx, my)
        else x.moveTo(mx, my)
      }
      x.closePath()
      x.save()
      x.shadowColor = `rgba(255,184,46,${0.25 + hov * 0.55})`
      x.shadowBlur = 18 + hov * 22
      const g = x.createLinearGradient(0, cy - rr, 0, cy + rr)
      g.addColorStop(0, '#5a5d68'); g.addColorStop(0.18, '#1c1e26'); g.addColorStop(0.55, '#0a0c12'); g.addColorStop(0.82, '#262a34'); g.addColorStop(1, '#464a56')
      x.fillStyle = g
      x.fill()
      x.restore()
      x.save()
      x.clip()
      const hx = cx - hw - rr + ((t * 0.35) % 1.6) * (W + 2 * rr) + (hov ? (lm.x - cx) * 0.3 : 0)
      const sg = x.createLinearGradient(hx - 60, 0, hx + 60, 0)
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,.22)'); sg.addColorStop(1, 'rgba(255,255,255,0)')
      x.fillStyle = sg
      x.fillRect(0, 0, PW, PH)
      x.save()
      x.translate(cx, cy - rr * 0.62)
      x.scale((W / 2 - 10) / (rr * 0.5), 1)
      const tg = x.createRadialGradient(0, 0, 0, 0, 0, rr * 0.5)
      tg.addColorStop(0, 'rgba(255,255,255,.26)'); tg.addColorStop(1, 'rgba(255,255,255,0)')
      x.fillStyle = tg
      x.beginPath(); x.arc(0, 0, rr * 0.5, 0, Math.PI * 2); x.fill()
      x.restore()
      const rg = x.createRadialGradient(lm.x, lm.y, 0, lm.x, lm.y, 90)
      rg.addColorStop(0, `rgba(255,190,50,${0.35 * hov})`); rg.addColorStop(1, 'rgba(255,190,50,0)')
      x.fillStyle = rg
      x.fillRect(0, 0, PW, PH)
      x.restore()
      x.lineWidth = 1
      x.strokeStyle = `rgba(255,${(200 - hov * 30) | 0},${(120 - hov * 60) | 0},${0.25 + hov * 0.5})`
      x.stroke()
      x.font = '800 15px Geist, system-ui, sans-serif'
      x.textAlign = 'center'
      x.textBaseline = 'middle'
      x.fillStyle = '#fff'
      x.shadowColor = 'rgba(0,0,0,.6)'
      x.shadowBlur = 6
      x.letterSpacing = '1.2px'
      x.fillText(label.toUpperCase(), cx + (hov ? (lm.x - cx) * 0.03 : 0), cy + 1 + (hov ? (lm.y - cy) * 0.05 : 0))
      x.shadowBlur = 0
    }
    const off = addFrameTask(draw)
    return () => {
      off()
      io.disconnect()
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
    }
  }, [label, width, height])

  void view
  return (
    <button ref={btn} className={`venom ${className}`} style={{ width, height, ...style }} {...rest}>
      <span className="sr">{label}</span>
      <canvas ref={cv} aria-hidden="true" />
    </button>
  )
}
