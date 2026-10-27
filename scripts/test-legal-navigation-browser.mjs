import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.MFM_PLAYWRIGHT_MODULE||'playwright');
assert.ok(process.env.MFM_GAME_DIST,'Set MFM_GAME_DIST to the companion game build directory');
const wikiRoot=resolve('docs'),gameRoot=resolve(process.env.MFM_GAME_DIST);
const wiki='https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/';
const game='https://monsterfusionmasters.com';
const browser=await chromium.launch({channel:'msedge'});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  // Exercise real cross-origin links against the two local production builds.
  // No deployed site, account, database or public support form is touched.
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    let root,path;
    if(url.href.startsWith(wiki)){root=wikiRoot;path=decodeURIComponent(url.pathname.slice(new URL(wiki).pathname.length))||'index.html';}
    else if(url.origin===game){
      if(url.pathname.startsWith('/api/')){
        await route.fulfill({json:{locale:'en',announcements:[]}});return;
      }
      root=gameRoot;path=decodeURIComponent(url.pathname.slice(1))||'index.html';
      if(['terms','privacy'].includes(path))path+='.html';
    }else{await route.abort();return;}
    const file=resolve(root,path);
    if(!file.startsWith(root+sep)){await route.abort();return;}
    try{await route.fulfill({contentType:types[extname(file)]||'application/octet-stream',body:await readFile(file)});}
    catch{await route.fulfill({status:404,body:'Not found'});}
  });
  for(const locale of ['zh-Hant','en'])for(const policy of ['terms','privacy'])for(const swap of [false,true]){
    await page.goto(`${wiki}${locale==='en'?'en/':''}about.html?lang=${locale}`);
    await page.waitForFunction(()=>!document.documentElement.classList.contains('wiki-fonts-loading'));
    await page.locator('.footer-nav a').nth(policy==='terms'?0:1).click();
    await page.waitForURL(`${game}/${policy}?from=wiki&lang=${locale}`);
    const home=`${wiki}${locale==='en'?'en/':''}index.html?lang=${locale}`;
    await page.waitForFunction(home=>document.querySelector('.ranking-back')?.href===home,home);
    if(swap){
      await page.locator('.legal-nav a').click();
      await page.waitForURL(`${game}/${policy==='terms'?'privacy':'terms'}?from=wiki&lang=${locale}`);
      await page.waitForFunction(home=>document.querySelector('.ranking-back')?.href===home,home);
    }
    await page.locator('.ranking-back').click();await page.waitForURL(home);
    await page.waitForFunction(locale=>document.documentElement.lang===locale,locale);
    assert.equal(await page.locator('h1').textContent(),locale==='en'?'Game encyclopedia':'遊戲百科');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: 8 cross-origin Wiki → legal → Wiki home journeys, both locales and policies, with/without policy switching');
}finally{await browser.close();}
