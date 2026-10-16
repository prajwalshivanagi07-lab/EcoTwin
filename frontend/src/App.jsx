import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'
import './DemoMode.css'
import CampusTwin3D from './components/CampusTwin3D'
import StudentIssues from './components/StudentIssues'

gsap.registerPlugin(ScrollTrigger)

const API_BASE = 'https://ecotwin-bkfb.onrender.com/api'

const nav = [
  ['/', '01', 'Overview'],
  ['/campus-map', '02', 'Campus map'],
  ['/monitoring', '03', 'Live monitoring'],
  ['/analytics', '04', 'Analytics'],
  ['/sustainability', '05', 'Sustainability'],
  ['/student-hub', '06', 'Student hub'],
]

const AREAS = [
  { name: 'Academic Building', aliases: ['Academic Building', 'Academic Block'] },
  { name: 'A Block / School of Engineering', aliases: ['A Block - SOE', 'A Block - School of Engineering', 'A Block / School of Engineering', 'A Block', 'School of Engineering', 'SOE', 'Engineering Block'] },
  { name: 'B Block / AI Block', aliases: ['B Block - AI', 'B Block - AI Block', 'B Block / AI Block', 'B Block', 'AI Block', 'Artificial Intelligence Block'] },
  { name: 'BBA & B.Com Building', aliases: ['BBA & B.Com Building', 'BBA & B.Com', 'BBA B.Com', 'Commerce Block'] },
  { name: 'Nursing Building', aliases: ['Nursing Building', 'Nursing Block'] },
  { name: 'CDSIMER Medical College', aliases: ['CDSIMER Medical College', 'CDSIMER - Medical College', 'CDSIMER', 'Medical College'] },
  { name: 'Library', aliases: ['Library'] },
  { name: 'Canteen', aliases: ['Canteen', 'Food Court'] },
  { name: 'ICICI Bank', aliases: ['ICICI Bank', 'Bank'] },
  { name: 'Main Arena', aliases: ['Main Arena', 'Auditorium', 'Open Auditorium'] },
  { name: 'Boys Hostel Tower 1', aliases: ['Boys Hostel - 4 Sharing 1', 'Boys Hostel - 4 Sharing Tower 1', 'Boys Hostel Tower 1'] },
  { name: 'Boys Hostel Tower 2', aliases: ['Boys Hostel - 4 Sharing 2', 'Boys Hostel - 4 Sharing Tower 2', 'Boys Hostel Tower 2'] },
  { name: 'Boys Hostel Tower 3', aliases: ['Boys Hostel - 2 Sharing', 'Boys Hostel - 2 Sharing Tower', 'Boys Hostel Tower 3'] },
  { name: 'Girls Hostel Tower 1', aliases: ['Girls Hostel - 4 Sharing 1', 'Girls Hostel - 4 Sharing Tower 1', 'Girls Hostel Tower 1'] },
  { name: 'Girls Hostel Tower 2', aliases: ['Girls Hostel - 4 Sharing 2', 'Girls Hostel - 4 Sharing Tower 2', 'Girls Hostel Tower 2'] },
  { name: 'Girls Hostel Tower 3', aliases: ['Girls Hostel - 2 Sharing', 'Girls Hostel - 2 Sharing Tower', 'Girls Hostel Tower 3'] },
  { name: 'Staff Quarters Tower 1', aliases: ['Staff Quarters Tower 1', 'Staff Quarters'] },
  { name: 'Staff Quarters Tower 2', aliases: ['Staff Quarters Tower 2'] },
  { name: 'Football Ground', aliases: ['Football Ground', 'Football Stadium'] },
  { name: 'Cricket Ground', aliases: ['Cricket Ground'] },
  { name: 'Basketball Courts', aliases: ['Basketball Courts', 'Basketball Court 1', 'Basketball Court 2', 'Basketball Court 3'] },
  { name: 'Volleyball Courts', aliases: ['Volleyball Courts', 'Volleyball Court 1', 'Volleyball Court 2'] },
  { name: 'Pickleball Courts', aliases: ['Pickleball Courts', 'Pickleball Court 1', 'Pickleball Court 2'] },
]

const DEMO_SEED = [
  ['Academic Building', 174.04, 4310.79, 488, 23.6, 14.52],
  ['A Block - SOE', 136.86, 2090.63, 377, 26.8, 9.64],
  ['B Block - AI', 127.85, 3620, 449, 25.5, 10.57],
  ['BBA & B.Com Building', 114.02, 2158.69, 304, 25.4, 8.95],
  ['Nursing Building', 115.12, 2534.16, 225, 26.2, 9.18],
  ['CDSIMER Medical College', 272.86, 6582.11, 384, 25, 22.35],
  ['Library', 71.32, 986.46, 224, 28.9, 3.56],
  ['Canteen', 117.05, 4685.58, 176, 28.1, 26.39],
  ['Boys Hostel - 4 Sharing 1', 147.66, 8191.45, 315, 25.4, 15.4],
  ['Boys Hostel - 4 Sharing 2', 159.38, 6346.04, 306, 28.4, 14.02],
  ['Boys Hostel - 2 Sharing', 137.82, 4524.73, 181, 30.2, 13.88],
  ['Girls Hostel - 4 Sharing 1', 139.3, 6243.26, 343, 30.8, 14.59],
  ['Girls Hostel - 4 Sharing 2', 118.06, 8443.21, 344, 26.4, 19.98],
  ['Girls Hostel - 2 Sharing', 132.61, 5368.57, 209, 29.3, 10.76],
  ['Staff Quarters Tower 1', 52.88, 2471.75, 139, 27.1, 4.1],
  ['Staff Quarters Tower 2', 43.28, 2060.12, 120, 29.4, 4.11],
  ['Football Ground', 17.42, 869.4, 76, 31.7, 3.96],
  ['Cricket Ground', 14.93, 1453.07, 84, 27.6, 2.16],
  ['Basketball Courts', 18.4, 373.92, 89, 30.8, 1.68],
  ['Volleyball Courts', 10.66, 307.75, 45, 28.4, 2.09],
  ['Pickleball Courts', 6.72, 195.52, 44, 24.6, 1.43],
  ['Main Arena', 45.56, 779.82, 87, 31.7, 12.98],
  ['ICICI Bank', 15.54, 314.38, 37, 26.3, 2.93],
].map(([building, energy, water, occupancy, temperature, waste], id) => ({
  id,
  building,
  energy,
  water,
  occupancy,
  temperature,
  waste,
  timestamp: '2026-10-13 20:00:00',
}))

