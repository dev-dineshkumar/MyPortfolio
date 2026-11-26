import { useEffect, useRef, useState } from 'react'
import { profile } from '../data/portfolio'
import { clamp, fireIntro, reduce, runMeasure } from '../lib/runtime'

/** Glitch loader: odometer counter 0→100, a statement that types in word by word, then a glitchy reveal. */
export default function Loader() {
  const root = useRef(null)
  const count = useRef(null)
  const statement = useRef(null)
  const bar = useRef(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const words = profile.loaderWords
    const st = statement.current
    st.innerHTML = words
      .map((w, i) => `<span class="glitch-loader__word${i === words.length - 1 ? ' red' : ''}">${w}</span>`)
      .join('')
    // five horizontal slices of the statement, flung sideways during the reveal
    for (let i = 0; i < 5; i++) {
      const f = document.createElement('p')
      f.className = `glitch-loader__frag glitch-loader__frag--${i}`
      f.textContent = words.join(' ')
      st.parentElement.appendChild(f)
    }
    const strip = () =>
      `<div class="glitch-loader__digit"><div class="glitch-loader__strip">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((d) => `<span>${d}</span>`)
        .join('')}</div></div>`
    const cnt = count.current
    cnt.innerHTML = strip() + strip() + strip() + '<span class="glitch-loader__pct">%</span>'
    const strips = [...cnt.querySelectorAll('.glitch-loader__strip')]
    const digits = [...cnt.querySelectorAll('.glitch-loader__digit')]
    const setN = (n) => {
      const s = String(n).padStart(3, '0')
      digits[0].style.display = n >= 100 ? '' : 'none'
      digits[1].style.display = n >= 10 ? '' : 'none'
      s.split('').forEach((d, i) => (strips[i].style.transform = `translateY(${-d}em)`))
      bar.current.style.width = n + '%'
    }
    strips[2].style.transition = 'none'
    setN(0)

    const wEls = [...st.querySelectorAll('.glitch-loader__word')]
    const dur = reduce ? 200 : 2000
    const t0 = performance.now()
    let raf = 0
    const timers = []
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1)
      setN(Math.round((1 - Math.pow(1 - p, 2.2)) * 100))
      wEls.forEach((w, i) => w.classList.toggle('on', p > (i + 0.5) / (wEls.length + 1.5)))
      if (p < 1) raf = requestAnimationFrame(step)
      else timers.push(setTimeout(reveal, 260))
    }
    const reveal = () => {
      root.current.classList.add('is-revealing')
      document.body.classList.remove('loading')
      runMeasure() // scrollbar appears here, so cached offsets are stale
      timers.push(setTimeout(fireIntro, 250))
      timers.push(setTimeout(() => setGone(true), 1100))
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
    }
  }, [])

  if (gone) return null
  return (
    <div className="glitch-loader" ref={root} aria-hidden="true">
      <div className="glitch-loader__veil" />
      <div className="glitch-loader__count" ref={count} />
      <div className="glitch-loader__center">
        <p className="glitch-loader__statement" ref={statement} />
      </div>
      <div className="glitch-loader__bar" ref={bar} />
    </div>
  )
}
