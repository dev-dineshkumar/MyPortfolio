import { useEffect, useRef, useState } from 'react'
import { profile } from '../data/portfolio'
import { makeHeroArt } from '../lib/art'
import { createCodeScene } from '../lib/codeScene'
import { addFrameRead, addFrameTask, clamp, intro, lerp, mouse, onIntro, onMeasure, onRealResize, reduce, sAttr, sStyle, view } from '../lib/runtime'

// Tile cut pattern, in % of the banner (x, y). The generated artwork is drawn for this exact layout.
const POLYS = [
  [[0, 0], [20.6, 0], [44.4, 61.6], [32.4, 100], [0, 100]],
  [[21.4, 0], [51.4, 0], [68.2, 45.8], [45.2, 60.4]],
  [[52.2, 0], [80.6, 0], [68.9, 44.6]],
  [[81.4, 0], [100, 0], [100, 100], [84.8, 100], [69.6, 47.8]],
  [[45.8, 61.8], [69, 49.2], [84, 100], [33.2, 100]],
]
const NS = 'http://www.w3.org/2000/svg'

/** Rounded polygon path: corners are replaced by quadratic curves. */
function roundedPath(pts, r) {
  let d = ''
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]]
    const v2 = [p2[0] - p1[0], p2[1] - p1[1]]
    const l1 = Math.hypot(...v1)
    const l2 = Math.hypot(...v2)
    const rr = Math.min(r, l1 / 2.2, l2 / 2.2)
    const a = [p1[0] + (v1[0] / l1) * rr, p1[1] + (v1[1] / l1) * rr]
    const b = [p1[0] + (v2[0] / l2) * rr, p1[1] + (v2[1] / l2) * rr]
    d += `${i ? 'L' : 'M'}${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`
  }
  return d + 'Z'
}

/** Offset every edge of a polygon inward by g (intersecting the shifted edges). */
function insetPoly(pts, g) {
  const n = pts.length
  let area = 0
  for (let i = 0; i < n; i++) { const a = pts[i]; const b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1] }
  const sg = area > 0 ? 1 : -1
  const lines = pts.map((a, i) => {
    const b = pts[(i + 1) % n]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy)
    const nx = (-dy / l) * sg
    const ny = (dx / l) * sg
    return [[a[0] + nx * g, a[1] + ny * g], [b[0] + nx * g, b[1] + ny * g]]
  })
  return pts.map((_, i) => {
    const [p, q] = lines[(i - 1 + n) % n]
    const [r, s2] = lines[i]
    const d1 = [q[0] - p[0], q[1] - p[1]]
    const d2 = [s2[0] - r[0], s2[1] - r[1]]
    const den = d1[0] * d2[1] - d1[1] * d2[0]
    if (Math.abs(den) < 1e-6) return lines[i][0]
    const t = ((r[0] - p[0]) * d2[1] - (r[1] - p[1]) * d2[0]) / den
    return [p[0] + d1[0] * t, p[1] + d1[1] * t]
  })
}

