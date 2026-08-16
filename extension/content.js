(() => {
  const url = window.location.hostname || 'this page'
  const el = document.createElement('div')
  el.id = 'clauseguard-overlay'
  el.style.cssText =
    'position:fixed;bottom:16px;right:16px;z-index:2147483647;max-width:340px;background:#0b1120;color:#e2e8f0;border:1px solid #312e81;border-radius:14px;padding:16px;font-family:system-ui,sans-serif;font-size:12px;box-shadow:0 20px 50px rgba(0,0,0,.55);display:none'
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399"></span>
      <b style="color:#fff">ClauseGuard</b>
      <span style="margin-left:auto;color:#818cf8;font-weight:700">Risk scan</span>
    </div>
    <p style="margin:10px 0 4px;color:#94a3b8">${url}</p>
    <div id="clauseguard-body" style="margin-top:8px">
      <p style="color:#a5b4fc">Scanning policy document…</p>
    </div>`

  document.body.appendChild(el)
  setTimeout(() => {
    el.style.display = 'block'
    document.getElementById('clauseguard-body').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-weight:800;font-size:22px;color:#f87171">72<span style="font-size:10px;color:#94a3b8">/100</span></div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-bottom:3px"><span>Hidden clauses</span><span style="color:#f87171">HIGH RISK</span></div>
          <div style="height:6px;border-radius:99px;background:#1e293b"><div style="width:72%;height:100%;border-radius:99px;background:#f87171"></div></div>
        </div>
      </div>
      <div style="margin-top:10px">
        <div style="padding:8px 10px;border-radius:8px;background:#450a0a;border:1px solid #7f1d1d;margin-bottom:6px">⚠ Auto-renewal · "…renews automatically at the current rate unless cancelled 48h prior."</div>
        <div style="padding:8px 10px;border-radius:8px;background:#451a03;border:1px solid #92400e;margin-bottom:6px">⚠ Forced arbitration · class-action rights waived.</div>
        <div style="padding:8px 10px;border-radius:8px;background:#450a0a;border:1px solid #7f1d1d">⚠ Deleted content retained up to 24 months.</div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button style="flex:1;background:#ef4444;border:0;color:#fff;font-weight:700;padding:8px;border-radius:8px;cursor:pointer">View full analysis</button>
        <button style="background:transparent;border:1px solid #334155;color:#94a3b8;padding:8px;border-radius:8px;cursor:pointer">Later</button>
      </div>`
  }, 1400)
})()
