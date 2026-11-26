import { useRef, useState } from 'react'
import { profile } from '../data/portfolio'
import Venom from './Venom'

export default function Contact() {
  const [toast, setToast] = useState(false)
  const form = useRef(null)

  // No backend: sending opens the visitor's email app, addressed to me and pre-filled.
  const onSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(form.current)
    const name = String(f.get('name')).trim()
    const email = String(f.get('email')).trim()
    const msg = String(f.get('message')).trim()
    const body = `Hi Dinesh Kumar G, I'm ${name}${email ? ` (${email})` : ''}.\n\n${msg}`
    setToast(true)
    setTimeout(() => setToast(false), 4200)
    window.sparkBurst?.(innerWidth / 2, innerHeight / 2)
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(`Portfolio enquiry from ${name}`)}&body=${encodeURIComponent(body)}`
    form.current.reset()
  }

  return (
    <section id="contact" className="sec">
      <div className="head">
        <span className="eyebrow">Get In Touch</span>
        <h2 className="h2" data-reveal>Contact.</h2>
        <div className="bar" />
      </div>
      <div className="contact-w">
        <a href={profile.phoneHref} className="wa glass" data-reveal style={{ '--d': '.05s' }}>
          <span className="wa-ic">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" /></svg>
          </span>
          <span><span className="l">Call Dinesh Kumar G</span><span className="n">{profile.phoneDisplay}</span></span>
          <span className="cta">Call now →</span>
        </a>
        <a href={`mailto:${profile.email}`} className="wa glass" data-reveal>
          <span className="wa-ic">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.6 7H4v.4l8 5.6 8-5.6V7h-.6L12 12.2z" /></svg>
          </span>
          <span><span className="l">Email</span><span className="n">{profile.email}</span></span>
          <span className="cta">Send mail →</span>
        </a>
        <div className="red-halo" />
        <div className="form-card glass glass-panel hov" data-reveal style={{ '--d': '.1s' }}>
          <form ref={form} onSubmit={onSubmit}>
            <div className="row2">
              <div className="field">
                <label htmlFor="fName">Your Name</label>
                <input id="fName" name="name" className="glass-input" required placeholder="Your Name" type="text" autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="fEmail">Your Email</label>
                <input id="fEmail" name="email" className="glass-input" required placeholder="your.email@example.com" type="email" autoComplete="email" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="fMsg">Message &amp; Project Details</label>
              <textarea id="fMsg" name="message" className="glass-input" required rows="6" placeholder="Tell me about the role or project you have in mind..." />
            </div>
            <Venom label="Send Message" type="submit" width={220} height={60} style={{ alignSelf: 'center', marginTop: '.5rem' }} />
          </form>
        </div>
      </div>
      <div className={`toast glass${toast ? ' show' : ''}`} role="status">Opening your email app with your message...</div>
    </section>
  )
}
