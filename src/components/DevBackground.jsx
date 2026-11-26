import { useEffect, useRef } from 'react'
import { addFrameTask, finePointer, lerp, mouse, onRealResize, reduce, sStyle, view } from '../lib/runtime'

/**
 * Developer-workspace backdrop, laid out like a studio rather than scattered at random:
 *  - two rails (left and right edge) of "windows" so the centre column stays clear for content
 *  - three depth tiers (near / mid / far) with one consistent size, opacity and tilt per tier
 *  - each rail mixes editor windows (React, C#, JavaScript, SQL, HTML, CSS), terminals (.NET, Git),
 *    a GitHub pull-request card and one "stack" panel with the technology logos
 *  - the rails turn in towards the page (real CSS 3D), drift with scroll at a speed set by depth,
 *    float gently and shift with the pointer
 * All windows are real, syntax-highlighted DOM, positioned with transforms only. Terminals type
 * with a CSS animation. Under reduced motion it still follows scroll; the float and typing stop.
 */

const S = ({ k, children }) => <span className={`t-${k}`}>{children}</span>

function Win({ file, tag, tagColor, lines, kind }) {
  return (
    <div className={`dwin ${kind || ''}`}>
      <div className="dbar">
        <i /><i /><i />
        <span className="dfile">{file}</span>
        <em style={{ color: tagColor, borderColor: tagColor }}>{tag}</em>
      </div>
      <div className="dcode">
        {lines.map((l, i) => <div className="dl" key={i}><b className="ln">{i + 1}</b>{l}</div>)}
      </div>
    </div>
  )
}

function Term({ title, lines }) {
  return (
    <div className="dwin term">
      <div className="dbar"><i /><i /><i /><span className="dfile">{title}</span></div>
      <div className="dcode">
        {lines.map(([cmd, text], i) => (
          <div className="tl" key={i} style={{ '--n': text.length, '--i': i }}>
            {cmd && <S k="st">$ </S>}
            <span className={cmd ? 't-tx' : 't-pu'}>{text}</span>
          </div>
        ))}
        <span className="tcaret" />
      </div>
    </div>
  )
}

const Icon = {
  react: (
    <svg viewBox="-12 -12 24 24" fill="none" stroke="#61dafb" strokeWidth="1.1"><circle r="1.8" fill="#61dafb" stroke="none" /><ellipse rx="10" ry="4" /><ellipse rx="10" ry="4" transform="rotate(60)" /><ellipse rx="10" ry="4" transform="rotate(120)" /></svg>
  ),
  sql: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ffb82e" strokeWidth="1.6"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>
  ),
  git: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ff7a59" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="5" r="2.2" /><circle cx="6" cy="19" r="2.2" /><circle cx="18" cy="9" r="2.2" /><path d="M6 7.2v9.6M18 11.2c0 4-6 3-11 6.2" /></svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="#e6edf3"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" /></svg>
  ),
}

const Logo = ({ name, label, bg, fg, children }) => (
  <div className="lg">
    <span className="lgi" style={{ background: bg, color: fg }}>{children || name}</span>
    <small>{label}</small>
  </div>
)

function Stack() {
  return (
    <div className="dwin stack">
      <div className="dbar"><i /><i /><i /><span className="dfile">tech-stack</span></div>
      <div className="lgrid">
        <Logo label="React" bg="#0b2a33">{Icon.react}</Logo>
        <Logo label="JavaScript" name="JS" bg="#f7df1e" fg="#222" />
        <Logo label="C#" name="C#" bg="#68217a" fg="#fff" />
        <Logo label=".NET" name=".NET" bg="#512bd4" fg="#fff" />
        <Logo label="SQL" bg="#2a1a05">{Icon.sql}</Logo>
        <Logo label="HTML" name="5" bg="#e44d26" fg="#fff" />
        <Logo label="CSS" name="3" bg="#1572b6" fg="#fff" />
        <Logo label="Git" bg="#2a0f08">{Icon.git}</Logo>
        <Logo label="GitHub" bg="#161b22">{Icon.github}</Logo>
      </div>
    </div>
  )
}

