import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.MFM_PLAYWRIGHT_MODULE||'playwright');
const root=resolve('docs'),output=resolve('.tmp/footer-validation');
await mkdir(output,{recursive:true});
// Serve under the actual GitHub Pages project subpath to catch /en/ mistakes.
const base='/monster-fusion-masters-showcase_MFM/';
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://test');
    if(!url.pathname.startsWith(base))throw Error('outside project');
    const file=resolve(root,decodeURIComponent(url.pathname.slice(base.length))||'index.html');
    if(!file.startsWith(root+sep))throw Error('outside docs');
    res.setHeader('content-type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'})[extname(file)]||'application/octet-stream');
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:process.env.MFM_FOOTER_CHANNEL||'msedge'});
const report=[];
try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const locale of ['zh-Hant','en'])for(const [width,height] of [[1920,1080],[1280,800],[800,600],[375,812]]){
    await page.setViewportSize({width,height});
    for(const name of ['index','rules','modes','history','requirements','about']){
      await page.goto(`${origin}${base}${locale==='en'?'en/':''}${name}.html?lang=${locale}`);
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>!document.documentElement.classList.contains('wiki-fonts-loading'));
      const links=page.locator('.footer-nav a');
      assert.equal(await links.count(),4,'every article exposes four legal/info destinations');
      const rating=page.locator('.site-footer .rating-summary');
      assert.equal(await rating.count(),1,'each article exposes one rating notice');
      const ratingText=await rating.innerText();
      assert.ok(ratingText.includes(locale==='en'?'Rating registration in progress':'分級登錄中'));
      assert.ok(ratingText.includes('不得利用本遊戲進行賭博'),'Chinese warning present in both languages');
      const symbol=rating.locator('.rating-symbol');
      assert.equal(await symbol.getAttribute('width'),'52');
      assert.ok(await symbol.evaluate(img=>img.complete&&img.naturalWidth>0),'rating asset loads');
      const align=await page.evaluate(()=>{
        const left=document.querySelector('.site-footer .footer-copyright').getBoundingClientRect();
        const right=document.querySelector('.site-footer .footer-nav').getBoundingClientRect();
        return {left:Math.abs(left.left-right.left),right:Math.abs(left.right-right.right)};
      });
      assert.ok(align.left<=1&&align.right<=1,'copyright and links share both horizontal edges');

      assert.deepEqual(await links.allTextContents(),locale==='en'?['TERMS','PRIVACY','CONTACT','ABOUT US']:['使用條款','隱私政策','聯絡','關於我們']);
      assert.equal(await links.nth(0).getAttribute('href'),`https://mfm.monster-fusion-masters-online.workers.dev/terms?from=wiki&lang=${locale}`);
      assert.equal(await links.nth(1).getAttribute('href'),`https://mfm.monster-fusion-masters-online.workers.dev/privacy?from=wiki&lang=${locale}`);
      assert.equal(await page.locator('.footer-credits').count(),0,'footer does not duplicate font attribution');
      assert.equal(await links.nth(2).getAttribute('target'),'_blank');
      assert.equal(await links.nth(2).getAttribute('href'),'https://github.com/duoduo-88/monster-fusion-masters-showcase_MFM/issues/new/choose');
      const geometry=await page.evaluate(()=>{
        const footer=document.querySelector('.site-footer'),r=footer.getBoundingClientRect();
        return {overflow:document.documentElement.scrollWidth>innerWidth+1,
          clipped:[...footer.querySelectorAll('a')].some(a=>{const b=a.getBoundingClientRect();return b.left<r.left-1||b.right>r.right+1||b.bottom>r.bottom+1}),
          footer:{top:r.top,bottom:r.bottom,height:r.height},font:getComputedStyle(footer).fontSize};
      });
      assert.equal(geometry.overflow,false,`${locale} ${width} ${name} overflow`);
      assert.equal(geometry.clipped,false,'footer text remains inside footer');
      assert.ok(parseFloat(geometry.font)>=12);
      await links.nth(0).focus();await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.href),`https://mfm.monster-fusion-masters-online.workers.dev/privacy?from=wiki&lang=${locale}`);
      assert.notEqual(await links.nth(1).evaluate(a=>getComputedStyle(a).outlineStyle),'none');
      await links.nth(0).hover();assert.equal(await links.nth(0).evaluate(a=>getComputedStyle(a).color),'rgb(183, 222, 215)');
      await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0)});
      if(name==='about'){
        assert.equal(await page.title(),locale==='en'?'About MFM | Monster Fusion Masters Wiki':'關於 MFM | Monster Fusion Masters Wiki');
        const zh=page.locator('[data-language="zh-Hant"]'),en=page.locator('[data-language="en"]');
        assert.ok((await zh.getAttribute('href')).includes('/about.html'));
        assert.ok((await en.getAttribute('href')).includes('/en/about.html'));
        await page.screenshot({path:resolve(output,`${locale}-about-${width}x${height}.png`),fullPage:true});
      }else if(name==='index')await page.screenshot({path:resolve(output,`${locale}-wiki-${width}x${height}.png`),fullPage:true});
      report.push({locale,width,height,name,...geometry});
    }
  }
  // Static fallback links work without JS; language switching retains About.
  await page.goto(`${origin}${base}about.html?lang=zh-Hant`);
  await page.evaluate(()=>{window.footerShell=document.querySelector('.site-shell')});
  await page.locator('[data-language="en"]').click();await page.waitForURL('**/en/about.html?lang=en*');
  assert.equal(await page.evaluate(()=>window.footerShell===document.querySelector('.site-shell')),true,'narrow About language switch preserves shell');
  await page.locator('.brand').click();await page.waitForURL('**/en/index.html*');
  await page.locator('.footer-nav a').nth(3).click();await page.waitForURL('**/en/about.html*');
  await page.waitForFunction(()=>document.querySelector('h1').textContent==='About MFM');
  assert.equal(await page.evaluate(()=>window.footerShell===document.querySelector('.site-shell')),true,'narrow About link updates only article');
  const popup=page.waitForEvent('popup');
  await page.locator('.footer-nav a').nth(2).click();
  const contact=await popup;await contact.waitForLoadState('domcontentloaded').catch(()=>{});
  assert.ok(contact.url().startsWith('https://github.com/duoduo-88/monster-fusion-masters-showcase_MFM/issues/new/choose')||contact.url().startsWith('https://github.com/login'),'Contact opens GitHub');
  await contact.close();
  assert.deepEqual(errors,[]);
  await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));
  console.log(`PASS ${report.length} bilingual Wiki page/viewports; keyboard, hover, About navigation and Contact popup`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
