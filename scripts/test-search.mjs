import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const sourcePath=new URL('../docs/wiki-search.js',import.meta.url);
const context={module:{exports:{}}};
if(existsSync(sourcePath)) runInNewContext(readFileSync(sourcePath,'utf8'),context);
const search=(...args)=>context.module.exports.search?.(...args)??[];
const records=[
  {page:'rules.html',id:'connections',variants:{'zh-Hant':{title:'遊戲規則',heading:'白色連通、封閉與 DEAD',text:'白色區域朝棋盤外緣延伸，會標示 DEAD。'},en:{title:'Game rules',heading:'Connections, closure & DEAD',text:'A white region reaching the board edge becomes DEAD.'}}},
  {page:'rules.html',id:'scoring',variants:{'zh-Hant':{title:'遊戲規則',heading:'封閉計分表',text:'不同棋子格數決定分數。'},en:{title:'Game rules',heading:'Closure scoring',text:'Scores count distinct tile spaces.'}}},
  {page:'modes.html',id:'features',variants:{'zh-Hant':{title:'模式與競技',heading:'其他功能',text:'可以觀戰、重播，並檢視對局的計分。'},en:{title:'Modes & ranked',heading:'Other features',text:'Spectating and replays show closure scoring during a match.'}}},
];

test('English keywords find the Chinese section and localized destination',()=>{
  const result=search(records,'BOARD EDGE','zh-Hant');
  assert.equal(result[0]?.href,'rules.html?lang=zh-Hant#connections');
  assert.equal(result[0]?.heading,'白色連通、封閉與 DEAD');
});
test('Chinese keywords find the English counterpart',()=>{
  const result=search(records,'不同棋子','en');
  assert.equal(result[0]?.href,'rules.html?lang=en#scoring');
  assert.equal(result[0]?.heading,'Closure scoring');
});
test('mixed-language queries require every term within the same section',()=>{
  const result=search(records,'  白色　DEAD  ','zh-Hant');
  assert.equal(result.length,1);
  assert.equal(result[0]?.id,'connections');
  assert.equal(search(records,'DEAD 重播','zh-Hant').length,0);
});
test('a heading match ranks ahead of a passing mention in body text',()=>{
  const result=search([...records].reverse(),'closure scoring','en');
  assert.equal(result[0]?.id,'scoring');
});
test('empty and nonmatching literal input produce no results',()=>{
  for(const query of ['', '   ', '[.*]', '<script>alert(1)</script>', 'unknown-word']) {
    assert.equal(search(records,query,'en').length,0,query);
  }
});
test('full-width English input is normalized',()=>{
  assert.equal(search(records,'ＤＥＡＤ','en')[0]?.id,'connections');
});

test('the real wiki index searches both languages across articles',()=>{
  const browser={window:{}};
  runInNewContext(readFileSync(new URL('../docs/wiki-search-index.js',import.meta.url),'utf8'),browser);
  const actual=browser.window.MFMWikiSearchIndex;
  for(const [query,language,want] of [
    ['封閉計分表','en','rules.html?lang=en#scoring'],
    ['closure scoring','zh-Hant','rules.html?lang=zh-Hant#scoring'],
    ['觀戰','en','modes.html?lang=en#features'],
    ['Color Lab','zh-Hant','modes.html?lang=zh-Hant#features'],
  ]) {
    assert.ok(search(actual,query,language).some(result=>result.href===want),query);
  }
  assert.match(search(actual,'closure scoring','zh-Hant')[0].snippet,/Closure scoring/);
});