function Pull() {
  return (
    <div className="dwin pr">
      <div className="dbar"><i /><i /><i /><span className="dfile">github.com</span><em style={{ color: '#e6edf3', borderColor: '#8b949e' }}>GitHub</em></div>
      <div className="prbody">
        <div className="prh"><span className="prico">{Icon.github}</span><b>feat: add JWT authentication</b></div>
        <div className="prbr"><S k="ty">feature/auth</S><S k="pu"> → </S><S k="ty">main</S></div>
        <div className="prrow"><span className="ok">✓</span> All checks have passed</div>
        <div className="prrow"><span className="mg">⑂</span> Merged · 1 commit</div>
      </div>
    </div>
  )
}

// lane, tier (near | mid | far), element. Order inside a lane = order down the page.
const ITEMS = [
  ['l', 'near', 'm1', (
    <Win file="App.jsx" tag="React" tagColor="#61dafb" lines={[
      <><S k="kw">function </S><S k="fn">Counter</S><S k="pu">() {'{'}</S></>,
      <><S k="kw">  const </S><S k="tx">[n, setN]</S><S k="pu"> = </S><S k="fn">useState</S><S k="pu">(</S><S k="st">0</S><S k="pu">);</S></>,
      <><S k="kw">  return </S><S k="pu">&lt;</S><S k="ty">button</S><S k="pu">&gt;</S><S k="tx">{'{n}'}</S><S k="pu">&lt;/</S><S k="ty">button</S><S k="pu">&gt;</S></>,
      <S k="pu">{'}'}</S>,
    ]} />
  )],
  ['l', 'mid', 'm0', (
    <Term title="terminal — .NET" lines={[[1, 'dotnet build'], [0, 'Build succeeded.'], [1, 'dotnet run'], [0, 'Listening on https://localhost:5001']]} />
  )],
  ['l', 'far', 'm0', (
    <Win file="query.sql" tag="SQL" tagColor="#ffb82e" lines={[
      <><S k="kw">SELECT </S><S k="tx">Name, Fees</S></>,
      <><S k="kw">FROM </S><S k="ty">Students</S></>,
      <><S k="kw">WHERE </S><S k="tx">Active = </S><S k="st">1</S></>,
      <><S k="kw">ORDER BY </S><S k="tx">Name;</S></>,
    ]} />
  )],
  ['l', 'mid', 'm1', <Stack />],
  ['l', 'far', 'm0', (
    <Win file="style.css" tag="CSS" tagColor="#6eb4ff" lines={[
      <><S k="ty">.card</S><S k="pu"> {'{'}</S></>,
      <><S k="tx">  display</S><S k="pu">: </S><S k="st">grid</S><S k="pu">;</S></>,
      <><S k="tx">  gap</S><S k="pu">: </S><S k="st">1rem</S><S k="pu">;</S></>,
      <S k="pu">{'}'}</S>,
    ]} />
  )],
  ['r', 'near', 'm1', (
    <Win file="Program.cs" tag="C#" tagColor="#c9a8ff" lines={[
      <><S k="kw">var </S><S k="tx">app</S><S k="pu"> = </S><S k="tx">builder.</S><S k="fn">Build</S><S k="pu">();</S></>,
      <><S k="tx">app.</S><S k="fn">UseAuthentication</S><S k="pu">();</S></>,
      <><S k="tx">app.</S><S k="fn">MapControllers</S><S k="pu">();</S></>,
      <><S k="tx">app.</S><S k="fn">Run</S><S k="pu">();</S></>,
    ]} />
  )],
  ['r', 'mid', 'm0', (
    <Win file="api.js" tag="JavaScript" tagColor="#ffd166" lines={[
      <><S k="kw">const </S><S k="tx">res</S><S k="pu"> = </S><S k="kw">await </S><S k="fn">fetch</S><S k="pu">(</S><S k="st">'/api/modules'</S><S k="pu">);</S></>,
      <><S k="kw">const </S><S k="tx">data</S><S k="pu"> = </S><S k="kw">await </S><S k="tx">res.</S><S k="fn">json</S><S k="pu">();</S></>,
      <><S k="fn">setModules</S><S k="pu">(</S><S k="tx">data</S><S k="pu">);</S></>,
    ]} />
  )],
  ['r', 'mid', 'm1', (
    <Term title="terminal — Git" lines={[[1, 'git add .'], [1, 'git commit -m "feat: api"'], [1, 'git push origin main'], [0, 'main -> origin/main']]} />
  )],
  ['r', 'far', 'm0', <Pull />],
  ['r', 'far', 'm0', (
    <Win file="index.html" tag="HTML" tagColor="#ff966e" lines={[
      <><S k="pu">&lt;</S><S k="kw">section</S><S k="ty"> id</S><S k="pu">=</S><S k="st">"home"</S><S k="pu">&gt;</S></>,
      <><S k="pu">  &lt;</S><S k="kw">h1</S><S k="pu">&gt;</S><S k="tx">Hello</S><S k="pu">&lt;/</S><S k="kw">h1</S><S k="pu">&gt;</S></>,
      <><S k="pu">&lt;/</S><S k="kw">section</S><S k="pu">&gt;</S></>,
    ]} />
  )],
]

