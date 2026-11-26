import { profile } from '../data/portfolio'

export default function Footer() {
  return (
    <footer>
      <div className="foot">
        <div>
          <a href="#hero" className="logo"><span className="a">{profile.logoFirst}</span><span className="b">{profile.logoRest}</span></a>
          <small>
            <span>{profile.role}.</span>
            {profile.footerAddress.map((line) => <span key={line}>{line}</span>)}
          </small>
        </div>
        <div className="foot-links">
          <a href="#hero">Top</a>
          <a href="#about">About</a>
          <a href="#projects">Work</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  )
}
