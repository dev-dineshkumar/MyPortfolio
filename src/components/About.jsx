import { useEffect, useRef } from 'react'
import { about, profile } from '../data/portfolio'
import { addFrameTask, clamp, onMeasure, onRealResize, sStyle, view } from '../lib/runtime'

/** Photo frame hung from two strings: drag it, flick it, or scroll — it swings like a pendulum. */
function HangingFrame() {
  const swing = useRef(null)
  const frame = useRef(null)
  const glare = useRef(null)
  const svg = useRef(null)
  const L = useRef(null)
  const R = useRef(null)

  useEffect(() => {
    const sw = swing.current
    let a = 0
    let v = 0
    let ry = 0
    let rv = 0
    let drag = false
    let startA = 0
    let startX = 0
    let lastSY = view.y
    let visible = true

    const strings = () => {
      const w = sw.offsetWidth
      const h = svg.current.getBoundingClientRect().height
      const fw = frame.current.offsetWidth
      const fl = (w - fw) / 2
      svg.current.setAttribute('viewBox', `0 0 ${w} ${h}`)
      ;[[L.current, fl + fw * 0.12], [R.current, fl + fw * 0.88]].forEach(([ln, x]) => {
        ln.setAttribute('x1', w / 2)
        ln.setAttribute('y1', 0)
        ln.setAttribute('x2', x)
        ln.setAttribute('y2', h - 2)
      })
    }
    strings()
    const offA = onRealResize(strings)
    const offB = onMeasure(strings)

    const down = (e) => { drag = true; startX = e.clientX; startA = a; sw.setPointerCapture(e.pointerId); sw.classList.add('grab') }
    const move = (e) => {
      if (drag) {
        const na = clamp(startA + (e.clientX - startX) * 0.12, -38, 38)
        v = na - a
        a = na
      } else {
        v += clamp(e.movementX || 0, -40, 40) * 0.02
        rv = clamp(rv + clamp(e.movementY || 0, -40, 40) * 0.02, -3, 3)
      }
    }
    const up = () => { drag = false; sw.classList.remove('grab') }
    sw.addEventListener('pointerdown', down, { passive: true })
    sw.addEventListener('pointermove', move)
    sw.addEventListener('pointerup', up)
    sw.addEventListener('pointercancel', up)
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting }, { rootMargin: '100px' })
    io.observe(sw)

    const offT = addFrameTask((t) => {
      const ds = view.y - lastSY
      lastSY = view.y
      if (!visible) return
      if (!drag) {
        v += -a * 0.012
        v *= 0.985
        v += clamp(ds, -60, 60) * 0.004 // scrolling nudges the frame
        v = clamp(v, -2.5, 2.5)
        a = clamp(a + v, -30, 30)
      }
      rv += -ry * 0.03
      rv *= 0.93
      ry += rv
      const idle = Math.sin(t / 1600) * 1.2
      sStyle(sw, 'transform', `rotateZ(${(a + idle).toFixed(3)}deg) rotateY(${(a * 0.6).toFixed(3)}deg) rotateX(${ry.toFixed(3)}deg)`)
      sStyle(glare.current, 'transform', `translateX(${(-a * 3).toFixed(3)}%)`)
    })
    return () => {
      offA(); offB(); offT()
      io.disconnect()
      sw.removeEventListener('pointerdown', down)
      sw.removeEventListener('pointermove', move)
      sw.removeEventListener('pointerup', up)
      sw.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div className="hang-rig">
      <span className="hang-nail" />
      <div className="hang-swing" ref={swing}>
        <svg className="hang-strings" ref={svg} preserveAspectRatio="none">
          <line ref={L} />
          <line ref={R} />
        </svg>
        <div className="hang-frame" ref={frame}>
          <span className="hang-ring hang-ring-l" />
          <span className="hang-ring hang-ring-r" />
          <div className="photo">
            <img src="/profile.webp" alt={`${profile.name}, ${profile.role}`} draggable="false" decoding="async" />
            <div className="fade" />
            <div className="hang-glare" ref={glare} />
            <div className="cap"><b>{profile.shortName}</b><span>{profile.role}</span></div>
          </div>
        </div>
        <div className="hang-shadow" />
      </div>
    </div>
  )
}

export default function About() {
  return (
    <section id="about" className="sec" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="about-grid" style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span className="eyebrow" data-reveal>The Story Behind The Code</span>
            <h2 className="about-h" data-reveal style={{ '--d': '.08s' }}>About {profile.name.split(' ').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ').replace(/ g$/i, ' G')}.</h2>
            <div className="bar" data-reveal style={{ '--d': '.16s', width: '6rem' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <div className="red-halo" />
            <div className="panel glass glass-panel hov" data-reveal style={{ '--d': '.2s' }}>
              <p>{about.paragraph}</p>
              <div>
                <h3 className="kit-h">Core Toolkit &amp; Proficiencies</h3>
                <div className="pills">
                  {about.pills.map((t, i) => (
                    <span key={t} className="pill glass-chip" data-reveal style={{ '--d': `${0.3 + i * 0.06}s` }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', '--d': '.2s' }} data-reveal>
          <HangingFrame />
          <p className="hint">Drag or swipe the frame</p>
        </div>
      </div>
    </section>
  )
}
