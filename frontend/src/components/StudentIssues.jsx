
import { useCallback, useEffect, useMemo, useState } from 'react'
import './StudentIssues.css'

// Use port 8001, where your current Python API is running.
const API_BASE = 'http://127.0.0.1:8001/api'

const ISSUE_CATEGORIES = [
  'Water & plumbing',
  'Electrical',
  'Waste & cleanliness',
  'Building & classroom',
  'Roads & safety',
  'Wi-Fi & IT',
  'Facilities',
  'Other',
]

const LOCATIONS = [
  'A Block / School of Engineering',
  'B Block / AI Block',
  'Academic Building',
  'BBA & B.Com Building',
  'Nursing Building',
  'CDSIMER Medical College',
  'Library',
  'Canteen',
  'Boys Hostel',
  'Girls Hostel',
  'Staff Quarters',
  'Main Arena',
  'Football / cricket grounds',
  'Basketball courts',
  'Volleyball courts',
  'Pickleball courts',
  'Roads / walkways',
  'Other / campus-wide',
]

const REWARDS = [
  { id: 'canteen_snack', name: 'Canteen snack coupon', detail: 'Prototype reward preview', points: 60, symbol: '₹' },
  { id: 'canteen_drink', name: 'Refreshment voucher', detail: 'Prototype reward preview', points: 40, symbol: '₹' },
  { id: 'printing_credits', name: 'Printing credits', detail: 'Prototype reward preview', points: 80, symbol: '↗' },
  { id: 'eco_merch', name: 'Eco merch reward', detail: 'Prototype reward preview', points: 180, symbol: '✳' },
]

const STATUS_STEPS = ['Submitted', 'Acknowledged', 'In progress', 'Resolved']
const ADMIN_KEY_DEFAULT = 'ecotwin-demo-2026'

const defaultForm = {
  category: ISSUE_CATEGORIES[0],
  location: 'Library',
  priority: 'Normal',
  title: '',
  description: '',
}

function localDate(value) {
  if (!value) return 'Just now'
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}

function displayStatus(status) {
  const statuses = {
    submitted: 'Submitted',
    acknowledged: 'Acknowledged',
    in_progress: 'In progress',
    resolved: 'Resolved',
    declined: 'Declined',
  }

  return statuses[String(status || '').toLowerCase()] || status || 'Submitted'
}

function apiStatus(status) {
  const statuses = {
    Submitted: 'submitted',
    Acknowledged: 'acknowledged',
    'In progress': 'in_progress',
    Resolved: 'resolved',
    Declined: 'declined',
  }

  return statuses[status] || status
}

function statusClass(status) {
  return String(status || 'Submitted')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
}

function mapComplaint(row) {
  return {
    ...row,
    id: row.id,
    token: row.ticket_code,
    status: displayStatus(row.status),
    points_awarded: Number(row.points_awarded || 0),
  }
}

async function readResponse(response) {
  let payload = {}

  try {
    payload = await response.json()
  } catch {
    // Keep the response error useful even if the server didn't return JSON.
  }

  if (!response.ok) {
    throw new Error(
      payload.detail ||
      payload.message ||
      `API returned HTTP ${response.status}.`
    )
  }

  return payload
}

