/**
 * ClauseGuard — Background Service Worker
 *
 * Handles:
 * - Badge updates based on page classification
 * - Policy change monitoring
 * - Message routing between popup, content scripts, and pages
 * - AI-powered page classification (when Chrome Built-in AI is available)
 */

// ── Badge State Management ───────────────────────────────────

const BADGE_COLORS = {
  high: '#ef4444',
  moderate: '#f59e0b',
  low: '#10b981',
  unknown: '#6b7280',
}

const BADGE_TEXT = {
  high: '!!',
  moderate: '!',
  low: '✓',
  unknown: '',
}

// ── Message Handler ──────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const respond = (fn) => {
    fn().then(sendResponse).catch((e) => sendResponse({ error: e?.message || 'Unknown error' }))
    return true
  }

  switch (message.type) {
    case 'ANALYZE_TEXT':
      return respond(() => handleAnalyzeText(message, sender))

    case 'FETCH_AND_ANALYZE':
      return respond(() => handleFetchAndAnalyze(message, sender))

    case 'PAGE_CLASSIFIED':
      handlePageClassified(message, sender)
      sendResponse({ ok: true })
      break

    case 'ANALYZE_CURRENT_TAB':
      return respond(() => handleAnalyzeCurrentTab(message.tabId))

    case 'OPEN_REPORT':
      chrome.tabs.create({
        url: chrome.runtime.getURL(`pages/report.html?domain=${encodeURIComponent(message.domain)}&score=${message.score || ''}&risk=${message.risk || ''}`),
      })
      sendResponse({ ok: true })
      break

    case 'OPEN_SETTINGS':
      chrome.tabs.create({
        url: chrome.runtime.getURL('pages/settings.html'),
      })
      sendResponse({ ok: true })
      break

    case 'GET_TAB_ANALYSIS':
      return respond(() => handleGetTabAnalysis(message.tabId || sender.tab?.id))

    case 'CHECK_POLICY_CHANGE':
      return respond(() => handlePolicyChangeCheck(message.domain, message.text))

    case 'SAVE_POLICY_SNAPSHOT':
      return respond(() => handleSaveSnapshot(message.domain, message.text, message.analysis))

    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// ── Fetch and Analyze Handler ────────────────────────────────
// Fetches a policy page from the service worker (no CORS restrictions),
// extracts text content, and runs the rule-based analyzer.

async function handleFetchAndAnalyze(message, _sender) {
  const { url, domain, allLinks } = message

  // Try to fetch the primary URL, then fallbacks
  const urlsToTry = [url, ...(allLinks || []).filter((u) => u !== url)]

  for (const fetchUrl of urlsToTry) {
    try {
      const resp = await fetch(fetchUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
      })

      if (!resp.ok) continue

      const html = await resp.text()
      const text = extractTextFromHtml(html)

      if (text.length < 100) continue

      // Run the rule-based analyzer
      const analysis = analyzePolicyText(text, domain || new URL(fetchUrl).hostname)
      const domainName = domain || new URL(fetchUrl).hostname

      // Store tab result + snapshot in a single write
      const storageData = {
        [`tab:${_sender?.tab?.id || 0}`]: {
          domain: domainName,
          score: analysis.riskScore,
          risk: analysis.overall,
          clauseCount: analysis.hiddenClauses.length,
          policyUrl: fetchUrl,
          analysis,
          analyzedAt: Date.now(),
        },
        [`snapshot:${domain}`]: {
          text: text.slice(0, 30000),
          hash: simpleHash(text),
          analysis,
          savedAt: Date.now(),
        },
      }
      await chrome.storage.local.set(storageData)

      return { analysis, fetchedUrl: fetchUrl }
    } catch {
      // Try next URL
    }
  }

  return { error: 'Could not fetch any policy page', urls: urlsToTry }
}

// ── Analyze Text Handler ──────────────────────────────────────
// Receives text from content script, runs analyzer, stores by tab ID.

