# Wiki About navigation and footer correction — 2026-10-24

About now uses the existing article-only navigation instead of reloading the document. The shell, article element, same-language sidebar/footer and search input are retained; title, canonical, language links, table of contents and history update through the existing navigation owner. The four-category sidebar can have no selected item on About without throwing and falling back to a full reload.

All ten article footers remove the extra Official Game Wiki / CUBIC 11 credit. Copyright and four legal/info destinations remain. Cubic 11's license file remains in `docs/fonts/Cubic11-LICENSE.txt`, and the game's Terms already contain Cubic 11 attribution and full license links.

Terms and Privacy links include `from=wiki&lang=zh-Hant` or `from=wiki&lang=en`, consumed by the companion game correction to return to the matching Wiki homepage.

## Files

- `docs/wiki-navigation.js`: include both About URLs and tolerate no selected category.
- `docs/{index,rules,modes,history,about}.html` and their `docs/en/` counterparts: remove footer credit, add legal source/language parameters, update CSS/navigation cache tokens.
- `docs/wiki.css`: remove unused footer-credit rule.
- `scripts/check-site.py`: verify source/language parameters, removed footer credit and retained license file.
- `scripts/test-navigation-browser.mjs`: verify About preserves original shell/article/sidebar/footer/search; exercise translated About, history and home navigation.
- `scripts/test-footer-browser.mjs`: validate every page's updated links and layout plus narrow-screen About shell preservation.
- `scripts/test-legal-navigation-browser.mjs`: verify complete cross-origin Wiki → legal → Wiki home clicks against both local production builds.
- This directory: desktop/narrow bilingual About screenshots and acceptance notes.

## Verification

- About regression observed RED before implementation, GREEN afterward.
- `python scripts/check-site.py`: 9 tests passed.
- Language/search/media/desktop-launch units: 8/7/5/6 passed.
- Existing navigation browser suite with new About assertions: passed in Edge.
- Footer browser suite: 40 page/locale/viewport cases passed at 1920×1080, 1280×800, 800×600 and 375×812, including new narrow About shell-preservation assertions.
- Existing UI browser suite: 96 cases passed in Edge.
- `test-legal-navigation-browser.mjs`: 8 complete cross-origin return journeys passed (both languages, both policies, direct Back and switch-policy-before-Back).
- Independent Sol source review found no material Wiki issue.
- `git diff --check`: passed.

Browser scripts use existing `MFM_PLAYWRIGHT_MODULE` and `MFM_TEST_BROWSERS=edge`. For the cross-origin suite, set `MFM_GAME_DIST` to the companion game's built `online/dist` directory. Requests are fulfilled from local static assets, with no public support submission or account/database change.

| Size | 繁體中文 | English |
| --- | --- | --- |
| 1920 × 1080 | [PNG](zh-Hant-about-1920x1080.png) | [PNG](en-about-1920x1080.png) |
| 375 × 812 | [PNG](zh-Hant-about-375x812.png) | [PNG](en-about-375x812.png) |

The legal Back-button behavior depends on the companion game assets being deployed. These changes are prepared for review only; no merge or deployment was performed.
