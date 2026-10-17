# Wiki partial navigation — 2026-10-18

The existing outer frame proportions and CRT presentation are preserved. Normal wiki links, search results, search submission and language switches retain the document, article frame and search input. Only article content, the table of contents and necessary localized labels change. Initial loading and the static HTML fallback remain available.

`docs/wiki-navigation.js` owns same-origin article navigation, aborting obsolete requests, browser history/scroll restoration and actual panel height animation. Search changes, TOC replacement and TOC expand/collapse use the game's 240 ms resize timing and `cubic-bezier(0.16, 1, 0.3, 1)`. Interrupted animation starts at the currently rendered height; reduced motion skips the animation. Media galleries and section tracking rebind after article replacement.

Verified locally in Microsoft Edge:

- `node scripts/test-navigation-browser.mjs`: retained DOM/search, search click and Enter, bilingual content/media, back/forward positions, TOC collapse/reopen, intermediate border heights, rapid navigation, reduced motion, mobile overflow and failed-fetch document fallback.
- `node scripts/test-ui-browser.mjs`: 96 viewport/page cases, including the existing outer frame proportions, desktop article scrolling, draggable rail, mobile layout and no-JavaScript fallback.
- `node scripts/test-desktop-launch-browser.mjs`: 10 launch-dialog cases.
- `node --test scripts/test-language.mjs scripts/test-media.mjs scripts/test-search.mjs scripts/test-desktop-launch.mjs`: 26 passed.
- `python scripts/check-site.py`: 8 passed.
- `python scripts/build-search-index.py --check`: generated search index matches all bilingual sections.

Browser scripts accept `MFM_TEST_BROWSERS=edge` and `MFM_PLAYWRIGHT_MODULE` for a locally installed Playwright package. This machine has no Playwright-managed Chromium/Firefox binaries, so those browser runs were unavailable. Browser screenshots are written to `.tmp/navigation-validation/`.
