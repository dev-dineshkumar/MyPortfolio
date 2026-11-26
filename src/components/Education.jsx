import { useRef } from 'react'
import { education } from '../data/portfolio'
import { useSpotlight } from '../lib/useSpotlight'

export default function Education() {
  const grid = useRef(null)
  useSpotlight(grid, '.glass-card')
  return (
    <section id="education" className="sec">
      <div className="head">
        <span className="eyebrow">Education &amp; Achievements</span>
        <h2 className="h2" data-reveal>Education.</h2>
        <div className="bar" />
      </div>
      <div style={{ position: 'relative' }}>
        <div className="red-halo" />
        <div className="skill-grid edu-grid grid-blur" ref={grid}>
          {education.map((e, i) => (
            <div className="skill glass glass-card" key={e.title} data-reveal style={{ '--d': `${i * 0.08}s` }}>
              <span className="card-spotlight" />
              <div><h3>{e.title}</h3><small>{e.small}</small></div>
              <span className="lvl glass-chip">{e.chip}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
