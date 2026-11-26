import { useEffect, useRef } from 'react'
import { stats } from '../data/portfolio'
import { addFrameTask, clamp } from '../lib/runtime'
import { useSpotlight } from '../lib/useSpotlight'

const ICONS = [
  <path key="a" d="M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h3" />,
  <path key="b" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4" />,
  <path key="c" d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />,
]

/** "At a glance": three glass panels with a count-up and a light that follows the pointer. */
export default function Stats() {
  const grid = useRef(null)
  useSpotlight(grid, '.stat-panel')

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return
        io.unobserve(e.target)
        const el = e.target
        const to = +el.dataset.count
        const t0 = performance.now()
        const off = addFrameTask((t) => {
          const p = clamp((t - t0) / 1800, 0, 1)
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)))
          if (p >= 1) off()
        })
      }),
      { threshold: 0.6 },
    )
    grid.current.querySelectorAll('[data-count]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="stats" className="sec">
      <p className="stats-title" data-reveal>At a glance</p>
      <div className="stats" data-reveal style={{ '--d': '.1s' }} ref={grid}>
        {stats.map((s, i) => (
          <div className="stat-panel" key={s.label}>
            <div className="stat-light" />
            <div className="stat-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[i % ICONS.length]}</svg>
            </div>
            <div className="stat-fig">
              <span data-count={s.value}>0</span>
              <span className="stat-suffix">{s.suffix}</span>
            </div>
            <div className="stat-line" />
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
