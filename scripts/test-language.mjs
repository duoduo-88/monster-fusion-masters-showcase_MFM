import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const script = readFileSync(new URL('../docs/wiki.js', import.meta.url), 'utf8');
// A small browser boundary for running the actual enhancement script in Node.
function page({ language = 'zh-Hant', saved, search = '', hash = '', blocked = false, desktop = false, scrollHost = false, browserLanguages = ['zh-TW'], browserLanguage = 'zh-TW' } = {}) {
  const base = 'https://example.test/project/';
  const location = new URL(`${base}${language === 'en' ? 'en/' : ''}rules.html${search}${hash}`);
  let redirect;
  location.replace = url => { redirect = url; };
  const links = ['zh-Hant', 'en'].map(lang => ({
    dataset: { language: lang },
    href: `${base}${lang === 'en' ? 'en/' : ''}rules.html?lang=${lang}`,
    events: {},
    addEventListener(name, handler) { this.events[name] = handler; }
  }));
  const toc = ['overview', 'board', 'scoring'].map(id => ({
    hash: `#${id}`, setAttribute() {}, removeAttribute() {}, addEventListener() {}
  }));
  let notifyIntersection;
  let observerRoot;
  const article = { nodeName: 'MAIN' };
  const rail = {
    clientHeight: 200, scrollHeight: 600, scrollTop: 0,
    variables: new Map(), events: {}, attributes: new Set(), classes: new Set(),
    style: {
      setProperty(name, value) { rail.variables.set(name, value); }
    },
    classList: { add(name) { rail.classes.add(name); } },
    addEventListener(name, callback) { rail.events[name] = callback; },
    setAttribute(name) { rail.attributes.add(name); },
    removeAttribute(name) { rail.attributes.delete(name); },
    toggleAttribute(name, present) {
      if (present) rail.attributes.add(name);
      else rail.attributes.delete(name);
    },
    getBoundingClientRect() { return { top: 0, bottom: 200, right: 400 }; },
    setPointerCapture(id) { this.capturedPointer = id; },
    releasePointerCapture(id) { this.releasedPointer = id; }
  };
  const desktopMedia = { matches: desktop, addEventListener(event, listener) { if (event === 'change') this.onChange = listener; } };
  const storage = new Map(saved ? [['mfm:wiki:language', saved]] : []);
  const document = {
    documentElement: { lang: language },
    querySelectorAll(selector) {
      if (selector === 'a[data-language]') return links;
      if (selector === '.page') return scrollHost ? [rail] : [];
      return toc;
    },
    querySelector(selector) { return selector === '.page' ? article : { open: true }; },
    getElementById(id) { return { id }; }
  };
  const window = {
    matchMedia: query => query === '(min-width: 761px)' ? desktopMedia : { matches: false },
    addEventListener() {},
    IntersectionObserver: true
  };
  runInNewContext(script, {
    document, window, location, URL, URLSearchParams,
    navigator: { languages: browserLanguages, language: browserLanguage },
    requestAnimationFrame: callback => callback(),
    localStorage: {
      getItem(key) { if (blocked) throw Error('Storage disabled'); return storage.get(key); },
      setItem(key, value) { if (blocked) throw Error('Storage disabled'); storage.set(key, value); }
    },
    IntersectionObserver: class {
      constructor(callback, options) { notifyIntersection = callback; observerRoot = options.root; }
      observe() {}
      disconnect() {}
    }
  });
  return {
    redirect: () => redirect, links, storage,
    scrollTo(id) { notifyIntersection([{ target: { id }, isIntersecting: true }]); },
    observerRoot: () => observerRoot,
    article, rail,
    resizeToMobile() { desktopMedia.matches = false; desktopMedia.onChange(); }
  };
}

test('a first English-browser visit opens the matching article and remembers the choice', () => {
  const actual = page({ browserLanguages: ['en-US'], search: '?ref=home', hash: '#scoring' });
  assert.equal(actual.redirect(), 'https://example.test/project/en/rules.html?ref=home&lang=en#scoring');
  assert.equal(actual.storage.get('mfm:wiki:language'), 'en');
});

test('Chinese browser variants choose Traditional Chinese, including from an English article', () => {
  for (const tag of ['zh', 'zh-TW', 'zh-HK', 'zh-Hant', 'zh-CN', 'zh-Hans-CN', 'ZH_tw']) {
    const actual = page({ language: 'en', browserLanguages: [tag], hash: '#board' });
    assert.equal(actual.redirect(), 'https://example.test/project/rules.html?lang=zh-Hant#board', tag);
    assert.equal(actual.storage.get('mfm:wiki:language'), 'zh-Hant');
  }
});

test('browser preference order wins among supported languages and others fall back to English', () => {
  for (const [languages, expected] of [
    [['en-US', 'zh-TW'], 'en'],
    [['zh-HK', 'en-US'], 'zh-Hant'],
    [['ja-JP', 'zh-TW', 'en'], 'zh-Hant'],
    [['fr-FR', 'ja-JP'], 'en'],
  ]) {
    const actual = page({ browserLanguages: languages });
    assert.equal(actual.storage.get('mfm:wiki:language'), expected);
    assert.equal(actual.redirect(), expected === 'en' ? 'https://example.test/project/en/rules.html?lang=en' : undefined);
  }
});