async function handleAnalyzeText(message, sender) {
  const { text, domain } = message
  const tabId = sender?.tab?.id

  if (!text || text.length < 50) return { error: 'Text too short' }

  const analysis = analyzePolicyText(text, domain || 'unknown')

  // Store by tab ID so popup can read it
  if (tabId) {
    await chrome.storage.local.set({
      [`tab:${tabId}`]: {
        domain: domain || 'unknown',
        score: analysis.riskScore,
        risk: analysis.overall,
        clauseCount: analysis.hiddenClauses.length,
        analysis,
        analyzedAt: Date.now(),
      },
    })
  }

  return { analysis }
}

// ── Extract text from HTML ──────────────────────────────────

function extractTextFromHtml(html) {
  // Single-pass: strip script/style/nav/header/footer/aside blocks, then all tags
  let text = html
    .replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

// ── Rule-Based Analyzer (inlined for service worker) ────────

function analyzePolicyText(text, domain) {
  const t = (text || '').slice(0, 50000)
  const found = []

  const rules = [
    // ── CRITICAL: Only genuinely harmful clauses ──────────────
    // NOTE: .* replaced with .{0,300} to prevent catastrophic backtracking on large text
    { type: 'contentLicense', severity: 'error', category: 'ownership', pattern: /perpetual.{0,300}(?:license|rights|access)|irrevocable.{0,300}(?:license|rights)|royalty-?free.{0,300}(?:license|rights|use.{0,300}(?:content|data|information))|sublicens(e|able)|transferable.{0,300}license/i, quote: 'Broad content license', plain: 'Service gains sweeping, permanent rights to your content', whyCare: 'This lets companies monetize your uploads without paying or asking.' },
    { type: 'dataSale', severity: 'error', category: 'dataSharing', pattern: /(?:we|the\s+company|they)\s+(?:may\s+)?sell\s+(?:your\s+)?(?:personal\s+)?(?:data|information)\s+to\s+third|(?:we|the\s+company|they)\s+(?:sell|sold|selling)\s+(?:your\s+)?(?:personal\s+)?(?:data|information)\s+(?:to|for)|sell.{0,300}(?:personal\s+)?data.{0,300}broker|monetize.{0,300}(?:your\s+)?(?:personal\s+)?data|categories.{0,300}(?:data|information).{0,300}that\s+we\s+sell/i, quote: 'Data sale to third parties', plain: 'Your personal data is actively sold to third parties or data brokers', whyCare: 'Data brokers build profiles sold to advertisers, insurers, and employers.' },
    { type: 'location', severity: 'error', category: 'privacy', pattern: /(?:track|collect|monitor).{0,300}(?:precise|continuous|always|background).{0,300}(?:location|geolocation)|(?:precise|continuous|always|background).{0,300}(?:location|geolocation).{0,300}(?:track|collect|monitor)/i, quote: 'Continuous precise location tracking', plain: 'Your precise location is tracked continuously, even in the background', whyCare: 'Builds a complete movement history that can be shared or sold.' },
    { type: 'healthData', severity: 'error', category: 'privacy', pattern: /(?:collect|process|store|share|use).{0,40}(?:biometric|health\s+data|medical|genetic|mental\s+health|menstrual|sleep\s+data)|(?:biometric|health\s+data|medical|genetic|mental\s+health).{0,40}(?:collect|process|store|share|use)/i, quote: 'Sensitive health/biometric data processing', plain: 'Sensitive health or biometric data is collected and potentially shared', whyCare: 'Can influence insurance pricing, employment decisions, and more.' },
    { type: 'aiTraining', severity: 'error', category: 'privacy', pattern: /(?:use|may\s+use).{0,300}(?:your\s+)?(?:data|content|information).{0,300}(?:to\s+)?train.{0,300}(?:ai|machine\s+learning|artificial\s+intelligence)|(?:train|training).{0,300}(?:ai|machine\s+learning).{0,300}(?:your|user).{0,300}(?:data|content|information)/i, quote: 'AI/ML training on your data', plain: 'Your data or content may be used to train artificial intelligence models', whyCare: 'Once used for AI training, your data cannot be retrieved.' },

    // ── WARN: Meaningful restrictions on your rights ─────────
    { type: 'arbitration', severity: 'warn', category: 'control', pattern: /(?:binding|required|mandatory)\s+arbitration|arbitration\s+(?:clause|agreement|provision)|waiv(e|es|ing)\s+(?:your\s+)?right\s+to\s+(?:a\s+)?(?:jury|class\s+action|lawsuit)|class.action.{0,50}waiver/i, quote: 'Mandatory binding arbitration', plain: 'You are forced into private arbitration instead of court', whyCare: 'Removes the option to sue in open court and often limits damages.' },
    { type: 'autoRenew', severity: 'warn', category: 'control', pattern: /auto-?renew(?:al)?.{0,100}(?:charge|bill|debit|payment|fee)|renew(s|al)\s+automatically\s+(?:and\s+)?(?:charge|bill|debit)|pre-?authorized\s+recurring\s+(?:charge|payment|debit)/i, quote: 'Auto-renewal with automatic charge', plain: 'Your subscription renews automatically and charges your payment method', whyCare: 'Common surprise billing trap — users forget and get charged.' },
    { type: 'noRefund', severity: 'warn', category: 'control', pattern: /(?:no|not\s+eligible\s+for|does\s+not\s+(?:offer|provide))\s+(?:refunds?|money[- ]back|credit)|all\s+(?:sales?|purchases?)\s+(?:are\s+)?final|(?:no|zero)\s+refund/i, quote: 'No refund policy', plain: 'No refunds are offered, even for unsatisfactory service', whyCare: 'You cannot get your money back if the product or service disappoints.' },
    { type: 'broadIndemnity', severity: 'warn', category: 'control', pattern: /(?:you\s+(?:shall|will|must|agree\s+to))\s+indemnif(y|ies|ication).{0,300}(?:all|any|every).{0,100}(?:claim|damage|loss|liability)|(?:hold|harmless).{0,100}(?:all|any).{0,100}(?:claim|damage|loss)/i, quote: 'Broad indemnification clause', plain: 'You may be held liable for virtually any damages the company claims', whyCare: 'Shifts all risk to you, even for the company\'s own mistakes.' },
    { type: 'contentRemoval', severity: 'warn', category: 'ownership', pattern: /(?:we|the\s+company).{0,300}(?:may|can|reserve\s+the\s+right\s+to).{0,200}(?:remove|delete|disable).{0,200}(?:your|user).{0,200}(?:content|posts?|uploads?|materials?).{0,200}(?:without|at\s+any\s+time|at\s+its?\s+discretion)|remove.{0,200}(?:your|user).{0,200}(?:content|posts?|uploads?).{0,200}(?:without|at.*discretion)/i, quote: 'Content removal without notice', plain: 'The service can remove your content without notice or explanation', whyCare: 'Your work can disappear at any time with no appeal process.' },
    { type: 'broadLicense', severity: 'warn', category: 'ownership', pattern: /(?:you\s+(?:grant|licence|license|give)).{0,100}(?:irrevocable|perpetual|worldwide|unlimited).{0,100}(?:license|licence|right|permission)/i, quote: 'Broad license to your content', plain: 'You grant the company an irrevocable, worldwide license to your content', whyCare: 'They can use your content anywhere, forever, without further consent.' },
    { type: 'thirdPartySale', severity: 'warn', category: 'dataSharing', pattern: /(?:sell|sold|selling).{0,300}(?:your\s+)?(?:personal\s+)?(?:data|information)\s+(?:to|with|for).{0,200}(?:third.party|data\s+brokers?)|share.{0,300}(?:your\s+)?(?:personal\s+)?(?:data|information)\s+(?:to|with|for)\s+(?:third.party|data\s+brokers?)/i, quote: 'Personal data sold/shared with data brokers', plain: 'Your personal data is sold or shared with data brokers', whyCare: 'Data brokers build profiles sold to advertisers, insurers, and employers.' },
  ]

  for (const rule of rules) {
    if (rule.pattern.test(t)) {
      found.push({
        type: rule.type,
        severity: rule.severity,
        category: rule.category,
        quote: rule.quote,
        plain: rule.plain,
        whyCare: rule.whyCare,
      })
    }
  }

  const counts = { error: 0, warn: 0, info: 0 }
  found.forEach((f) => counts[f.severity]++)

  // Score starts at 10 (baseline for any policy). Each critical finding adds significantly.
  // A standard corporate policy should score ~15-35.
  let score = 10 + counts.error * 25 + counts.warn * 12 + counts.info * 3
  score = Math.min(95, Math.max(5, score))

  const categories = {
    privacy: Math.min(95, 10 + counts.error * 20 + counts.warn * 8 + counts.info * 2),
    dataSharing: Math.min(95, 10 + counts.error * 22 + counts.warn * 10 + counts.info * 1),
    ownership: Math.min(95, 10 + counts.error * 24 + counts.warn * 10 + counts.info * 1),
    control: Math.min(95, 10 + counts.error * 18 + counts.warn * 12 + counts.info * 2),
  }

  const overall = score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low'

  // Readability — sample first 500 words for speed
  const words = t.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const sentences = t.split(/[.!?]+/).filter(Boolean).length
  const sample = wordCount > 500 ? words.slice(0, 500) : words
  const syllables = sample.reduce((sum, w) => sum + countSyllables(w), 0)
  const avgWPS = sample.length / Math.max(sentences, 1)
  const avgSPW = syllables / Math.max(sample.length, 1)
  const gradeLevel = Math.max(0, Math.round(0.39 * avgWPS + 11.8 * avgSPW - 15.59))
  const readingEase = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * avgWPS - 84.6 * avgSPW)))

  // Vagueness — single regex pass instead of 10 splits
  const vagueMatches = t.toLowerCase().match(/may|might|could|some|various|certain|as needed|reasonable|at our discretion|without limitation/g)
  const vaguenessIndex = Math.min(100, Math.round(((vagueMatches ? vagueMatches.length : 0) / Math.max(wordCount, 1)) * 1000))

  return {
    domain,
    company: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
    type: 'Terms & Privacy',
    overall,
    riskScore: score,
    sentences: Math.min(800, Math.max(10, sentences)),
    pages: Math.max(1, Math.round(t.length / 2500)),
    readTime: `${Math.max(1, Math.round(t.length / 2000))} min`,
    categories,
    hiddenClauses: found,
    clauses: found.map((f) => ({ category: f.category, title: f.type, severity: f.severity === 'error' ? 'high' : f.severity === 'warn' ? 'medium' : 'low', raw: f.quote, plain: f.plain })),
    readability: { gradeLevel, readingEase, vaguenessIndex, wordCount },
    recommendation: overall === 'low' ? 'Low-risk policy.' : overall === 'moderate' ? 'Moderate risk. Read flagged clauses.' : 'High risk. Review carefully before accepting.',
    analyzedAt: new Date().toISOString(),
  }
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  const m = word.match(/[aeiouy]{1,2}/g)
  return m ? m.length : 1
}

