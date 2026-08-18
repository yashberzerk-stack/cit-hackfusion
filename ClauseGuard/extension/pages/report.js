/**
 * ClauseGuard — Full Report Page
 *
 * Shows detailed analysis results with risk scores, category breakdown,
 * hidden clauses, plain English translations, and readability metrics.
 * Also supports paste-and-analyze mode.
 */

const contentEl = document.getElementById('content')
const loadingEl = document.getElementById('loading')

const params = new URLSearchParams(window.location.search)
const domain = params.get('domain') || ''
const mode = params.get('mode') || ''
const initialScore = parseInt(params.get('score')) || 0
const initialRisk = params.get('risk') || ''

// ── Initialize ──────────────────────────────────────────────

if (mode === 'paste') {
  showPasteMode()
} else if (domain) {
  loadReport(domain)
} else {
  showPasteMode()
}

// ── Paste Mode ──────────────────────────────────────────────

function showPasteMode() {
  loadingEl.style.display = 'none'
  contentEl.innerHTML = `
    <h1>Paste & Analyze</h1>
    <p class="sub">Paste any Terms of Service or Privacy Policy text for instant analysis.</p>
    <div class="card" style="margin-top:16px">
      <textarea class="paste-area" id="paste-input" placeholder="Paste the full text of a privacy policy or terms of service here..."></textarea>
      <button class="btn btn-primary" style="width:100%;margin-top:12px" id="run-analysis">Analyze Text</button>
    </div>
    <div id="paste-results"></div>
  `

  document.getElementById('run-analysis')?.addEventListener('click', () => {
    const text = document.getElementById('paste-input')?.value || ''
    if (text.trim().length < 50) {
      alert('Please paste at least 50 characters of policy text.')
      return
    }
    analyzeAndDisplay(text, 'pasted.policy')
  })
}

// ── Load Report ─────────────────────────────────────────────

async function loadReport(domain) {
  // Check cache first
  try {
    const result = await chrome.storage.local.get('clauseguard:history')
    const history = result['clauseguard:history'] || []
    const entry = history.find((h) => h.domain === domain)

    if (entry) {
      displayFullReport(entry)
      return
    }
  } catch { /* ignore */ }

  // Check if we have a snapshot
  try {
    const result = await chrome.storage.local.get(`snapshot:${domain}`)
    const snapshot = result[`snapshot:${domain}`]
    if (snapshot?.analysis) {
      displayFullReport(snapshot.analysis)
      return
    }
  } catch { /* ignore */ }

  // Show paste mode as fallback
  loadingEl.innerHTML = `
    <p style="color:#94a3b8;margin-bottom:12px">No cached analysis for <b style="color:#fff">${domain}</b></p>
    <p style="font-size:11px;color:#64748b;margin-bottom:16px">Paste the policy text below to run a fresh analysis.</p>
  `
  showPasteMode()
}

// ── Analyze Pasted Text ─────────────────────────────────────

async function analyzeAndDisplay(text, domain) {
  // Import analyzer dynamically
  const { analyzePolicyText } = await import(chrome.runtime.getURL('analyzer/ruleAnalyzer.js'))

  // Load personalized weights
  let weights = null
  try {
    const result = await chrome.storage.local.get('clauseguard:settings')
    const settings = result['clauseguard:settings'] || {}
    if (settings.weights) weights = settings.weights
  } catch { /* ignore */ }

  const analysis = analyzePolicyText(text, domain, weights)
  displayFullReport(analysis)

  // Save to history
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_POLICY_SNAPSHOT',
      domain: domain === 'pasted.policy' ? 'pasted-analysis' : domain,
      text,
      analysis,
    })
  } catch { /* ignore */ }
}

// ── Display Full Report ─────────────────────────────────────

