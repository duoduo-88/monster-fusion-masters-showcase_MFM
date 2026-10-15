import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const script = readFileSync(new URL('../docs/wiki.js', import.meta.url), 'utf8');
// A small browser boundary for running the actual enhancement script in Node.
function page({ language = 'zh-Hant', saved, search = '', hash = '', blocked = false, desktop = false } = {}) {
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
  const desktopMedia = { matches: desktop, addEventListener(event, listener) { if (event === 'change') this.onChange = listener; } };
  const storage = new Map(saved ? [['mfm:wiki:language', saved]] : []);
  const document = {
    documentElement: { lang: language },
    querySelectorAll(selector) { return selector === 'a[data-language]' ? links : toc; },
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
    article,
    resizeToMobile() { desktopMedia.matches = false; desktopMedia.onChange(); }
  };
}

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
