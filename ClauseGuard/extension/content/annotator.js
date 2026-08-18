/**
 * ClauseGuard — Inline Risk Annotator (Content Script)
 *
 * Injected into every page. Scans for policy links, highlights risky clauses
 * directly on the page, and shows a floating risk summary overlay.
 *
 * Uses Chrome Built-in AI when available, falls back to heuristics.
 */

(() => {
  'use strict'

  // Prevent double injection
  if (window.__clauseguard_annotator) return
  window.__clauseguard_annotator = true

  const OVERLAY_ID = 'clauseguard-overlay'
  const HIGHLIGHT_CLASS = 'cg-highlight'
  const TOOLTIP_CLASS = 'cg-tooltip'
  const BADGE_CLASS = 'cg-policy-badge'

  // ── Policy Link Detection ──────────────────────────────────

  const POLICY_URL_PATTERNS = [
    /privacy[\-\s]?policy/i,
    /terms[\-\s]?(of[\-\s]?)?(service|use|conditions)/i,
    /cookie[\-\s]?policy/i,
    /data[\-\s]?protection/i,
    /legal[\-\s]?notice/i,
    /impressum/i,
    /agb/i,
  ]

  function scanForPolicyLinks() {
    const links = document.querySelectorAll('a[href]')
    const results = []

    links.forEach((link) => {
      const href = link.href
      const text = link.textContent.trim()

      const urlMatch = POLICY_URL_PATTERNS.some((p) => p.test(href))
      const textMatch = POLICY_URL_PATTERNS.some((p) => p.test(text))

      if (urlMatch || textMatch) {
        results.push({ url: href, text: text.slice(0, 100) })
      }
    })

    const seen = new Set()
    return results.filter((r) => {
      if (seen.has(r.url)) return false
      seen.add(r.url)
      return true
    })
  }

  // ── Keyword-Based Content Classifier ───────────────────────

  const POLICY_KEYWORDS = [
    'terms of service', 'terms and conditions', 'privacy policy',
    'data protection', 'we collect', 'personal information',
    'by using this', 'you agree', 'cookies', 'third-party',
    'governing law', 'liability', 'arbitration', 'jurisdiction',
    'intellectual property', 'indemnification', 'data processing',
    'data retention', 'personal data', 'data controller',
  ]

  function classifyPageContent() {
    const text = document.body?.innerText || ''
    if (text.length < 100) return { type: 'unknown', confidence: 0 }

    const lowerText = text.toLowerCase()
    let score = 0
    for (const kw of POLICY_KEYWORDS) {
      if (lowerText.includes(kw)) score++
    }

    if (score >= 5) return { type: 'policy', confidence: Math.min(1, score / 12) }
    if (score >= 3) return { type: 'likely-policy', confidence: score / 12 }
    return { type: 'other', confidence: 0 }
  }

  // ── Clause Risk Patterns ───────────────────────────────────

  const RISK_PATTERNS = [
    { pattern: /perpetual|irrevocable|royalty-?free|sublicens(e|able)/i, severity: 'error', label: 'Broad content license', plain: 'Service gains sweeping rights to your content' },
    { pattern: /sell.*data|third-?party data broker|monetize.*data/i, severity: 'error', label: 'Data sale/broker', plain: 'Your data may be sold to third parties' },
    { pattern: /arbitration|binding arbitration|class.action.*waiver/i, severity: 'warn', label: 'Forced arbitration', plain: 'You may lose the right to sue in court' },
    { pattern: /auto-?renew|renew(s|al) automatically|recurring debit/i, severity: 'warn', label: 'Auto-renewal', plain: 'Subscription renews automatically' },
    { pattern: /may.*modify.*terms|change.*terms.*at any time|sole discretion/i, severity: 'warn', label: 'Unilateral changes', plain: 'Terms can change without your consent' },
    { pattern: /retain(ed|ion)|backup copies|persist in backups/i, severity: 'info', label: 'Data retention', plain: 'Deleted data may persist in backups' },
    { pattern: /train.*ai|machine learning.*data|ai.*model/i, severity: 'error', label: 'AI training', plain: 'Your data may train AI models' },
    { pattern: /health data|biometric|heart rate|medical data/i, severity: 'error', label: 'Sensitive health data', plain: 'Health/biometric data is collected' },
    { pattern: /precise location|gps|continuous location|always.*location/i, severity: 'error', label: 'Location tracking', plain: 'Continuous location tracking' },
    { pattern: /terminate.*account.*at any time|suspend.*without notice/i, severity: 'warn', label: 'Account termination', plain: 'Your account can be terminated without warning' },
  ]

  function findRiskyClauses(text) {
    const results = []
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20)

    for (const sentence of sentences) {
      for (const rp of RISK_PATTERNS) {
        if (rp.pattern.test(sentence)) {
          results.push({
            text: sentence.trim().slice(0, 300),
            severity: rp.severity,
            label: rp.label,
            plain: rp.plain,
          })
          break // One match per sentence
        }
      }
    }

    return results.slice(0, 10) // Cap at 10
  }

  // ── Risk Level Helper ──────────────────────────────────────

  function getRiskLevel(score) {
    if (score >= 70) return { level: 'high', color: '#f87171', emoji: '🔴', label: 'HIGH RISK' }
    if (score >= 40) return { level: 'moderate', color: '#fbbf24', emoji: '🟡', label: 'MODERATE' }
    return { level: 'low', color: '#34d399', emoji: '🟢', label: 'LOW RISK' }
  }

  // Fallback score when background is unavailable (used only for highlighting)
  function computeFallbackScore(clauses) {
    let score = 10
    for (const c of clauses) {
      if (c.severity === 'error') score += 25
      else if (c.severity === 'warn') score += 12
      else score += 3
    }
    return Math.min(95, Math.max(5, score))
  }

  // ── Inline Clause Highlighting ─────────────────────────────

  function highlightRiskyClauses(clauses) {
    if (!clauses.length) return

    // Find the main content area
    const contentAreas = document.querySelectorAll('article, main, [role="main"], .content, .policy, .terms')
    const target = contentAreas.length > 0 ? contentAreas[0] : document.body

    for (const clause of clauses) {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false)
      let node

      while ((node = walker.nextNode())) {
        const text = node.textContent
        const searchTerms = clause.text.split(/\s+/).slice(0, 5).join(' ')

        if (text.toLowerCase().includes(searchTerms.toLowerCase().slice(0, 30))) {
          highlightNode(node, clause)
          break // Highlight once per clause type
        }
      }
    }
  }

  function highlightNode(textNode, clause) {
    const span = document.createElement('span')
    span.className = HIGHLIGHT_CLASS

    const bgColor = clause.severity === 'error'
      ? 'rgba(239, 68, 68, 0.15)'
      : clause.severity === 'warn'
        ? 'rgba(251, 191, 36, 0.12)'
        : 'rgba(56, 189, 248, 0.1)'

    const borderColor = clause.severity === 'error'
      ? 'rgba(239, 68, 68, 0.4)'
      : clause.severity === 'warn'
        ? 'rgba(251, 191, 36, 0.35)'
        : 'rgba(56, 189, 248, 0.3)'

    span.style.cssText = `
      background: ${bgColor};
      border-bottom: 2px solid ${borderColor};
      cursor: help;
      position: relative;
      border-radius: 2px;
      padding: 0 1px;
    `
    span.textContent = textNode.textContent

    // Add tooltip
    const tooltip = document.createElement('div')
    tooltip.className = TOOLTIP_CLASS
    tooltip.innerHTML = `
      <div style="font-weight:700;color:${clause.severity === 'error' ? '#fca5a5' : clause.severity === 'warn' ? '#fcd34d' : '#93c5fd'};margin-bottom:3px;font-size:11px">
        ⚠ ${clause.label}
      </div>
      <div style="color:#cbd5e1;font-size:11px">${clause.plain}</div>
    `
    tooltip.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 10px;
      min-width: 200px;
      max-width: 300px;
      z-index: 2147483646;
      display: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.4;
    `
    span.appendChild(tooltip)

    span.addEventListener('mouseenter', () => { tooltip.style.display = 'block' })
    span.addEventListener('mouseleave', () => { tooltip.style.display = 'none' })

    textNode.parentNode.replaceChild(span, textNode)
  }

  // ── Floating Overlay ───────────────────────────────────────

  function createOverlay(score, risk, clauses, domain, policyUrl) {
    const existing = document.getElementById(OVERLAY_ID)
    if (existing) existing.remove()

    const el = document.createElement('div')
    el.id = OVERLAY_ID
    el.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483647;
      width: 340px;
      background: #0b1120;
      color: #e2e8f0;
      border: 1px solid #1f2b45;
      border-radius: 14px;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,.55);
      animation: cg-slide-up 0.3s ease-out;
    `

    const clauseHtml = clauses.slice(0, 3).map((c) => {
      const bg = c.severity === 'error' ? '#450a0a' : c.severity === 'warn' ? '#451a03' : '#0c4a6e'
      const border = c.severity === 'error' ? '#7f1d1d' : c.severity === 'warn' ? '#92400e' : '#075985'
      const color = c.severity === 'error' ? '#fca5a5' : c.severity === 'warn' ? '#fcd34d' : '#7dd3fc'
      return `<div style="padding:6px 8px;border-radius:6px;background:${bg};border:1px solid ${border};color:${color};margin-bottom:4px;font-size:11px">⚠ <b>${c.label || c.type || c.quote || 'Clause'}</b> · ${c.plain || ''}</div>`
    }).join('')

    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:8px;height:8px;border-radius:50%;background:${risk.color};box-shadow:0 0 8px ${risk.color}"></span>
        <b style="color:#fff;font-size:13px">ClauseGuard</b>
        <span style="margin-left:auto;font-size:10px;font-weight:700;color:${risk.color}">${risk.label}</span>
      </div>
      <p style="color:#94a3b8;font-size:11px;margin-bottom:6px">${policyUrl ? `<span style="color:#818cf8">Policy:</span> ${new URL(policyUrl).pathname}` : domain}</p>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="font-weight:800;font-size:22px;color:${risk.color}">${score}<span style="font-size:10px;color:#94a3b8">/100</span></div>
        <div style="flex:1">
          <div style="height:5px;border-radius:99px;background:#1e293b;overflow:hidden">
            <div style="width:${score}%;height:100%;border-radius:99px;background:${risk.color};transition:width 0.6s ease"></div>
          </div>
        </div>
      </div>
      ${clauseHtml || '<p style="color:#64748b;font-size:11px">No hidden clauses detected</p>'}
      <div style="display:flex;gap:6px;margin-top:10px">
        <button id="cg-open-report" style="flex:1;background:linear-gradient(90deg,#6366f1,#06b6d4);border:0;color:#fff;font-weight:700;padding:8px;border-radius:8px;cursor:pointer;font-size:11px">Full Report</button>
        <button id="cg-dismiss-overlay" style="background:transparent;border:1px solid #334155;color:#94a3b8;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:11px">Dismiss</button>
      </div>
    `

    document.body.appendChild(el)

    // Event listeners
    el.querySelector('#cg-dismiss-overlay')?.addEventListener('click', () => el.remove())
    el.querySelector('#cg-open-report')?.addEventListener('click', () => {
      const reportUrl = chrome.runtime.getURL(`pages/report.html?domain=${encodeURIComponent(domain)}`)
      chrome.runtime.sendMessage({ type: 'OPEN_REPORT', domain, score, risk: risk.level })
      window.open(reportUrl, '_blank')
    })
  }

  // ── Policy Link Badge ──────────────────────────────────────

  function addPolicyBadges(links) {
    for (const link of links) {
      const el = document.querySelector(`a[href="${link.url}"]`)
      if (!el || el.querySelector('.' + BADGE_CLASS)) continue

      const badge = document.createElement('span')
      badge.className = BADGE_CLASS
      badge.textContent = '📋'
      badge.title = 'ClauseGuard: Policy detected — click extension to analyze'
      badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
        font-size: 10px;
        opacity: 0.7;
      `
      el.appendChild(badge)
    }
  }

  // ── Main Init ──────────────────────────────────────────────

  async function init() {
    // Check if annotations are enabled
    try {
      const settings = await chrome.storage.local.get('clauseguard:settings')
      const s = settings['clauseguard:settings'] || {}
      if (s.inlineAnnotations === false) return
    } catch { /* proceed with defaults */ }

    const url = window.location.href
    const hostname = window.location.hostname

    // Step 1: Scan for policy links on the page
    const policyLinks = scanForPolicyLinks()
    if (policyLinks.length > 0) {
      addPolicyBadges(policyLinks)
    }

    // Step 2: Classify current page
    const classification = classifyPageContent()
    const isPolicyPage = classification.type === 'policy' || classification.type === 'likely-policy'

    if (isPolicyPage) {
      // We're already on a policy page — send text to background for scoring
      const text = document.body?.innerText || ''
      const clauses = findRiskyClauses(text)

      if (clauses.length > 0) highlightRiskyClauses(clauses)

      // Get authoritative score from background (single source of truth)
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'ANALYZE_TEXT',
          text,
          domain: hostname,
        })
        if (response?.analysis) {
          const { analysis } = response
          const score = analysis.riskScore
          const risk = getRiskLevel(score)
          createOverlay(score, risk, analysis.hiddenClauses || [], hostname)

          notifyBackground({
            type: 'PAGE_CLASSIFIED',
            domain: hostname,
            isPolicy: true,
            score,
            risk: risk.level,
            clauseCount: (analysis.hiddenClauses || []).length,
            url,
            clauses: analysis.hiddenClauses,
          })
        } else {
          // Fallback: use clause-based estimate
          const score = computeFallbackScore(clauses)
          const risk = getRiskLevel(score)
          createOverlay(score, risk, clauses, hostname)
          notifyBackground({ type: 'PAGE_CLASSIFIED', domain: hostname, isPolicy: true, score, risk: risk.level, clauseCount: clauses.length, url })
        }
      } catch {
        const score = computeFallbackScore(clauses)
        const risk = getRiskLevel(score)
        createOverlay(score, risk, clauses, hostname)
        notifyBackground({ type: 'PAGE_CLASSIFIED', domain: hostname, isPolicy: true, score, risk: risk.level, clauseCount: clauses.length, url })
      }
    } else if (policyLinks.length > 0) {
      // NOT a policy page, but policy links found — auto-fetch and analyze them
      // Show a "scanning" overlay while fetching
      createScanningOverlay(hostname, policyLinks)

      // Pick the best link (prefer privacy policy, then terms)
      const bestLink = pickBestPolicyLink(policyLinks)

      // Ask background to fetch the policy content (no CORS issues from service worker)
      // Use a timeout so the overlay never hangs if background fetch is blocked (e.g. bot protection)
      const FETCH_TIMEOUT = 12000
      try {
        const response = await Promise.race([
          chrome.runtime.sendMessage({
            type: 'FETCH_AND_ANALYZE',
            url: bestLink.url,
            domain: hostname,
            allLinks: policyLinks.map((l) => l.url),
          }),
          new Promise((resolve) => setTimeout(() => resolve(null), FETCH_TIMEOUT)),
        ])

        if (response && response.analysis) {
          const { analysis } = response
          const score = analysis.riskScore
          const risk = getRiskLevel(score)

          // Update overlay with real results
          createOverlay(score, risk, analysis.hiddenClauses || [], hostname, bestLink.url)

          notifyBackground({
            type: 'PAGE_CLASSIFIED',
            domain: hostname,
            isPolicy: true,
            score,
            risk: risk.level,
            clauseCount: (analysis.hiddenClauses || []).length,
            url,
            policyUrl: bestLink.url,
            clauses: analysis.hiddenClauses,
          })
        } else {
          // Fetch failed or timed out — fall back to analyzing the current page's own HTML
          try {
            const pageText = document.body?.innerText || ''
            if (pageText.length > 200) {
              const fallbackResult = await chrome.runtime.sendMessage({
                type: 'ANALYZE_TEXT',
                text: pageText,
                domain: hostname,
              })
              if (fallbackResult?.analysis) {
                const a = fallbackResult.analysis
                const score = a.riskScore
                const risk = getRiskLevel(score)
                createOverlay(score, risk, a.hiddenClauses || [], hostname)
                notifyBackground({ type: 'PAGE_CLASSIFIED', domain: hostname, isPolicy: true, score, risk: risk.level, clauseCount: a.hiddenClauses?.length || 0, url, clauses: a.hiddenClauses })
              } else {
                removeOverlay()
                notifyBackground({ type: 'PAGE_CLASSIFIED', domain: hostname, isPolicy: false, score: 0 })
              }
            } else {
              removeOverlay()
              notifyBackground({ type: 'PAGE_CLASSIFIED', domain: hostname, isPolicy: false, score: 0 })
            }
          } catch {
            removeOverlay()
            notifyBackground({ type: 'PAGE_CLASSIFIED', domain: hostname, isPolicy: false, score: 0 })
          }
        }
      } catch {
        removeOverlay()
        notifyBackground({ type: 'PAGE_CLASSIFIED', domain: hostname, isPolicy: false, score: 0 })
      }
    } else {
      // No policy page, no policy links
      notifyBackground({ type: 'PAGE_CLASSIFIED', domain: hostname, isPolicy: false, score: 0 })
    }
  }

  // ── Pick the best policy link to analyze ───────────────────

  function pickBestPolicyLink(links) {
    // Priority: privacy policy > terms of service > cookie policy > anything else
    const priority = [
      /privacy/i,
      /terms/i,
      /cookie/i,
      /legal/i,
    ]

    for (const pattern of priority) {
      const match = links.find((l) => pattern.test(l.text) || pattern.test(l.url))
      if (match) return match
    }
    return links[0]
  }

  // ── Scanning Overlay (shown while fetching) ────────────────

  function createScanningOverlay(domain, links) {
    const existing = document.getElementById(OVERLAY_ID)
    if (existing) existing.remove()

    const el = document.createElement('div')
    el.id = OVERLAY_ID
    el.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483647;
      width: 340px;
      background: #0b1120;
      color: #e2e8f0;
      border: 1px solid #1f2b45;
      border-radius: 14px;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,.55);
      animation: cg-slide-up 0.3s ease-out;
    `

    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="width:8px;height:8px;border-radius:50%;background:#6366f1;box-shadow:0 0 8px #6366f1;animation:cg-pulse 1.5s infinite"></span>
        <b style="color:#fff;font-size:13px">ClauseGuard</b>
        <span style="margin-left:auto;font-size:10px;font-weight:700;color:#818cf8">SCANNING</span>
      </div>
      <p style="color:#94a3b8;font-size:11px;margin-bottom:8px">Found ${links.length} policy link${links.length > 1 ? 's' : ''} on this page</p>
      <div style="background:#16223f;border-radius:8px;padding:8px 10px;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:16px;height:16px;border:2px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite"></div>
          <span style="color:#cbd5e1;font-size:11px">Fetching & analyzing policy...</span>
        </div>
      </div>
      <p style="color:#64748b;font-size:10px">Auto-detected: ${links[0]?.text || links[0]?.url?.split('/').pop() || 'policy page'}</p>
    `

    document.body.appendChild(el)
  }

  function removeOverlay() {
    const existing = document.getElementById(OVERLAY_ID)
    if (existing) existing.remove()
  }

  function notifyBackground(message) {
    try {
      chrome.runtime.sendMessage(message)
    } catch {
      // Extension context may be invalidated
    }
  }

  // ── Message Handler (responds to background/popup requests) ──

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_PAGE_TEXT') {
      const text = document.body?.innerText || ''
      sendResponse({ text, domain: window.location.hostname, url: window.location.href })
    }
  })

  // Inject animation keyframes
  const style = document.createElement('style')
  style.textContent = `
    @keyframes cg-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes cg-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .${HIGHLIGHT_CLASS}:hover .${TOOLTIP_CLASS} {
      display: block !important;
    }
  `
  document.head.appendChild(style)

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
