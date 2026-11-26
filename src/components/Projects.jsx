import { useEffect, useMemo, useRef, useState } from 'react'
import { projectCards } from '../data/portfolio'
import { makeThumb } from '../lib/art'
import { addFrameTask, onMeasure, onRealResize, sStyle, view } from '../lib/runtime'

const FOV = 42
const CAM_Z = 9
const CARD_W = 3.4
const SPACING = 0.13
const RAIL_SPAN = 1.7
const FLY_SPAN = 0.35
const HOLD = 0.12
const AR = 16 / 9
// camera path control points [x, y, z] — desktop and mobile
const RAIL = [[0, 3, -60], [-10, 2, -34], [-12, 0.5, -14], [-7, -0.4, -1], [0, -0.8, 3.2], [7, -0.4, -1], [12, 0.6, -12], [9, 1.6, -26], [2, 2.2, -34]]
const RAIL_M = [[0, 3, -50], [-4, 1.5, -26], [-3.5, 0, -8], [0, -0.6, 2.5], [3.5, 0, -8], [4, 1.5, -24], [1, 2.4, -32]]

const sat = (x) => Math.max(0, Math.min(1, x))
const ease = (e) => (e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2)

/** Centripetal Catmull-Rom spline through control points. */
function splinePoint(P, t) {
  const L = P.length
  const p = (L - 1) * t
  let i = Math.floor(p)
  let w = p - i
  if (w === 0 && i === L - 1) { i = L - 2; w = 1 }
  const p0 = i === 0 ? P[0].map((v, k) => 2 * v - P[1][k]) : P[i - 1]
  const p1 = P[i]
  const p2 = P[i + 1]
  const p3 = i + 2 < L ? P[i + 2] : P[L - 1].map((v, k) => 2 * v - P[L - 2][k])
  const dist = (a, b) => Math.pow(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), 0.5)
  let d0 = dist(p0, p1)
  let d1 = dist(p1, p2)
  let d2 = dist(p2, p3)
  if (d1 < 1e-4) d1 = 1
  if (d0 < 1e-4) d0 = d1
  if (d2 < 1e-4) d2 = d1
  return p1.map((_, k) => {
    const x0 = p0[k], x1 = p1[k], x2 = p2[k], x3 = p3[k]
    const t1 = ((x1 - x0) / d0 - (x2 - x0) / (d0 + d1) + (x2 - x1) / d1) * d1
    const t2 = ((x2 - x1) / d1 - (x3 - x1) / (d1 + d2) + (x3 - x2) / d2) * d1
    return x1 + t1 * w + (-3 * x1 + 3 * x2 - 2 * t1 - t2) * w * w + (2 * x1 - 2 * x2 + t1 + t2) * w * w * w
  })
}

// minimal quaternion toolkit
const qFromBasis = (X, Y, Z) => {
  const m00 = X[0], m01 = Y[0], m02 = Z[0], m10 = X[1], m11 = Y[1], m12 = Z[1], m20 = X[2], m21 = Y[2], m22 = Z[2]
  const tr = m00 + m11 + m22
  let x, y, z, w
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; w = s / 4; x = (m21 - m12) / s; y = (m02 - m20) / s; z = (m10 - m01) / s }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; w = (m21 - m12) / s; x = s / 4; y = (m01 + m10) / s; z = (m02 + m20) / s }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; w = (m02 - m20) / s; x = (m01 + m10) / s; y = s / 4; z = (m12 + m21) / s }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = s / 4 }
  return [x, y, z, w]
}
// slerp from identity to q by t
const qSlerpI = (q, t) => {
  let [x, y, z, w] = q
  if (w < 0) { x = -x; y = -y; z = -z; w = -w }
  const th = Math.acos(Math.min(1, w))
  const s = Math.sin(th)
  if (s < 1e-5) return [x, y, z, w]
  const a = Math.sin((1 - t) * th) / s
  const b = Math.sin(t * th) / s
  return [x * a, y * a, z * a, w * a + b]
}
const qMul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
]
const qCols = (q) => {
  const [x, y, z, w] = q
  const x2 = x + x, y2 = y + y, z2 = z + z
  return [
    [1 - (y * y2 + z * z2), x * y2 + w * z2, x * z2 - w * y2],
    [x * y2 - w * z2, 1 - (x * x2 + z * z2), y * z2 + w * x2],
    [x * z2 + w * y2, y * z2 - w * x2, 1 - (x * x2 + y * y2)],
  ]
}

