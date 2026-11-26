import { useRef } from 'react'
import { services } from '../data/portfolio'
import { useSpotlight } from '../lib/useSpotlight'

export default function Services() {
  const list = useRef(null)
  useSpotlight(list, '.glass-card')
  return (
    <section id="services" className="sec">
      <div className="head">
        <span className="eyebrow" style={{ fontSize: '.75rem' }}>What I Offer</span>
        <h2 className="h2" data-reveal style={{ fontSize: 'clamp(2rem,5vw,3rem)' }}>Services.</h2>
        <div className="bar" style={{ width: '3rem', height: '4px', marginTop: '.5rem' }} />
      </div>
      <ul className="svc-list grid-blur" ref={list}>
        {services.map((s, i) => (
          <li key={s.title} data-reveal style={{ '--d': `${i * 0.08}s` }}>
            <a href="#contact" className="svc glass glass-card">
              <span className="card-spotlight" />
              <span className="num glass-chip">{String(i + 1).padStart(2, '0')}</span>
              <div className="svc-body">
                <div>
                  <h3>{s.title}</h3>
                  {s.badge && <span className="badge glass-chip-red">{s.badge}</span>}
                  <p className="svc-d">{s.text}</p>
                </div>
                <div className="price-w">
                  <span className="price-l">Stack</span>
                  <span className="price glass-chip">{s.stack}</span>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <p className="note" data-reveal>*Message me to discuss your project requirements.</p>
    </section>
  )
}
