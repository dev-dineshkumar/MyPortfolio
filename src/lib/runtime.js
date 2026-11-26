// Shared runtime: one requestAnimationFrame loop for every per-frame job, plus the
// scroll / pointer / resize state the effects read. Jobs register with addFrameTask
// and get back a function that unregisters them.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
export const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches

export const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 }
export const view = { y: window.scrollY, w: innerWidth, h: innerHeight, t: 0 }

const reads = new Set()
const tasks = new Set()
export const addFrameRead = (f) => (reads.add(f), () => reads.delete(f))
export const addFrameTask = (f) => (tasks.add(f), () => tasks.delete(f))

function frame(t) {
  view.t = t
  view.y = window.scrollY
  for (const f of reads) f(t)
  for (const f of tasks) f(t)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

addEventListener('scroll', () => { view.y = window.scrollY }, { passive: true })
addEventListener(
  'pointermove',
  (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
    mouse.nx = (e.clientX / innerWidth) * 2 - 1
    mouse.ny = (e.clientY / innerHeight) * 2 - 1
  },
  { passive: true },
)

// Write a style/attribute only when it actually changed (skips redundant invalidation).
export function sStyle(el, prop, val) {
  const c = el.__sc || (el.__sc = {})
  if (c[prop] !== val) { c[prop] = val; el.style[prop] = val }
}
export function sAttr(el, name, val) {
  const c = el.__ac || (el.__ac = {})
  if (c[name] !== val) { c[name] = val; el.setAttribute(name, val) }
}

// Mobile browsers fire `resize` when the URL bar slides away. Heavy rebuilds only run on a
// real width change; cheap re-measures run more often.
const heavy = new Set()
const measure = new Set()
export const onRealResize = (f) => (heavy.add(f), () => heavy.delete(f))
export const onMeasure = (f) => (measure.add(f), () => measure.delete(f))
export const runMeasure = () => measure.forEach((f) => f())
let lw = innerWidth
let lh = innerHeight
addEventListener(
  'resize',
  () => {
    view.w = innerWidth
    view.h = innerHeight
    const real = view.w !== lw || Math.abs(view.h - lh) > 140
    if (!real) return
    lw = view.w
    lh = view.h
    heavy.forEach((f) => f())
    runMeasure()
  },
  { passive: true },
)
addEventListener('load', () => { lw = innerWidth; lh = innerHeight; runMeasure() })
// Content that settles late (web fonts, the phone hero re-sizing itself) moves every section below it,
// so cached offsets are re-measured whenever the page's height changes.
if (window.ResizeObserver) new ResizeObserver(() => runMeasure()).observe(document.body)

// Hero intro: fired when the loader finishes.
export const intro = { t: Infinity, done: false, subs: new Set() }
export function fireIntro() {
  intro.done = true
  intro.t = performance.now()
  intro.subs.forEach((f) => f())
}
export function onIntro(f) {
  if (intro.done) f()
  else intro.subs.add(f)
  return () => intro.subs.delete(f)
}
