import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const playwright = require(process.env.MFM_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../docs/', import.meta.url));
const output = fileURLToPath(new URL('../.tmp/desktop-launch-validation/', import.meta.url));
await mkdir(output, {recursive:true});
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ttf':'font/ttf','.svg':'image/svg+xml','.webp':'image/webp'};
const server = createServer(async (req,res) => {
  try {
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html';
    const path = resolve(root, relative);
    if (!path.startsWith(resolve(root) + sep)) throw Error('outside docs');
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let cases = 0;
try {
  for (const name of (process.env.MFM_TEST_BROWSERS || 'chromium,firefox,edge').split(',')) {
    const browser = await (name === 'edge' ? playwright.chromium.launch({channel:'msedge'}) : playwright[name].launch());
    try {
      for (const locale of ['zh-Hant','en']) for (const [width,height] of [[320,480],[390,844],[900,700],[1440,900]]) {
        const context = await browser.newContext({viewport:{width,height}, reducedMotion:'no-preference'});
        // Exercise popup behavior without letting native external-app prompts steal
        // test keyboard input. Real ShellExecute/profile handoff is tested separately.
        await context.addInitScript(() => {
          Object.defineProperty(navigator,'userAgentData',{value:{platform:'Windows'}});
          Object.defineProperty(navigator,'platform',{value:'Win32'});
          window.__protocolAttempts = [];
          window.__testProtocolLaunch = uri => {
            window.__protocolAttempts.push({uri, active:navigator.userActivation.isActive});
            throw Error('Controlled external-handler refusal');
          };
        });
        await context.route('**/wiki.js?*', async route => {
          const source = await readFile(resolve(root,'wiki.js'),'utf8');
          assert.ok(source.includes('window.location.assign("mfmdesktop://launch")'));
          await route.fulfill({contentType:'text/javascript',body:source.replace('window.location.assign("mfmdesktop://launch")','window.__testProtocolLaunch("mfmdesktop://launch")')});
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${origin}/${locale === 'en' ? 'en/' : ''}index.html?lang=${locale}`);
        const trigger = page.locator('[data-mfm-launch]');
        await trigger.scrollIntoViewIfNeeded();
        await page.evaluate(() => { document.querySelector('.page').scrollTop = 150; });
        const before = await page.evaluate(() => ({x:window.scrollX,y:window.scrollY,main:document.querySelector('.page').scrollTop,width:document.querySelector('.page').getBoundingClientRect().width}));
        await trigger.click();
        await page.waitForFunction(() => document.querySelector('#mfm-launch-dialog').open && !document.querySelector('#mfm-launch-dialog').hasAttribute('data-animating'));
        const geometry = await page.locator('#mfm-launch-dialog').evaluate(dialog => {
          const r = dialog.getBoundingClientRect();
          const buttons = [...dialog.querySelectorAll('.pixel-btn')];
          return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:dialog.scrollWidth > dialog.clientWidth + 1,buttons:buttons.map(b => b.scrollWidth <= b.clientWidth + 1),buttonTops:buttons.map(b => b.getBoundingClientRect().top),font:getComputedStyle(dialog).fontFamily};
        });
        assert.ok(geometry.x >= 0 && geometry.y >= 0 && geometry.right <= width && geometry.bottom <= height, JSON.stringify(geometry));
        assert.equal(geometry.overflow, false);
        assert.ok(geometry.buttons.every(Boolean));
        assert.equal(geometry.buttons.length,3);
        if (width >= 900) assert.ok(geometry.buttonTops.every(y => Math.abs(y - geometry.buttonTops[0]) < 1),'desktop actions share one row');
        assert.match(geometry.font, /MFM Pixel/);
        assert.equal(await page.locator('#mfm-launch-dialog a').first().getAttribute('href'), 'https://github.com/duoduo-88/monster-fusion-masters-showcase_MFM/releases/latest');
        for (let n=0;n<6;n++) {
          await page.keyboard.press('Tab');
          assert.ok(await page.evaluate(() => document.querySelector('#mfm-launch-dialog').contains(document.activeElement)));
        }
        const attempts = await page.evaluate(() => window.__protocolAttempts);
        assert.equal(attempts.length,1);
        assert.ok(attempts.every(a => a.active && a.uri === 'mfmdesktop://launch'));
        assert.ok(page.url().startsWith(origin)); // No automatic second game session.
        if (width === 390) await page.screenshot({path:resolve(output,`${name}-${locale}-mobile.png`)});
        if (width === 1440) await page.screenshot({path:resolve(output,`${name}-${locale}-desktop.png`)});
        await page.keyboard.press('Escape');
        try { await page.waitForFunction(() => !document.querySelector('#mfm-launch-dialog').open, null, {timeout:5000}); }
        catch (error) {
          console.error(await page.evaluate(() => ({active:document.activeElement?.outerHTML,open:document.querySelector('#mfm-launch-dialog').open,animations:document.querySelector('#mfm-launch-dialog').getAnimations().map(a=>({state:a.playState,time:a.currentTime})),errors:window.__errors})),errors);
          throw error;
        }
        assert.ok(await trigger.evaluate(t => document.activeElement === t));
        const after = await page.evaluate(() => ({x:window.scrollX,y:window.scrollY,main:document.querySelector('.page').scrollTop,width:document.querySelector('.page').getBoundingClientRect().width}));
        assert.deepEqual(after,before,'closing preserves page position and layout');
        await page.emulateMedia({reducedMotion:'reduce'});
        await trigger.click();
        assert.equal(await page.locator('#mfm-launch-dialog').evaluate(d => d.getAnimations().length),0);
        await page.locator('[data-mfm-launch-close]').click();
        assert.equal(await page.locator('#mfm-launch-dialog').evaluate(d => d.open),false);
        await page.emulateMedia({reducedMotion:'no-preference'});
        await trigger.click();
        await page.keyboard.press('Escape'); // Closing can supersede an unfinished opening.
        await page.waitForFunction(() => !document.querySelector('#mfm-launch-dialog').open);
        assert.equal(await page.locator('#mfm-launch-dialog').evaluate(d => d.getAnimations().length),0);
        assert.deepEqual(errors,[]);
        cases++;
        await context.close();
      }
      // Non-Windows and no-JS clients retain the original direct browser entry.
      for (const javaScriptEnabled of [true,false]) {
        const context = await browser.newContext({javaScriptEnabled});
        if (javaScriptEnabled) await context.addInitScript(() => {
          Object.defineProperty(navigator,'userAgentData',{value:{platform:'Linux'}});
          Object.defineProperty(navigator,'platform',{value:'Linux x86_64'});
        });
        await context.route('https://monsterfusionmasters.com/**', route => route.fulfill({body:'Browser game fallback'}));
        const page = await context.newPage();
        await page.goto(`${origin}/en/index.html?lang=en`);
        await page.locator('[data-mfm-launch]').click();
        await page.waitForURL('https://monsterfusionmasters.com/');
        cases++;
        await context.close();
      }
      console.log(`${name} ${browser.version()}: bilingual/320/390/900/1440, three actions, desktop single row, keyboard, scroll, reduced motion, non-Windows and no-JS passed`);
    } finally { await browser.close(); }
  }
  console.log(`Wiki browser launch: ${cases} cases passed; screenshots: ${output}`);
} finally { server.close(); }
