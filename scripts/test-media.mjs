import {existsSync,readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const path=new URL('../docs/wiki-media.js',import.meta.url);
const source=existsSync(path)?readFileSync(path,'utf8'):'';
function fixture({reduced=false,saved=null}={}){
  const control=dataset=>({dataset,hidden:true,textContent:'',attributes:{},handlers:{},activate(){this.handlers.click?.();},addEventListener(k,fn){this.handlers[k]=fn;},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}});
  const image={src:'connect.webp',dataset:{animation:'connect.gif',still:'connect.webp'},alt:'Connect'};
  const rank={src:'master.webp',dataset:{animation:'master.gif',still:'master.webp'},alt:'Master'};
  const clips=[control({demoSrc:'connect.gif',demoStill:'connect.webp',demoCaption:'Connect white edges'}),control({demoSrc:'close.gif',demoStill:'close.webp',demoCaption:'Close the region'})];
  const caption={textContent:'Connect white edges'};
  const gallery={querySelector:s=>s==='img'?image:caption,querySelectorAll:()=>clips};
  const store=new Map(saved?[['mfm:wiki:motion',saved]]:[]);
  const query={matches:reduced,addEventListener(){}};
  const document={hidden:false,querySelectorAll:s=>s==='img[data-animation]'?[image,rank]:s==='[data-demo-gallery]'?[gallery]:[],addEventListener(){}};
  runInNewContext(source,{document,window:{matchMedia:()=>query},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});
  return {image,rank,clips,caption,store};
}
test('normal motion plays both in-game clips and rank badges',()=>{const p=fixture();assert.equal(p.image.src,'connect.gif');assert.equal(p.rank.src,'master.gif');});
test('reduced motion keeps static game and badge images',()=>{const p=fixture({reduced:true});assert.equal(p.image.src,'connect.webp');assert.equal(p.rank.src,'master.webp');});
test('an obsolete paused preference cannot leave animations stuck without a play button',()=>{const p=fixture({saved:'paused'});assert.equal(p.image.src,'connect.gif');assert.equal(p.rank.src,'master.gif');});
test('changing the example with reduced motion keeps it still and updates its caption',()=>{const p=fixture({reduced:true});p.clips[1].activate();assert.equal(p.image.src,'close.webp');assert.equal(p.caption.textContent,'Close the region');assert.equal(p.clips[1].attributes['aria-pressed'],'true');});
test('changing the example plays the selected clip and leaves rank animation running',()=>{const p=fixture();p.clips[1].activate();assert.equal(p.image.src,'close.gif');assert.equal(p.rank.src,'master.gif');});
