import { useEffect, useRef, useState } from 'react'

/**
 * Seamless, infinite left-to-right ticker.
 * The track holds N identical groups and slides exactly one group's width, so the loop point is
 * invisible. N is chosen so the groups always cover the viewport (no gap on wide screens), and the
 * duration follows the measured width so the speed (px/s) is the same on every device. There is no
 * scrollbar and no manual scrolling. Copies are aria-hidden.
 */
export function Marquee({ items, speed = 38, offset = 0, render, label }) {
  const row = useRef(null)
  const first = useRef(null)
  const [fit, setFit] = useState({ n: 3, dur: 60 })

  useEffect(() => {
    const measure = () => {
      const gw = first.current?.getBoundingClientRect().width || 0
      const vw = row.current?.getBoundingClientRect().width || innerWidth
      if (!gw) return
      const n = Math.max(2, Math.ceil(vw / gw) + 1)
      const dur = Math.round((gw / (innerWidth < 640 ? speed * 0.75 : speed)) * 10) / 10
      setFit((f) => (f.n === n && f.dur === dur ? f : { n, dur }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(row.current)
    ro.observe(first.current)
    document.fonts?.ready?.then(measure)
    return () => ro.disconnect()
  }, [speed])

  return (
    <div className="marquee" ref={row} role="group" aria-label={label} data-reveal style={{ '--d': `${offset * 0.06}s` }}>
      <div className="marquee-track" style={{ '--n': fit.n, '--dur': `${fit.dur}s`, '--delay': `${-(fit.dur * (0.15 + offset * 0.37)).toFixed(1)}s` }}>
        {Array.from({ length: fit.n }, (_, g) => (
          <ul className="marquee-group" key={g} ref={g === 0 ? first : undefined} aria-hidden={g ? 'true' : undefined}>
            {items.map((it, i) => <li key={i}>{render(it)}</li>)}
          </ul>
        ))}
      </div>
    </div>
  )
}

/** Click (or Enter / Space) anywhere on the tickers to pause them; click again to resume. */
export function MarqueeZone({ children, label }) {
  const [paused, setPaused] = useState(false)
  const toggle = () => setPaused((p) => !p)
  return (
    <div
      className={`marquee-zone${paused ? ' paused' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={paused}
      aria-label={`${label}: ${paused ? 'paused, press to resume' : 'moving, press to pause'}`}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
    >
      {children}
      <span className="mz-hint" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">{paused ? <path d="M7 4.5v15l13-7.5z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}</svg>
        {paused ? 'Paused · click to resume' : 'Click to pause'}
      </span>
    </div>
  )
}
