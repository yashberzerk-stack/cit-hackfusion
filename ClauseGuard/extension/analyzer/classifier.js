/**
 * ClauseGuard AI Page Classifier
 *
 * Three-tier classification system:
 * Tier 1: Chrome Built-in AI (Gemini Nano) — best quality, on-device
 * Tier 2: Keyword/rule-based heuristics — works everywhere
 * Tier 3: URL pattern matching — fastest, lowest quality
 */

const POLICY_URL_PATTERNS = [
  /privacy[\-\s]?policy/i,
  /terms[\-\s]?(of[\-\s]?)?(service|use|conditions)/i,
  /cookie[\-\s]?policy/i,
  /data[\-\s]?protection/i,
  /legal[\-\s]?notice/i,
  /impressum/i,
  /agb/i,
  /gdpr/i,
  /acceptable[\-\s]?use/i,
  /community[\-\s]?guidelines/i,
  /refund[\-\s]?policy/i,
]

const POLICY_KEYWORDS = [
  'terms of service', 'terms and conditions', 'privacy policy',
  'data protection', 'we collect', 'personal information',
  'by using this', 'you agree', 'cookies', 'third-party',
  'governing law', 'liability', 'arbitration', 'jurisdiction',
  'intellectual property', 'indemnification', 'class action waiver',
  'data processing', 'data retention', 'opt-out', 'unsubscribe',
  'we may share', 'personal data', 'data controller', 'data processor',
  'right to access', 'right to delete', 'right to erasure',
  'your rights', 'complaints', 'supervisory authority',
]

const LEGAL_KEYWORD_THRESHOLD = 5

/**
 * Check if a URL points to a policy/ToS page.
 */
export function isPolicyUrl(url) {
  try {
    const u = new URL(url)
    const path = u.pathname + u.search
    return POLICY_URL_PATTERNS.some((p) => p.test(path) || p.test(u.hostname))
  } catch {
    return false
  }
}

/**
 * Scan a page for links to policy/ToS pages.
 */
export function scanForPolicyLinks(doc = document) {
  const links = doc.querySelectorAll('a[href]')
  const results = []

  links.forEach((link) => {
    const href = link.href
    const text = link.textContent.trim()

    const urlMatch = POLICY_URL_PATTERNS.some((p) => p.test(href))
    const textMatch = POLICY_URL_PATTERNS.some((p) => p.test(text))

    if (urlMatch || textMatch) {
      results.push({
        url: href,
        text: text.slice(0, 100),
        matchedBy: urlMatch ? 'url' : 'text',
      })
    }
  })

  // Deduplicate by URL
  const seen = new Set()
  return results.filter((r) => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })
}

/**
 * Classify page content as policy/article/product/other using keyword heuristics.
 */
export function classifyByKeywords(text) {
  if (!text || text.length < 100) return { type: 'unknown', confidence: 0 }

  const lowerText = text.toLowerCase()
  let score = 0

  for (const kw of POLICY_KEYWORDS) {
    if (lowerText.includes(kw)) score++
  }

  if (score >= LEGAL_KEYWORD_THRESHOLD) {
    return { type: 'policy', confidence: Math.min(1, score / 12) }
  }
  if (score >= 3) {
    return { type: 'likely-policy', confidence: score / 12 }
  }
  return { type: 'other', confidence: 0 }
}

/**
 * Extract main content from a page (simplified Readability-style approach).
 */
export function extractMainContent(doc = document) {
  const clone = doc.cloneNode(true)

  // Remove noise elements
  const noiseSelectors = [
    'nav', 'header:not(:first-of-type)', 'footer', 'aside',
    '.sidebar', '.ad', '.advertisement', '.cookie-banner',
    '.social-share', '.related-posts', '.comments', '.comment-section',
    '[role="navigation"]', '[role="complementary"]', '[role="banner"]',
    'script', 'style', 'noscript', 'iframe',
    '.nav', '.menu', '.breadcrumb', '.pagination',
    '.popup', '.modal', '.overlay', '.toast',
  ]

  for (const sel of noiseSelectors) {
    try {
      clone.querySelectorAll(sel).forEach((el) => el.remove())
    } catch { /* ignore invalid selectors */ }
  }

  // Find the element with the best text-to-link density ratio
  let best = { el: clone.body, score: 0 }
  const candidates = clone.querySelectorAll('article, main, section, [role="main"], .content, .post, .entry')

  if (candidates.length > 0) {
    for (const el of candidates) {
      const score = scoreContentElement(el)
      if (score > best.score) best = { el, score }
    }
  }

  // Fallback: scan all divs
  if (best.score === 0) {
    for (const el of clone.querySelectorAll('div, p')) {
      const score = scoreContentElement(el)
      if (score > best.score) best = { el, score }
    }
  }

  return best.el?.innerText || ''
}

function scoreContentElement(el) {
  const text = el.innerText || ''
  const textLen = text.length
  if (textLen < 50) return 0

  const linkLen = Array.from(el.querySelectorAll('a')).reduce((sum, a) => sum + (a.textContent?.length || 0), 0)
  const linkDensity = linkLen / textLen

  // Penalize high link density (navigation, not content)
  if (linkDensity > 0.5) return 0

  // Score based on text length and low link density
  return textLen * (1 - linkDensity)
}

/**
 * Tier 1: Use Chrome Built-in AI (Gemini Nano) for classification.
 * Returns null if not available.
 */
export async function classifyWithAI(text) {
  try {
    // Check if Chrome Built-in AI is available
    if (typeof LanguageModel === 'undefined') return null

    const availability = await LanguageModel.availability()
    if (availability !== 'available') return null

    const session = await LanguageModel.create({
      systemPrompt: 'You are a legal document classifier. Classify the given text into exactly one category and return ONLY valid JSON.',
    })

    const schema = {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['policy', 'terms', 'app-permissions', 'cookie-policy', 'other'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        summary: { type: 'string' },
      },
      required: ['type', 'confidence'],
    }

    const truncatedText = text.slice(0, 8000)
    const result = await session.prompt(
      `Classify this legal/policy document:\n\n${truncatedText}`,
      { responseConstraint: schema }
    )

    session.destroy()
    return JSON.parse(result)
  } catch {
    return null
  }
}

/**
 * Main classifier: tries AI first, falls back to heuristics.
 */
export async function classifyPage(text, url = '') {
  // Always try URL pattern first (fastest)
  if (url && isPolicyUrl(url)) {
    return { type: 'policy', confidence: 0.9, method: 'url-pattern' }
  }

  // Try Chrome Built-in AI
  const aiResult = await classifyWithAI(text)
  if (aiResult) {
    return { ...aiResult, method: 'ai' }
  }

  // Fallback to keyword heuristics
  const heuristicResult = classifyByKeywords(text)
  return { ...heuristicResult, method: 'heuristic' }
}

export default {
  isPolicyUrl,
  scanForPolicyLinks,
  classifyByKeywords,
  extractMainContent,
  classifyWithAI,
  classifyPage,
}
