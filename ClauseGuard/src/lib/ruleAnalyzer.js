export function analyzePolicyText(text = '', domain = 'custom.policy') {
  const t = (text || '').slice(0, 20000)
  const found = []
  function match(re, type, severity, quote, plain, whyCare) {
    if (re.test(t)) {
      found.push({ type, severity, quote: quote || '', plain: plain || '', whyCare: whyCare || '' })
      return true
    }
    return false
  }

  match(/\barbitration\b|binding arbitration|waiv(e|es).*class action/i, 'arbitration', 'warn', 'Binding arbitration clause present', 'You may be forced into private arbitration rather than court.', 'Arbitration removes the option to sue in open court.')
  match(/auto-?renew|renew(s|al) automatically|recurring debit|pre-?approved recurring/i, 'autoRenew', 'warn', 'Automatic renewal language detected', 'Subscription renews automatically unless you cancel.', 'Auto-renewals are a common surprise billing trap.')
  match(/retain(ed|ion)|backup copies|retain.*(days|months|years)|persist in backups/i, 'retention', 'info', 'Retention / backup language', 'Deleted data may persist in backups for a period.', 'Vague retention means deletion is not instantaneous.')
  match(/perpetual|irrevocable|royalty-?free|sublicens(e|able)|broad license/i, 'contentLicense', 'error', 'Broad content license found', 'The service may gain wide rights to your content.', 'This can let companies monetize your uploads.')
  match(/sell.*data|third-?party data broker|data broker|sell .* personal data/i, 'dataSale', 'error', 'Data sale or broker language', 'Your data may be sold to third parties.', 'Data brokers create profiles sold to buyers.')
  match(/location services|precise location|gps|track.*location|continuous location/i, 'location', 'error', 'Persistent location tracking', 'The service may track precise location continuously.', 'Continuous tracking builds a movement history.')
  match(/health data|biometric|heart rate|menstrual|medical data/i, 'healthData', 'error', 'Sensitive health data processing', 'Health or biometric data is processed or shared.', 'Sensitive health data increases privacy & regulatory risk.')

  // basic scoring
  let score = 20
  let severityCount = { high: 0, medium: 0, low: 0 }
  for (const f of found) {
    if (f.severity === 'error') {
      score += 20
      severityCount.high++
    } else if (f.severity === 'warn') {
      score += 12
      severityCount.medium++
    } else {
      score += 6
      severityCount.low++
    }
  }
  score = Math.min(95, score + Math.round((t.length % 30) / 2))

  const overall = score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low'

  return {
    domain: domain || 'custom.policy',
    company: 'Untitled policy',
    type: 'Terms & Privacy',
    overall,
    riskScore: score,
    sentences: Math.min(800, Math.max(40, Math.floor(t.split(/[.!?]/).length))) ,
    pages: Math.max(1, Math.round(Math.min(800, Math.floor(t.length / 2500)))),
    readTime: `${Math.max(1, Math.round(t.length / 2000))} min`,
    categories: {
      privacy: Math.min(95, 20 + severityCount.high * 18 + severityCount.medium * 8),
      dataSharing: Math.min(95, 20 + severityCount.high * 16 + severityCount.medium * 6),
      ownership: Math.min(95, 12 + severityCount.high * 14 + severityCount.medium * 4),
      control: Math.min(95, 14 + severityCount.high * 12 + severityCount.medium * 6),
    },
    hiddenClauses: found.length > 0 ? found : [],
    clauses: [],
    recommendation: overall === 'low' ? 'Low risk' : overall === 'moderate' ? 'Moderate risk' : 'High risk — review before consenting',
  }
}

export default { analyzePolicyText }