const norm = (value) =>
  String(value ?? '').toLowerCase().trim().replace(/\s+/g, ' ')

const timestampValue = (row) => Date.parse(row?.timestamp || '') || 0

function canonicalRows(rows) {
  if (!Array.isArray(rows)) return []

  return AREAS.map((area) => {
    let matches = rows.filter((row) =>
      area.aliases.some((alias) => norm(alias) === norm(row.building))
    )

    if (!matches.length) {
      matches = rows.filter((row) =>
        area.aliases.some((alias) => {
          const a = norm(alias)
          const b = norm(row.building)
          return a.length > 5 && b.length > 5 && (a.includes(b) || b.includes(a))
        })
      )
    }

    if (!matches.length) return null

    matches.sort(
      (a, b) =>
        timestampValue(a) - timestampValue(b) ||
        (Number(a.id) || 0) - (Number(b.id) || 0)
    )

    return { ...matches[matches.length - 1], areaName: area.name }
  }).filter(Boolean)
}

function rounded(value, digits = 1) {
  return Number(Number(value || 0).toFixed(digits))
}

function demoRows(tick, scenario) {
  return DEMO_SEED.map((base, i) => {
    const wave =
      1 +
      0.025 * Math.sin(tick * 0.8 + i * 1.4) +
      0.009 * Math.cos(tick * 0.45 + i)

    let energy = base.energy * wave
    let water = base.water * (1 + 0.02 * Math.cos(tick * 0.65 + i * 0.9))
    let waste = base.waste * (1 + 0.012 * Math.sin(tick * 0.3 + i))
    let occupancy = Math.max(
      0,
      Math.round(base.occupancy * (1 + 0.018 * Math.sin(tick * 0.55 + i * 0.7)))
    )

    if (scenario === 'energy' && base.building === 'A Block - SOE') energy *= 2.15
    if (scenario === 'water' && base.building === 'Girls Hostel - 4 Sharing 2') water *= 2.25
    if (scenario === 'waste' && base.building === 'Canteen') waste *= 2.1

    return {
      ...base,
      energy: rounded(energy),
      water: rounded(water),
      waste: rounded(waste),
      occupancy,
      timestamp: new Date().toISOString(),
    }
  })
}

function aggregate(rows) {
  const sum = (key) =>
    rows.reduce((total, row) => total + (Number(row[key]) || 0), 0)

  return {
    energy: sum('energy'),
    water: sum('water'),
    occupancy: sum('occupancy'),
    waste: sum('waste'),
    count: rows.length,
  }
}

function fmt(value, digits = 0) {
  return Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function median(values) {
  const a = values.filter(Number.isFinite).slice().sort((x, y) => x - y)
  if (!a.length) return 0

  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

function makeTrend(rows, field, tick = 0) {
  const base = rows.length
    ? rows.reduce((s, r) => s + (Number(r[field]) || 0), 0) / rows.length
    : 100

  return Array.from({ length: 12 }, (_, i) => ({
    label: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'][i],
    value: Math.max(
      0,
      rounded(
        base * (0.72 + 0.24 * Math.sin(i * 0.7 - 0.8) + 0.06 * Math.cos(i * 1.2 + tick * 0.2)),
        1
      )
    ),
  }))
}

function historyTrend(history, field, fallbackRows, tick) {
  if (!Array.isArray(history) || history.length < 6) {
    return makeTrend(fallbackRows, field, tick)
  }

  const bins = new Map()

  for (const row of history) {
    const time = String(row.timestamp || '').slice(0, 13)
    const n = Number(row[field])

    if (!time || !Number.isFinite(n)) continue

    const bin = bins.get(time) || { sum: 0, count: 0 }
    bin.sum += n
    bin.count += 1
    bins.set(time, bin)
  }

  const points = [...bins.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)

  if (points.length < 3) return makeTrend(fallbackRows, field, tick)

  return points.map(([time, v]) => ({
    label: time.slice(11, 13),
    value: rounded(v.sum / v.count, 1),
  }))
}

function useCampusData() {
  const [mode, setMode] = useState('demo')
  const [scenario, setScenario] = useState('baseline')
  const [tick, setTick] = useState(0)
  const [dbRows, setDbRows] = useState([])
  const [historyRows, setHistoryRows] = useState([])
  const [apiStatus, setApiStatus] = useState('connecting')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (mode !== 'demo') return undefined

    const timer = window.setInterval(() => setTick((v) => v + 1), 8000)
    return () => window.clearInterval(timer)
  }, [mode])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [currentResp, historyResp] = await Promise.all([
          fetch(`${API_BASE}/readings`, { cache: 'no-store' }),
          fetch(`${API_BASE}/history`, { cache: 'no-store' }),
        ])

        if (!currentResp.ok) throw new Error(`Readings API ${currentResp.status}`)

        const payload = await currentResp.json()
        const rows = Array.isArray(payload) ? payload : (payload.readings || payload.data || [])

        if (active) {
          setDbRows(canonicalRows(rows))
          setApiStatus('connected')
          setLastUpdated(payload.updatedAt || new Date().toISOString())
        }

        if (historyResp.ok) {
          const h = await historyResp.json()
          if (active) setHistoryRows(Array.isArray(h) ? h : (h.rows || []))
        }
      } catch {
        if (active) setApiStatus('offline')
      }
    }

    load()
    const timer = window.setInterval(load, 10000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const rows = useMemo(
    () => mode === 'demo' ? canonicalRows(demoRows(tick, scenario)) : dbRows,
    [mode, tick, scenario, dbRows]
  )

  const actualModeAvailable = apiStatus === 'connected' && dbRows.length > 0

  return {
    mode,
    setMode,
    scenario,
    setScenario,
    tick,
    rows,
    historyRows,
    apiStatus,
    lastUpdated,
    actualModeAvailable,
  }
}

