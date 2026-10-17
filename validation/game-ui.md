# Wiki / game UI comparison — 2026-10-18

The Wiki keeps its bilingual static articles, Cubic11 reading font, language switch,
article navigation and mobile document scrolling. Shared visual elements follow
the current game's presentation rather than an independently tinted theme.

| Element | Difference found | Correction / reference |
| --- | --- | --- |
| Desktop frame | Width and height followed the viewport independently; capped at 1600px wide | Center a 4:3 frame inside the viewport; CSS establishes it before JavaScript runs |
| Banner | Fixed 72px minimum with larger padding | Game `desktop-layout.css`: height `clamp(54px, frame-height × .0625, 72px)`, padding `7px 7px 7px 14px` |
| Frame padding and panel gaps | Independent 13–16px values and 14px top margin | Game `desktop-layout.css`: `clamp(8px, frame-width × .0095, 14px)` for frame padding, banner/content, columns and rail panels |
| Responsive columns, galleries and logo | Used browser width even when the content frame is much narrower | Container queries and container width units use the actual Wiki frame; dense article grids also collapse when the reading column is below 480px; mobile retains its separate reading flow |
| Logo | Cream `#f1eedc`; independently sized by browser width | White `#fff`, original hex artwork and proportions, game white glow; fit within banner without overlapping language controls |
| Panels | Green-black fill, different shadows and yellow/green sidebar border overrides | Game competitive presentation: black fill, `3px #45453c` frame, black offset shadow, inset edge and subtle glow; remove sidebar color overrides |
| Accent / muted text | Lighter Wiki-specific palette | Game competitive palette: green `#72aa83`, muted `#8d8a7b`; existing gold/cyan/ink already match |
| Buttons | Thinner-looking dark frame/shadow, green hover fill and separate cyan border | Game neutral border/shadow, black background, brightness hover, white keyboard focus and pressed offset; retain semantic green/cyan actions |
| Search field | 1px panel-colored border and green focus ring | Game 2px input border `#5d5d54`, white text and white focused border |
| Figure frames | Ad hoc dark teal colors | Reuse the shared neutral frame color; content dividers remain 1px |
| Scroll rail | Main 12px rail, 14px gutter, palette and drag behavior already match | Retained; synchronize native table scrollbar corner pattern |
| CRT | One static dark scanline layer; no game's beam/glass finish | Copy `online/public/crt-filter-v2.js` verbatim as an independent presentation asset; remove duplicate Wiki scanline layer |
| Launch dialog | Already mirrors the game room-action dialog | Retain its frame, animation, focus and fallback behavior; verify with CRT overlays in the modal top layer |

References were checked in the parent game's `outputs/competitive-rule.html`,
`online/public/desktop-layout.css`, `online/public/lobby.css`,
`online/public/retro-scrollbar.css` and `online/public/crt-filter-v2.js`.
The competitive surface uses `#45453c` for frames; Lobby uses `#48483f`.
This Wiki consistently uses the competitive surface's frame palette.
No game logic, account code or private deployment configuration is published.

The CSS, logo and CRT URLs are versioned across all eight articles so cached
assets cannot leave a mix of the previous and updated presentation.

## Validation

- `python scripts/check-site.py`: 8 static-site checks.
- `python scripts/build-search-index.py --check`: bilingual index remains current.
- Node tests for language, media, search and desktop launch: 26 checks.
- `scripts/test-ui-browser.mjs`: both languages and four articles at ten desktop
  sizes (including 2560×1080, 1920×600, 800×900 and 844×390) and two mobile sizes; actual
  frame bounds, centering, banner geometry, gap, colors, logo collision, overflow,
  independent scrolling, reading font, CRT layers, native no-JS fallback, search
  navigation and pointer dragging of the pixel rail.
- `scripts/test-desktop-launch-browser.mjs`: existing modal keyboard, focus,
  reverse animation, reduced motion, scroll preservation, three actions and
  non-Windows/no-JS fallback checks.
- Edge 155: 96 page/viewport cases plus interaction and no-JS checks; 10 existing
  launch-dialog cases. Native Firefox 157 via the installed GeckoDriver: 32
  bilingual page/viewport cases, including CRT and mobile scrolling geometry.
- Existing local font/loading harness: all eight delayed-font pages, six fallback
  cases and four slow-image cases pass with the synchronized CRT. The held-font
  capture was skipped in that temporary harness because Playwright waits for
  fonts before taking a screenshot; the loading-visibility assertions still run.

The initial 1920×1080 regression check failed at the previous 1600px-wide frame
instead of 1440px. A second check caught the missing CRT presentation. During
review, the 844×390 English mode-card heading reproduced overflow; the final
suite checks individual heading bounds as well as page bounds.

Local visual captures are written to `.tmp/ui-validation/` and
`.tmp/desktop-launch-validation/`; temporary files are not publication assets.