// ── Page Classification Handler ──────────────────────────────

async function handlePageClassified(message, sender) {
  const tabId = sender.tab?.id
  if (!tabId) return

  const { domain, isPolicy, score, clauseCount } = message

  // Update badge
  if (isPolicy && score) {
    const level = score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low'
    await chrome.action.setBadgeText({ text: BADGE_TEXT[level], tabId })
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS[level], tabId })

    // Store analysis result for this tab
    await chrome.storage.local.set({
      [`tab:${tabId}`]: { domain, score, risk: level, clauseCount, analyzedAt: Date.now() },
    })
  } else {
    await chrome.action.setBadgeText({ text: '', tabId })
  }
}

// ── Analyze Current Tab ─────────────────────────────────────

async function handleAnalyzeCurrentTab(tabId) {
  let tab
  if (tabId) {
    try { tab = await chrome.tabs.get(tabId) } catch { /* ignore */ }
  }
  if (!tab) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    tab = activeTab
  }

  if (!tab?.url) return { error: 'No active tab' }

  const domain = new URL(tab.url).hostname

  // Try to get content from the content script
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_TEXT' })
    if (response?.text) {
      // Got text from content script — analyze it
      const analysis = analyzePolicyText(response.text, domain)
      // Store by tab ID
      if (tabId) {
        await chrome.storage.local.set({
          [`tab:${tabId}`]: { domain, score: analysis.riskScore, risk: analysis.overall, clauseCount: analysis.hiddenClauses.length, analysis, analyzedAt: Date.now() },
        })
      }
      return { analysis, domain, url: tab.url }
    }
  } catch {
    // Content script not loaded — try fetching page directly
  }

  // Fallback: fetch the page HTML directly from the service worker
  try {
    const resp = await fetch(tab.url, { signal: AbortSignal.timeout(8000), headers: { 'Accept': 'text/html' } })
    if (resp.ok) {
      const html = await resp.text()
      const text = extractTextFromHtml(html)
      if (text.length > 100) {
        const analysis = analyzePolicyText(text, domain)
        if (tabId) {
          await chrome.storage.local.set({
            [`tab:${tabId}`]: { domain, score: analysis.riskScore, risk: analysis.overall, clauseCount: analysis.hiddenClauses.length, analysis, analyzedAt: Date.now() },
          })
        }
        return { analysis, domain, url: tab.url }
      }
    }
  } catch { /* fetch failed */ }

  return { domain, url: tab.url }
}

