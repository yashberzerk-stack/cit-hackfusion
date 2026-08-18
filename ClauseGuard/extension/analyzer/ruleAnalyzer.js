/**
 * ClauseGuard Expanded Rule-Based Analyzer
 *
 * Ported from the SPA ruleAnalyzer.js and expanded with CLAUDETTE-aligned rules,
 * additional clause types, and personalized risk weighting.
 *
 * Scoring based on: CLAUDETTE taxonomy (Lippi et al., 2019),
 * OPP-115 categories (Wilson et al., 2016), and
 * Chilean ToS "Dark Clauses" (Loeffler et al., 2025).
 */

const RULES = [
  // ── CRITICAL (error severity): Only genuinely harmful clauses ──
  {
    type: 'contentLicense',
    severity: 'error',
    category: 'ownership',
    pattern: /perpetual.*(?:license|rights|access)|irrevocable.*(?:license|rights)|royalty-?free.*(?:license|rights|use.*(?:content|data|information))|sublicens(e|able)|transferable.*license/i,
    quote: 'Broad content license',
    plain: 'Service gains sweeping, permanent rights to your content.',
    whyCare: 'This lets companies monetize your uploads without paying or asking you.',
  },
  {
    type: 'dataSale',
    severity: 'error',
    category: 'dataSharing',
    pattern: /(?:we|the\s+company|they)\s+(?:may\s+)?sell\s+(?:your\s+)?(?:personal\s+)?(?:data|information)\s+to\s+third|(?:we|the\s+company|they)\s+(?:sell|sold|selling)\s+(?:your\s+)?(?:personal\s+)?(?:data|information)\s+(?:to|for)|sell.*(?:personal\s+)?data.*broker|monetize.*(?:your\s+)?(?:personal\s+)?data|categories.*(?:data|information).*that\s+we\s+sell/i,
    quote: 'Data sale to third parties',
    plain: 'Your personal data is actively sold to third parties or data brokers.',
    whyCare: 'Data brokers build detailed profiles sold to advertisers, insurers, and employers.',
  },
  {
    type: 'location',
    severity: 'error',
    category: 'privacy',
    pattern: /(?:track|collect|monitor).*(?:precise|continuous|always|background).*(?:location|geolocation)|(?:precise|continuous|always|background).*(?:location|geolocation).*(?:track|collect|monitor)/i,
    quote: 'Continuous precise location tracking',
    plain: 'Your precise location is tracked continuously, even in the background.',
    whyCare: 'Continuous tracking builds a complete movement history that can be shared or sold.',
  },
  {
    type: 'healthData',
    severity: 'error',
    category: 'privacy',
    pattern: /(?:collect|process|store|share|use).{0,40}(?:biometric|health\s+data|medical|genetic|mental\s+health|menstrual|sleep\s+data)|(?:biometric|health\s+data|medical|genetic|mental\s+health).{0,40}(?:collect|process|store|share|use)/i,
    quote: 'Sensitive health/biometric data processing',
    plain: 'Health or biometric data is collected and potentially shared.',
    whyCare: 'Sensitive health data can influence insurance pricing, employment decisions, and more.',
  },
  {
    type: 'aiTraining',
    severity: 'error',
    category: 'privacy',
    pattern: /(?:use|may\s+use).*(?:your\s+)?(?:data|content|information).*(?:to\s+)?train.*(?:ai|machine\s+learning|artificial\s+intelligence)|(?:train|training).*(?:ai|machine\s+learning).*(?:your|user).*(?:data|content|information)/i,
    quote: 'AI/ML training on your data',
    plain: 'Your data or content may be used to train artificial intelligence models.',
    whyCare: 'Once used for AI training, your data cannot be retrieved or opted out of existing models.',
  },

  // ── WARNING (warn severity): Meaningful restrictions ──────────
  {
    type: 'arbitration',
    severity: 'warn',
    category: 'control',
    pattern: /(?:binding|required|mandatory)\s+arbitration|arbitration\s+(?:clause|agreement|provision)|waiv(e|es|ing)\s+(?:your\s+)?right\s+to\s+(?:a\s+)?(?:jury|class\s+action|lawsuit)|class.action.*waiver/i,
    quote: 'Mandatory binding arbitration',
    plain: 'You are forced into private arbitration instead of court.',
    whyCare: 'Removes the option to sue in open court and often limits damages.',
  },
  {
    type: 'autoRenew',
    severity: 'warn',
    category: 'control',
    pattern: /auto-?renew(?:al)?.*(?:charge|bill|debit|payment|fee)|renew(s|al)\s+automatically\s+(?:and\s+)?(?:charge|bill|debit)|pre-?authorized\s+recurring\s+(?:charge|payment|debit)/i,
    quote: 'Auto-renewal with automatic charge',
    plain: 'Your subscription renews automatically and charges your payment method.',
    whyCare: 'Common surprise billing trap — users forget and get charged.',
  },
  {
    type: 'noRefund',
    severity: 'warn',
    category: 'control',
    pattern: /(?:no|not\s+eligible\s+for|does\s+not\s+(?:offer|provide))\s+(?:refunds?|money[- ]back|credit)|all\s+(?:sales?|purchases?)\s+(?:are\s+)?final|(?:no|zero)\s+refund/i,
    quote: 'No refund policy',
    plain: 'No refunds are offered, even for unsatisfactory service.',
    whyCare: 'You cannot get your money back if the product or service disappoints.',
  },
  {
    type: 'broadIndemnity',
    severity: 'warn',
    category: 'control',
    pattern: /(?:you\s+(?:shall|will|must|agree\s+to))\s+indemnif(y|ies|ication).*(?:all|any|every).*(?:claim|damage|loss|liability)|(?:hold|harmless).*(?:all|any).*(?:claim|damage|loss)/i,
    quote: 'Broad indemnification clause',
    plain: 'You may be held liable for virtually any damages the company claims.',
    whyCare: 'Broad indemnification shifts all risk to you, even for the company\'s own actions.',
  },
  {
    type: 'contentRemoval',
    severity: 'warn',
    category: 'ownership',
    pattern: /(?:we|the\s+company).*(?:may|can|reserve\s+the\s+right\s+to).*(?:remove|delete|disable).*(?:your|user).*(?:content|posts?|uploads?|materials?).*(?:without|at\s+any\s+time|at\s+its?\s+discretion)|remove.*(?:your|user).*(?:content|posts?|uploads?).*(?:without|at.*discretion)/i,
    quote: 'Content removal without notice',
    plain: 'The service can remove your content without notice or explanation.',
    whyCare: 'Your work can disappear at any time with no appeal process.',
  },
  {
    type: 'broadLicense',
    severity: 'warn',
    category: 'ownership',
    pattern: /(?:you\s+(?:grant|licence|license|give)).*(?:irrevocable|perpetual|worldwide|unlimited).*(?:license|licence|right|permission)/i,
    quote: 'Broad license to your content',
    plain: 'You grant the company an irrevocable, worldwide license to your content.',
    whyCare: 'They can use your content anywhere, forever, without further consent.',
  },
  {
    type: 'thirdPartySale',
    severity: 'warn',
    category: 'dataSharing',
    pattern: /(?:sell|sold|selling).*(?:your\s+)?(?:personal\s+)?(?:data|information)\s+(?:to|with|for).*(?:third.party|advertisers?|ad\s+networks?|marketing|data\s+brokers?)|share.*(?:your\s+)?(?:personal\s+)?(?:data|information)\s+(?:to|with|for)\s+(?:third.party|advertisers?|ad\s+networks?|marketing\s+partners?|data\s+brokers?)|(?:we|they)\s+(?:may\s+)?(?:sell|share)\s+(?:your\s+)?(?:personal\s+)?(?:data|information)\s+(?:to|with|for)/i,
    quote: 'Personal data sold/shared with advertisers',
    plain: 'Your personal data is sold or shared with advertising networks and marketers.',
    whyCare: 'Your data ends up in targeted advertising profiles you cannot control.',
  },

  // ── NOTE (info severity): Standard but worth noting ───────────
  {
    type: 'cookies',
    severity: 'info',
    category: 'privacy',
    pattern: /cookies|tracking.*pixel|web.*beacon|analytics.*tool/i,
    quote: 'Cookies and tracking',
    plain: 'The service uses cookies and tracking technologies.',
    whyCare: 'Can track your browsing behavior across multiple websites.',
  },
  {
    type: 'jurisdiction',
    severity: 'info',
    category: 'control',
    pattern: /governed.*by.*law|applicable\s+law|choice.*of.*law|jurisdiction.*(?:for|of|governing)/i,
    quote: 'Jurisdiction clause',
    plain: 'Legal jurisdiction governing this agreement is specified.',
    whyCare: 'You may need to pursue legal action in a specific jurisdiction.',
  },
  {
    type: 'dataRetention',
    severity: 'info',
    category: 'privacy',
    pattern: /retain.*(?:for|during|as\s+long\s+as).*(?:\d+|necessary|required|needed)|(?:as\s+long\s+as|for\s+as\s+long\s+as).*(?:necessary|required|needed|legitimate)/i,
    quote: 'Data retention period',
    plain: 'Data is retained for a specified period.',
    whyCare: 'Long retention periods extend the window for potential data breaches or misuse.',
  },
]