// phones, portrait or landscape: the cards flow in the page. Anything bigger gets the pinned 3D rail.
const FLOW_QUERY = '(max-width: 767px), (max-width: 1100px) and (max-height: 540px)'
const noop = () => {} // a touch listener lets iOS Safari apply :active press feedback
// phone entrance: how much of a card must be on screen to start it, and the gap between cards that arrive together (ms)
const SHOW_AT = 0.22
const STAGGER = 130
const MAX_DELAY = 390

function useFlow() {
  const [flow, setFlow] = useState(() => matchMedia(FLOW_QUERY).matches)
  useEffect(() => {
    const q = matchMedia(FLOW_QUERY)
    const on = () => setFlow(q.matches)
    on()
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  return flow
}

/**
 * Two presentations of the same cards:
 *  - tablets and desktops: a pinned 3D scene — the cards ride a curved rail past the camera as you scroll,
 *    then fly out and settle into a grid.
 *  - phones (FLOW_QUERY): one screen cannot hold nine readable cards under a heading, so the cards flow down the page
 *    at full size and each one fades and slides up as it scrolls into view.
 */
export default function Projects() {
  const flow = useFlow()
  const sec = useRef(null)
  const scene = useRef(null)
  const world = useRef(null)
  const head = useRef(null)
  const tip = useRef(null)
  const state = useRef(projectCards.map(() => ({ hover: 0, hv: 0, kv: null })))
  const thumbs = useMemo(() => projectCards.map((p) => makeThumb(p.kind, p.hue)), [])

  // phones: each card plays a short fade / slide-up / scale once it is properly on screen (the motion is in site.css)
  useEffect(() => {
    if (!flow) return
    const els = [...world.current.children]
    scene.current.style.perspective = ''
    if (!window.IntersectionObserver) { els.forEach((el) => el.classList.add('in')); return }
    let nextStart = 0 // earliest time the next card may start, so cards that arrive together play one after another
    const io = new IntersectionObserver((entries) => {
      const now = performance.now()
      entries
        .filter((e) => e.intersectionRatio >= SHOW_AT && !e.target.classList.contains('in'))
        .sort((a, b) => els.indexOf(a.target) - els.indexOf(b.target))
        .forEach((e) => {
          const delay = Math.min(MAX_DELAY, Math.max(0, nextStart - now)) // capped, so a fast swipe never queues up a lag
          nextStart = now + delay + STAGGER
          e.target.style.setProperty('--d', `${Math.round(delay)}ms`)
          e.target.classList.add('in')
        })
      // re-arm only once a card is wholly below the screen again: it replays on the next scroll down, never while visible
      entries
        .filter((e) => !e.isIntersecting && e.boundingClientRect.top >= (e.rootBounds?.bottom ?? innerHeight))
        .forEach((e) => { e.target.style.setProperty('--d', '0ms'); e.target.classList.remove('in') })
    }, { threshold: [0, SHOW_AT] })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [flow])

  // tablets and desktops: the pinned 3D rail
  useEffect(() => {
    if (flow) return
    const N = projectCards.length
    const DX = RAIL_SPAN + FLY_SPAN + (N - 1) * SPACING + HOLD
    const els = [...world.current.children]
    state.current.forEach((c) => { c.kv = null; c.hover = 0 })
    let K = 100
    let cells = []
    let cellH = 1
    let KK = 1 // card text scale, eased in as a card shrinks into the grid
    let pts = []
    let tans = []
    let pTop = 0
    let pH = 0
    const I = CARD_W / AR // rail-state scale

    function buildRail() {
      const R = innerWidth <= 768 ? RAIL_M : RAIL
      const S = 1200
      const raw = []
      const cum = [0]
      for (let i = 0; i <= S; i++) raw.push(splinePoint(R, i / S))
      for (let i = 1; i <= S; i++) cum[i] = cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1], raw[i][2] - raw[i - 1][2])
      const tot = cum[S]
      pts = []
      tans = []
      let j = 0
      for (let i = 0; i <= 400; i++) {
        const target = (tot * i) / 400
        while (j < S - 1 && cum[j + 1] < target) j++
        const f = (target - cum[j]) / (cum[j + 1] - cum[j] || 1)
        pts.push(raw[j].map((v, k) => v + (raw[j + 1][k] - v) * f))
      }
      for (let i = 0; i <= 400; i++) {
        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(400, i + 1)]
        const v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
        const l = Math.hypot(...v) || 1
        tans.push([v[0] / l, v[1] / l, v[2] / l])
      }
    }
    function railAt(u) {
      const r = sat(u) * 400
      const i = Math.min(Math.floor(r), 399)
      const f = r - i
      const A = pts[i], B = pts[i + 1], T = tans[i], U = tans[i + 1]
      const t = [T[0] + (U[0] - T[0]) * f, T[1] + (U[1] - T[1]) * f, T[2] + (U[2] - T[2]) * f]
      const l = Math.hypot(...t) || 1
      return { p: [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f], t: [t[0] / l, t[1] / l, t[2] / l] }
    }

    function layout() {
      const sc = scene.current
      const vw = sc.clientWidth || innerWidth
      const vh = sc.clientHeight || innerHeight
      const asp = vw / vh
      const d = vh / 2 / Math.tan(((FOV / 2) * Math.PI) / 180)
      K = d / CAM_Z
      sc.style.perspective = d + 'px'
      sc.style.perspectiveOrigin = '50% 50%'
      const W0 = CARD_W * K
      const H0 = W0 / AR
      els.forEach((el) => {
        el.style.width = W0 + 'px'
        el.style.height = H0 + 'px'
        el.style.margin = `${-H0 / 2}px 0 0 ${-W0 / 2}px`
        el.style.setProperty('--r', 0.07 * H0 + 'px')
      })
      // final grid, in world units
      const a = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180)
      const s = a * asp
      // the grid starts just below the heading block (measured, so the button never overlaps the cards)
      const hd = head.current
      const headPx = hd ? hd.offsetTop + hd.offsetHeight + 14 : vh * 0.36
      const u = Math.min((a * headPx) / vh, a * 0.56)
      const dd = a - u - a * 0.03
      const f = Math.min(s, a) * 0.025
      // card width that fits `c` columns in the free area (limited by the screen width or by the height left under the heading)
      const fit = (c) => Math.min((s * 0.92 - f * (c - 1)) / c, ((dd - f * (Math.ceil(N / c) - 1)) / Math.ceil(N / c)) * AR)
      // portrait tablets: two columns, or three when that gives the bigger cards
      const cols = asp < 0.8 ? (fit(3) > fit(2) * 1.08 ? 3 : 2) : 3
      const rows = Math.ceil(N / cols)
      let m = fit(cols)
      m = Math.max(m, 0.5)
      const h = m / AR
      const tw = cols * m + (cols - 1) * f
      const th = rows * h + (rows - 1) * f
      const v = a / 2 - u - Math.min((dd - th) / 2, a * 0.012) // hug the heading; spare height goes below the grid
      cellH = h
      const orphan = cols === 2 && N % 2 === 1 // a lone last card sits centred
      // Card text is styled for a 16px title. --k converts that so a settled card shows a title sized from its own
      // on-screen width (11–17px); small cards also drop the description, and tiny ones the chip and icon.
      const cardPx = m * K
      const title = cardPx < 195 ? Math.max(11, cardPx * 0.07) : Math.max(12, Math.min(17, cardPx * 0.062))
      KK = Math.max(0.6, Math.min(3.2, title / 16 / (m / CARD_W)))
      world.current.dataset.size = cardPx < 135 ? 'xs' : cardPx < 195 ? 's' : 'm'
      state.current.forEach((c) => { c.kv = null })
      cells = els.map((_, i) => {
        const n = i % cols
        const r = Math.floor(i / cols)
        const solo = orphan && i === N - 1
        return {
          x: solo ? 0 : -tw / 2 + m / 2 + n * (m + f),
          y: v - h / 2 - r * (h + f),
          side: solo ? 0 : cols > 1 && n === 0 ? -1 : +(cols > 1 && n === cols - 1),
          vert: r === 0 ? 1 : r === rows - 1 ? -1 : 0,
        }
      })
      buildRail()
    }
    const measureSec = () => { pTop = sec.current.getBoundingClientRect().top + view.y; pH = sec.current.offsetHeight }
    const relayout = () => { layout(); measureSec() }
    relayout()
    let alive = true
    document.fonts?.ready.then(() => alive && relayout()) // the heading height depends on the web font
    const offA = onRealResize(relayout)
    const offB = onMeasure(measureSec)
    addEventListener('load', relayout)

    const up = [0, 1, 0]
    let D = 0
    let last = performance.now()
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016
      last = now
      const rTop = pTop - view.y
      const run = pH - view.h
      const E = run > 0 ? sat(-rTop / run) : 0
      D += (E - D) * (1 - Math.exp(-7 * dt))
      if (Math.abs(E - D) < 1e-5) D = E
      if (!(rTop + pH > 0 && rTop < view.h)) return
      els.forEach((el, i) => {
        const c = state.current[i]
        const rr = sat(D) * DX - i * SPACING
        const rail = sat(rr / RAIL_SPAN)
        const fly = sat((rr - RAIL_SPAN) / FLY_SPAN)
        const op = rr <= 0 ? 0 : Math.min(1, rr / 0.12)
        const g = railAt(rail)
        // face perpendicular to the rail tangent in the ground plane, always toward +z
        let ax = g.t[0]
        let az = g.t[2]
        let l = Math.hypot(ax, az)
        if (l * l < 1e-4) { ax = 1; az = 0; l = 1 }
        ax /= l; az /= l
        let Wx = -az
        let Wz = ax
        if (Wz < 0) { Wx = -Wx; Wz = -Wz }
        const wl = Math.hypot(Wx, Wz) || 1
        Wx /= wl; Wz /= wl
        const Wv = [Wx, 0, Wz]
        const Xv = [up[1] * Wv[2] - up[2] * Wv[1], up[2] * Wv[0] - up[0] * Wv[2], up[0] * Wv[1] - up[1] * Wv[0]]
        const xl = Math.hypot(...Xv) || 1
        Xv[0] /= xl; Xv[1] /= xl; Xv[2] /= xl
        let q = qFromBasis(Xv, up, Wv)
        let pos = g.p
        let sc = I
        if (fly > 0) {
          const cell = cells[i]
          const t = ease(fly)
          const n = 1 - t
          const pe = railAt(1).p
          const de = [cell.x, cell.y, 0]
          const fe = [cell.x + cell.side * (cellH * AR) * 0.9, cell.y + cell.vert * cellH * 1.6, 1.2]
          pos = [0, 1, 2].map((k) => n * n * pe[k] + 2 * n * t * fe[k] + t * t * de[k])
          q = qSlerpI(q, t)
          const ang = Math.sin(Math.PI * t) * 0.18 * (cell.side || cell.vert || 1)
          q = qMul(q, [0, 0, Math.sin(ang / 2), Math.cos(ang / 2)])
          sc = I + (cellH - I) * t
        }
        c.hover += (c.hv - c.hover) * (1 - Math.exp(-10 * dt))
        sc *= 1 + c.hover * 0.05
        const rel = sc / I
        const [X, Y, Z] = qCols(q)
        // world (y up) → css (y down): flip the y components
        const m = [X[0] * rel, -X[1] * rel, X[2] * rel, 0, -Y[0] * rel, Y[1] * rel, -Y[2] * rel, 0, Z[0] * rel, -Z[1] * rel, Z[2] * rel, 0, pos[0] * K, -pos[1] * K, pos[2] * K, 1]
        sStyle(el, 'transform', `matrix3d(${m.map((v) => v.toFixed(5)).join(',')})`)
        sStyle(el, 'opacity', op.toFixed(4))
        sStyle(el, 'visibility', op > 0.001 ? 'visible' : 'hidden')
        const kv = (1 + (KK - 1) * ease(fly)).toFixed(2)
        if (c.kv !== kv) { c.kv = kv; el.style.setProperty('--k', kv) }
        sStyle(el, 'pointerEvents', op > 0.3 && (fly > 0.2 || (rail > 0.3 && rail < 0.95)) ? 'auto' : 'none')
      })
    }
    const offT = addFrameTask(loop)
    return () => { alive = false; offA(); offB(); offT(); removeEventListener('load', relayout) }
  }, [flow])

  const enter = (i) => {
    const p = projectCards[i]
    state.current[i].hv = 1
    const t = tip.current
    t.querySelector('.c').textContent = p.cat
    t.querySelector('.t').textContent = p.title
    t.querySelector('.s').textContent = p.sub
    t.style.opacity = 1
  }
  const leave = (i) => { state.current[i].hv = 0; tip.current.style.opacity = 0 }
  const move = (e) => { tip.current.style.transform = `translate(${e.clientX + 18}px,${e.clientY + 18}px)` }

  return (
    <section id="projects" ref={sec} className={flow ? 'p-flow' : undefined} onTouchStart={noop}>
      <div className="p-sticky">
        <div className="p-head" ref={head}>
          <span className="eyebrow" data-reveal>Featured Work</span>
          <h2 className="h2" data-reveal style={{ '--d': '.08s' }}>Projects.</h2>
          <div className="bar" data-reveal style={{ '--d': '.16s' }} />
          <a href="#contact" className="drive-btn glass hov" data-reveal style={{ '--d': '.24s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--acc)' }}><path d="M4 11h4v9H4zM10 4h4v16h-4zM16 8h4v12h-4z" /></svg>
            <span>Ask For Project Details</span><span className="arr">↗</span>
          </a>
        </div>
        <div className="p-scene" ref={scene}>
          {/* the key gives each presentation fresh card nodes, so no inline style leaks from one to the other */}
          <div className="p-world" ref={world} key={flow ? 'flow' : 'rail'}>
            {projectCards.map((p, i) => {
              const face = (
                <>
                  <div className="thumb art" style={{ background: `url('${thumbs[i]}') center/cover no-repeat` }} />
                  <div className="thumb shade" />
                  <div className="p-top">
                    <span className="cat glass-chip">{p.cat}</span>
                  </div>
                  <div className="p-text">
                    <span className="lbl">{p.title}</span>
                    <span className="sub">{p.sub}</span>
                  </div>
                  <div className="thumb shine" />
                </>
              )
              return (
                <div
                  key={p.title}
                  className="p-card"
                  style={{ '--h': p.hue }}
                  onPointerEnter={flow ? undefined : () => enter(i)}
                  onPointerLeave={flow ? undefined : () => leave(i)}
                  onPointerMove={flow ? undefined : move}
                >
                  <div className="face">{face}</div>
                  <div className="face back" aria-hidden="true">{face}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="p-tip glass" ref={tip}><span className="c" /><span className="t" /><span className="s" /></div>
    </section>
  )
}
