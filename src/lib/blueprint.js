// Blueprint-style circuit traces shared by the hero backdrop (drawn once, static) and the
// code scene (animated light pulses that travel along them). Design space: 1775 × 785.

export const TRACES = [
  { gold: false, speed: 0.07, phase: 0.1, pts: [[0, 640], [300, 640], [360, 580], [760, 580], [820, 520], [1100, 520]] },
  { gold: true, speed: 0.09, phase: 0.55, pts: [[1775, 120], [1560, 120], [1500, 180], [1500, 330], [1440, 390]] },
  { gold: false, speed: 0.06, phase: 0.3, pts: [[1775, 700], [1500, 700], [1440, 640], [1200, 640]] },
  { gold: false, speed: 0.08, phase: 0.8, pts: [[700, 0], [700, 160], [760, 220], [760, 420]] },
  { gold: true, speed: 0.07, phase: 0.2, pts: [[1300, 785], [1300, 720], [1360, 660], [1620, 660]] },
  { gold: false, speed: 0.05, phase: 0.65, pts: [[0, 200], [200, 200], [260, 260], [520, 260]] },
  { gold: false, speed: 0.08, phase: 0.4, pts: [[1000, 785], [1000, 700], [940, 640], [600, 640]] },
  { gold: true, speed: 0.1, phase: 0.9, pts: [[1775, 420], [1700, 420], [1640, 480], [1640, 560]] },
  { gold: false, speed: 0.06, phase: 0.15, pts: [[400, 0], [400, 90], [460, 150], [640, 150]] },
]

// cumulative segment lengths, computed once
for (const t of TRACES) {
  t.cum = [0]
  for (let i = 1; i < t.pts.length; i++) {
    t.cum[i] = t.cum[i - 1] + Math.hypot(t.pts[i][0] - t.pts[i - 1][0], t.pts[i][1] - t.pts[i - 1][1])
  }
  t.len = t.cum[t.cum.length - 1]
}

/** Point at fraction u (0–1) along a trace. */
export function pointAt(t, u) {
  const d = u * t.len
  let i = 1
  while (i < t.cum.length - 1 && t.cum[i] < d) i++
  const f = (d - t.cum[i - 1]) / (t.cum[i] - t.cum[i - 1] || 1)
  const a = t.pts[i - 1]
  const b = t.pts[i]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
}