function displayFullReport(data) {
  loadingEl.style.display = 'none'

  const score = data.riskScore || initialScore || 0
  const risk = data.overall || initialRisk || (score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low')
  const colors = { high: '#f87171', moderate: '#fbbf24', low: '#34d399' }
  const labels = { high: 'HIGH RISK', moderate: 'MODERATE RISK', low: 'LOW RISK' }
  const color = colors[risk]

  const categories = data.categories || { privacy: 0, dataSharing: 0, ownership: 0, control: 0 }
  const catMeta = [
    { key: 'privacy', label: 'Privacy Risk' },
    { key: 'dataSharing', label: 'Data Sharing' },
    { key: 'ownership', label: 'Content Ownership' },
    { key: 'control', label: 'Account Control' },
  ]

  const hiddenClauses = data.hiddenClauses || []
  const readability = data.readability || {}

  let html = `
    <h1>${data.domain || domain || 'Policy Analysis'}</h1>
    <p class="sub">
      ${data.company || 'Unknown'} · ${data.pages || '?'} pages · ${data.sentences || '?'} sentences · ~${data.readTime || '?'} to read
    </p>

    <div class="score-ring">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" stroke-width="8"/>
        <circle cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="8"
          stroke-dasharray="${Math.PI * 104}" stroke-dashoffset="${Math.PI * 104 * (1 - score / 100)}"
          stroke-linecap="round" transform="rotate(-90 60 60)"
          style="transition: stroke-dashoffset 1s ease"/>
        <text x="60" y="56" text-anchor="middle" fill="white" font-size="28" font-weight="800">${score}</text>
        <text x="60" y="72" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">/ 100</text>
      </svg>
    </div>

    <div class="card">
      <h2>Category Risk Profile</h2>
      <div class="meters">
        ${catMeta.map((c) => {
          const val = categories[c.key] || 0
          const cColor = val >= 70 ? '#f87171' : val >= 40 ? '#fbbf24' : '#34d399'
          return `<div class="meter"><span>${c.label}</span><b style="color:${cColor}">${val}</b></div>`
        }).join('')}
      </div>
    </div>

    ${hiddenClauses.length > 0 ? `
    <div class="card">
      <h2>⚠ Hidden Clause Finder (${hiddenClauses.length})</h2>
      ${hiddenClauses.map((c) => {
        const cls = c.severity === 'error' ? 'error' : c.severity === 'warn' ? 'warn' : 'info'
        const titleCls = c.severity === 'error' ? 'err-title' : c.severity === 'warn' ? 'warn-title' : 'info-title'
        return `
          <div class="clause ${cls}">
            <span class="${titleCls}">${(c.severity || 'info').toUpperCase()} · ${c.type || c.label || 'Clause'}</span>
            <p class="plain">"${c.quote || c.text || ''}"</p>
            <p class="why">→ ${c.plain || c.whyCare || ''}</p>
          </div>
        `
      }).join('')}
    </div>
    ` : ''}

    ${readability.gradeLevel !== undefined ? `
    <div class="card">
      <h2>📖 Readability Analysis</h2>
      <div class="readability">
        <div class="read-item">
          <div class="label">Grade Level</div>
          <div class="value">${readability.gradeLevel}</div>
          <div class="desc">${readability.gradeLevel > 12 ? 'College level — very complex' : readability.gradeLevel > 8 ? 'High school level' : 'Easy to read'}</div>
        </div>
        <div class="read-item">
          <div class="label">Reading Ease</div>
          <div class="value">${readability.readingEase}/100</div>
          <div class="desc">${readability.readingEase > 60 ? 'Fairly easy to understand' : readability.readingEase > 30 ? 'Difficult to read' : 'Very difficult'}</div>
        </div>
        <div class="read-item">
          <div class="label">Avg Sentence Length</div>
          <div class="value">${readability.avgSentenceLength || '?'} words</div>
          <div class="desc">${(readability.avgSentenceLength || 0) > 25 ? 'Long sentences — hard to follow' : 'Moderate length'}</div>
        </div>
        <div class="read-item">
          <div class="label">Vagueness Index</div>
          <div class="value">${readability.vaguenessIndex || 0}%</div>
          <div class="desc">${(readability.vaguenessIndex || 0) > 5 ? 'High vagueness — vague language used frequently' : 'Relatively clear'}</div>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="rec">
      <b>Recommendation:</b> ${data.recommendation || 'No recommendation available.'}
    </div>

    <div class="actions">
      <button class="btn btn-primary" id="btn-save">Save to History</button>
      <button class="btn btn-ghost" id="btn-export">Export JSON</button>
    </div>
  `

  contentEl.innerHTML = html

  // Event listeners
  document.getElementById('btn-save')?.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_POLICY_SNAPSHOT',
        domain: data.domain || domain || 'unknown',
        text: '',
        analysis: data,
      })
      document.getElementById('btn-save').textContent = '✓ Saved'
      document.getElementById('btn-save').style.background = '#064e3b'
      document.getElementById('btn-save').style.color = '#34d399'
    } catch { /* ignore */ }
  })

  document.getElementById('btn-export')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clauseguard-${(data.domain || 'report').replace(/[^a-z0-9.-]/gi, '_')}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  })
}
