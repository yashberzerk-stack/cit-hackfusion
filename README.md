# ClauseGuard — AI-Powered T&C & Privacy Policy Risk Analyzer

This repository contains the ClauseGuard front-end prototype and a lightweight browser extension prototype used to demo policy risk scanning and plain-English translations for Terms & Conditions and Privacy Policies.

## What’s included
- React + Vite single-page app (`src/`) with: analyzer UI, compare, history, and settings pages.
- A minimal rule-based analyzer for quick local scans: `src/lib/ruleAnalyzer.js`.
- Mock policy dataset for demo and samples: `src/data.js`.
- Browser extension prototype (unpacked) in `extension/` with `popup.html`, `content.js`, and `app.html`.

## Features implemented
- Paste a policy URL or raw policy text and run a structured risk analysis.
- Hidden Clause Finder: auto-detects common traps (arbitration, auto-renew, retention, data sale, content license, location, health data).
- Plain English translator cards for flagged clauses.
- Category risk meters and overall numeric risk score.
- Export analysis as a JSON report from the UI.
- Persisted analysis history in `localStorage`.
- Browser extension prototype overlays a quick risk summary and opens the full analysis (`extension/app.html?domain=…`).

## Run locally
Install dependencies and start the dev server:

```bash
npm install
npm run dev
# open http://localhost:5173
```

## Load the extension (prototype)
1. Build or run the app locally so `app.html` is reachable via the extension assets in this folder (the extension loads the local `extension/` files only).
2. Open `chrome://extensions` → Enable _Developer mode_ → _Load unpacked_ → select the `extension/` folder.
3. Click the ClauseGuard extension icon; use the popup to open the full analysis (`app.html`) which will open with `?domain=…` to auto-fill the domain.

Notes: This extension is a UI prototype. To connect the extension overlay to the running SPA in a production flow you would host the SPA and have the extension call a hosted analyzer API.

## Files of interest
- `src/components/Analyzer.jsx` — main UI for running and viewing analyses.
- `src/lib/ruleAnalyzer.js` — lightweight heuristic analyzer for pasted text.
- `src/data.js` — sample policies and UI constants.
- `extension/` — popup, content overlay, and a simple full-analysis `app.html`.

## Extending ClauseGuard
- To integrate a real LLM-based analyzer: implement a backend (FastAPI/Express) that accepts policy text or URL, runs LLM-based clause extraction & plain-English rewriting, then returns a structured analysis. Wire `src/components/Analyzer.jsx` to call that API.
- Add tests around `src/lib/ruleAnalyzer.js` and UI snapshot tests for `Analyzer`.

## Slides / Presentation
See `presentation/ClauseGuard-slides.md` for the PPT content used at the HackFusion demo.

## License & Acknowledgements
This is a HackFusion prototype. Use or redistribute responsibly; replace demo API keys before connecting to hosted LLMs.

If you want, I can now:
- generate a downloadable PPTX from the slides in `presentation/`, or
- scaffold a small FastAPI backend to call an LLM for higher-quality clause extraction, or
- prepare the extension for packaging (manifest tweaks, icons, publishing notes).
Which would you like me to do next?