const TIER = { near: 1, mid: 0.72, far: 0.5 }

export default function DevBackground() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    const nodes = [...el.querySelectorAll('.rail-item')]
    let cfg = []
    let W = innerWidth
    let H = innerHeight
    let sm = view.y

    const layout = () => {
      W = innerWidth
      H = innerHeight
      cfg = nodes.map((n) => ({ n, lane: n.dataset.lane, z: +n.dataset.z, ph: +n.dataset.ph, w: n.offsetWidth, h: n.offsetHeight, slot: 0, cnt: 1, live: n.offsetParent !== null }))
      for (const lane of ['l', 'r']) {
        const live = cfg.filter((c) => c.lane === lane && c.live)
        live.forEach((c, i) => { c.slot = i; c.cnt = live.length })
      }
    }
    layout()
    const offR = onRealResize(layout)
    window.addEventListener('load', layout)
    document.fonts?.ready?.then(layout)

    const paint = (t, still) => {
      const s = still ? view.y : sm
      const T = still || reduce ? 0 : t / 1000
      const span = H + 480
      const edge = W >= 1700 ? 24 : W >= 1366 ? -28 : W >= 1100 ? -64 : W >= 760 ? -80 : -90
      const fade = W < 760 ? 0.24 : W < 1100 ? 0.72 : 1
      for (const c of cfg) {
        if (!c.live) continue
        const P = span / c.cnt
        const speed = 0.34 + 0.5 * c.z
        const y0 = c.slot * P - s * speed
        const py = ((y0 % span) + span) % span - 260 + Math.sin(T * 0.5 + c.ph) * 7 * c.z
        const stagger = (c.slot % 2) * 18
        const px = (c.lane === 'l' ? edge + stagger : W - c.w - edge - stagger) + Math.cos(T * 0.4 + c.ph) * 5 * c.z - (reduce ? 0 : mouse.nx) * 16 * c.z
        const tz = (c.z - 1) * 260
        const ry = (c.lane === 'l' ? 17 : -17) + (reduce ? 0 : mouse.nx) * -3 + Math.sin(s * 0.0015 + c.ph) * 2.5
        const rx = 5 + mouse.ny * -2.5
        sStyle(c.n, 'transform', `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,${tz.toFixed(0)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`)
        sStyle(c.n, 'opacity', ((0.2 + 0.42 * c.z * c.z) * fade).toFixed(3))
      }
    }

    paint(0, true)
    const small = !finePointer
    const off = addFrameTask((t) => {
      sm = lerp(sm, view.y, small ? 0.14 : 0.1)
      if (Math.abs(view.y - sm) < 0.05) sm = view.y
      paint(t, false)
    })
    return () => { off(); offR(); window.removeEventListener('load', layout) }
  }, [])

  return (
    <div className="devbg" ref={root} aria-hidden="true">
      {ITEMS.map(([lane, tier, mob, node], i) => (
        <div className="rail-item" key={i} data-lane={lane} data-tier={tier} data-m={mob === 'm1' ? 1 : 0} data-z={TIER[tier]} data-ph={(i * 1.7).toFixed(2)}>
          {node}
        </div>
      ))}
    </div>
  )
}
