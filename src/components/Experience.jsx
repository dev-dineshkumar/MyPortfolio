import { useRef } from 'react'
import { experience } from '../data/portfolio'
import { useSpotlight } from '../lib/useSpotlight'

/** Work experience, in the same glass-card list style as the services. */
export default function Experience() {
  const list = useRef(null)
  useSpotlight(list, '.glass-card')
  return (
    <section id="experience" className="sec">
      <div className="head">
        <span className="eyebrow" style={{ fontSize: '.75rem' }}>Where I've Worked</span>
        <h2 className="h2" data-reveal style={{ fontSize: 'clamp(2rem,5vw,3rem)' }}>Experience.</h2>
        <div className="bar" style={{ width: '3rem', height: '4px', marginTop: '.5rem' }} />
      </div>
      <ul className="svc-list job-list grid-blur" ref={list}>
        {experience.map((j, i) => (
          <li key={j.company} data-reveal style={{ '--d': `${i * 0.1}s` }}>
            <article className="svc job glass glass-card">
              <span className="card-spotlight" />
              <span className="num glass-chip">{String(i + 1).padStart(2, '0')}</span>
              <div className="job-body">
                <div className="job-top">
                  <div>
                    <h3>{j.role}</h3>
                    <p className="job-co">{j.company} <span>· {j.location}</span></p>
                    {j.current && <span className="badge glass-chip-red">Current</span>}
                  </div>
                  <div className="price-w">
                    <span className="price-l">Period</span>
                    <span className="price glass-chip">{j.period}</span>
                  </div>
                </div>
                <ul className="job-points">
                  {j.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <ul className="job-tags" aria-label="Technologies used">
                  {j.tech.map((t) => <li key={t} className="glass-chip">{t}</li>)}
                </ul>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
