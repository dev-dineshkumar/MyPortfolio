import { useEffect, useRef } from 'react'
import { addFrameTask, clamp, lerp, mouse, onRealResize, reduce, sStyle, view } from '../lib/runtime'

/**
 * Page-length developer backdrop.
 *
 * This layer is as tall as the whole page and lives in document space, so it scrolls with the content instead of
 * sitting fixed behind it. On top of that native scroll every piece has its own depth rate (far pieces lag, near
 * pieces lead) which gives the parallax. Contents:
 *  - soft cyan / violet / gold / rose / emerald light fields that breathe (the animated gradient)
 *  - floating 3D developer pieces: { } braces, </> tags, => arrows, a git branch, a database, a wireframe cube,
 *    the React atom, a terminal prompt, an API graph, a C# mark. They turn as you scroll past them.
 * Transforms and opacity only, one shared rAF loop, off-screen pieces are skipped. Under reduced motion the layer
 * still scrolls with the page and follows scroll; only the ambient float and the breathing stop.
 */

const COLORS = ['56,189,248', '139,92,246', '255,184,46', '244,114,182', '52,211,153', '167,139,250']
const GLYPH = ['56,189,248', '255,201,77', '244,114,182', '52,211,153', '167,139,250', '251,146,60']
const KINDS = ['braces', 'branch', 'tag', 'cube', 'db', 'react', 'arrow', 'graph', 'term', 'csharp', 'braces', 'cube']
const TIER = [
  { z: 0, k: 0.62, size: 96, a: 0.28 },
  { z: 1, k: 0.86, size: 140, a: 0.38 },
  { z: 2, k: 1.12, size: 190, a: 0.48 },
]
const N_BLOB = 14
const N_SHAPE = 24
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'

const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

const Glyph = ({ t, size = 46 }) => (
  <svg viewBox="0 0 100 100"><text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight="700" fontFamily={MONO} fill="currentColor">{t}</text></svg>
)

const Art = ({ kind }) => {
  const p = { viewBox: '0 0 100 100', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' }
  if (kind === 'braces') return <Glyph t="{ }" size={50} />
  if (kind === 'tag') return <Glyph t="</>" size={44} />
  if (kind === 'arrow') return <Glyph t="=>" size={50} />
  if (kind === 'term') return (
    <svg {...p}><rect x="6" y="14" width="88" height="72" rx="9" /><path d="M6 30h88" /><circle cx="17" cy="22" r="2" fill="currentColor" /><circle cx="26" cy="22" r="2" fill="currentColor" /><path d="m22 48 12 9-12 9M44 68h22" /></svg>
  )
  if (kind === 'csharp') return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke"><path d="M50 4 90 27v46L50 96 10 73V27z" /><text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="700" fontFamily={MONO} fill="currentColor" stroke="none">C#</text></svg>
  )
  if (kind === 'branch') return (
    <svg {...p}><circle cx="26" cy="20" r="8" /><circle cx="26" cy="80" r="8" /><circle cx="74" cy="38" r="8" /><path d="M26 28v44M74 46c0 22-30 14-48 28" /></svg>
  )
  if (kind === 'db') return (
    <svg {...p}><ellipse cx="50" cy="22" rx="34" ry="12" /><path d="M16 22v56c0 7 15 12 34 12s34-5 34-12V22M16 50c0 7 15 12 34 12s34-5 34-12" /></svg>
  )
  if (kind === 'cube') return (
    <svg {...p}><path d="M50 6 88 27v46L50 94 12 73V27zM12 27l38 21 38-21M50 48v46" /></svg>
  )
  if (kind === 'react') return (
    <svg {...p}><ellipse cx="50" cy="50" rx="44" ry="17" /><ellipse cx="50" cy="50" rx="44" ry="17" transform="rotate(60 50 50)" /><ellipse cx="50" cy="50" rx="44" ry="17" transform="rotate(120 50 50)" /><circle cx="50" cy="50" r="5" fill="currentColor" /></svg>
  )
  return (
    <svg {...p}><path d="M50 16 18 72h64zM50 16v38M18 72l32-18 32 18" opacity=".7" /><circle cx="50" cy="16" r="7" /><circle cx="18" cy="72" r="7" /><circle cx="82" cy="72" r="7" /><circle cx="50" cy="54" r="4.5" fill="currentColor" /></svg>
  )
}