// ── Get Tab Analysis ────────────────────────────────────────

async function handleGetTabAnalysis(tabId) {
  if (!tabId) return null
  const result = await chrome.storage.local.get(`tab:${tabId}`)
  return result[`tab:${tabId}`] || null
}

// ── Policy Change Monitoring ────────────────────────────────

async function handlePolicyChangeCheck(domain, currentText) {
  const result = await chrome.storage.local.get(`snapshot:${domain}`)
  const snapshot = result[`snapshot:${domain}`]

  if (!snapshot) {
    return { changed: false, reason: 'no-previous-snapshot' }
  }

  const currentHash = simpleHash(currentText)
  if (currentHash === snapshot.hash) {
    return { changed: false, reason: 'identical' }
  }

  // Calculate change stats
  const oldWords = snapshot.text.split(/\s+/)
  const newWords = currentText.split(/\s+/)
  const added = Math.max(0, newWords.length - oldWords.length)
  const removed = Math.max(0, oldWords.length - newWords.length)

  return {
    changed: true,
    reason: 'content-changed',
    previousDate: snapshot.savedAt,
    stats: { added, removed },
    detectedAt: Date.now(),
  }
}

async function handleSaveSnapshot(domain, text, analysis) {
  await chrome.storage.local.set({
    [`snapshot:${domain}`]: {
      text: text.slice(0, 50000),
      hash: simpleHash(text),
      analysis,
      savedAt: Date.now(),
    },
  })
  return { ok: true }
}

// ── Tab Lifecycle ───────────────────────────────────────────

// Clean up tab data when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`tab:${tabId}`)
})

// Reset badge when navigating to a new page
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId })
  }
})

// ── Utilities ───────────────────────────────────────────────

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

// ── Installation Handler ────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      'clauseguard:settings': {
        inlineAnnotations: true,
        badgeEnabled: true,
        autoScan: false,
        changeMonitoring: true,
        weights: { privacy: 1.0, dataSharing: 1.0, ownership: 1.0, control: 1.0 },
        priorities: [],
        notifyOnHighRisk: true,
        notifyOnChange: true,
        preferAI: true,
        language: 'en',
      },
      'clauseguard:history': [],
      'clauseguard:snapshots': {},
    })
  }
})
