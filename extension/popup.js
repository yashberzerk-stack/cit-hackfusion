const urlEl = document.getElementById('url')
const stageScan = document.getElementById('stage-scan')
const stageDone = document.getElementById('stage-done')
const barFill = document.getElementById('barfill')

let __cg_current_host = ''
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const u = new URL(tab.url || 'about:blank')
  __cg_current_host = u.hostname
  urlEl.textContent = u.hostname + u.pathname
})

setTimeout(() => {
  stageScan.style.display = 'none'
  stageDone.style.display = 'block'
  requestAnimationFrame(() => {
    barFill.style.width = '72%'
  })
}, 1500)

document.getElementById('dismiss').addEventListener('click', () => window.close())

document.getElementById('open-app').addEventListener('click', () => {
  const host = __cg_current_host || ''
  chrome.tabs.create({ url: chrome.runtime.getURL('app.html') + `?domain=${encodeURIComponent(host)}` })
  window.close()
})