export default function FlowBackdrop() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    const items = [...el.querySelectorAll('.fb-item')].map((n) => ({
      n,
      blob: n.dataset.t === 'b',
      k: +n.dataset.k,
      u: +n.dataset.u, // 0..1 position along the page
      x: +n.dataset.x, // 0..1 across
      sz: +n.dataset.sz, // px (shapes) or vw (blobs)
      ph: +n.dataset.ph,
      z: +n.dataset.z,
      y0: 0,
      px: 0,
      size: 0,
      hid: true,
    }))
    let W = innerWidth
    let H = innerHeight
    let sm = view.y

    const layout = () => {
      W = innerWidth
      H = innerHeight
      const docH = Math.max(el.offsetHeight, H)
      for (const c of items) {
        c.y0 = c.u * docH
        c.size = c.blob ? (c.sz / 100) * W : c.sz * (W < 760 ? 0.62 : 1)
        c.px = c.x * W
        sStyle(c.n, 'width', c.size.toFixed(0) + 'px')
        sStyle(c.n, 'height', c.size.toFixed(0) + 'px')
      }
    }
    layout()
    const offR = onRealResize(layout)
    const ro = new ResizeObserver(layout)
    ro.observe(document.body)
    window.addEventListener('load', layout)

    const paint = (t) => {
      const T = reduce ? 0 : t / 1000
      const mx = reduce ? 0 : mouse.nx
      for (const c of items) {
        const off = (sm + H * 0.5 - c.y0) * (1 - c.k)
        const ay = c.y0 + off - sm // viewport y of the centre
        const out = ay < -c.size || ay > H + c.size
        if (out !== c.hid) { c.hid = out; sStyle(c.n, 'visibility', out ? 'hidden' : 'visible') }
        if (out) continue
        const fl = Math.sin(T * 0.45 + c.ph) * 10 * (0.4 + c.z * 0.3)
        const x = c.px - c.size / 2 - mx * 14 * (c.z + 0.5) + Math.cos(T * 0.35 + c.ph) * 8
        const y = c.y0 + off - c.size / 2 + fl
        if (c.blob) {
          sStyle(c.n, 'transform', `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`)
        } else {
          const d = sm - c.y0
          const ry = d * 0.06 + c.ph * 22
          const rx = 18 + clamp(d * 0.03, -30, 30) + Math.sin(T * 0.4 + c.ph) * 4
          sStyle(c.n, 'transform', `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) perspective(900px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${(d * -0.008 + c.ph * 6).toFixed(1)}deg)`)
        }
      }
    }
    const small = innerWidth < 760
    paint(0)
    const off = addFrameTask((t) => {
      sm = lerp(sm, view.y, small ? 0.16 : 0.12)
      if (Math.abs(view.y - sm) < 0.05) sm = view.y
      paint(t)
    })
    return () => { off(); offR(); ro.disconnect(); window.removeEventListener('load', layout) }
  }, [])

  const blobs = Array.from({ length: N_BLOB }, (_, i) => {
    const tier = TIER[i % 3]
    return {
      u: (i + 0.5) / N_BLOB,
      x: i % 2 ? 0.74 + rnd(i + 3) * 0.2 : 0.06 + rnd(i + 7) * 0.2,
      sz: 58 + rnd(i + 11) * 26,
      k: 0.55 + tier.k * 0.3 + rnd(i) * 0.12,
      col: COLORS[i % COLORS.length],
      a: 0.18 + rnd(i + 5) * 0.12,
      ph: rnd(i + 2) * 6,
    }
  })
  const shapes = Array.from({ length: N_SHAPE }, (_, i) => {
    const tier = TIER[i % 3]
    const left = i % 2 === 0
    return {
      kind: KINDS[i % KINDS.length],
      u: (i + 0.3 + rnd(i + 20) * 0.4) / N_SHAPE,
      x: left ? 0.06 + rnd(i + 1) * 0.28 : 0.66 + rnd(i + 4) * 0.28,
      sz: tier.size * (0.85 + rnd(i + 9) * 0.35),
      k: tier.k,
      z: tier.z,
      a: tier.a,
      col: GLYPH[i % GLYPH.length],
      ph: (rnd(i + 30) - 0.5) * 3,
      m: i % 2 ? 0 : 1,
    }
  })

  return (
    <div className="flowbg" ref={root} aria-hidden="true">
      {blobs.map((b, i) => (
        <div className="fb-item fb-blob" key={'b' + i} data-t="b" data-k={b.k.toFixed(3)} data-u={b.u} data-x={b.x.toFixed(3)} data-sz={b.sz.toFixed(1)} data-ph={b.ph.toFixed(2)} data-z="0"
          style={{ '--c': b.col, '--a': b.a.toFixed(2), '--d': `${(9 + (i % 5) * 2.4).toFixed(1)}s` }}><i /></div>
      ))}
      {shapes.map((s, i) => (
        <div className="fb-item fb-shape" key={'s' + i} data-t="s" data-m={s.m} data-k={s.k} data-u={s.u.toFixed(4)} data-x={s.x.toFixed(3)} data-sz={s.sz.toFixed(0)} data-ph={s.ph.toFixed(2)} data-z={s.z}
          style={{ '--c': s.col, '--a': s.a }}><Art kind={s.kind} /></div>
      ))}
    </div>
  )
}
