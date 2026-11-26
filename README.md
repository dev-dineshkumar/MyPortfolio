# Dinesh Kumar G – Portfolio

React + Vite portfolio. All content lives in `src/data/portfolio.js` (taken from the resume).

```powershell
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
```

- **Profile photo:** the photo is `public/profile.webp` (replace it to change). A "DK" monogram shows if the file is missing.
- **LinkedIn / GitHub:** not in the resume, so no links are shown. Add them to `profile` in `src/data/portfolio.js` and render them in `src/components/Contact.jsx`.
- Respects `prefers-reduced-motion`; particle background, tilt and cursor glow are reduced/disabled on touch devices.
- This project is fully independent of `../Abhishek` (own dependencies, assets, config and port 5173).

## Motion & structure
- `src/components/ScrollFX.jsx` is the scroll-reactive depth layer (perspective grid floor, wireframe shapes, light pools, data streams). It is transform-only, eased, thinned out on touch/small screens and shown as a single static frame under `prefers-reduced-motion`.
- `src/components/Marquee.jsx` is the seamless right-to-left ticker (pixel-constant speed, copies sized to cover any viewport; stops and becomes hand-scrollable under reduced motion).
- Section order is set in `src/App.jsx`; nav links in `navLinks` in `src/data/portfolio.js`.

- Background: `src/components/DevBackground.jsx` lays out syntax-highlighted code windows, terminals, a GitHub card and a tech-stack panel on two depth-tiered 3D rails. The Development Tools tickers move left to right and pause / resume on click. `src/components/FlowBackdrop.jsx` is a page-length layer (document space) of breathing colour fields and floating 3D developer pieces, so the background scrolls with the page with per-depth parallax, and keeps following scroll under reduced motion. On phones (<768px) the hero banner is portrait: `Hero.jsx` sizes it to the copy block plus the scene, and `createCodeScene(..., { mobile: true })` re-places the same artwork under the copy, so the glass tiles, text and scene stay together like the laptop layout.

Projects section: `src/components/Projects.jsx` has two presentations of the same cards. Tablets and desktops get the pinned 3D rail that settles into a grid; phones (the `FLOW_QUERY` media query) get full-size cards in the normal page flow, each fading and sliding up (staggered) when it scrolls into view. Card styles are the `.p-card` and `.p-flow` rules in `src/styles/site.css`.
