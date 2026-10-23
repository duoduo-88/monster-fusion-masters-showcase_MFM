import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const playwright = require(process.env.MFM_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../docs/', import.meta.url));
const output = fileURLToPath(new URL('../.tmp/navigation-validation/', import.meta.url));
await mkdir(output, {recursive:true});
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ttf':'font/ttf','.svg':'image/svg+xml','.webp':'image/webp'};
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/project\//, '') || 'index.html');
    if (!path.startsWith(resolve(root) + sep)) throw Error('outside docs');
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}/project/`;
try {
  for (const name of (process.env.MFM_TEST_BROWSERS || 'chromium,firefox,edge').split(',')) {
    const browser = await (name === 'edge' ? playwright.chromium.launch({channel:'msedge'}) : playwright[name].launch());
    try {
      const page = await browser.newPage({viewport:{width:1600,height:1200}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}history.html?lang=zh-Hant`);
      await page.waitForFunction(() => !document.documentElement.classList.contains('wiki-fonts-loading'));
      await page.evaluate(() => {
        window.originalShell = document.querySelector('.site-shell');
        window.originalSearch = document.querySelector('#wiki-search-input');
        window.originalArticle = document.querySelector('.page');
      });
      await page.locator('.site-nav a[href$="rules.html"]').click();
      await page.waitForURL('**/rules.html');
      assert.equal(await page.evaluate(() => window.originalShell === document.querySelector('.site-shell')), true, 'wiki navigation must preserve the document shell instead of reloading the page');
      assert.equal(await page.evaluate(() => window.originalArticle === document.querySelector('.page')), true);
      assert.equal(await page.locator('h1').textContent(), '遊戲規則');
      assert.ok(await page.locator('.toc a[href="#scoring"]').count());
      // Search must visibly stretch the frame while preserving legible text size.
      const search = page.locator('#wiki-search-input');
      const small = await page.locator('.search-panel').evaluate(el => el.getBoundingClientRect().height);
      await search.fill('DEAD');
      assert.equal(await page.locator('.search-panel').evaluate(el => el.getAnimations().some(a => a.effect.getKeyframes().some(f => f.height))), true, 'search changes must animate frame height');
      await page.waitForFunction(() => !document.querySelector('.search-panel').getAnimations().length);
      const large = await page.locator('.search-panel').evaluate(el => el.getBoundingClientRect().height);
      assert.ok(large > small + 30);
      await search.fill('no-such-keyword-12345');
      const shrinking = await page.locator('.search-panel').evaluate(el => {
        const animation = el.getAnimations()[0];
        animation.pause();
        animation.currentTime = 70;
        const height = el.getBoundingClientRect().height;
        animation.finish();
        return height;
      });
      assert.ok(shrinking > small && shrinking < large, 'the actual frame passes through intermediate heights');
      await search.fill('DEAD');
      await page.locator('.search-results a').first().click();
      await page.waitForFunction(() => location.hash && document.querySelector('.page').scrollTop > 0);
      assert.equal(await search.inputValue(), 'DEAD', 'search survives a result navigation');
      await page.locator('.site-nav a[href$="modes.html"]').click();
      await page.waitForURL('**/modes.html');
      assert.equal(await search.inputValue(), 'DEAD');
      assert.equal(await page.evaluate(() => window.originalSearch === document.querySelector('#wiki-search-input')), true);
      await page.goBack();
      await page.waitForFunction(() => location.pathname.endsWith('/rules.html') && document.querySelector('h1').textContent === '遊戲規則');
      assert.ok(await page.locator('.page').evaluate(el => el.scrollTop > 0), 'back restores article scroll');
      await page.goForward();
      await page.waitForFunction(() => document.querySelector('.toc a[href="#ranked"]'));
      await page.locator('.contents-panel summary').click();
      assert.equal(await page.locator('.contents-panel').evaluate(el => el.getAnimations().length > 0), true, 'TOC collapse animates frame height');
      await page.locator('.contents-panel summary').click();
      await page.waitForFunction(() => !document.querySelector('.contents-panel').getAnimations().length);
      assert.equal(await page.locator('.contents-panel details').getAttribute('open'), '');
      // A slow earlier request must not overwrite a newer navigation.
      await page.route('**/history.html', async route => {
        await new Promise(done => setTimeout(done, 200));
        await route.continue();
      });
      await page.locator('.site-nav a[href$="history.html"]').click();
      await page.locator('.site-nav a[href$="index.html"]').click();
      await page.waitForURL('**/index.html');
      await page.waitForTimeout(250);
      assert.equal(await page.locator('h1').textContent(), '遊戲百科', 'the latest click wins');
      await page.unroute('**/history.html');
      // About belongs to the same partial-navigation shell, despite having no
      // selected category in the four-item article sidebar.
      await page.evaluate(() => {
        window.originalLeftRail = document.querySelector('.left-rail');
        window.originalFooter = document.querySelector('.site-footer');
      });
      await page.locator('.footer-nav a').nth(3).click();
      await page.waitForFunction(() => location.pathname.endsWith('/about.html') && document.querySelector('h1').textContent === '關於 MFM');
      assert.equal(await page.evaluate(() => window.originalShell === document.querySelector('.site-shell')), true, 'About must update the article without a document reload');
      assert.equal(await page.evaluate(() => window.originalArticle === document.querySelector('.page')), true);
      assert.equal(await page.evaluate(() => window.originalLeftRail === document.querySelector('.left-rail')), true);
      assert.equal(await page.evaluate(() => window.originalFooter === document.querySelector('.site-footer')), true);
      assert.equal(await page.locator('.site-nav a[aria-current="page"]').count(), 0);
      assert.ok(await page.locator('.toc a[href="#contact"]').count());
      assert.equal(await search.inputValue(), 'DEAD');
      await page.locator('[data-language="en"]').click();
      await page.waitForFunction(() => document.documentElement.lang === 'en' && document.querySelector('h1').textContent === 'About MFM');
      assert.equal(await page.evaluate(() => window.originalShell === document.querySelector('.site-shell')), true);
      await page.goBack();
      await page.waitForFunction(() => document.documentElement.lang === 'zh-Hant' && document.querySelector('h1').textContent === '關於 MFM');
      assert.equal(await page.evaluate(() => window.originalShell === document.querySelector('.site-shell')), true);
      await page.locator('.page a[href$="index.html"]').click();
      await page.waitForFunction(() => document.querySelector('h1').textContent === '遊戲百科');
      assert.equal(await page.evaluate(() => window.originalShell === document.querySelector('.site-shell')), true);
      await page.locator('.site-nav a[href$="modes.html"]').click();
      await page.waitForURL('**/modes.html');
      // Language changes keep the shell, search query and correct relative media URLs.
      await page.locator('[data-language="en"]').click();
      await page.waitForFunction(() => document.documentElement.lang === 'en');
      assert.equal(await page.evaluate(() => window.originalShell === document.querySelector('.site-shell')), true);
      assert.equal(await search.inputValue(), 'DEAD');
      assert.match(await page.locator('.search-results a').first().getAttribute('href'), /rules.html\?lang=en/);
      await search.press('Enter');
      await page.waitForFunction(() => location.pathname.endsWith('/en/rules.html') && document.querySelector('.page').scrollTop > 0);
      await page.locator('.page').evaluate(el => {el.scrollTop = 0;});
      const image = page.locator('.page img').first();
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.page img').naturalWidth > 0);
      assert.match(await image.getAttribute('src'), /\/project\/assets\/media\//);
      await page.screenshot({path:resolve(output,`${name}-en-search.png`)});
      // Newly inserted galleries must still bind their controls.
      const galleryButton = page.locator('[data-demo-gallery] button[data-demo-src]').last();
      await galleryButton.click();
      assert.equal(await galleryButton.getAttribute('aria-pressed'), 'true');
      await page.emulateMedia({reducedMotion:'reduce'});
      await search.fill('no-such-keyword-12345');
      assert.equal(await page.locator('.search-panel').evaluate(el => el.getAnimations().length), 0);
      await page.setViewportSize({width:390,height:844});
      await page.locator('.site-nav a[href$="history.html"]').click();
      await page.waitForFunction(() => document.querySelector('h1').textContent === 'Development history');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      // A failed fragment request retains the working static-page fallback.
      await page.route('**/en/index.html', route => route.request().resourceType() === 'fetch' ? route.abort() : route.continue());
      await page.locator('.site-nav a[href$="index.html"]').click();
      await page.waitForURL('**/en/index.html');
      await page.waitForLoadState('load');
      assert.equal(await page.evaluate(() => window.originalShell), undefined, 'fetch failure falls back to a document navigation');
      assert.equal(await page.locator('h1').textContent(), 'Game encyclopedia');
      assert.deepEqual(errors, []);
      console.log(`${name}: partial navigation, retained search, history, bilingual media, popup resizing and reduced motion passed`);
    } finally {await browser.close();}
  }
} finally {server.close();}
