# Wiki legal footer and About acceptance — 2026-10-24

All ten Chinese/English pages share `.site-footer` legal navigation. The original copyright, Official Game Wiki credit and CUBIC 11 license remain. Terms/privacy use the existing game service. Contact opens main-project GitHub Issues in a new tab. About is maintained only here, using the owner's supplied personal introduction, with a visible reminder that public Issues must not contain sensitive information and account/privacy requests belong in the game's existing HELP form.

## Changed files

| Files | Purpose |
| --- | --- |
| `docs/{index,rules,modes,history}.html` and their `docs/en/` counterparts | Add identical ordered footer navigation and update shared CSS cache token. |
| `docs/about.html`, `docs/en/about.html` | Supplied About copy, original Wiki layout/fonts, home/language navigation, canonical, hreflang, visible contact/HELP guidance. |
| `docs/wiki.css` | Shared footer navigation/wrapping and hover; retain 12px type and existing article dimensions/scrolling. |
| `docs/sitemap.xml` | Both canonical About URLs and reciprocal language alternates. |
| `scripts/check-site.py` | Validate footer URLs, preserved license and About metadata, local links and sitemap. |
| `scripts/test-footer-browser.mjs` | Exercise every page at four exact sizes under a GitHub Pages project subpath; test locale paths, overflow, focus, hover, language/home links and real Contact popup. |
| This directory | Bilingual screenshots and geometry results. |

## Validation

- `python scripts/check-site.py`: **9 tests passed**, including all local assets, unique IDs, links/fragments, canonical/hreflang and sitemap entries.
- `node scripts/test-language.mjs`: 8 passed.
- `node scripts/test-search.mjs`: 7 passed.
- `node scripts/test-media.mjs`: 5 passed.
- `node scripts/test-desktop-launch.mjs`: 6 passed.
- `node scripts/test-footer-browser.mjs`: **40 page/locale/viewport cases passed** in Edge 155; 1920 × 1080, 1280 × 800, 800 × 600 and 375 × 812, both languages, all five articles. Verified no horizontal overflow or clipped footer links, 12px text, keyboard focus, hover, About/home/language navigation and Contact opening GitHub (or GitHub login) in a separate tab.
- Existing `test-navigation-browser.mjs`: partial navigation, search, browser history, bilingual media and reduced motion passed in Edge.
- Existing `test-desktop-launch-browser.mjs`: 10 cases passed in Edge, including no-JS fallback.
- Existing `test-ui-browser.mjs`: **96 cases passed** in Edge, including eight bilingual pages, ten desktop sizes, two narrow sizes, search, scroll rails and no-JS.
- `git diff --check`: passed.

Browser commands used the existing bundled Playwright module via `MFM_PLAYWRIGHT_MODULE`, and `MFM_TEST_BROWSERS=edge` for existing scripts. The unconfigured default scripts first could not launch because the separate Playwright Chromium bundle was absent; installed Edge supplied the successful runs. No package or browser was installed.

## Screenshots

Full-page narrow screenshots preserve the Wiki's existing vertical document flow; desktop articles retain their internal scroll rails.

| Size | 中文 Wiki | English Wiki | 關於 MFM | About MFM |
| --- | --- | --- | --- | --- |
| 1920 × 1080 | [PNG](zh-Hant-wiki-1920x1080.png) | [PNG](en-wiki-1920x1080.png) | [PNG](zh-Hant-about-1920x1080.png) | [PNG](en-about-1920x1080.png) |
| 1280 × 800 | [PNG](zh-Hant-wiki-1280x800.png) | [PNG](en-wiki-1280x800.png) | [PNG](zh-Hant-about-1280x800.png) | [PNG](en-about-1280x800.png) |
| 800 × 600 | [PNG](zh-Hant-wiki-800x600.png) | [PNG](en-wiki-800x600.png) | [PNG](zh-Hant-about-800x600.png) | [PNG](en-about-800x600.png) |
| 375 × 812 | [PNG](zh-Hant-wiki-375x812.png) | [PNG](en-wiki-375x812.png) | [PNG](zh-Hant-about-375x812.png) | [PNG](en-about-375x812.png) |

Independent Sol source review found no material finding. [Wiki Draft PR #22](https://github.com/duoduo-88/monster-fusion-masters-showcase_MFM/pull/22) accompanies [game Draft PR #231](https://github.com/duoduo-88/monster-fusion-masters-online/pull/231); the game's About links target these static pages with explicit language parameters. No merge or deployment.
