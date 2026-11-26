// Procedural artwork (no external assets): the hero banner that the glass shards slice up,
// and one thumbnail per project card. Everything is drawn on <canvas>.
import { TRACES } from './blueprint'

const rand = (seed) => {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function glow(x, cx, cy, r, color) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = g
  x.fillRect(cx - r, cy - r, r * 2, r * 2)
}

/** Banner backdrop, aspect 1775:785 — a blueprint grid with circuit traces. Returns a canvas. */
export function makeHeroArt() {
  const W = 1775
  const H = 785
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')

  const base = x.createLinearGradient(0, 0, W, H)
  base.addColorStop(0, '#040814')
  base.addColorStop(0.55, '#07112a')
  base.addColorStop(1, '#050a1a')
  x.fillStyle = base
  x.fillRect(0, 0, W, H)

  glow(x, W * 0.66, H * 0.4, W * 0.4, 'rgba(40,100,230,0.28)')
  glow(x, W * 0.08, H * 0.95, W * 0.3, 'rgba(40,100,230,0.18)')
  glow(x, W * 0.92, H * 0.1, W * 0.16, 'rgba(255,184,46,0.14)')

  // blueprint grid: fine every 40px, major every 200px
  x.lineWidth = 1
  for (let gx = 0; gx <= W; gx += 40) {
    x.strokeStyle = gx % 200 === 0 ? 'rgba(130,175,255,0.15)' : 'rgba(110,160,255,0.065)'
    x.beginPath(); x.moveTo(gx + 0.5, 0); x.lineTo(gx + 0.5, H); x.stroke()
  }
  for (let gy = 0; gy <= H; gy += 40) {
    x.strokeStyle = gy % 200 === 0 ? 'rgba(130,175,255,0.15)' : 'rgba(110,160,255,0.065)'
    x.beginPath(); x.moveTo(0, gy + 0.5); x.lineTo(W, gy + 0.5); x.stroke()
  }

  // crosshairs at the major intersections
  x.strokeStyle = 'rgba(170,205,255,0.35)'
  for (let gx = 200; gx < W; gx += 200) {
    for (let gy = 200; gy < H; gy += 200) {
      x.beginPath(); x.moveTo(gx - 7, gy + 0.5); x.lineTo(gx + 7, gy + 0.5); x.moveTo(gx + 0.5, gy - 7); x.lineTo(gx + 0.5, gy + 7); x.stroke()
    }
  }

  // drafting circles around the focal point + ruler ticks on the top and left edges
  x.strokeStyle = 'rgba(130,175,255,0.09)'
  x.lineWidth = 1.5
  for (const r of [170, 290, 420, 560]) { x.beginPath(); x.arc(W * 0.645, H * 0.5, r, 0, 7); x.stroke() }
  x.setLineDash([6, 10])
  x.beginPath(); x.moveTo(W * 0.645, 0); x.lineTo(W * 0.645, H); x.moveTo(W * 0.3, H * 0.5); x.lineTo(W, H * 0.5); x.stroke()
  x.setLineDash([])
  x.strokeStyle = 'rgba(170,205,255,0.3)'
  x.lineWidth = 1
  for (let t = 0; t <= W; t += 20) { x.beginPath(); x.moveTo(t + 0.5, 0); x.lineTo(t + 0.5, t % 100 === 0 ? 14 : 7); x.stroke() }
  for (let t = 0; t <= H; t += 20) { x.beginPath(); x.moveTo(0, t + 0.5); x.lineTo(t % 100 === 0 ? 14 : 7, t + 0.5); x.stroke() }

  // circuit traces with end nodes
  x.lineJoin = 'round'
  x.lineCap = 'round'
  for (const t of TRACES) {
    const col = t.gold ? '255,200,90' : '125,185,255'
    x.strokeStyle = `rgba(${col},0.38)`
    x.lineWidth = 2
    x.beginPath()
    t.pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)))
    x.stroke()
    for (const [px, py] of [t.pts[0], t.pts[t.pts.length - 1]]) {
      x.fillStyle = '#050a1a'
      x.beginPath(); x.arc(px, py, 6, 0, 7); x.fill()
      x.strokeStyle = `rgba(${col},0.75)`
      x.lineWidth = 2
      x.stroke()
      x.strokeStyle = `rgba(${col},0.2)`
      x.beginPath(); x.arc(px, py, 14, 0, 7); x.stroke()
    }
  }

  // keep the left (text) side calm
  const left = x.createLinearGradient(0, 0, W * 0.55, 0)
  left.addColorStop(0, 'rgba(3,6,16,0.6)')
  left.addColorStop(1, 'rgba(3,6,16,0)')
  x.fillStyle = left
  x.fillRect(0, 0, W * 0.55, H)

  const v = x.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.62)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.5)')
  x.fillStyle = v
  x.fillRect(0, 0, W, H)

  return c
}

