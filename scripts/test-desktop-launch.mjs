import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

const script = readFileSync(new URL('../docs/wiki.js', import.meta.url), 'utf8');
const setup = script.match(/  function setupDesktopLaunch\(\) \{[\s\S]*?\n  \}/)?.[0];
assert.ok(setup, 'Wiki must own desktop launch enhancement');

function runtime({platform = 'Windows', reduced = false, denied = false} = {}) {
  const listeners = new Map(), requests = [], animations = [];
  const element = () => ({addEventListener(type, cb, options) {
    listeners.set(this.id + ':' + type, {cb, options});
  }, focus() { this.focused = true; }, hidden: false});
  const trigger = {...element(), id:'trigger'};
  const retry = {...element(), id:'retry'};
  const close = {...element(), id:'close'};
  const dialog = {...element(), id:'dialog', open:false, dataset:{},
    showModal() {this.open = true;}, close() {this.open = false;},
    animate(frames, options) {
      const animation = {frames, options, cancel() {this.cancelled = true;}};
      animations.push(animation); return animation;
    },
    querySelector(selector) { return selector.includes('retry') ? retry : close; }
  };
  const document = {querySelector: selector => selector === '[data-mfm-launch]' ? trigger : dialog};
  const window = {matchMedia: () => ({matches:reduced}), location: {assign(uri) {
    requests.push(uri); if (denied) throw new Error('denied');
  }}};
  runInNewContext(`${setup}; setupDesktopLaunch();`, {
    document, window, navigator:{userAgentData:{platform}, platform}, AbortController
  });
  const click = (target) => {
    const event = {button:0, preventDefault() {this.defaultPrevented = true;}};
    listeners.get(target.id + ':click')?.cb(event); return event;
  };
  return {dialog, trigger, retry, close, click, requests, animations, listeners};
}

test('Windows launch is synchronous, one modal, and never assumes success or failure', () => {
  const r = runtime();
  assert.equal(r.click(r.trigger).defaultPrevented, true);
  assert.deepEqual(r.requests, ['mfmdesktop://launch']);
  assert.equal(r.dialog.open, true);
  r.click(r.trigger);
  assert.equal(r.requests.length, 1);
  assert.equal(r.animations[0].options.duration, 260);
  assert.match(r.animations[0].frames[1].clipPath, /49.5% 0/);
});
test('retry is an explicit action and denial leaves browser/download choices available', () => {
  const r = runtime({denied:true});
  r.click(r.trigger); r.click(r.retry);
  assert.equal(r.requests.length, 2);
  assert.equal(r.dialog.open, true);
});
test('non-Windows keeps the original working browser link', () => {
  for (const platform of ['macOS', 'Linux', 'Android', 'iPhone', '']) {
    const r = runtime({platform});
    assert.equal(r.click(r.trigger).defaultPrevented, undefined);
    assert.equal(r.requests.length, 0);
  }
});
test('close reverses animation, cancels old state, returns focus and releases session handlers', () => {
  const r = runtime(); r.click(r.trigger); r.click(r.close);
  assert.equal(r.animations[0].cancelled, true);
  const exit = r.animations.at(-1);
  assert.equal(exit.options.duration, 180);
  assert.equal(r.dialog.open, true);
  exit.onfinish();
  assert.equal(r.dialog.open, false);
  assert.equal(r.trigger.focused, true);
  assert.equal(r.listeners.get('retry:click').options.signal.aborted, true);
  assert.equal(exit.cancelled, true);
});
test('Escape and reduced motion close immediately without animation', () => {
  const r = runtime({reduced:true}); r.click(r.trigger);
  let prevented = false;
  r.listeners.get('dialog:cancel').cb({preventDefault() {prevented = true;}});
  assert.equal(prevented, true);
  assert.equal(r.animations.length, 0);
  assert.equal(r.dialog.open, false);
});
test('both static home pages retain browser fallback, release download, labels and canonical assets', () => {
  for (const path of ['../docs/index.html', '../docs/en/index.html']) {
    const html = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(html, /data-mfm-launch[^>]*href="https:\/\/mfm\.monster-fusion-masters-online\.workers\.dev\/"/);
    assert.match(html, /<dialog[^>]*aria-labelledby="mfm-launch-title"[^>]*aria-describedby="mfm-launch-copy"/);
    assert.match(html, /releases\/latest/);
    assert.match(html, /data-mfm-launch-retry/);
  }
  assert.doesNotMatch(setup, /setTimeout|setInterval|requestAnimationFrame|visibilitychange|\bblur\b/);
});
