import { useEffect, useRef, useState } from 'react'
import { navLinks, profile } from '../data/portfolio'
import { addFrameTask, onMeasure, view } from '../lib/runtime'

/** Floating glass nav: hides while scrolling down, underlines the section in view. */
export default function Nav() {
  const nav = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = nav.current
    const links = [...el.querySelectorAll('.links a')]
    const secs = navLinks.map((l) => ({ id: l.id, el: document.getElementById(l.id), top: 0 }))
    const measure = () => { for (const s of secs) if (s.el) s.top = s.el.getBoundingClientRect().top + view.y }
    measure()
    const offM = onMeasure(measure)
    let ly = view.y
    let hidden = false
    let cur = null
    const offT = addFrameTask(() => {
      const y = view.y
      if (y === ly) return
      const h = y > ly && y > 300
      ly = y
      if (h !== hidden) { hidden = h; el.classList.toggle('hide', h) }
      let now = ''
      for (const s of secs) if (s.top - y < view.h * 0.4) now = s.id
      if (now !== cur) { cur = now; links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + now)) }
    })
    return () => { offM(); offT() }
  }, [])

  return (
    <nav id="nav" ref={nav} className={open ? 'menu-open' : undefined}>
      <div className="nav-in glass">
        <a href="#hero" className="logo" aria-label={`${profile.name} – home`}>
          <span className="a">{profile.logoFirst}</span>
          <span className="b">{profile.logoRest}</span>
        </a>
        <div className="links">
          {navLinks.map((l) => (
            <a key={l.id} href={`#${l.id}`}>{l.label}<i /></a>
          ))}
        </div>
        <a href="#contact" className="talk glass-red">Let's Talk</a>
        <button
          type="button"
          className="menu-btn"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      <div className="mobile-menu glass">
        {navLinks.map((l) => (
          <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a href="#contact" className="glass-red" onClick={() => setOpen(false)}>Let's Talk</a>
      </div>
    </nav>
  )
}
