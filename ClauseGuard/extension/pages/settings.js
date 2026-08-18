/**
 * ClauseGuard — Settings Page Script
 *
 * Manages user preferences, personalized risk weights,
 * and feature toggles. All stored in chrome.storage.local.
 */

// ── Elements ────────────────────────────────────────────────

const toggles = {
  annotations: document.getElementById('toggle-annotations'),
  badge: document.getElementById('toggle-badge'),
  changes: document.getElementById('toggle-changes'),
  ai: document.getElementById('toggle-ai'),
}

const sliders = {
  privacy: { el: document.getElementById('weight-privacy'), val: document.getElementById('val-privacy') },
  dataSharing: { el: document.getElementById('weight-dataSharing'), val: document.getElementById('val-dataSharing') },
  ownership: { el: document.getElementById('weight-ownership'), val: document.getElementById('val-ownership') },
  control: { el: document.getElementById('weight-control'), val: document.getElementById('val-control') },
}

const saveBtn = document.getElementById('save-btn')
const toast = document.getElementById('toast')

// ── Load Settings ───────────────────────────────────────────

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('clauseguard:settings')
    const settings = result['clauseguard:settings'] || {}

    // Set toggles
    if (settings.inlineAnnotations !== undefined) toggles.annotations.checked = settings.inlineAnnotations
    if (settings.badgeEnabled !== undefined) toggles.badge.checked = settings.badgeEnabled
    if (settings.changeMonitoring !== undefined) toggles.changes.checked = settings.changeMonitoring
    if (settings.preferAI !== undefined) toggles.ai.checked = settings.preferAI

    // Set weights
    const weights = settings.weights || { privacy: 1, dataSharing: 1, ownership: 1, control: 1 }
    for (const [key, slider] of Object.entries(sliders)) {
      const val = weights[key] || 1
      slider.el.value = val
      slider.val.textContent = `${val.toFixed(1)}x`
    }
  } catch { /* use defaults */ }
}

// ── Slider Updates ──────────────────────────────────────────

for (const [, slider] of Object.entries(sliders)) {
  slider.el.addEventListener('input', () => {
    slider.val.textContent = `${parseFloat(slider.el.value).toFixed(1)}x`
  })
}

// ── Save Settings ───────────────────────────────────────────

saveBtn.addEventListener('click', async () => {
  const settings = {
    inlineAnnotations: toggles.annotations.checked,
    badgeEnabled: toggles.badge.checked,
    changeMonitoring: toggles.changes.checked,
    preferAI: toggles.ai.checked,
    weights: {
      privacy: parseFloat(sliders.privacy.el.value),
      dataSharing: parseFloat(sliders.dataSharing.el.value),
      ownership: parseFloat(sliders.ownership.el.value),
      control: parseFloat(sliders.control.el.value),
    },
  }

  try {
    await chrome.storage.local.set({ 'clauseguard:settings': settings })
    showToast()
  } catch { /* ignore */ }
})

function showToast() {
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 2000)
}

// ── Init ────────────────────────────────────────────────────

loadSettings()
