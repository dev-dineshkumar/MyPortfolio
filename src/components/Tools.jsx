import { tools } from '../data/portfolio'
import { Marquee, MarqueeZone } from './Marquee'

const chip = ([name, abbr, color, bg]) => (
  <div className="tool glass-chip">
    <span className="ic" style={{ background: bg, color, boxShadow: `inset 0 0 0 1.5px ${color}55` }}>{abbr}</span>
    {name}
  </div>
)

/** Development Tools: two slow, endless left-to-right tickers (the second runs a little slower, from another start point). */
export default function Tools() {
  const half = Math.ceil(tools.length / 2)
  return (
    <section id="tools" className="sec arsenal">
      <div className="head">
        <span className="eyebrow">Development Tools</span>
        <h2 className="h2" data-reveal>My Toolkit.</h2>
        <div className="bar" />
      </div>
      <MarqueeZone label="Development tools">
        <Marquee items={tools.slice(0, half)} speed={42} render={chip} label="Development tools" />
        <Marquee items={tools.slice(half)} speed={34} offset={1} render={chip} label="More development tools" />
      </MarqueeZone>
    </section>
  )
}
