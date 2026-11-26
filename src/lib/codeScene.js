// Animated "developer at work" scene that fills the hero banner (replaces the portrait).
// One offscreen canvas is drawn at ~30fps and copied into each glass shard, so the cost stays
// small no matter how many tiles show it. Everything is drawn in a 1775×785 design space.

import { TRACES, pointAt } from './blueprint'

const DW = 1775
const DH = 785
const MONO = '"JetBrains Mono", ui-monospace, "Cascadia Code", Consolas, monospace'
const CYCLE = 20 // seconds before the scene restarts

const C = { kw: '#c9a8ff', ty: '#7dd3fc', st: '#9be8a8', fn: '#ffd166', tx: '#dfe5f0', pu: '#8c98ad', no: '#4b566a' }

// A real ASP.NET Core endpoint, in line with the ERP modules on the resume.
const CODE = [
  [['[Authorize]', C.ty]],
  [['[HttpGet(', C.tx], ['"modules"', C.st], [')]', C.tx]],
  [['public async ', C.kw], ['Task', C.ty], ['<', C.tx], ['IActionResult', C.ty], ['>', C.tx], [' Get()', C.fn]],
  [['{', C.pu]],
  [['  var ', C.kw], ['data', C.tx], [' = ', C.pu], ['await ', C.kw], ['_db.Modules', C.tx]],
  [['      .ToListAsync();', C.fn]],
  [['  return ', C.kw], ['Ok', C.fn], ['(data);', C.tx]],
  [['}', C.pu]],
]
const lineLen = (segs) => segs.reduce((n, [s]) => n + s.length, 0)

const TERM = [
  { text: '$ dotnet run', color: C.tx, at: 11.6 },
  { text: 'info: Listening on :5001', color: C.pu, at: 13.2 },
  { text: '✓ Modules API ready', color: '#7ee787', at: 14.8 },
]