/**
 * Analyze policy text using expanded rule-based heuristics.
 *
 * @param {string} text - The policy text to analyze
 * @param {string} domain - The domain the policy belongs to
 * @param {object} [weights] - Personalized risk weights per category
 * @returns {object} Analysis result
 */
export function analyzePolicyText(text = '', domain = 'custom.policy', weights = null) {
  const t = (text || '').slice(0, 50000)
  const found = []

  for (const rule of RULES) {
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

  // Count severities
  const counts = { error: 0, warn: 0, info: 0 }
  for (const f of found) {
    counts[f.severity]++
  }

  // Base score: 10 for any policy. Each critical finding adds significantly.
  // A standard corporate policy should score ~15-35.
  let score = 10
  score += counts.error * 25
  score += counts.warn * 12
  score += counts.info * 3

  // Text length adjustment removed — longer policies are often MORE transparent, not riskier.

  score = Math.min(95, Math.max(5, score))

  // Category sub-scores
  const categoryBase = {
    privacy: 10 + counts.error * 20 + counts.warn * 8 + counts.info * 2,
    dataSharing: 10 + counts.error * 22 + counts.warn * 10 + counts.info * 1,
    ownership: 10 + counts.error * 24 + counts.warn * 10 + counts.info * 1,
    control: 10 + counts.error * 18 + counts.warn * 12 + counts.info * 2,
  }

  const categories = {
    privacy: Math.min(95, categoryBase.privacy),
    dataSharing: Math.min(95, categoryBase.dataSharing),
    ownership: Math.min(95, categoryBase.ownership),
    control: Math.min(95, categoryBase.control),
  }

  // Apply personalized weights if provided
  if (weights && typeof weights === 'object') {
    for (const key of Object.keys(categories)) {
      if (weights[key] !== undefined) {
        categories[key] = Math.min(95, Math.round(categories[key] * weights[key]))
      }
    }
    // Recalculate overall from weighted categories
    score = Math.min(95, Math.round(
      (categories.privacy + categories.dataSharing + categories.ownership + categories.control) / 4
    ))
  }

  const overall = score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low'

  // Readability metrics
  const readability = computeReadability(t)

  return {
    domain: domain || 'custom.policy',
    company: extractCompany(domain),
    type: 'Terms & Privacy',
    overall,
    riskScore: score,
    sentences: Math.min(800, Math.max(10, sentences)),
    pages: Math.max(1, Math.round(t.length / 2500)),
    readTime: `${Math.max(1, Math.round(t.length / 2000))} min`,
    categories,
    hiddenClauses: found,
    clauses: found.map((f) => ({
      category: f.category,
      title: f.type,
      severity: f.severity === 'error' ? 'high' : f.severity === 'warn' ? 'medium' : 'low',
      raw: f.quote,
      plain: f.plain,
    })),
    recommendation: overall === 'low'
      ? 'Low-risk policy. Reasonable protections for a consumer service.'
      : overall === 'moderate'
        ? 'Moderate risk. Read the flagged clauses carefully before accepting.'
        : 'High risk. Review all flagged clauses and consider alternatives before consenting.',
    readability,
    analysisMethod: 'rule-based',
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * Compute Flesch-Kincaid readability metrics.
 */
function computeReadability(text) {
  if (!text || text.length < 50) {
    return { gradeLevel: 0, readingEase: 0, avgSentenceLength: 0, passiveVoicePct: 0 }
  }

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0)

  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1)
  const avgSyllablesPerWord = syllables / Math.max(words.length, 1)

  // Flesch-Kincaid Grade Level
  const gradeLevel = Math.round(
    0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
  )

  // Flesch Reading Ease
  const readingEase = Math.round(
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
  )

  // Passive voice detection (simple heuristic)
  const passiveMatches = text.match(/\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi) || []
  const passiveVoicePct = Math.round((passiveMatches.length / Math.max(sentences.length, 1)) * 100)

  // Vagueness index (from research: vague terms in policies)
  const vagueTerms = ['may', 'might', 'could', 'some', 'various', 'certain', 'as needed', 'from time to time', 'reasonable', 'commercially reasonable', 'at our discretion', 'without limitation', 'including but not limited to']
  const lowerText = text.toLowerCase()
  const vagueCount = vagueTerms.reduce((sum, term) => sum + (lowerText.split(term).length - 1), 0)
  const vaguenessIndex = Math.min(100, Math.round((vagueCount / Math.max(words.length, 1)) * 1000))

  return {
    gradeLevel: Math.max(0, gradeLevel),
    readingEase: Math.max(0, Math.min(100, readingEase)),
    avgSentenceLength: Math.round(avgWordsPerSentence),
    passiveVoicePct: Math.min(100, passiveVoicePct),
    vaguenessIndex,
    wordCount: words.length,
    estimatedReadMinutes: Math.max(1, Math.round(words.length / 250)),
  }
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

function extractCompany(domain) {
  if (!domain) return 'Unknown'
  const name = domain.split('.')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default { analyzePolicyText, RULES }
