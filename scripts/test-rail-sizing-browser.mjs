import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.MFM_PLAYWRIGHT_MODULE||'playwright');

const directory=resolve('docs');
const types={html:'text/html; charset=utf-8',css:'text/css',js:'text/javascript',svg:'image/svg+xml',webp:'image/webp',ttf:'font/ttf'};
const server=createServer(async(req,res)=>{
 try {
  const path=new URL(req.url,'http://test').pathname;
  const file=resolve(directory,'.'+decodeURIComponent(path));
  if(!file.startsWith(directory+sep))throw Error('outside docs');
  res.setHeader('content-type',types[file.split('.').at(-1)]||'application/octet-stream');
  res.end(await readFile(file));
 } catch {res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const instance=await chromium.launch({channel:'msedge'});
const page=await instance.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const cdp=await page.context().newCDPSession(page);
const browser={
 resize:(width,height)=>page.setViewportSize({width,height}),
 evaluate:expression=>page.evaluate(expression),
 wait:expression=>page.waitForFunction(expression),
 send:(method,params)=>cdp.send(method,params),errors,
 async dispose(){await instance.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
};
try {
 await page.goto(`http://127.0.0.1:${server.address().port}/rules.html`);
 await browser.resize(1440,900);
 await browser.wait("!document.documentElement.classList.contains('wiki-fonts-loading')");
 for(const width of [1440,1280,1920]) {
  await browser.resize(width,width===1920?600:720);
  const result=await browser.evaluate(`(()=>{
   const rails=[...document.querySelectorAll('.left-rail,.right-rail')];
   return rails.map(rail=>{
    rail.scrollTop=0;
    const children=[...rail.children].filter(el=>!el.hidden);
    const before=children.map(el=>el.getBoundingClientRect().top);
    rail.scrollTop=100;
    return {overflow:rail.scrollHeight>rail.clientHeight,scroll:rail.scrollTop,
     shrunk:children.filter(el=>el.scrollHeight>el.clientHeight+2).map(el=>el.className),
     deltas:children.map((el,i)=>before[i]-el.getBoundingClientRect().top)};
   });
  })()`);
  for(const rail of result) {
   assert.deepEqual(rail.shrunk,[],`${width}: sidebar cards keep their natural content height`);
   if(rail.overflow){assert.ok(rail.scroll>0);assert.ok(rail.deltas.every(delta=>Math.abs(delta-rail.scroll)<1),'the whole column scrolls together');}
  }
 }
 await browser.resize(1440,900);
 await browser.evaluate("const input=document.querySelector('[data-wiki-search] input');input.value='棋';input.dispatchEvent(new Event('input',{bubbles:true}))");
 await browser.wait("document.querySelectorAll('.search-results li').length>0 && !document.querySelector('[data-wiki-resizing]')");
 assert.equal(await browser.evaluate("document.querySelector('.search-panel').scrollHeight>document.querySelector('.search-panel').clientHeight+2"),false,'expanded search results retain the whole card height');
 assert.equal(await browser.evaluate("document.querySelector('.right-rail').scrollHeight>document.querySelector('.right-rail').clientHeight"),true,'expanded results scroll with the entire right column');
 await browser.evaluate("document.querySelector('.search-clear').click()");
 await browser.wait("!document.querySelector('[data-wiki-resizing]')");
 if(process.env.MFM_WIKI_SCREENSHOT){
  await browser.evaluate("for(const rail of document.querySelectorAll('.left-rail,.right-rail'))rail.scrollTop=0;document.querySelector('.contents-panel details').open=true");
  await browser.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const screenshot=await browser.send('Page.captureScreenshot',{format:'png'});
  await mkdir(resolve('../outputs'),{recursive:true});
  await writeFile(resolve('../outputs/wiki-rules-and-rails.png'),Buffer.from(screenshot.data,'base64'));
 }
 assert.deepEqual(browser.errors,[]);
 console.log('Wiki columns retain natural card heights and scroll together at desktop/short viewports');
} finally {await browser.dispose();}