export default function StudentIssues() {
  // This ID matches the test complaint created earlier in Swagger.
  const [studentId, setStudentId] = useState(() => {
    try {
      return localStorage.getItem('ecotwin-student-id') || 'DSU-DEMO-01'
    } catch {
      return 'DSU-DEMO-01'
    }
  })

  const [form, setForm] = useState({ ...defaultForm })
  const [view, setView] = useState('report')
  const [issues, setIssues] = useState([])
  const [rewardData, setRewardData] = useState({
    balance: 0,
    ledger: [],
    earned: 0,
    redeemed: 0,
  })

  const [apiState, setApiState] = useState('connecting')
  const [apiError, setApiError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewKey, setReviewKey] = useState('')
  const [reviewIssues, setReviewIssues] = useState([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [redeeming, setRedeeming] = useState('')

  const loadStudentData = useCallback(async (id = studentId) => {
    const normalizedId = String(id || '').trim().toUpperCase()

    if (normalizedId.length < 3) {
      setIssues([])
      setRewardData({ balance: 0, ledger: [], earned: 0, redeemed: 0 })
      setApiState('connected')
      setApiError('')
      return
    }

    try {
      const query = new URLSearchParams({ student_id: normalizedId })

      const [complaintsResponse, walletResponse] = await Promise.all([
        fetch(
          `${API_BASE}/campus-care/complaints?${query.toString()}`,
          { cache: 'no-store' }
        ),
        fetch(
          `${API_BASE}/campus-care/wallet/${encodeURIComponent(normalizedId)}`,
          { cache: 'no-store' }
        ),
      ])

      const [complaintsData, walletData] = await Promise.all([
        readResponse(complaintsResponse),
        readResponse(walletResponse),
      ])

      setIssues((complaintsData.complaints || []).map(mapComplaint))

      const redemptions = (walletData.redemptions || []).map(item => ({
        id: item.id,
        points: -Number(item.points_cost || 0),
        description: `Redeemed · ${item.reward_name}`,
        created_at: item.created_at,
        redemption_code: item.redemption_code,
      }))

      setRewardData({
        balance: Number(walletData.points_balance || 0),
        earned: Number(walletData.total_earned || 0),
        redeemed: Number(walletData.total_redeemed || 0),
        ledger: redemptions,
      })

      setApiState('connected')
      setApiError('')
    } catch (error) {
      console.error('Campus Care connection failed:', error)
      setApiState('offline')
      setApiError(
        `${error.message || 'Could not reach the API.'} API URL: ${API_BASE}`
      )
    }
  }, [studentId])

  useEffect(() => {
    loadStudentData()

    const timer = window.setInterval(() => {
      loadStudentData()
    }, 10000)

    return () => window.clearInterval(timer)
  }, [loadStudentData])

  useEffect(() => {
    try {
      localStorage.setItem('ecotwin-student-id', studentId.trim())
    } catch {
      // Browser storage may be disabled.
    }
  }, [studentId])

  const myResolved = useMemo(
    () => issues.filter(issue => issue.status === 'Resolved').length,
    [issues]
  )

  const myOpen = useMemo(
    () => issues.filter(
      issue => !['Resolved', 'Declined'].includes(issue.status)
    ).length,
    [issues]
  )

  async function submitIssue(event) {
    event.preventDefault()
    setMessage('')

    const normalizedId = studentId.trim().toUpperCase()

    if (normalizedId.length < 3) {
      setMessage('Enter a student/demo ID with at least 3 characters.')
      return
    }

    if (form.title.trim().length < 5) {
      setMessage('Give the issue a title of at least 5 characters.')
      return
    }

    if (form.description.trim().length < 15) {
      setMessage('Add at least 15 characters describing the issue.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE}/campus-care/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: 'Demo Student',
          student_id: normalizedId,
          category: form.category,
          location: form.location,
          priority: form.priority,
          title: form.title.trim(),
          description: form.description.trim(),
        }),
      })

      const payload = await readResponse(response)
      const complaint = payload.complaint || {}

      setMessage(
        `Report submitted! Tracking token: ${complaint.ticket_code || payload.ticket_code}.`
      )

      setForm(previous => ({
        ...previous,
        title: '',
        description: '',
      }))

      setView('tickets')
      await loadStudentData(normalizedId)
    } catch (error) {
      console.error('Complaint submission failed:', error)
      setMessage(error.message || 'Could not submit your report.')
    } finally {
      setSubmitting(false)
    }
  }

  async function loadReviewQueue() {
    if (!reviewKey.trim()) {
      setMessage('Enter the facilities reviewer key.')
      return
    }

    setReviewLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${API_BASE}/campus-care/complaints`, {
        headers: { 'X-Admin-Key': reviewKey.trim() },
        cache: 'no-store',
      })

      const payload = await readResponse(response)
      setReviewIssues((payload.complaints || []).map(mapComplaint))
      setReviewOpen(true)
      setMessage(`Review queue loaded: ${payload.count ?? payload.complaints?.length ?? 0} reports.`)
    } catch (error) {
      console.error('Review queue request failed:', error)
      setMessage(error.message || 'Could not load the review queue.')
    } finally {
      setReviewLoading(false)
    }
  }

  async function updateIssueStatus(issue, status) {
    if (!issue.id) {
      setMessage('This ticket has no database ID. Refresh the review queue.')
      return
    }

    try {
      const response = await fetch(
        `${API_BASE}/campus-care/complaints/${issue.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': reviewKey.trim(),
          },
          body: JSON.stringify({ status: apiStatus(status) }),
        }
      )

      const payload = await readResponse(response)
      const awarded = payload.points_awarded_now
        ? Number(payload.complaint?.points_awarded || 20)
        : 0

      setMessage(
        awarded
          ? `${status}. ${awarded} EcoPoints awarded once to ${payload.complaint?.student_id || issue.student_id}.`
          : `Report status updated to ${status}.`
      )

      await loadStudentData(studentId.trim())
      await loadReviewQueue()
    } catch (error) {
      console.error('Status update failed:', error)
      setMessage(error.message || 'Status update failed.')
    }
  }

  async function redeemReward(reward) {
    setRedeeming(reward.id)
    setMessage('')

    try {
      const response = await fetch(`${API_BASE}/campus-care/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId.trim().toUpperCase(),
          reward_id: reward.id,
        }),
      })

      const payload = await readResponse(response)

      setMessage(
        `Demo redemption created: ${payload.redemption_code}. This is not a real canteen voucher.`
      )

      await loadStudentData(studentId.trim())
    } catch (error) {
      console.error('Reward redemption failed:', error)
      setMessage(error.message || 'Redemption failed.')
    } finally {
      setRedeeming('')
    }
  }

  return (
    <div className="page-content inner-page student-hub-page">
      <div className="sh-hero">
        <div className="sh-hero-copy">
          <div className="sh-eyebrow">
            <span className="sh-pulse" /> STUDENT PARTICIPATION · CAMPUS CARE
          </div>
          <h1>Spot it.<br /><em>Report it.</em> Improve it.</h1>
          <p>
            Help the campus team resolve everyday issues faster. Track your
            report and earn EcoPoints when a report is verified and resolved.
          </p>
          <div className="sh-hero-note">
            <span>✳</span> Small reports can create a better campus.
          </div>
        </div>

        <div className="sh-token-art" aria-hidden="true">
          <div className="sh-token-orbit o1" />
          <div className="sh-token-orbit o2" />
          <div className="sh-token-core">
            <span>e.</span><b>ECO</b><small>POINTS</small>
          </div>
          <div className="sh-floating-token ft1">+20 <small>POINTS</small></div>
          <div className="sh-floating-token ft2">✓ <small>RESOLVED</small></div>
        </div>
      </div>

      <div className="sh-toolbar">
        <div className="sh-id-field">
          <label htmlFor="sh-student-id">STUDENT / DEMO ID</label>
          <input
            id="sh-student-id"
            value={studentId}
            onChange={event => setStudentId(event.target.value.slice(0, 32))}
            placeholder="e.g. DSU-DEMO-01"
          />
          <span>Prototype account · use a demo ID for the presentation</span>
        </div>

        <div className="sh-api-state">
          <i className={apiState === 'connected' ? 'is-live' : ''} />
          {apiState === 'connected'
            ? 'CAMPUS CARE CONNECTED'
            : apiState === 'connecting'
              ? 'CONNECTING…'
              : 'API OFFLINE'}
        </div>
      </div>

      {apiState === 'offline' && (
        <div className="sh-inline-warning">
          {apiError || 'Campus Care cannot currently reach the API.'}
        </div>
      )}

      <div className="sh-stats-grid">
        <article className="sh-stat">
          <span>MY REPORTS</span><strong>{issues.length}</strong>
          <small>Tracked for this ID</small>
        </article>
        <article className="sh-stat">
          <span>OPEN ISSUES</span><strong>{myOpen}</strong>
          <small>Awaiting resolution</small>
        </article>
        <article className="sh-stat">
          <span>RESOLVED</span><strong>{myResolved}</strong>
          <small>Marked resolved by review</small>
        </article>
        <article className="sh-stat sh-points-stat">
          <span>AVAILABLE ECOPOINTS</span>
          <strong>{rewardData.balance}<small> pts</small></strong>
          <small>Reward ledger balance</small>
        </article>
      </div>

      <div className="sh-tabbar" role="tablist" aria-label="Student Hub sections">
        {[
          ['report', 'Raise an issue'],
          ['tickets', 'Track my reports'],
          ['rewards', 'EcoPoints & rewards'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            className={view === id ? 'active' : ''}
            onClick={() => { setView(id); setMessage('') }}
          >
            {label}
            {id === 'tickets' && issues.length > 0 && <span>{issues.length}</span>}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`sh-message ${
            /failed|could not|error|not enough|incorrect|disabled/i.test(message)
              ? 'error'
              : ''
          }`}
          role="status"
        >
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss message">×</button>
        </div>
      )}

      {view === 'report' && (
        <div className="sh-content-grid">
          <section className="sh-panel sh-form-panel">
            <div className="sh-panel-kicker">01 / NEW REPORT</div>
            <h2>What needs attention?</h2>
            <p className="sh-muted">
              Share enough detail for the facilities team to locate and verify the issue.
            </p>

            <form onSubmit={submitIssue} className="sh-form">
              <div className="sh-form-row">
                <label>
                  Issue category
                  <select
                    value={form.category}
                    onChange={event => setForm(v => ({ ...v, category: event.target.value }))}
                  >
                    {ISSUE_CATEGORIES.map(category => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  Campus location
                  <select
                    value={form.location}
                    onChange={event => setForm(v => ({ ...v, location: event.target.value }))}
                  >
                    {LOCATIONS.map(location => <option key={location}>{location}</option>)}
                  </select>
                </label>
              </div>

              <div className="sh-form-row">
                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={event => setForm(v => ({ ...v, priority: event.target.value }))}
                  >
                    <option>Normal</option>
                    <option>Urgent</option>
                  </select>
                  <small>For emergencies, contact campus security directly.</small>
                </label>
                <label>
                  Short title
                  <input
                    maxLength={120}
                    required
                    value={form.title}
                    onChange={event => setForm(v => ({ ...v, title: event.target.value }))}
                    placeholder="e.g. Water tap leaking near library"
                  />
                </label>
              </div>

              <label>
                Description
                <textarea
                  required
                  minLength={15}
                  maxLength={1200}
                  rows={4}
                  value={form.description}
                  onChange={event => setForm(v => ({ ...v, description: event.target.value }))}
                  placeholder="What did you notice? Include a nearby room, floor, or landmark."
                />
                <small>{form.description.length}/1200 characters · Avoid sensitive personal information.</small>
              </label>

              <div className="sh-form-footer">
                <span><b>✳</b> Your report gets a unique tracking token.</span>
                <button className="sh-submit" type="submit" disabled={submitting || apiState !== 'connected'}>
                  {submitting ? 'Submitting…' : 'Submit report'} <span>↗</span>
                </button>
              </div>
            </form>
          </section>

          <aside className="sh-panel sh-how-panel">
            <div className="sh-panel-kicker">HOW IT WORKS</div>
            <h2>From report to reward.</h2>
            {[
              ['01', 'Submit the issue', 'Describe what you spotted and where.'],
              ['02', 'Get a tracking token', 'Use the token to follow its status.'],
              ['03', 'Facilities team reviews', 'Reports move through acknowledgement and in-progress stages.'],
              ['04', 'Earn EcoPoints', '20 points are awarded once when the report is resolved.'],
            ].map(([number, title, description]) => (
              <div className="sh-step" key={number}>
                <span>{number}</span><div><b>{title}</b><p>{description}</p></div>
              </div>
            ))}
            <div className="sh-reward-callout">
              <div className="sh-callout-icon">✳</div>
              <div>
                <b>Help the campus. Earn rewards.</b>
                <p>
                  EcoPoints are prototype incentives. The catalogue is not a
                  real voucher programme until participating campus outlets
                  approve fulfilment.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {view === 'tickets' && (
        <section className="sh-panel sh-ticket-panel">
          <div className="sh-section-head">
            <div>
              <div className="sh-panel-kicker">02 / YOUR TRACKER</div>
              <h2>Every report has a trail.</h2>
              <p className="sh-muted">Tickets shown for the student/demo ID above.</p>
            </div>
            <button className="sh-outline-btn" onClick={() => loadStudentData()}>
              ↻ Refresh
            </button>
          </div>

          {issues.length === 0 ? (
            <div className="sh-empty">
              <span>◎</span><b>No reports for this ID yet.</b>
              <p>Raise an issue to receive your first tracking token.</p>
              <button className="sh-outline-btn" onClick={() => setView('report')}>Raise an issue</button>
            </div>
          ) : (
            <div className="sh-ticket-list">
              {issues.map(issue => (
                <article className="sh-ticket" key={issue.id}>
                  <div className="sh-ticket-top">
                    <div>
                      <span className="sh-token-label">TRACKING TOKEN</span>
                      <strong>{issue.token}</strong>
                    </div>
                    <span className={`sh-status status-${statusClass(issue.status)}`}>{issue.status}</span>
                  </div>
                  <div className="sh-ticket-body">
                    <div>
                      <h3>{issue.title}</h3>
                      <p>{issue.category} <i>·</i> {issue.location} <i>·</i> {issue.priority} priority</p>
                      <p className="sh-ticket-description">{issue.description}</p>
                    </div>
                    <div className="sh-ticket-points">
                      <strong>+{issue.points_awarded || 0}</strong>
                      <small>EcoPoints<br />awarded</small>
                    </div>
                  </div>
                  <div className="sh-timeline">
                    {STATUS_STEPS.map((step, index) => {
                      const current = STATUS_STEPS.indexOf(issue.status)
                      return (
                        <div key={step} className={`sh-timeline-step ${current >= index ? 'done' : ''} ${current === index ? 'current' : ''}`}>
                          <i>{current > index ? '✓' : String(index + 1).padStart(2, '0')}</i>
                          <span>{step}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="sh-ticket-foot">
                    <span>Submitted {localDate(issue.created_at)}</span>
                    <span>{issue.status === 'Resolved' ? 'Thanks for helping improve campus.' : `Updated ${localDate(issue.updated_at)}`}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="sh-review-toggle">
            <div>
              <b>Facilities review · demo walkthrough</b>
              <p>Use the reviewer key to demonstrate how submitted reports are reviewed and resolved.</p>
            </div>
            <button className="sh-outline-btn" onClick={() => { setReviewOpen(v => !v); setMessage('') }}>
              {reviewOpen ? 'Hide reviewer' : 'Open reviewer ↗'}
            </button>
          </div>

          {reviewOpen && (
            <div className="sh-review-panel">
              <label>
                Reviewer key
                <input
                  type="password"
                  value={reviewKey}
                  onChange={event => setReviewKey(event.target.value)}
                  placeholder="Enter reviewer key"
                  autoComplete="off"
                />
              </label>
              <button className="sh-submit" onClick={loadReviewQueue} disabled={reviewLoading}>
                {reviewLoading ? 'Loading…' : 'Load review queue'}
              </button>
              <p className="sh-data-disclaimer">
                Local demo key: <code>{ADMIN_KEY_DEFAULT}</code>. Do not use this key in a public deployment.
              </p>

              {reviewIssues.length === 0 ? (
                <p className="sh-muted">Load the queue to view submitted reports.</p>
              ) : (
                <div className="sh-review-list">
                  {reviewIssues.map(issue => (
                    <div className="sh-review-row" key={issue.id}>
                      <div>
                        <b>{issue.title}</b>
                        <small>{issue.token} · {issue.student_id} · {issue.location}</small>
                        <span className={`sh-status status-${statusClass(issue.status)}`}>{issue.status}</span>
                      </div>
                      <div className="sh-review-actions">
                        {issue.status === 'Submitted' && (
                          <button onClick={() => updateIssueStatus(issue, 'Acknowledged')}>Acknowledge</button>
                        )}
                        {['Submitted', 'Acknowledged'].includes(issue.status) && (
                          <button onClick={() => updateIssueStatus(issue, 'In progress')}>Start work</button>
                        )}
                        {!['Resolved', 'Declined'].includes(issue.status) && (
                          <button className="resolve" onClick={() => updateIssueStatus(issue, 'Resolved')}>Resolve + award</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {view === 'rewards' && (
        <div className="sh-content-grid sh-rewards-grid">
          <section className="sh-panel sh-reward-balance">
            <div className="sh-panel-kicker">03 / REWARDS WALLET</div>
            <h2>Your effort has value.</h2>
            <p className="sh-muted">Earn points when a report is reviewed and resolved.</p>
            <div className="sh-wallet-number">{rewardData.balance}<small> EcoPoints</small></div>
            <div className="sh-wallet-caption">AVAILABLE BALANCE · {studentId || 'NO STUDENT ID'}</div>
            <div className="sh-wallet-rule"><span>✳</span> Points are awarded only once per resolved report.</div>
            <h3 className="sh-ledger-title">Recent redemptions</h3>
            {rewardData.ledger.length === 0 ? (
              <p className="sh-muted">No redemptions yet. Your balance updates when reports are resolved.</p>
            ) : (
              <div className="sh-ledger">
                {rewardData.ledger.slice(0, 8).map(item => (
                  <div key={item.id} className="sh-ledger-row">
                    <span className="sh-ledger-icon spent">↗</span>
                    <div>
                      <b>{item.description}</b>
                      <small>{localDate(item.created_at)}{item.redemption_code ? ` · ${item.redemption_code}` : ''}</small>
                    </div>
                    <strong className="negative">{item.points}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="sh-panel sh-redemption-panel">
            <div className="sh-panel-kicker">REDEEM · PREVIEW CATALOG</div>
            <h2>Choose a reward.</h2>
            <p className="sh-muted">Demo redemptions are not live vouchers.</p>
            <div className="sh-reward-options">
              {REWARDS.map(reward => (
                <article className="sh-reward-option" key={reward.id}>
                  <div className="sh-reward-symbol">{reward.symbol}</div>
                  <div className="sh-reward-details">
                    <b>{reward.name}</b>
                    <p>{reward.detail}</p>
                    <span>{reward.points} EcoPoints</span>
                  </div>
                  <button
                    disabled={rewardData.balance < reward.points || redeeming === reward.id}
                    onClick={() => redeemReward(reward)}
                  >
                    {redeeming === reward.id ? 'Working…' : rewardData.balance < reward.points ? 'Locked' : 'Preview redeem'}
                  </button>
                </article>
              ))}
            </div>
            <div className="sh-redemption-note">
              <b>Before this goes live</b>
              <p>Actual redemption requires verified student accounts and an approved campus outlet.</p>
            </div>
          </section>
        </div>
      )}

      <section className="sh-review-footer">
        <span>ECOTWIN · STUDENT HUB</span>
        <span>Participation rewards · demo workflow · no real voucher issued</span>
      </section>
    </div>
  )
}