function MetricCard({ label, value, unit, note, index, icon }) {
  return (
    <article className="metric-card" style={{ '--delay': `${(index || 0) * 80}ms` }}>
      <div className="metric-top">
        <span>{label}</span>
        <i>{icon}</i>
      </div>
      <div className="metric-value">
        {value}<small>{unit}</small>
      </div>
      <div className="metric-foot">
        <b className="neutral">{note}</b>
        <span>Latest snapshot</span>
      </div>
      <div className="metric-line" />
    </article>
  )
}

function Heading({ eyebrow, title, highlight, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow"><i /> {eyebrow}</div>
        <h1>{title} {highlight && <span>{highlight}</span>}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function ModeBadge({ mode, apiStatus }) {
  return (
    <span className={`soft-tag demo-mode-tag ${mode === 'demo' ? 'demo' : 'database'}`}>
      <i className="pulse-dot" />
      {mode === 'demo'
        ? 'DEMO PLAYBACK · SIMULATED'
        : apiStatus === 'connected'
          ? 'DATABASE CONNECTED'
          : 'DATABASE OFFLINE'}
    </span>
  )
}

function Shell({ children, mode, setMode, apiStatus }) {
  const loc = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [loc.pathname])

  return (
    <div className="app-shell">
      <header className={`site-nav ${menuOpen ? 'nav-open' : ''}`}>
        <NavLink className="brand" to="/" aria-label="EcoTwin home">
          <span className="brand-mark">e<span>.</span></span>
          <span className="brand-copy">EcoTwin<small>DSU HAROHALLI</small></span>
        </NavLink>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          <span /><span />
        </button>

        <nav className="top-navigation" aria-label="Main navigation">
          {nav.map(([to, n, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-index">{n}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="data-mode-toggle"
          onClick={() => setMode(mode === 'demo' ? 'database' : 'demo')}
          title="Switch between demo playback and the local SQLite API"
        >
          {mode === 'demo' ? 'Use database ↗' : 'Run demo ↻'}
        </button>

        <div className="nav-status">
          <i className="pulse-dot" />
          <span>
            {mode === 'demo'
              ? 'Demo playback'
              : apiStatus === 'connected'
                ? 'Database linked'
                : 'API offline'}
          </span>
        </div>
      </header>

      <main className="main-area">
        {children}
        <footer className="footer">
          <span>ECOTWIN <b>·</b> DSU HAROHALLI</span>
          <span>
            {mode === 'demo'
              ? 'Hackathon demo · simulated values'
              : apiStatus === 'connected'
                ? 'SQLite snapshot · sensor data may be simulated'
                : 'Database unavailable · switch to demo playback'}
          </span>
        </footer>
      </main>
    </div>
  )
}

function ScenarioControls({ scenario, setScenario, mode = 'demo' }) {
  return (
    <div className="demo-scenarios">
      <div>
        <span className="scenario-kicker">PRESENTATION CONTROLS</span>
        <h3>Show a campus event</h3>
        <p>
          {mode === 'demo'
            ? 'Choose a scenario to demonstrate how EcoTwin flags unusual readings. These changes affect demo values only.'
            : 'Switch to Demo Playback to run a presentation scenario. Database mode shows the latest stored rows.'}
        </p>
      </div>

      <div className="scenario-buttons">
        {[
          { id: 'baseline', label: 'Baseline' },
          { id: 'energy', label: 'High energy load' },
          { id: 'water', label: 'Water anomaly' },
          { id: 'waste', label: 'Waste spike' },
        ].map((s) => (
          <button
            key={s.id}
            disabled={mode !== 'demo'}
            onClick={() => setScenario(s.id)}
            className={scenario === s.id ? 'active' : ''}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Home({ data }) {
  const ref = useRef(null)
  const totals = aggregate(data.rows)
  const energyTrend = historyTrend(
    data.mode === 'demo' ? [] : data.historyRows,
    'energy',
    data.rows,
    data.tick
  )

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-kicker,.hero-title,.hero-copy,.hero-actions,.hero-orbit-card', {
        y: 25,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
      })

      gsap.utils.toArray('.scroll-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      })

      gsap.to('.hero-glow', {
        y: 70,
        x: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.to('.hero-orbit-card', {
        y: -32,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })
    }, ref)

    return () => ctx.revert()
  }, [])

  const metrics = [
    { label: 'Energy reading', value: fmt(totals.energy), unit: 'kWh', note: 'Across matched areas', icon: 'ϟ' },
    { label: 'Water reading', value: fmt(totals.water), unit: 'L', note: 'Across matched areas', icon: '≈' },
    { label: 'Recorded occupancy', value: fmt(totals.occupancy), unit: 'people', note: 'Sum of area readings', icon: '◎' },
    { label: 'Waste reading', value: fmt(totals.waste, 1), unit: 'kg', note: 'Across matched areas', icon: '♧' },
  ]

  return (
    <div ref={ref} className="page-content home-page">
      <section className="hero-section">
        <div className="hero-grid" />
        <div className="hero-glow" />

        <div className="hero-content">
          <div className="hero-kicker"><i className="pulse-dot" /> INTELLIGENCE FOR A GREENER CAMPUS</div>
          <h1 className="hero-title">A campus that<br />thinks <em>ahead.</em></h1>
          <p className="hero-copy">
            A living digital twin of DSU Harohalli — bringing campus energy, water,
            people and sustainability into one connected view.
          </p>
          <div className="hero-actions">
            <NavLink to="/campus-map" className="btn-primary">Explore campus <b>↗</b></NavLink>
            <NavLink to="/analytics" className="btn-quiet">View insights <b>→</b></NavLink>
          </div>
          <div className="hero-meta">
            <span><i /> 144 acres represented</span>
            <span><b>✳</b> A smarter campus, by design</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-ring ring-one" />
          <div className="hero-ring ring-two" />
          <div className="hero-map-art">
            <div className="map-road ra" />
            <div className="map-road rb" />
            <div className="map-road rc" />
            <div className="map-water" />
            <div className="map-green ga" />
            <div className="map-green gb" />

            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} className={`mini-building mb-${i + 1}`}><span /></div>
            ))}

            <div className="map-pin pa"><i /> A BLOCK</div>
            <div className="map-pin pb"><i /> AI BLOCK</div>
            <div className="map-pin pc"><i /> ARENA</div>
          </div>

          <div className="hero-orbit-card">
            <div className="orbit-head"><i className="pulse-dot" /> CAMPUS PULSE</div>
            <div className="orbit-score">
              {data.mode === 'demo'
                ? data.scenario === 'baseline' ? '82'
                  : data.scenario === 'water' ? '74'
                    : data.scenario === 'energy' ? '69' : '77'
                : '—'}
              <span>/100</span>
            </div>
            <div className="orbit-label">Illustrative screening index</div>
            <div className="orbit-bars">
              {energyTrend.map((p, i) => (
                <i
                  key={i}
                  style={{
                    height: `${Math.max(
                      16,
                      Math.min(94, (p.value / Math.max(...energyTrend.map((x) => x.value), 1)) * 90)
                    )}%`,
                  }}
                />
              ))}
            </div>
            <div className="orbit-bottom">
              <span>{data.mode === 'demo' ? 'SIMULATION' : 'DATABASE'}</span>
              <span>RESOURCE PULSE</span>
            </div>
          </div>

          <div className="hero-floating-tag">
            <span>ϟ</span>
            <div><b>{fmt(totals.energy)} kWh</b><small>Latest energy reading sum</small></div>
          </div>
        </div>

        <div className="hero-scroll"><i /> SCROLL TO EXPLORE <b>↓</b></div>
      </section>

      <section className="intro-strip scroll-reveal">
        <div className="intro-number">01 <span>/ THE BIG PICTURE</span></div>
        <p>Not just a dashboard. <strong>A way to understand how a campus lives, moves and uses resources.</strong></p>
        <span className="intro-mark">✳</span>
      </section>

      <section className="overview-section">
        <Heading
          eyebrow="CAMPUS AT A GLANCE"
          title="Everything connected."
          highlight="Every resource visible."
          description="The latest matched readings from the selected data source. Values refresh automatically in Demo Playback."
          action={<ModeBadge mode={data.mode} apiStatus={data.apiStatus} />}
        />

        <div className="metrics-grid">
          {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
        </div>

        <div className="lower-grid">
          <div className="panel energy-panel scroll-reveal">
            <div className="panel-header">
              <div><div className="panel-eyebrow">RESOURCE INTELLIGENCE</div><h3>Energy reading pattern</h3></div>
              <span className="small-select">12 samples</span>
            </div>
            <div className="chart-summary">
              <strong>{fmt(totals.energy)} <small>kWh</small></strong>
              <span className="neutral">{data.mode === 'demo' ? 'Simulated playback' : 'Latest DB snapshot'}</span>
            </div>
            <ChartBars points={energyTrend} />
            <p className="data-note">Chart points are averages of readings per time bucket, not daily totals.</p>
          </div>

          <div className="panel quick-panel scroll-reveal">
            <div className="panel-header">
              <div><div className="panel-eyebrow">SCREENING FLAGS</div><h3>Places to investigate</h3></div>
              <NavLink to="/sustainability" className="text-link">See insights ↗</NavLink>
            </div>
            {getTopFlags(data.rows).slice(0, 4).map((f) => (
              <div className="watch-row" key={f.label}>
                <i className={`watch-dot ${f.alert ? 'warning' : ''}`} />
                <div><b>{f.area}</b><small>{f.label}</small></div>
                <span className={`status-label ${f.alert ? 'watch' : ''}`}>{f.alert ? 'Review' : 'Relative high'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="journey-section">
        <Heading
          eyebrow="EXPLORE ECOTWIN"
          title="One campus."
          highlight="Multiple perspectives."
          description="Choose a live view or use the presentation controls to demonstrate an event."
        />
        <ScenarioControls scenario={data.scenario} setScenario={data.setScenario} mode={data.mode} />

        <div className="journey-grid">
          {[
            { n: '01', title: 'See the campus', desc: 'Explore the mapped buildings, roads, courts and sensor points in 3D.', to: '/campus-map', icon: '⌖', c: 'tile-map' },
            { n: '02', title: 'Monitor resource use', desc: 'See building-level readings and screening flags.', to: '/monitoring', icon: 'ϟ', c: 'tile-monitor' },
            { n: '03', title: 'Investigate patterns', desc: 'Review trends and data-driven resource comparisons.', to: '/analytics', icon: '▥', c: 'tile-analytics' },
          ].map((c) => (
            <NavLink to={c.to} key={c.n} className={`journey-card ${c.c} scroll-reveal`}>
              <div className="journey-top"><span>{c.n} / EXPLORE</span><b>{c.icon}</b></div>
              <div><h3>{c.title}</h3><p>{c.desc}</p></div>
              <div className="journey-bottom"><span>EXPLORE SECTION</span><b>↗</b></div>
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  )
}

function CampusMap({ data }) {
  return (
    <div className="page-content inner-page campus-map-page">
      <CampusTwin3D
        readings={data.rows}
        dataMode={data.mode}
        apiStatus={data.apiStatus}
        lastUpdated={data.lastUpdated}
      />
    </div>
  )
}

function ChartBars({ points }) {
  const max = Math.max(...points.map((p) => p.value), 1)

  return (
    <div className="chart-wrap">
      <div className="y-labels">
        <span>{fmt(max)}</span><span>{fmt(max * 0.75)}</span><span>{fmt(max * 0.5)}</span><span>{fmt(max * 0.25)}</span><span>0</span>
      </div>
      <div className="chart-main">
        <div className="gridlines">{[1, 2, 3, 4, 5].map((i) => <i key={i} />)}</div>
        <div className="bars">
          {points.map((p, i) => (
            <div
              title={`${p.label}: ${fmt(p.value, 1)}`}
              key={`${p.label}-${i}`}
              className={`bar ${i === Math.floor(points.length * 0.6) ? 'bar-hot' : ''}`}
              style={{ height: `${Math.max(3, p.value / max * 100)}%`, animationDelay: `${i * 20}ms` }}
            />
          ))}
        </div>
        <div className="x-labels">
          <span>{points[0]?.label || '—'}</span>
          <span>{points[Math.floor(points.length * 0.25)]?.label || ''}</span>
          <span>{points[Math.floor(points.length * 0.5)]?.label || ''}</span>
          <span>{points[Math.floor(points.length * 0.75)]?.label || ''}</span>
          <span>{points.at(-1)?.label || '—'}</span>
        </div>
      </div>
    </div>
  )
}

/* Financial Overview: illustrative costs for the selected readings */

function FinancialOverview({ rows = [], mode }) {
  const [electricityTarget, setElectricityTarget] = useState(15);
  const [waterTarget, setWaterTarget] = useState(10);
  const [wasteTarget, setWasteTarget] = useState(20);

  const rates = {
    electricity: 8, // ₹ per kWh
    water: 80,       // ₹ per 1,000 litres
    waste: 5,        // ₹ per kg
  };

  // Add readings from every building
  const totals = rows.reduce(
    (sum, building) => ({
      energy: sum.energy + (Number(building.energy) || 0),
      water: sum.water + (Number(building.water) || 0),
      waste: sum.waste + (Number(building.waste) || 0),
    }),
    { energy: 0, water: 0, waste: 0 }
  );

  // Estimated cost of all campus resources
  const electricityCost = totals.energy * rates.electricity;
  const waterCost = (totals.water / 1000) * rates.water;
  const wasteCost = totals.waste * rates.waste;

  const totalCost = electricityCost + waterCost + wasteCost;

  // Savings based on adjustable reduction targets
  const electricitySavings =
    electricityCost * (electricityTarget / 100);

  const waterSavings = waterCost * (waterTarget / 100);
  const wasteSavings = wasteCost * (wasteTarget / 100);

  const totalSavings =
    electricitySavings + waterSavings + wasteSavings;

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const formatNumber = (value) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <section className="financial-panel">
      <div className="financial-header">
        <div>
          <h2>Campus Resource Cost & Savings</h2>
          <p>
            Combined readings and estimated costs for all buildings
          </p>
        </div>
        <span className="financial-badge">
          {mode === "demo" ? "Demo estimates" : "Reading-based estimates"}
        </span>
      </div>

      <div className="financial-summary-grid">
        <div className="financial-card">
          <span>Total Electricity</span>
          <h3>{formatNumber(totals.energy)} kWh</h3>
          <p>{formatMoney(electricityCost)}</p>
        </div>

        <div className="financial-card">
          <span>Total Water</span>
          <h3>{formatNumber(totals.water)} L</h3>
          <p>{formatMoney(waterCost)}</p>
        </div>

        <div className="financial-card">
          <span>Total Waste</span>
          <h3>{formatNumber(totals.waste)} kg</h3>
          <p>{formatMoney(wasteCost)}</p>
        </div>

        <div className="financial-card">
          <span>Total Estimated Cost</span>
          <h3>{formatMoney(totalCost)}</h3>
          <p>Across all buildings</p>
        </div>
      </div>

      <div className="financial-savings">
        <h3>Potential Savings Calculator</h3>
        <p>
          Adjust the reduction targets to estimate how much the campus
          could save for the readings currently displayed.
        </p>

        <div className="savings-control">
          <label>
            Electricity reduction: <strong>{electricityTarget}%</strong>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={electricityTarget}
            onChange={(e) =>
              setElectricityTarget(Number(e.target.value))
            }
          />
          <p>
            Potential savings: {formatMoney(electricitySavings)}
          </p>
        </div>

        <div className="savings-control">
          <label>
            Water reduction: <strong>{waterTarget}%</strong>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={waterTarget}
            onChange={(e) => setWaterTarget(Number(e.target.value))}
          />
          <p>Potential savings: {formatMoney(waterSavings)}</p>
        </div>

        <div className="savings-control">
          <label>
            Waste-cost reduction: <strong>{wasteTarget}%</strong>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={wasteTarget}
            onChange={(e) => setWasteTarget(Number(e.target.value))}
          />
          <p>Potential savings: {formatMoney(wasteSavings)}</p>
        </div>

        <div className="financial-total-savings">
          <span>Estimated total savings</span>
          <h2>{formatMoney(totalSavings)}</h2>
          <p>
            Estimated remaining cost:{" "}
            {formatMoney(Math.max(0, totalCost - totalSavings))}
          </p>
        </div>
      </div>

      <p className="financial-note">
        Estimates use electricity at ₹8/kWh, water at ₹80/kL, and waste
        at ₹5/kg. Actual bills may differ. Savings assume the selected
        reductions are achievable and do not include additional
        implementation costs.
      </p>
    </section>
  );
}


function Monitoring({ data }) {
  const [filter, setFilter] = useState('All areas')

  const rows = data.rows.slice().sort((a, b) =>
    String(a.areaName || a.building).localeCompare(String(b.areaName || b.building))
  )

  const filtered = rows.filter((r) =>
    filter === 'All areas' ||
    (filter === 'High relative readings' &&
      getTopFlags(rows).some((f) => f.area === (r.areaName || r.building) && f.alert)) ||
    (filter === 'Hostels' && /hostel/i.test(r.areaName || r.building)) ||
    (filter === 'Academic' && /block|academic|nursing|library|college|b.com/i.test(r.areaName || r.building))
  )

  const totals = aggregate(rows)

  return (
    <div className="page-content inner-page">
      <Heading
        eyebrow="OPERATIONS CENTRE"
        title="Know what’s happening."
        highlight="As it happens."
        description="Building-level resource snapshot. Use presentation scenarios to demonstrate how the screening rules respond."
        action={<ModeBadge mode={data.mode} apiStatus={data.apiStatus} />}
      />

      <div className="metrics-grid monitoring-metrics">
        {[
          { label: 'Energy reading', value: fmt(totals.energy), unit: 'kWh', note: `${rows.length} matched areas`, icon: 'ϟ' },
          { label: 'Water reading', value: fmt(totals.water), unit: 'L', note: 'Latest snapshot', icon: '≈' },
          { label: 'Occupancy', value: fmt(totals.occupancy), unit: 'people', note: 'Recorded across areas', icon: '◎' },
          { label: 'Waste reading', value: fmt(totals.waste, 1), unit: 'kg', note: 'Latest snapshot', icon: '♧' },
        ].map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
      </div>

      <ScenarioControls scenario={data.scenario} setScenario={data.setScenario} mode={data.mode} />

      <FinancialOverview rows={rows} mode={data.mode} />

      <div className="panel table-panel">
        <div className="panel-header table-header">
          <div><div className="panel-eyebrow">BUILDING TELEMETRY</div><h3>Area-by-area readings</h3></div>
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All areas</option>
            <option>High relative readings</option>
            <option>Hostels</option>
            <option>Academic</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>LOCATION</th><th>ENERGY</th><th>WATER</th><th>OCCUPANCY</th><th>TEMP</th><th>WASTE</th><th>SCREEN</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const value = Number(r.energy) || 0
                const rowsForField = rows.map((x) => Number(x.energy) || 0)
                const alert = value > median(rowsForField) * 1.65

                return (
                  <tr key={r.areaName || r.building}>
                    <td><i className="table-building-icon">⌂</i>{r.areaName || r.building}</td>
                    <td>{fmt(r.energy, 1)} kWh</td>
                    <td>{fmt(r.water, 1)} L</td>
                    <td>{fmt(r.occupancy)}</td>
                    <td>{fmt(r.temperature, 1)} °C</td>
                    <td>{fmt(r.waste, 1)} kg</td>
                    <td>
                      <span className={`table-status ${alert ? 'table-warning' : ''}`}>
                        <i />{alert ? 'Review' : 'Watch'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="table-foot">
          Showing {filtered.length} matched locations
          <span>
            {data.mode === 'demo' ? 'Scenario values are simulated' : 'Latest API snapshot'}
            {' '}· not physical sensor telemetry
          </span>
        </div>
      </div>
    </div>
  )
}

function getTopFlags(rows) {
  const specs = [
    ['energy', 'Energy', 'kWh'],
    ['water', 'Water', 'L'],
    ['waste', 'Waste', 'kg'],
  ]

  return specs.map(([field, label, unit]) => {
    const sorted = rows
      .filter((r) => Number.isFinite(Number(r[field])))
      .slice()
      .sort((a, b) => Number(b[field]) - Number(a[field]))

    const top = sorted[0]
    const baseline = median(sorted.map((r) => Number(r[field])))

    if (!top) return null

    const val = Number(top[field])
    const ratio = baseline ? val / baseline : 0

    return {
      field,
      label: `${label}: ${fmt(val, 1)} ${unit} · ${ratio >= 1.65 ? 'above relative threshold' : 'highest current reading'}`,
      area: top.areaName || top.building,
      alert: ratio >= 1.65,
      ratio,
      value: val,
      unit,
    }
  }).filter(Boolean)
}

function getInsight(rows, scenario, mode = 'demo') {
  const flags = getTopFlags(rows)

  if (mode === 'demo' && scenario === 'water') {
    return {
      title: 'Water-demand anomaly scenario',
      area: 'Girls Hostel Tower 2',
      desc: 'The demo has raised this area’s water reading. EcoTwin compares it against the latest campus snapshot and flags it for investigation.',
      field: 'water',
    }
  }

  if (mode === 'demo' && scenario === 'energy') {
    return {
      title: 'High energy-load scenario',
      area: 'A Block / School of Engineering',
      desc: 'The demo has raised the energy reading for this area. Review operating hours, HVAC and equipment schedules before drawing conclusions.',
      field: 'energy',
    }
  }

  if (mode === 'demo' && scenario === 'waste') {
    return {
      title: 'Waste-spike scenario',
      area: 'Canteen',
      desc: 'The demo has raised the waste reading for the canteen. Review segregation, collection timing and bin capacity.',
      field: 'waste',
    }
  }

  const f = flags.find((x) => x.alert) || flags[0]

  return {
    title: f?.label || 'Reading review',
    area: f?.area || 'No area matched',
    desc: 'This is a relative screening flag using the latest available area readings. It is not proof of a leak, fault or actual saving; compare with historical patterns and inspect the source.',
    field: f?.field || 'energy',
  }
}

function LineChart({ points }) {
  const max = Math.max(...points.map((p) => p.value), 1)
  const min = Math.min(...points.map((p) => p.value), 0)
  const spread = max - min || 1

  const coordinates = points.map((p, i) =>
    `${points.length === 1 ? 0 : i / (points.length - 1) * 480},${96 - ((p.value - min) / spread) * 80}`
  ).join(' ')

  return (
    <div className="line-chart">
      <div className="line-grid">{[1, 2, 3, 4].map((i) => <i key={i} />)}</div>
      <svg viewBox="0 0 480 110" preserveAspectRatio="none" aria-label="Sensor reading trend">
        <defs>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a36bff" stopOpacity=".3" />
            <stop offset="100%" stopColor="#a36bff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,110 ${coordinates} 480,110`} fill="url(#fill)" />
        <polyline
          points={coordinates}
          fill="none"
          stroke="#ff4d98"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="line-axis">
        {points.filter((_, i) => i % 3 === 0).map((p) => <span key={p.label}>{p.label}</span>)}
      </div>
    </div>
  )
}

function Analytics({ data }) {
  const [field, setField] = useState('energy')

  const fields = {
    energy: ['Energy reading', 'kWh'],
    water: ['Water reading', 'L'],
    waste: ['Waste reading', 'kg'],
    occupancy: ['Occupancy', 'people'],
    temperature: ['Temperature', '°C'],
  }

  const points = historyTrend(
    data.mode === 'demo' ? [] : data.historyRows,
    field,
    data.rows,
    data.tick
  )

  const totals = aggregate(data.rows)
  const insight = getInsight(data.rows, data.scenario, data.mode)
  const ranking = data.rows
    .slice()
    .sort((a, b) => (Number(b[field]) || 0) - (Number(a[field]) || 0))
    .slice(0, 6)

  return (
    <div className="page-content inner-page">
      <Heading
        eyebrow="PERFORMANCE & TRENDS"
        title="Look beyond the moment."
        highlight="Find the pattern."
        description="Historical data is summarized by time bucket when available; Demo Playback provides a labeled simulation if history is unavailable."
        action={<ModeBadge mode={data.mode} apiStatus={data.apiStatus} />}
      />

      <div className="analytics-grid">
        <div className="panel analytics-main">
          <div className="panel-header">
            <div><div className="panel-eyebrow">RESOURCE TREND</div><h3>{fields[field][0]} · recent samples</h3></div>
            <select className="filter-select" value={field} onChange={(e) => setField(e.target.value)}>
              {Object.entries(fields).map(([k, [label]]) => <option value={k} key={k}>{label}</option>)}
            </select>
          </div>

          <div className="big-chart-number">
            {fmt(totals[field], 1)}
            <span>{fields[field][1]} total/latest snapshot</span>
            <small className="neutral">{data.mode === 'demo' ? 'Simulated sample trend' : 'Available database history'}</small>
          </div>

          <LineChart points={points} />
          <p className="data-note">Trend lines are aggregated average sensor readings per time bucket; they are not daily totals.</p>
        </div>

        <div className="panel breakdown-panel">
          <div className="panel-eyebrow">AREA COMPARISON</div>
          <h3>Highest current readings</h3>

          <div className="rank-list">
            {ranking.map((r, i) => (
              <div className="rank-row" key={r.areaName || r.building}>
                <span className="rank-no">0{i + 1}</span>
                <div className="rank-info">
                  <b>{r.areaName || r.building}</b>
                  <div>
                    <i style={{
                      width: `${Math.max(
                        4,
                        (Number(r[field]) || 0) / Math.max(...ranking.map((x) => Number(x[field]) || 0), 1) * 100
                      )}%`,
                    }} />
                  </div>
                </div>
                <strong>{fmt(r[field], 1)}</strong>
              </div>
            ))}
          </div>

          <small className="data-note">{fields[field][1]} · relative ranking, not an anomaly diagnosis</small>
        </div>
      </div>

      <div className="insight-grid">
        <InsightCard
          icon="↘"
          label="ENERGY"
          insight={insight.field === 'energy' ? insight : getInsight(data.rows, data.scenario, data.mode)}
          scenario={data.scenario}
        />
      </div>

      <div className="panel recommendations">
        <div className="panel-header">
          <div><div className="panel-eyebrow">NEXT STEPS</div><h3>Actionable screening</h3></div>
          <ModeBadge mode={data.mode} apiStatus={data.apiStatus} />
        </div>

        {getTopFlags(data.rows).map((f, i) => (
          <div className="recommendation-row" key={f.field}>
            <span>0{i + 1}</span>
            <div><b>{f.area}</b><p>{f.label}. Compare with its historical baseline before escalating.</p></div>
            <small>{f.label.split(':')[0].toUpperCase()}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightCard({ icon, label, insight, scenario }) {
  return (
    <div className="panel insight-card">
      <span className="insight-icon">{icon}</span>
      <div className="panel-eyebrow">{label} · RULE-BASED SCREENING</div>
      <h3>{insight.title}</h3>
      <p><strong>{insight.area}</strong> — {insight.desc}</p>
      <span className="insight-link">
        {scenario === 'baseline' ? 'Relative screening result' : 'Demo scenario active'} <b>↗</b>
      </span>
    </div>
  )
}

function Sustainability({ data }) {
  const insight = getInsight(data.rows, data.scenario, data.mode)
  const flags = getTopFlags(data.rows)
  const totals = aggregate(data.rows)

  const score = data.mode === 'demo'
    ? data.scenario === 'baseline' ? 82
      : data.scenario === 'energy' ? 69
        : data.scenario === 'water' ? 74 : 77
    : null

  return (
    <div className="page-content inner-page">
      <Heading
        eyebrow="ENVIRONMENTAL PERFORMANCE"
        title="Small changes."
        highlight="Campus-wide impact."
        description="Rule-based screening and resource indicators designed to support campus operations. They do not replace physical inspection or validated audits."
        action={<ModeBadge mode={data.mode} apiStatus={data.apiStatus} />}
      />

      <section className="panel sustain-hero">
        <div>
          <div className="panel-eyebrow">ECOTWIN DEMONSTRATION INDEX</div>
          <div className="sustain-score">{score ?? '—'}<span>/100</span></div>
          <h3>{data.mode === 'demo' ? 'Scenario responds to the data.' : 'Experimental screening view.'}</h3>
          <p>
            This presentation index is illustrative and not an audited sustainability rating.
            Switch scenarios to demonstrate how the screening interface reacts.
          </p>
          <div className="score-trend">{data.mode === 'demo' ? 'DEMO INDEX' : 'DATABASE MODE'} <small>not a verified score</small></div>
        </div>
        <div className="score-visual">
          <div className="score-ring">
            <div><span>✳</span><b>{data.mode === 'demo' ? 'DEMO' : 'SCREEN'}</b><small>RULE-BASED</small></div>
          </div>
          <i className="score-orbit" />
        </div>
      </section>

      <ScenarioControls scenario={data.scenario} setScenario={data.setScenario} mode={data.mode} />

      <div className="sustain-metrics">
        {[
          { icon: 'ϟ', title: 'Energy footprint', v: `${fmt(totals.energy)} kWh`, desc: 'Sum of latest matched area readings.', w: '72%', c: 'green' },
          { icon: '≈', title: 'Water stewardship', v: `${fmt(totals.water)} L`, desc: 'Sum of latest matched area readings.', w: '64%', c: 'blue' },
          { icon: '♧', title: 'Waste awareness', v: `${fmt(totals.waste, 1)} kg`, desc: 'Sum of latest matched area readings.', w: '58%', c: 'gold' },
        ].map((x) => (
          <div className="panel sustain-card" key={x.title}>
            <div className="sustain-card-head">
              <i className={x.c}>{x.icon}</i>
              <b className={x.c}>{x.v}</b>
            </div>
            <h3>{x.title}</h3>
            <p>{x.desc}</p>
            <div className={`progress ${x.c}`}><i style={{ width: x.w }} /></div>
            <small>{data.mode === 'demo' ? 'Simulated reading' : 'Database snapshot'}</small>
          </div>
        ))}
      </div>

      <div className="panel recommendations">
        <div className="panel-header">
          <div><div className="panel-eyebrow">ATTENTION FLAGS</div><h3>Where to investigate</h3></div>
          <span className="soft-tag">RULE-BASED · EXPLAINABLE</span>
        </div>

        <InsightCard icon="≈" label={insight.field.toUpperCase()} insight={insight} scenario={data.scenario} />

        {flags.map((f, i) => (
          <div className="recommendation-row" key={f.field}>
            <span>0{i + 1}</span>
            <div>
              <b>{f.area}</b>
              <p>{f.label}. Compare against that location’s own historical baseline before deciding whether action is needed.</p>
            </div>
            <small>{f.label.split(':')[0].toUpperCase()}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const data = useCampusData()

  useEffect(() => {
    ScrollTrigger.refresh()
  }, [location.pathname])

  return (
    <Shell mode={data.mode} setMode={data.setMode} apiStatus={data.apiStatus}>
      <Routes>
        <Route path="/" element={<Home data={data} />} />
        <Route path="/campus-map" element={<CampusMap data={data} />} />
        <Route path="/monitoring" element={<Monitoring data={data} />} />
        <Route path="/analytics" element={<Analytics data={data} />} />
        <Route path="/sustainability" element={<Sustainability data={data} />} />
        <Route path="/student-hub" element={<StudentIssues />} />
        <Route path="*" element={<Home data={data} />} />
      </Routes>
    </Shell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}