test('navigator.language is used when the browser preference list is unavailable or empty', () => {
  for (const browserLanguages of [null, []]) {
    const actual = page({ browserLanguages, browserLanguage: 'en-GB' });
    assert.equal(actual.redirect(), 'https://example.test/project/en/rules.html?lang=en');
  }
});

test('an invalid saved language is replaced by the browser choice', () => {
  const actual = page({ saved: 'fr', browserLanguages: ['en-US'] });
  assert.equal(actual.redirect(), 'https://example.test/project/en/rules.html?lang=en');
  assert.equal(actual.storage.get('mfm:wiki:language'), 'en');
});

test('explicit URLs and remembered manual selections override browser preferences', () => {
  const explicit = page({ search: '?lang=en', browserLanguages: ['zh-TW'] });
  assert.equal(explicit.redirect(), 'https://example.test/project/en/rules.html?lang=en');
  const remembered = page({ saved: 'zh-Hant', browserLanguages: ['en-US'] });
  assert.equal(remembered.redirect(), undefined);
  assert.equal(remembered.storage.get('mfm:wiki:language'), 'zh-Hant');
});

test('browser choice still redirects once when storage is blocked, then the explicit destination wins', () => {
  const first = page({ blocked: true, browserLanguages: ['en-US'], hash: '#board' });
  assert.equal(first.redirect(), 'https://example.test/project/en/rules.html?lang=en#board');
  const destination = page({ blocked: true, language: 'en', search: '?lang=en', browserLanguages: ['zh-TW'] });
  assert.equal(destination.redirect(), undefined);
});

test('remembered English preserves the project path, article, query and section', () => {
  const actual = page({ saved: 'en', search: '?ref=home', hash: '#scoring' });
  assert.equal(actual.redirect(), 'https://example.test/project/en/rules.html?ref=home&lang=en#scoring');
});

test('an explicit English link wins over a previously saved Chinese preference', () => {
  const actual = page({ language: 'en', saved: 'zh-Hant', search: '?lang=en' });
  assert.equal(actual.redirect(), undefined);
  assert.equal(actual.storage.get('mfm:wiki:language'), 'en');
});

test('scrolling to scoring updates language destinations even with an old board fragment', () => {
  const actual = page({ hash: '#board' });
  actual.scrollTo('scoring');
  assert.equal(actual.links[1].href, 'https://example.test/project/en/rules.html?lang=en#scoring');
});

test('switching to Chinese overrides the saved English preference', () => {
  const actual = page({ language: 'en', saved: 'en' });
  actual.links[0].events.click({});
  assert.equal(actual.storage.get('mfm:wiki:language'), 'zh-Hant');
});

test('language destinations still work when browser storage is unavailable', () => {
  const actual = page({ blocked: true, hash: '#scoring' });
  assert.equal(actual.redirect(), undefined);
  assert.doesNotThrow(() => actual.links[1].events.click({}));
  assert.equal(actual.links[1].href, 'https://example.test/project/en/rules.html?lang=en#scoring');
});

test('section tracking observes the inner article on desktop and viewport on mobile', () => {
  const desktopPage = page({ desktop: true });
  assert.equal(desktopPage.observerRoot(), desktopPage.article);
  desktopPage.resizeToMobile();
  assert.equal(desktopPage.observerRoot(), null);
  const mobilePage = page();
  assert.equal(mobilePage.observerRoot(), null);
});

test('the desktop pixel rail renders a persistent thumb and supports pointer dragging', () => {
  const actual = page({ desktop: true, scrollHost: true });
  const rail = actual.rail;
  assert.ok(rail.classes.has('wiki-scroll-rail'));
  const height = Number.parseFloat(rail.variables.get('--wiki-scroll-thumb-h'));
  assert.ok(height >= 28 && height < rail.clientHeight);
  assert.equal(rail.variables.get('--wiki-scroll-thumb-y'), '2px');
  const makeEvent = (clientY, clientX = 396) => ({
    pointerId: 4, pointerType: 'mouse', button: 0,
    clientX, clientY, preventDefault() {}
  });
  rail.events.pointerdown(makeEvent(15, 180));
  assert.equal(rail.capturedPointer, undefined, 'content area must not start scrollbar drag');
  rail.events.pointerdown(makeEvent(15));
  assert.equal(rail.capturedPointer, 4);
  assert.ok(rail.attributes.has('data-wiki-scroll-dragging'));
  rail.events.pointermove(makeEvent(125));
  assert.ok(rail.scrollTop > 0, 'dragging the thumb should scroll its own panel');
  rail.events.pointerup(makeEvent(125));
  assert.equal(rail.releasedPointer, 4);
  assert.ok(!rail.attributes.has('data-wiki-scroll-dragging'));
});

test('mobile keeps native touch/document scrolling rather than hijacking the rail', () => {
  const actual = page({ desktop: false, scrollHost: true });
  const rail = actual.rail;
  assert.equal(rail.variables.has('--wiki-scroll-thumb-h'), false);
  rail.events.pointerdown({
    pointerId: 1, pointerType: 'mouse', button: 0,
    clientX: 396, clientY: 15, preventDefault() { throw Error('should not intercept'); }
  });
  assert.equal(rail.capturedPointer, undefined);
});
