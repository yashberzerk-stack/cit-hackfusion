/**
 * ClauseGuard — Chrome Storage Abstraction
 *
 * Provides a unified async API for chrome.storage.local
 * with JSON serialization, policy snapshots, and change monitoring.
 */

const HISTORY_KEY = 'clauseguard:history'
const SNAPSHOTS_KEY = 'clauseguard:snapshots'
const SETTINGS_KEY = 'clauseguard:settings'
const ANALYSIS_CACHE_KEY = 'clauseguard:cache'

// ── Generic Storage Helpers ────────────────────────────────────

async function get(key, defaultValue = null) {
  try {
    const result = await chrome.storage.local.get(key)
    return result[key] !== undefined ? result[key] : defaultValue
  } catch {
    return defaultValue
  }
}

async function set(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value })
  } catch {
    // Storage full or unavailable
  }
}

// ── History Management ────────────────────────────────────────

export async function getHistory() {
  return get(HISTORY_KEY, [])
}

export async function addToHistory(entry) {
  const history = await getHistory()
  const newEntry = {
    id: `ext-${Date.now()}`,
    timestamp: Date.now(),
    date: new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    ...entry,
  }
  history.unshift(newEntry)
  // Keep last 200 entries
  if (history.length > 200) history.length = 200
  await set(HISTORY_KEY, history)
  return newEntry
}

export async function clearHistory() {
  await set(HISTORY_KEY, [])
}

// ── Policy Snapshots (Change Monitoring) ──────────────────────

export async function getSnapshot(domain) {
  const snapshots = await get(SNAPSHOTS_KEY, {})
  return snapshots[domain] || null
}

export async function saveSnapshot(domain, text, analysis) {
  const snapshots = await get(SNAPSHOTS_KEY, {})
  snapshots[domain] = {
    text: text.slice(0, 50000),
    hash: simpleHash(text),
    analysis,
    savedAt: Date.now(),
    savedDate: new Date().toISOString(),
  }
  // Keep last 100 snapshots (by recency)
  const entries = Object.entries(snapshots)
  if (entries.length > 100) {
    entries.sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0))
    const trimmed = Object.fromEntries(entries.slice(0, 100))
    await set(SNAPSHOTS_KEY, trimmed)
  } else {
    await set(SNAPSHOTS_KEY, snapshots)
  }
}

export async function compareWithSnapshot(domain, currentText) {
  const snapshot = await getSnapshot(domain)
  if (!snapshot) return { changed: false, reason: 'no-previous-snapshot' }

  const currentHash = simpleHash(currentText)
  if (currentHash === snapshot.hash) return { changed: false, reason: 'identical' }

  // Compute diff stats
  const oldWords = snapshot.text.split(/\s+/)
  const newWords = currentText.split(/\s+/)
  const added = Math.max(0, newWords.length - oldWords.length)
  const removed = Math.max(0, oldWords.length - newWords.length)
  const changedWords = Math.abs(newWords.length - oldWords.length)

  return {
    changed: true,
    reason: 'content-changed',
    previousSnapshot: snapshot,
    stats: {
      added,
      removed,
      changedPercent: Math.round((changedWords / Math.max(oldWords.length, 1)) * 100),
    },
    detectedAt: Date.now(),
  }
}

// ── Settings / Personalized Risk Profile ──────────────────────

const DEFAULT_SETTINGS = {
  // Feature toggles
  inlineAnnotations: true,
  badgeEnabled: true,
  autoScan: false,
  changeMonitoring: true,

  // Personalized risk weights (1.0 = normal, higher = more important)
  weights: {
    privacy: 1.0,
    dataSharing: 1.0,
    ownership: 1.0,
    control: 1.0,
  },

  // Priority categories (user selects what matters most)
  priorities: [],

  // Notification preferences
  notifyOnHighRisk: true,
  notifyOnChange: true,

  // AI preferences
  preferAI: true,
  language: 'en',
}

export async function getSettings() {
  const stored = await get(SETTINGS_KEY, {})
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function updateSettings(partial) {
  const current = await getSettings()
  const updated = { ...current, ...partial }
  await set(SETTINGS_KEY, updated)
  return updated
}

// ── Analysis Cache ────────────────────────────────────────────

export async function getCachedAnalysis(domain) {
  const cache = await get(ANALYSIS_CACHE_KEY, {})
  return cache[domain] || null
}

export async function cacheAnalysis(domain, result) {
  const cache = await get(ANALYSIS_CACHE_KEY, {})
  cache[domain] = {
    result,
    cachedAt: Date.now(),
  }
  // Keep cache under 2MB by trimming old entries
  const entries = Object.entries(cache)
  if (entries.length > 50) {
    entries.sort((a, b) => (b[1].cachedAt || 0) - (a[1].cachedAt || 0))
    const trimmed = Object.fromEntries(entries.slice(0, 50))
    await set(ANALYSIS_CACHE_KEY, trimmed)
  } else {
    await set(ANALYSIS_CACHE_KEY, cache)
  }
}

// ── Utilities ─────────────────────────────────────────────────

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

export default {
  getHistory,
  addToHistory,
  clearHistory,
  getSnapshot,
  saveSnapshot,
  compareWithSnapshot,
  getSettings,
  updateSettings,
  getCachedAnalysis,
  cacheAnalysis,
}
