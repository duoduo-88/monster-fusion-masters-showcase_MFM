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
  const pause=control({pauseLabel:'Pause motion',playLabel:'Play motion'});
  const clips=[control({demoSrc:'connect.gif',demoStill:'connect.webp',demoCaption:'Connect white edges'}),control({demoSrc:'close.gif',demoStill:'close.webp',demoCaption:'Close the region'})];
  const caption={textContent:'Connect white edges'};
  const gallery={querySelector:s=>s==='img'?image:caption,querySelectorAll:()=>clips};
  const store=new Map(saved?[['mfm:wiki:motion',saved]]:[]);
  const query={matches:reduced,addEventListener(){}};
  const document={hidden:false,querySelectorAll:s=>s==='img[data-animation]'?[image,rank]:s==='[data-motion-toggle]'?[pause]:s==='[data-demo-gallery]'?[gallery]:[],addEventListener(){}};
  runInNewContext(source,{document,window:{matchMedia:()=>query},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});
  return {image,rank,pause,clips,caption,store};
}
test('normal motion plays both in-game clips and rank badges',()=>{const p=fixture();assert.equal(p.image.src,'connect.gif');assert.equal(p.rank.src,'master.gif');assert.equal(p.pause.hidden,false);});
test('reduced motion keeps static game and badge images',()=>{const p=fixture({reduced:true});assert.equal(p.image.src,'connect.webp');assert.equal(p.rank.src,'master.webp');});
test('pausing stops every animation and remembers the choice',()=>{const p=fixture();p.pause.activate();assert.equal(p.image.src,'connect.webp');assert.equal(p.rank.src,'master.webp');assert.equal(p.store.get('mfm:wiki:motion'),'paused');});
test('changing the example while paused keeps it still and updates its caption',()=>{const p=fixture({saved:'paused'});p.clips[1].activate();assert.equal(p.image.src,'close.webp');assert.equal(p.caption.textContent,'Close the region');assert.equal(p.clips[1].attributes['aria-pressed'],'true');});
test('resuming uses the newly selected clip',()=>{const p=fixture({saved:'paused'});p.clips[1].activate();p.pause.activate();assert.equal(p.image.src,'close.gif');assert.equal(p.rank.src,'master.gif');});