export default function Hero() {
  const heroRef = useRef(null)
  const wrapRef = useRef(null)
  const bannerRef = useRef(null)
  const copyRef = useRef(null)
  const [introduced, setIntroduced] = useState(false)

  useEffect(() => onIntro(() => setIntroduced(true)), [])

  useEffect(() => {
    const hero = heroRef.current
    const wrap = wrapRef.current
    const banner = bannerRef.current
    const copy = copyRef.current
    const shards = []
    let scene = null
    let lastDraw = 0
    let heroVis = true
    let heroH = hero.offsetHeight
    let brL = 0
    let brT = 0
    let spP = 0
    let lastHT = 0
    const tilt = { x: 0, y: 0 }

    // Copy the animated scene into every tile (only the tile's bounding box).
    function paint(tSec) {
      if (!scene) return
      scene.draw(tSec)
      const k = scene.ratio
      for (const s of shards) {
        const [bx, by, bw, bh] = s.box
        s.ctx.drawImage(scene.canvas, bx * k, by * k, bw * k, bh * k, bx * k, by * k, bw * k, bh * k)
      }
    }

    function build() {
      shards.forEach((s) => s.el.remove())
      shards.length = 0
      const mobile = innerWidth < 768
      if (mobile) {
        // phones: a portrait banner = the copy block on top + the scene underneath, all inside the same glass tiles (laptop look)
        const bw = banner.offsetWidth
        const sceneH = (690 * (bw * 0.96)) / 960 + 24
        const textH = copy.firstElementChild.offsetHeight
        const bh = Math.round(textH + sceneH)
        banner.style.height = bh + 'px'
        const top = 84 + Math.max(0, Math.round((innerHeight - 84 - bh - 24) * 0.4))
        wrap.style.top = top + 'px'
        hero.style.minHeight = Math.max(innerHeight, top + bh + 36) + 'px'
        heroH = hero.offsetHeight
      } else {
        banner.style.height = ''
        wrap.style.top = ''
        hero.style.minHeight = ''
      }
      const W = banner.offsetWidth
      const H = banner.offsetHeight
      if (!W || !H) return
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      scene = createCodeScene(W, H, dpr, makeHeroArt(), { mobile })
      POLYS.forEach((poly, i) => {
        const pts = poly.map(([x, y]) => [(x / 100) * W, (y / 100) * H])
        const ip = insetPoly(pts, mobile ? 2.5 : 3)
        const d = roundedPath(ip, mobile ? 14 : 22)
        const ip2 = insetPoly(ip, mobile ? 2.5 : 3.5)
        const d2 = roundedPath(ip2, mobile ? 10 : 18)
        const cx = ip.reduce((a, p) => a + p[0], 0) / ip.length
        const cy = ip.reduce((a, p) => a + p[1], 0) / ip.length
        const el = document.createElement('div')
        el.className = 'shard'
        el.setAttribute('aria-hidden', 'true')
        el.style.width = W + 'px'
        el.style.height = H + 'px'
        el.style.transformOrigin = `${cx}px ${cy}px`
        const id = 'sh' + i
        const dim = `width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
        // three stacked layers: drop shadow (svg) → animated scene (canvas, clipped to the tile) → glass edges, glare and hit area (svg)
        el.innerHTML = `<svg class="sh-layer" ${dim}><defs>
          <filter id="${id}f" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".7"/></filter>
        </defs><path d="${d}" fill="#05070c" filter="url(#${id}f)"/></svg>
        <canvas class="sh-layer" width="${Math.round(W * dpr)}" height="${Math.round(H * dpr)}"></canvas>
        <svg class="sh-layer" ${dim}><defs>
          <clipPath id="${id}c"><path d="${d}"/></clipPath>
          <linearGradient id="${id}e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".7" stop-color="#ffc94d" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient>
          <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${i === 1 || i === 2 ? 0.22 : 0.1}"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#ffd27a" stop-opacity=".08"/></linearGradient>
          <linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".18" stop-color="#fff" stop-opacity=".34"/><stop offset=".5" stop-color="#fff2d6" stop-opacity=".1"/><stop offset=".82" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <radialGradient id="${id}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${Math.round(Math.max(W, H) * 0.3)}"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".3" stop-color="#fff" stop-opacity=".85"/><stop offset=".6" stop-color="#ffd98a" stop-opacity=".4"/><stop offset="1" stop-color="#ffc94d" stop-opacity="0"/></radialGradient>
        </defs>
        <g clip-path="url(#${id}c)">
          <rect class="sheen" x="${-W}" y="0" width="${W * 3}" height="${H}" fill="url(#${id}s)"/>
          <rect class="glare" x="0" y="0" width="${W}" height="${H}" fill="url(#${id}g)" opacity="0" style="mix-blend-mode:screen"/>
        </g>
        <path d="${d}" fill="none" stroke="url(#${id}e)" stroke-width="1.4"/>
        <path d="${d}" fill="none" stroke="#ffb82e" stroke-opacity=".12" stroke-width="4" style="filter:blur(3px)"/>
        <path class="chR" d="${d}" fill="none" stroke="#ffb02e" stroke-width="1.1" opacity="0" transform="translate(-1 0)" style="mix-blend-mode:screen"/>
        <path class="chB" d="${d}" fill="none" stroke="#38c4ff" stroke-width="1.1" opacity="0" transform="translate(1 0)" style="mix-blend-mode:screen"/>
        <path class="bevel" d="${d2}" fill="none" stroke="url(#${id}r)" stroke-width="1" opacity="0"/>
        <path class="rimGlow" d="${d}" fill="none" stroke="url(#${id}r)" stroke-width="8" stroke-linejoin="round" opacity="0" style="filter:blur(5px)"/>
        <path class="rim" d="${d}" fill="none" stroke="url(#${id}r)" stroke-width="2.4" stroke-linejoin="round" opacity="0"/>
        <path class="hit" d="${d}" fill="transparent"/></svg>`
        const cv = el.querySelector('canvas')
        cv.style.width = W + 'px'
        cv.style.height = H + 'px'
        cv.style.clipPath = `path('${d}')`
        banner.insertBefore(el, banner.firstChild)

        const xs = ip.map((p) => p[0])
        const ys = ip.map((p) => p[1])
        const bx = Math.max(0, Math.floor(Math.min(...xs)) - 4)
        const by = Math.max(0, Math.floor(Math.min(...ys)) - 4)
        const bw = Math.min(W, Math.ceil(Math.max(...xs)) + 4) - bx
        const bh = Math.min(H, Math.ceil(Math.max(...ys)) + 4) - by

        const seed = (i * 0.37 + 0.21) % 1
        const st = {
          el, i, W, H, px: cx, py: cy, pts: ip, ctx: cv.getContext('2d'), box: [bx, by, bw, bh],
          sheen: el.querySelector('.sheen'),
          glare: el.querySelector('.glare'), rim: el.querySelector('.rim'), glow: el.querySelector('.rimGlow'),
          bev: el.querySelector('.bevel'), chR: el.querySelector('.chR'), chB: el.querySelector('.chB'),
          g1: el.querySelector('#' + id + 'g'), g2: el.querySelector('#' + id + 'r'),
          cx: cx / W - 0.5, cy: cy / H - 0.5, dx: 0, dy: 0, vx: 0, vy: 0, drag: false, ox: 0, oy: 0,
          ux: -0.6, uy: -0.8, hv: 0, hover: false, gx: W / 2, gy: H / 2,
          // where this tile flies to as the page scrolls
          fly: {
            x: (cx / W - 0.5) * 900 + (seed - 0.5) * 200,
            y: (cy / H - 0.5) * 500 + (seed - 0.5) * 120,
            rz: (seed - 0.5) * 40, ry: (cx / W - 0.5) * -50, rx: (cy / H - 0.5) * 40, z: 150 + seed * 350,
          },
        }
        shards.push(st)
        const hit = el.querySelector('.hit')
        hit.addEventListener('pointerenter', () => { st.hover = true })
        hit.addEventListener('pointerleave', () => { st.hover = false })
        hit.addEventListener('pointerdown', (e) => {
          st.drag = true
          st.ox = e.clientX - st.dx
          st.oy = e.clientY - st.dy
          hit.setPointerCapture(e.pointerId)
          el.classList.add('dragging')
        })
        hit.addEventListener('pointermove', (e) => {
          if (!st.drag) return
          const nx = e.clientX - st.ox
          const ny = e.clientY - st.oy
          st.vx = nx - st.dx
          st.vy = ny - st.dy
          st.dx = nx
          st.dy = ny
        })
        const up = () => { st.drag = false; el.classList.remove('dragging') }
        hit.addEventListener('pointerup', up)
        hit.addEventListener('pointercancel', up)
      })
      paint(reduce ? 17 : view.t / 1000) // first frame right away; reduced motion keeps this finished frame
    }
    build()
    // web fonts change the copy height on phones, so rebuild once they are in
    if (innerWidth < 768) document.fonts?.ready?.then(() => build())

    let rsT
    const offRs = onRealResize(() => { clearTimeout(rsT); rsT = setTimeout(build, 150) })
    const io = new IntersectionObserver(
      (es) => {
        heroVis = es[0].isIntersecting
        // once the hero is a screen behind us its shard layers are dropped from compositing
        sStyle(wrap, 'visibility', heroVis ? '' : 'hidden')
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(hero)
    const offM = onMeasure(() => { heroH = hero.offsetHeight })
    const offR = addFrameRead(() => {
      if (heroVis) { const r = banner.getBoundingClientRect(); brL = r.left; brT = r.top }
    })

    const loop = (t) => {
      if (!heroVis) { lastHT = t; return }
      if (!reduce && t - lastDraw >= 33) { lastDraw = t; paint(t / 1000) }
      // damped scroll progress: the split follows the scroll with inertia
      const dtH = Math.min(Math.max((t - lastHT) / 1000, 0), 0.05)
      lastHT = t
      const tgt = clamp(view.y / heroH, 0, 1.2)
      spP += (tgt - spP) * (1 - Math.exp(-dtH * 5.5))
      if (Math.abs(tgt - spP) < 0.0004) spP = tgt
      const p = spP
      tilt.x = lerp(tilt.x, mouse.nx, 0.05)
      tilt.y = lerp(tilt.y, mouse.ny, 0.05)
      const it = clamp((t - intro.t) / 1500, 0, 1)
      const ie = 1 - Math.pow(1 - it, 3)
      const enter = 1 - ie
      sStyle(banner, 'transform', `rotateY(${(tilt.x * 6).toFixed(3)}deg) rotateX(${(-tilt.y * 5).toFixed(3)}deg)`)

      for (const s of shards) {
        // each tile starts a touch later than the previous one, easing with a smoothstep curve
        const ps = Math.max(p - s.i * 0.035, 0)
        const k = 1.8 * (ps < 1 ? ps * ps * (3 - 2 * ps) : 1 + (ps - 1) * 0.6)
        if (!s.drag) { s.vx += -s.dx * 0.07; s.vy += -s.dy * 0.07; s.vx *= 0.82; s.vy *= 0.82; s.dx += s.vx; s.dy += s.vy }
        const f = s.fly
        const bob = Math.sin((t / 1000) * 1.1 + s.i * 1.7) * 3
        const sep = 6 + Math.abs(s.vx) * 0.4
        const tx = s.dx + f.x * k + s.cx * enter * 700 + tilt.x * s.cx * 14
        const ty = s.dy + f.y * k + bob + s.cy * enter * 300 + tilt.y * s.cy * 10
        const tz = s.i * sep + f.z * k - enter * 500
        const rz = f.rz * (k + enter * 0.6) + s.vx * 0.12
        const ry = f.ry * (k + enter * 0.4) + s.vx * 0.25
        const rx = f.rx * (k + enter * 0.4) - s.vy * 0.25
        sStyle(s.el, 'transform', `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,${tz.toFixed(2)}px) rotateZ(${rz.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg)`)
        sStyle(s.el, 'opacity', clamp(ie * 1.2 * (1.1 - ps * 0.9), 0, 1).toFixed(4))

        // light enters each tile from the side facing the cursor and fades out by mid-tile
        const lx = mouse.x - brL - s.dx
        const ly = mouse.y - brT - s.dy
        s.gx = lerp(s.gx, lx, 0.2)
        s.gy = lerp(s.gy, ly, 0.2)
        s.hv = lerp(s.hv, s.hover || s.drag ? 1 : 0, 0.1)
        let vx = s.gx - s.px
        let vy = s.gy - s.py
        const vl = Math.hypot(vx, vy)
        if (vl < 10) { vx = -0.6; vy = -0.8 } else { vx /= vl; vy /= vl }
        s.ux = lerp(s.ux, vx, 0.12)
        s.uy = lerp(s.uy, vy, 0.12)
        const ul = Math.hypot(s.ux, s.uy) || 1
        const ux = s.ux / ul
        const uy = s.uy / ul
        let ext = 1
        for (const q of s.pts) ext = Math.max(ext, (q[0] - s.px) * ux + (q[1] - s.py) * uy)
        sAttr(s.g1, 'x1', (s.px + ux * ext).toFixed(2))
        sAttr(s.g1, 'y1', (s.py + uy * ext).toFixed(2))
        sAttr(s.g1, 'x2', (s.px - ux * ext * 0.15).toFixed(2))
        sAttr(s.g1, 'y2', (s.py - uy * ext * 0.15).toFixed(2))
        const near = clamp(1 - Math.hypot(lx - s.px, ly - s.py) / (s.W * 0.5), 0, 1)
        sAttr(s.glare, 'opacity', clamp(0.3 + s.hv * 0.7 + near * 0.3, 0, 1).toFixed(4))
        sAttr(s.g2, 'cx', s.gx.toFixed(2))
        sAttr(s.g2, 'cy', s.gy.toFixed(2))
        const ro = clamp(s.hv * 0.9 + near * 0.4, 0, 1)
        sAttr(s.rim, 'opacity', ro.toFixed(4))
        sAttr(s.glow, 'opacity', (ro * 0.6).toFixed(4))
        sAttr(s.bev, 'opacity', (ro * 0.6).toFixed(4))
        sAttr(s.chR, 'opacity', (s.hv * 0.3).toFixed(4))
        sAttr(s.chB, 'opacity', (s.hv * 0.3).toFixed(4))
        sAttr(s.sheen, 'transform', `translate(${((tilt.x * 0.5 + 0.1) * s.W * 0.6).toFixed(2)} 0)`)
      }
      const cp = clamp(p * 1.4, 0, 1)
      sStyle(copy, 'transform', `translate3d(${(-cp * 120).toFixed(2)}px,${(-cp * 40).toFixed(2)}px,${(40 + cp * 90).toFixed(2)}px)`)
      sStyle(copy, 'opacity', (1 - cp).toFixed(4))
    }
    const offT = addFrameTask(loop)

    return () => {
      clearTimeout(rsT)
      offRs(); offM(); offR(); offT()
      io.disconnect()
      shards.forEach((s) => s.el.remove())
    }
  }, [])

  const cls = (extra = '') => `${extra} ${introduced ? 'in' : ''}`.trim()
  const d = (i) => ({ '--d': `${0.12 * i}s` })
  const [r1, r2] = profile.roles

  return (
    <section id="hero" ref={heroRef}>
      <div className="banner-wrap" ref={wrapRef}>
        <div className="banner" id="banner" ref={bannerRef}>
          <div className="hero-copy" ref={copyRef}>
            <div className="hero-copy-in">
              <span className={cls('kicker')} data-reveal data-hero style={d(0)}>{profile.kicker}</span>
              <h1 className={cls('h1')} data-reveal data-hero style={d(1)}>{profile.name}</h1>
              <div className={cls('role')} data-reveal data-hero style={d(2)}>
                <span>{r1}</span><b>/</b><span>{r2}</span>
              </div>
              <p className={cls('tag')} data-reveal data-hero style={d(3)}>{profile.tagline}</p>
              <div className={cls('ctas')} data-reveal data-hero style={d(4)}>
                <a href="#projects" className="glow-btn">
                  <span className="gb-txt">View My Work</span>
                  <span className="gb-ar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
                  </span>
                </a>
                <a href="#contact" className="btn-ghost glass hov">Get In Touch</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="scroll-hint"><span />Scroll</div>
    </section>
  )
}