const SYMBOLS = [
  ['{ }', 905, 95, 64, 0.0, C.fn], ['</>', 1405, 85, 56, 1.3, C.ty], [';', 810, 385, 64, 2.1, C.fn],
  ['=>', 1725, 330, 50, 0.7, C.ty], ['[ ]', 1010, 725, 52, 1.9, C.fn], ['#', 1240, 740, 50, 2.8, C.ty], ['()', 870, 660, 56, 3.4, C.fn],
]
const CHIPS = [
  ['C#', 850, 215, 0.4], ['React', 1610, 205, 1.6], ['JWT', 1660, 420, 2.5], ['SQL', 850, 565, 3.1], ['API', 1130, 640, 0.9],
]

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function createCodeScene(W, H, dpr, art, opts = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const k = canvas.width / DW
  // Phones: the banner is portrait. The backdrop art covers it (right-hand part of the art), and the windows / chips
  // keep their laptop composition, scaled to the banner width and placed under the copy.
  const mob = !!opts.mobile
  const VX = 800 // design-space window shown on phones: x 800..1760, y 60..745
  const VW = 960
  const VB = 745
  const dp = canvas.width / W
  const sArt = H / DH
  const sScn = (W * 0.96) / VW
  const setArt = () => (mob ? x.setTransform(dp * sArt, 0, 0, dp * sArt, -(DW - W / sArt) * dp * sArt, 0) : x.setTransform(k, 0, 0, k, 0, 0))
  const setScene = () => { if (mob) x.setTransform(dp * sScn, 0, 0, dp * sScn, ((W - VW * sScn) / 2 - VX * sScn) * dp, (H - 12 - VB * sScn) * dp) }
  const x = canvas.getContext('2d')
  document.fonts?.load?.(`600 21px ${MONO}`).catch(() => {})

  const box = (a, b, w, h, r) => { x.beginPath(); x.roundRect(a, b, w, h, r) }

  function windowFrame(a, b, w, h, title, alpha, bob) {
    x.save()
    x.globalAlpha = alpha
    x.translate(0, bob)
    x.shadowColor = 'rgba(255,184,46,0.28)'
    x.shadowBlur = 46
    box(a, b, w, h, 18)
    const g = x.createLinearGradient(0, b, 0, b + h)
    g.addColorStop(0, 'rgba(10,15,28,0.96)')
    g.addColorStop(1, 'rgba(6,9,18,0.96)')
    x.fillStyle = g
    x.fill()
    x.shadowBlur = 0
    x.lineWidth = 2
    x.strokeStyle = 'rgba(255,209,102,0.5)'
    x.stroke()
    // header bar
    x.save()
    box(a, b, w, 44, 18)
    x.clip()
    x.fillStyle = 'rgba(255,255,255,0.05)'
    x.fillRect(a, b, w, 44)
    x.restore()
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(a + 26 + i * 22, b + 22, 6, 0, 7); x.fill() })
    x.font = `500 15px ${MONO}`
    x.fillStyle = C.pu
    x.textBaseline = 'middle'
    x.fillText(title, a + 100, b + 23)
    x.restore()
  }

  function typed(px, py, segs, chars) {
    const cw = x.measureText('M').width
    let cx = px
    for (const [s, c] of segs) {
      if (chars <= 0) break
      const part = s.slice(0, chars)
      x.fillStyle = c
      x.fillText(part, cx, py)
      cx += cw * part.length
      chars -= s.length
    }
    return cx
  }

  function draw(t) {
    const tc = t % CYCLE
    const out = 1 - clamp01((tc - (CYCLE - 1)) / 1) // fade everything out for the last second
    setArt()
    x.globalAlpha = 1
    x.shadowBlur = 0
    x.drawImage(art, 0, 0, DW, DH)

    // light pulses travelling along the blueprint circuit traces
    x.globalCompositeOperation = 'lighter'
    for (const tr of TRACES) {
      const col = tr.gold ? '255,200,90' : '130,190,255'
      for (let n = 0; n < 2; n++) {
        const u = (t * tr.speed + tr.phase + n * 0.5) % 1
        const [px, py] = pointAt(tr, u)
        const g = x.createRadialGradient(px, py, 0, px, py, 22)
        g.addColorStop(0, `rgba(${col},${0.9 * out})`)
        g.addColorStop(1, `rgba(${col},0)`)
        x.fillStyle = g
        x.fillRect(px - 22, py - 22, 44, 44)
      }
    }
    x.globalCompositeOperation = 'source-over'
    setScene()

    // floating symbols (behind the windows)
    x.textAlign = 'left'
    x.textBaseline = 'alphabetic'
    for (const [s, sx, sy, size, ph, col] of SYMBOLS) {
      x.globalAlpha = (0.22 + 0.16 * Math.sin(t * 0.8 + ph)) * out
      x.font = `700 ${size}px ${MONO}`
      x.fillStyle = col
      x.fillText(s, sx, sy + Math.sin(t * 0.9 + ph) * 12)
    }

    // ── editor ──
    const ex = 885
    const ey = 125
    const bob = Math.sin(t * 0.7) * 5
    const eAlpha = clamp01(tc / 0.6) * out
    windowFrame(ex, ey, 640, 400, 'ModulesController.cs', eAlpha, bob)
    x.save()
    x.translate(0, bob)
    x.globalAlpha = eAlpha
    x.font = `600 21px ${MONO}`
    x.textBaseline = 'alphabetic'
    let caret = null
    let active = -1
    CODE.forEach((segs, i) => {
      const len = lineLen(segs)
      const start = 0.8 + i * 1.35
      const dur = 0.5 + len * 0.03
      const prog = clamp01((tc - start) / dur)
      if (tc < start) return
      const by = ey + 92 + i * 38
      const chars = Math.floor(len * prog)
      if (prog < 1) active = i
      x.fillStyle = C.no
      x.font = `500 17px ${MONO}`
      x.fillText(String(i + 1), ex + 24, by)
      x.font = `600 21px ${MONO}`
      if (prog < 1) { x.fillStyle = 'rgba(255,184,46,0.07)'; x.fillRect(ex + 8, by - 26, 624, 36) }
      const endX = typed(ex + 66, by, segs, chars)
      caret = { x: endX, y: by }
    })
    if (caret && Math.floor(t * 2) % 2 === 0) {
      x.fillStyle = 'rgba(255,209,102,0.95)'
      x.fillRect(caret.x + 2, caret.y - 21, 10, 26)
    }
    // scanning highlight
    const sy = ey + 48 + ((t * 70) % 340)
    const sg = x.createLinearGradient(0, sy - 18, 0, sy + 18)
    sg.addColorStop(0, 'rgba(255,209,102,0)')
    sg.addColorStop(0.5, 'rgba(255,209,102,0.06)')
    sg.addColorStop(1, 'rgba(255,209,102,0)')
    x.fillStyle = sg
    x.fillRect(ex + 4, sy - 18, 632, 36)
    x.restore()
    void active

    // ── terminal ──
    const tIn = clamp01((tc - 11.2) / 0.5)
    if (tIn > 0) {
      const tx = 1370
      const ty = 505
      windowFrame(tx, ty + (1 - tIn) * 14, 330, 190, 'terminal', tIn * out, Math.sin(t * 0.8 + 1) * 5)
      x.save()
      x.translate(0, Math.sin(t * 0.8 + 1) * 5 + (1 - tIn) * 14)
      x.globalAlpha = tIn * out
      x.font = `500 17px ${MONO}`
      x.textBaseline = 'alphabetic'
      TERM.forEach((l, i) => {
        if (tc < l.at) return
        const chars = Math.floor(l.text.length * clamp01((tc - l.at) / (0.3 + l.text.length * 0.035)))
        typed(tx + 22, ty + 84 + i * 34, [[l.text, l.color]], chars)
      })
      x.restore()
    }

    // ── tech chips (in front) ──
    x.textBaseline = 'middle'
    x.textAlign = 'center'
    for (const [s, cx, cy, ph] of CHIPS) {
      const y = cy + Math.sin(t * 1.0 + ph * 2) * 10
      x.globalAlpha = 0.95 * out
      x.font = `700 20px ${MONO}`
      const w = x.measureText(s).width + 36
      box(cx - w / 2, y - 20, w, 40, 20)
      x.fillStyle = 'rgba(8,12,24,0.85)'
      x.shadowColor = 'rgba(255,184,46,0.5)'
      x.shadowBlur = 18
      x.fill()
      x.shadowBlur = 0
      x.lineWidth = 1.5
      x.strokeStyle = 'rgba(255,209,102,0.6)'
      x.stroke()
      x.fillStyle = '#ffe3a0'
      x.fillText(s, cx, y + 1)
    }
    x.globalAlpha = 1
  }

  return { canvas, draw, ratio: canvas.width / W }
}
