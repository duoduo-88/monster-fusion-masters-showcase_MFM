import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const playwright = require(process.env.MFM_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../docs/', import.meta.url));
const output = fileURLToPath(new URL('../.tmp/ui-validation/', import.meta.url));
await mkdir(output, {recursive:true});
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ttf':'font/ttf','.svg':'image/svg+xml','.webp':'image/webp'};
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html');
    if (!path.startsWith(resolve(root) + sep)) throw Error('outside docs');
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual} != ${expected}`);
// Independent examples of the game's 4:3 frame and desktop-layout masthead tokens.
const desktops = [
  [1920,1080,1440,1080,13.68,67.5], [2560,1080,1440,1080,13.68,67.5],
  [1440,900,1200,900,11.4,56.25], [1280,720,960,720,9.12,54],
  [1024,768,1024,768,9.728,54], [900,700,900,675,8.55,54],
  [1920,600,800,600,8,54], [800,900,800,600,8,54],
  [844,390,520,390,8,54], [1280,400,533.333,400,8,54]
];
let cases = 0;
try {
  for (const name of (process.env.MFM_TEST_BROWSERS || 'chromium,firefox,edge').split(',')) {
    const browser = await (name === 'edge' ? playwright.chromium.launch({channel:'msedge'}) : playwright[name].launch());
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const locale of ['zh-Hant','en']) for (const file of ['index.html','rules.html','modes.html','requirements.html','history.html']) {
        for (const [width,height,frameWidth,frameHeight,gap,headerHeight] of desktops) {
          await page.setViewportSize({width,height});
          await page.goto(`${origin}/${locale === 'en' ? 'en/' : ''}${file}?lang=${locale}`);
          await page.waitForFunction(() => !document.documentElement.classList.contains('wiki-fonts-loading'));
          const geometry = await page.evaluate(async () => {
            const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
            const shell = document.querySelector('.site-shell');
            const article = document.querySelector('.page');
            const head = document.querySelector('.site-head');
            const layout = document.querySelector('.layout');
            const image = document.querySelector('.brand img');
            const svg = new DOMParser().parseFromString(await (await fetch(image.src)).text(), 'image/svg+xml');
            article.scrollTop = 120;
            return {
              shell:rect('.site-shell'), head:rect('.site-head'), layout:rect('.layout'),
              padding:parseFloat(getComputedStyle(shell).paddingLeft), gap:parseFloat(getComputedStyle(layout).gap),
              headPadding:getComputedStyle(head).padding,
              frames:[...document.querySelectorAll('.frame')].map(el => ({color:getComputedStyle(el).borderTopColor,background:getComputedStyle(el).backgroundColor,width:getComputedStyle(el).borderTopWidth})),
              logoFill:svg.documentElement.getAttribute('fill'),
              logo:rect('.brand img'), actions:rect('.head-actions'),
              articleWidth:article.clientWidth, articleOverflow:article.scrollWidth > article.clientWidth + 1,
              headingOverflow:[...article.querySelectorAll('h1,h2,h3')].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent),
              articleScroll:article.scrollTop, bodyScroll:scrollY,
              bodyOverflow:document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight + 1,
              columns:getComputedStyle(layout).gridTemplateColumns.split(' ').length,
              font:getComputedStyle(article).fontFamily,
              crt:window.__MFM_CRT_FILTER__,
              overlays:document.querySelectorAll('[data-mfm-crt-layer]').length,
              filter:getComputedStyle(shell).filter
            };
          });
          const label = `${name} ${locale}/${file} ${width}x${height}`;
          near(geometry.shell.width,frameWidth,`${label} frame width`);
          near(geometry.shell.height,frameHeight,`${label} frame height`);
          near(geometry.shell.x,(width-frameWidth)/2,`${label} centered horizontally`);
          near(geometry.shell.y,(height-frameHeight)/2,`${label} centered vertically`);
          near(geometry.padding,gap,`${label} frame padding`);
          near(geometry.head.height,headerHeight,`${label} banner height`);
          near(geometry.layout.y-geometry.head.bottom,gap,`${label} banner/content gap`);
          near(geometry.gap,gap,`${label} column gap`);
          assert.equal(geometry.headPadding,'7px 7px 7px 14px',`${label} banner padding`);
          assert.ok(geometry.frames.every(f => f.color === 'rgb(69, 69, 60)' && f.width === '3px' && f.background === 'rgb(0, 0, 0)'),`${label} game panel palette: ${JSON.stringify(geometry.frames)}`);
          assert.equal(geometry.logoFill,'#fff',`${label} game white logo`);
          assert.ok(geometry.logo.right < geometry.actions.x,`${label} logo must not collide with language controls`);
          assert.ok(geometry.articleWidth > 280,`${label} article remains readable`);
          assert.equal(geometry.articleOverflow,false,`${label} article horizontal overflow`);
          assert.deepEqual(geometry.headingOverflow,[],`${label} card headings stay inside their own columns`);
          assert.ok(geometry.articleScroll > 0,`${label} article scrolls independently`);
          assert.equal(geometry.bodyScroll,0,`${label} outer document stays fixed`);
          assert.equal(geometry.bodyOverflow,false,`${label} frame fits viewport`);
          if (frameWidth <= 1000) assert.equal(geometry.columns,2,`${label} columns follow frame width`);
          assert.match(geometry.font,/Cubic 11/,`${label} reading font retained`);
          assert.equal(geometry.crt,'dynamic-beam-v8-teal-glass',`${label} game CRT presentation`);
          assert.equal(geometry.overlays,4,`${label} one set of CRT layers`);
          assert.match(geometry.filter,/#mfmCrtDynamicBeam/,`${label} game phosphor beam`);
          if (file === 'index.html' && width === 1920) {
            await page.locator('.page').evaluate(el => { el.scrollTop = 0; });
            await page.screenshot({path:resolve(output,`${name}-${locale}-${width}x${height}.png`)});
          }
          cases++;
        }
        for (const [width,height] of [[390,844],[760,800]]) {
          await page.setViewportSize({width,height});
          await page.reload();
          assert.equal(await page.locator('.page').evaluate(el => getComputedStyle(el).overflowY),'visible');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
          await page.locator('.site-footer').scrollIntoViewIfNeeded();
          assert.ok(await page.evaluate(() => scrollY > 0),'mobile uses document scrolling');
          if (file === 'index.html' && width === 390) {
            await page.evaluate(() => scrollTo(0,0));
            await page.screenshot({path:resolve(output,`${name}-${locale}-mobile.png`)});
          }
          cases++;
        }
      }
      await page.setViewportSize({width:1280,height:720});
      await page.goto(`${origin}/rules.html?lang=zh-Hant`);
      const search = page.locator('#wiki-search-input');
      await search.fill('DEAD');
      await search.focus();
      assert.equal(await search.evaluate(el => getComputedStyle(el).borderColor),'rgb(255, 255, 255)','game input focus');
      await page.locator('.search-results a').first().waitFor();
      await page.locator('.search-results a').first().click();
      await page.waitForFunction(() => location.hash && document.querySelector('.page').scrollTop > 0);
      assert.equal(await page.evaluate(() => scrollY),0,'search results navigate inside the article');
      await page.locator('.page').evaluate(el => { el.scrollTop = 0; });
      const articleBox = await page.locator('.page').boundingBox();
      await page.mouse.move(articleBox.x + articleBox.width - 8, articleBox.y + 15);
      await page.mouse.down();
      await page.mouse.move(articleBox.x + articleBox.width - 8, articleBox.y + 150,{steps:8});
      await page.mouse.up();
      assert.ok(await page.locator('.page').evaluate(el => el.scrollTop > 0),'pixel rail remains draggable through CRT layers');
      // The frame must exist before enhancement, including blocked scripts/fonts.
      const fallback = await browser.newPage({javaScriptEnabled:false,viewport:{width:1920,height:1080}});
      await fallback.goto(`${origin}/index.html`);
      const fallbackRect = await fallback.locator('.site-shell').boundingBox();
      near(fallbackRect.width,1440,'no-JS frame width');
      near(fallbackRect.height,1080,'no-JS frame height');
      assert.equal(await fallback.locator('h1').isVisible(),true);
      await fallback.close();
      assert.deepEqual(errors,[]);
      console.log(`${name}: 10 bilingual pages, 10 desktop sizes, 2 mobile sizes, resizing, search, rail dragging and no-JS passed`);
    } finally { await browser.close(); }
  }
  console.log(`Wiki UI: ${cases} viewport/page cases passed; screenshots: ${output}`);
} finally { server.close(); }
