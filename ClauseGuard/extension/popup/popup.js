/**
 * ClauseGuard — Popup Script
 *
 * Loads analysis results for the current tab from background storage.
 * All scoring is done by the background service worker (single source of truth).
 */

const urlEl = document.getElementById('url')
const scanStage = document.getElementById('stage-scan')
const doneStage = document.getElementById('stage-done')
const emptyStage = document.getElementById('stage-empty')

let currentTab = null
let currentDomain = ''

// ── Get Current Tab ─────────────────────────────────────────

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  currentTab = tab
  try {
    const u = new URL(tab.url || 'about:blank')
    currentDomain = u.hostname
    urlEl.textContent = currentDomain + u.pathname
  } catch {
    urlEl.textContent = 'Unable to read URL'
  }

  loadAnalysis()
})

// ── Load Analysis (single source: background storage) ────────

async function loadAnalysis() {
  // 1. Try cached analysis from background (keyed by tab ID)
  try {
    const result = await chrome.storage.local.get(`tab:${currentTab.id}`)
    const cached = result[`tab:${currentTab.id}`]

    if (cached && Date.now() - cached.analyzedAt < 300000) {
      if (cached.analysis) {
        const a = cached.analysis
        showResults(a.riskScore, a.overall, a.hiddenClauses?.length || 0, a.domain || currentDomain, a.hiddenClauses)
      } else {
        showResults(cached.score, cached.risk, cached.clauseCount || 0, cached.domain || currentDomain)
      }
      return
    }
  } catch { /* ignore */ }

  // 2. Try getting analysis from background via message
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TAB_ANALYSIS', tabId: currentTab.id })
    if (response?.analysis) {
      const a = response.analysis
      showResults(a.riskScore, a.overall, a.hiddenClauses?.length || 0, a.domain || currentDomain, a.hiddenClauses)
      return
    }
    if (response?.score) {
      showResults(response.score, response.risk, response.clauseCount || 0, response.domain || currentDomain)
      return
    }
  } catch { /* ignore */ }

  // 3. Ask background to analyze the current tab's content
  try {
    showScanningState()
    const response = await Promise.race([
      chrome.runtime.sendMessage({ type: 'ANALYZE_CURRENT_TAB', tabId: currentTab.id }),
      new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
    ])
    if (response?.analysis) {
      const a = response.analysis
      showResults(a.riskScore, a.overall, a.hiddenClauses?.length || 0, a.domain || currentDomain, a.hiddenClauses)
      return
    }
  } catch { /* ignore */ }

  // 4. Nothing available
  scanStage.style.display = 'none'
  emptyStage.style.display = 'block'
}

function showScanningState() {
  scanStage.innerHTML = `
    <div class="spinner"></div>
    <p>Auto-scanning policy links on this page...</p>
    <p style="font-size:10px;color:#475569;margin-top:4px">Fetching Terms &amp; Privacy pages in the background</p>
  `
}

// ── Show Results ────────────────────────────────────────────

function showResults(score, riskLevel, clauseCount, domain, directClauses) {
  scanStage.style.display = 'none'
  emptyStage.style.display = 'none'
  doneStage.style.display = 'block'

  const colors = { high: '#f87171', moderate: '#fbbf24', low: '#34d399' }
  const labels = { high: 'HIGH RISK', moderate: 'MODERATE', low: 'LOW RISK' }
  const bgColors = { high: '#7f1d1d', moderate: '#78350f', low: '#064e3b' }

  const color = colors[riskLevel]
  const label = labels[riskLevel]

  doneStage.innerHTML = `
    <div class="score-row">
      <div class="score-num" style="color:${color}">${score}<small>/100</small></div>
      <div class="bar-wrap">
        <div class="bar-head">
          <span>${clauseCount} clause${clauseCount !== 1 ? 's' : ''} found</span>
          <span style="color:${color}">${label}</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${score}%;background:${color}"></div></div>
      </div>
    </div>
    <span class="verdict" style="background:${bgColors[riskLevel]};color:${colors[riskLevel]}">
      ${riskLevel === 'high' ? 'High risk — review before accepting' : riskLevel === 'moderate' ? 'Moderate risk — read flagged clauses' : 'Low risk — standard terms'}
    </span>
    <div id="clauses-container"></div>
    <div id="change-alert-container"></div>
    <div class="actions">
      <button class="btn btn-primary" id="open-report">Full Report</button>
      <button class="btn btn-ghost" id="analyze-text">Paste & Analyze</button>
    </div>
  `

  // Load and display clauses from storage or direct pass
  loadClauseDetails(domain, directClauses)

  // Check for policy changes
  checkPolicyChange(domain)

  // Event listeners
  document.getElementById('open-report')?.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL(`pages/report.html?domain=${encodeURIComponent(domain)}&score=${score}&risk=${riskLevel}`),
    })
  })

  document.getElementById('analyze-text')?.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('pages/report.html?mode=paste'),
    })
  })
}

// ── Load Clause Details ─────────────────────────────────────

async function loadClauseDetails(domain, directClauses) {
  const container = document.getElementById('clauses-container')
  if (!container) return

  // Use directly passed clauses first
  if (directClauses && directClauses.length > 0) {
    container.innerHTML = directClauses.slice(0, 4).map((c) => {
      const cls = c.severity === 'error' ? 'error' : c.severity === 'warn' ? 'warn' : 'info'
      return `<div class="clause ${cls}">⚠ <b>${c.type || c.label || 'Clause'}</b> · ${c.plain || c.quote || ''}</div>`
    }).join('')
    return
  }

  // Fallback: try history
  try {
    const result = await chrome.storage.local.get('clauseguard:history')
    const history = result['clauseguard:history'] || []
    const entry = history.find((h) => h.domain === domain)

    if (entry?.hiddenClauses?.length > 0) {
      container.innerHTML = entry.hiddenClauses.slice(0, 4).map((c) => {
        const cls = c.severity === 'error' ? 'error' : c.severity === 'warn' ? 'warn' : 'info'
        return `<div class="clause ${cls}">⚠ <b>${c.type || 'Clause'}</b> · ${c.plain || c.quote || ''}</div>`
      }).join('')
    }
  } catch { /* ignore */ }
}

// ── Check Policy Change ─────────────────────────────────────

async function checkPolicyChange(domain) {
  const container = document.getElementById('change-alert-container')
  if (!container) return

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_POLICY_CHANGE',
      domain,
      text: '', // Will use stored snapshot
    })

    if (response?.changed) {
      container.innerHTML = `
        <div class="change-alert">
          ⚠ <b>Policy Changed!</b> This policy was updated since your last visit.
          <br><span style="font-size:10px;color:#fca5a5">Last checked: ${new Date(response.previousDate).toLocaleDateString()}</span>
        </div>
      `
    }
  } catch { /* ignore */ }
}

// ── Settings Link ───────────────────────────────────────────

document.getElementById('open-settings')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' })
  window.close()
})
