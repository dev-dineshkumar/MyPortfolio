import { useEffect, useRef } from 'react'
import { skills } from '../data/portfolio'
import { useSpotlight } from '../lib/useSpotlight'

export default function Skills() {
  const grid = useRef(null)
  useSpotlight(grid, '.glass-card')

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.5 },
    )
    grid.current.querySelectorAll('.meter').forEach((m) => io.observe(m))
    return () => io.disconnect()
  }, [])

  return (
    <section id="skills" className="sec">
      <div className="head">
        <span className="eyebrow">Expertise</span>
        <h2 className="h2" data-reveal>Technical Skills.</h2>
        <div className="bar" />
      </div>
      <div style={{ position: 'relative' }}>
        <div className="red-halo" />
        <div className="skill-grid grid-blur" ref={grid}>
          {skills.map((s, i) => (
            <div className="skill glass glass-card" key={s.title} data-reveal style={{ '--d': `${i * 0.06}s` }}>
              <span className="card-spotlight" />
              <div><h3>{s.title}</h3><small>{s.small}</small></div>
              <span className="lvl glass-chip">{s.since}</span>
              <span className="meter"><i style={{ '--w': `${s.w}%` }} /></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
