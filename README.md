# Pause

A Chrome extension that gently interrupts distracting browsing with a calm, customizable reminder.

## Features

- **Selected sites** — Track time on domains you choose (`x.com`, `youtube.com`, etc.)
- **All browsing** — Remind on any normal website
- **Timeframe** — Pause after 5 minutes to 2 hours of active time on tracked sites
- **Custom message** — Edit the title and body shown in the overlay
- **Snooze** — Dismiss and silence reminders for a site for 5–30 minutes
- **Minimal UI** — Clean popup settings and a blurred, Apple-inspired pause card

## Install (developer mode)

1. Generate icons (once):

   ```powershell
   cd scripts
   .\generate-icons.ps1
   ```

2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select this folder (`PAUSE`)

## How it works

Pause counts **active** time while a matching tab is focused. When you switch away or close the tab, the timer pauses. After your chosen interval, a full-page reminder appears on that tab.

Use **Preview reminder** in the popup to test the overlay on your current tab without waiting.

## Project structure

```
PAUSE/
├── manifest.json
├── background.js          # Time tracking & triggers
├── content/
│   ├── overlay.js         # In-page pause modal
│   └── overlay.css
├── popup/                 # Settings UI
├── shared/                # Defaults & URL matching
└── icons/
```

## Privacy

Settings sync via `chrome.storage.sync` (if enabled in Chrome). Time tracking stays in `chrome.storage.session` on your device. No data is sent to external servers.