/** 16:9 abstract thumbnail for a project card. `kind` picks the motif, `hue` the colour. */
export function makeThumb(kind, hue) {
  const W = 640
  const H = 360
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')
  const r = rand(hue * 7 + kind.length)
  const hs = (l, a = 1, s = 92) => `hsla(${hue},${s}%,${l}%,${a})`

  const bg = x.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, hs(22, 1, 62))
  bg.addColorStop(0.55, hs(11, 1, 55))
  bg.addColorStop(1, '#080b16')
  x.fillStyle = bg
  x.fillRect(0, 0, W, H)
  glow(x, W * 0.5, H * 0.4, W * 0.46, hs(56, 0.72))
  glow(x, W * 0.1, H * 0.95, W * 0.4, `hsla(${(hue + 150) % 360},80%,40%,0.25)`)

  // faint grid
  x.strokeStyle = 'rgba(255,255,255,0.05)'
  x.lineWidth = 1
  for (let i = 0; i < W; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke() }
  for (let j = 0; j < H; j += 32) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke() }

  // lit podium under the motif
  x.save()
  x.translate(W / 2, 244)
  x.scale(1, 0.17)
  for (const [r, a] of [[210, 0.35], [160, 0.6]]) {
    x.beginPath(); x.arc(0, 0, r, 0, 7)
    x.fillStyle = hs(55, a * 0.35); x.fill()
    x.lineWidth = 7; x.strokeStyle = hs(74, a); x.stroke()
  }
  x.restore()

  // motif: drawn on a 640x360 design, then scaled into the upper part of the card
  x.save()
  x.translate(320, 142)
  x.scale(0.76, 0.76)
  x.translate(-320, -185)
  x.lineWidth = 5
  x.lineJoin = 'round'
  x.lineCap = 'round'
  x.strokeStyle = hs(80)
  x.fillStyle = hs(64, 0.42)
  x.shadowColor = hs(62, 1)
  x.shadowBlur = 26

  const rr = (a, b, w, h, rad) => { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, rad); else x.rect(a, b, w, h) } // older iOS has no roundRect

  switch (kind) {
    case 'billing': // bar chart + coin
      for (let i = 0; i < 7; i++) { const h = 40 + r() * 130 + i * 8; rr(150 + i * 54, 250 - h, 34, h, 6); x.fill(); x.stroke() }
      x.beginPath(); x.arc(470, 120, 44, 0, 7); x.stroke(); x.font = '700 44px Geist, sans-serif'; x.textAlign = 'center'; x.fillStyle = hs(80); x.fillText('₹', 470, 136)
      break
    case 'library': // book spines
      for (let i = 0; i < 9; i++) { const h = 120 + r() * 90; rr(130 + i * 46, 270 - h, 34, h, 4); x.fill(); x.stroke(); x.beginPath(); x.moveTo(140 + i * 46, 270 - h + 24); x.lineTo(156 + i * 46, 270 - h + 24); x.stroke() }
      break
    case 'admission': { // flow of nodes
      const pts = [[130, 200], [250, 120], [370, 210], [490, 130]]
      x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke()
      pts.forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 26, 0, 7); x.fill(); x.stroke() })
      rr(430, 230, 120, 50, 12); x.stroke()
      break }
    case 'transport': // route with stops
      x.beginPath(); x.moveTo(90, 250); x.bezierCurveTo(200, 80, 300, 300, 400, 150); x.bezierCurveTo(470, 60, 540, 140, 560, 110); x.stroke()
      ;[[90, 250], [400, 150], [560, 110]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 16, 0, 7); x.fill(); x.stroke() })
      break
    case 'auth': // shield + lock
      x.beginPath(); x.moveTo(320, 60); x.lineTo(430, 100); x.lineTo(430, 190); x.quadraticCurveTo(430, 270, 320, 310); x.quadraticCurveTo(210, 270, 210, 190); x.lineTo(210, 100); x.closePath(); x.fill(); x.stroke()
      rr(285, 170, 70, 56, 10); x.stroke(); x.beginPath(); x.arc(320, 170, 22, Math.PI, 0); x.stroke()
      break
    case 'api': // braces + endpoints
      x.font = '800 190px Geist, sans-serif'; x.textAlign = 'center'; x.fillStyle = hs(72, 0.9); x.fillText('{ }', 320, 235)
      ;[[110, 100], [110, 260], [530, 100], [530, 260]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(320, 180); x.stroke(); x.beginPath(); x.arc(a, b, 11, 0, 7); x.fill(); x.stroke() })
      break
    case 'react': // orbits
      for (let i = 0; i < 3; i++) { x.save(); x.translate(320, 185); x.rotate((i * Math.PI) / 3); x.beginPath(); x.ellipse(0, 0, 150, 52, 0, 0, 7); x.stroke(); x.restore() }
      x.beginPath(); x.arc(320, 185, 20, 0, 7); x.fill(); x.stroke()
      break
    case 'docs': // pages + lines
      rr(190, 70, 190, 240, 14); x.fill(); x.stroke(); rr(260, 100, 190, 240, 14); x.stroke()
      for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(285, 140 + i * 30); x.lineTo(285 + (i % 2 ? 100 : 140), 140 + i * 30); x.stroke() }
      break
    case 'iis': // server racks
      for (let i = 0; i < 4; i++) { rr(190, 70 + i * 66, 260, 52, 12); x.fill(); x.stroke(); x.beginPath(); x.arc(225, 96 + i * 66, 6, 0, 7); x.fill(); x.moveTo(300, 96 + i * 66); x.lineTo(420, 96 + i * 66); x.stroke() }
      break
    default: // 'edu' — responsive layout tiles
      rr(150, 80, 340, 200, 14); x.stroke(); rr(170, 100, 120, 160, 8); x.fill(); x.stroke(); rr(310, 100, 160, 70, 8); x.stroke(); rr(310, 190, 70, 70, 8); x.fill(); x.stroke(); rr(400, 190, 70, 70, 8); x.stroke()
      rr(520, 150, 70, 130, 12); x.stroke()
  }

  x.restore()
  x.shadowBlur = 0
  const f = x.createLinearGradient(0, H * 0.55, 0, H)
  f.addColorStop(0, 'rgba(0,0,0,0)')
  f.addColorStop(1, 'rgba(0,0,0,0.55)')
  x.fillStyle = f
  x.fillRect(0, 0, W, H)

  return c.toDataURL('image/jpeg', 0.85)
}
