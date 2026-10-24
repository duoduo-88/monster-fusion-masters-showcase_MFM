/* Keep the static HTML fallback; enhance this wiki's bilingual article URLs. */
(() => {
  "use strict";
  const article = document.querySelector(".page");
  const contents = document.querySelector(".contents-panel");
  if (!article || !contents || !window.fetch || !window.AbortController) return;
  const root = new URL(".", document.currentScript.src);
  const pages = new Set(["index.html", "rules.html", "modes.html", "requirements.html", "history.html", "about.html"]
    .flatMap(name => [new URL(name, root).pathname, new URL(`en/${name}`, root).pathname]));
  pages.add(root.pathname);
  pages.add(new URL("en/", root).pathname);
  const isWiki = url => url.origin === location.origin && pages.has(url.pathname);
  const pagePath = url => url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new Map();
  let renderedURL = new URL(location.href);
  let pending = null;

  // Animate the real border box, so neighbouring panels move with it and text
  // keeps its pixel size. An interrupted resize starts at its current height.
  function resizePanel(panel, update) {
    const before = panel.getBoundingClientRect().height;
    const previous = animations.get(panel);
    if (previous) { previous.onfinish = null; previous.cancel(); animations.delete(panel); }
    panel.removeAttribute("data-wiki-resizing");
    update();
    const after = panel.getBoundingClientRect().height;
    if (reduced.matches || !panel.animate || Math.abs(before - after) < 1) return;
    panel.setAttribute("data-wiki-resizing", "");
    const animation = panel.animate([{height:`${before}px`}, {height:`${after}px`}], {
      duration:240, easing:"cubic-bezier(0.16, 1, 0.3, 1)", fill:"both"
    });
    animations.set(panel, animation);
    animation.onfinish = () => {
      animations.delete(panel);
      panel.removeAttribute("data-wiki-resizing");
      animation.cancel();
    };
  }
  reduced.addEventListener("change", () => {
    if (!reduced.matches) return;
    for (const [panel, animation] of animations) {
      animation.onfinish = null;
      animation.cancel();
      panel.removeAttribute("data-wiki-resizing");
    }
    animations.clear();
  });

  const savePosition = () => {
    if (location.href !== renderedURL.href) return;
    history.replaceState({...history.state, wikiPosition:{article:article.scrollTop, x:scrollX, y:scrollY}}, "");
  };
  history.scrollRestoration = "manual";
  article.addEventListener("scroll", savePosition, {passive:true});
  window.addEventListener("scroll", savePosition, {passive:true});
  savePosition();

  function place(url, position) {
    if (position) {
      article.scrollTop = position.article;
      window.scrollTo(position.x, position.y);
    } else {
      article.scrollTop = 0;
      let target;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { /* Bad fragment. */ }
      if (target) target.scrollIntoView({block:"start", behavior:"instant"});
      else window.scrollTo({top:0, behavior:"instant"});
    }
    window.dispatchEvent(new Event("hashchange"));
    window.dispatchEvent(new Event("wiki:content-resize"));
  }

  function prepare(html, url) {
    const next = new DOMParser().parseFromString(html, "text/html");
    if (!next.querySelector(".page") || !next.querySelector(".contents-panel")) throw Error("Not a wiki article");
    // Imported fragments must retain the fetched page's base path when moving
    // between Chinese and /en/, including gallery clips and animated badges.
    for (const element of next.querySelectorAll("[href], [src], [data-animation], [data-still], [data-demo-src], [data-demo-still]")) {
      for (const attr of ["href", "src", "data-animation", "data-still", "data-demo-src", "data-demo-still"]) {
        const value = element.getAttribute(attr);
        if (value && !value.startsWith("#")) element.setAttribute(attr, new URL(value, url).href);
      }
    }
    return next;
  }

  function commit(next) {
    const localeChanged = next.documentElement.lang !== document.documentElement.lang;
    const launchChanged = localeChanged || !!document.querySelector("[data-mfm-launch]") !== !!next.querySelector("[data-mfm-launch]");
    const replaceContent = selector => document.querySelector(selector).replaceChildren(...next.querySelector(selector).childNodes);
    article.replaceChildren(...next.querySelector(".page").childNodes);
    const open = contents.querySelector("details").open;
    resizePanel(contents, () => {
      contents.replaceChildren(...next.querySelector(".contents-panel").childNodes);
      contents.querySelector("details").open = open;
      contents.setAttribute("aria-label", next.querySelector(".contents-panel").getAttribute("aria-label"));
    });
    if (localeChanged) {
      replaceContent(".site-head");
      replaceContent(".left-rail");
      replaceContent(".wiki-contribution");
      document.querySelector(".wiki-contribution").setAttribute("aria-label", next.querySelector(".wiki-contribution").getAttribute("aria-label"));
      replaceContent(".site-footer");
      document.querySelector(".skip-link").textContent = next.querySelector(".skip-link").textContent;
    } else {
      const selected = next.querySelector('.site-nav a[aria-current="page"]')?.href;
      for (const link of document.querySelectorAll(".site-nav a")) {
        if (link.href === selected) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
      if (launchChanged) document.querySelector(".rail-note").replaceWith(next.querySelector(".rail-note"));
      for (const link of document.querySelectorAll("a[data-language]")) {
        link.href = next.querySelector(`a[data-language="${link.dataset.language}"]`).href;
      }
    }
    if (launchChanged) {
      document.querySelector("#mfm-launch-dialog")?.remove();
      const dialog = next.querySelector("#mfm-launch-dialog");
      if (dialog) document.body.append(dialog);
    }
    document.documentElement.lang = next.documentElement.lang;
    document.title = next.title;
    for (const selector of ['meta[name="description"]', 'link[rel="canonical"]', 'link[hreflang="zh-Hant"]', 'link[hreflang="en"]']) {
      const source = next.querySelector(selector);
      const target = document.querySelector(selector);
      if (source && target) target.replaceWith(source);
    }
    try { localStorage.setItem("mfm:wiki:language", next.documentElement.lang); } catch { /* Optional. */ }
    document.dispatchEvent(new CustomEvent("wiki:navigated", {detail:{localeChanged, launchChanged}}));
  }

  async function navigate(href, {pop = false, position = null} = {}) {
    const url = new URL(href, location.href);
    if (!isWiki(url)) { location.assign(url.href); return; }
    pending?.abort();
    const request = new AbortController();
    pending = request;
    const samePage = pagePath(url) === pagePath(renderedURL);
    if (!pop) savePosition();
    try {
      let next;
      if (!samePage) {
        article.setAttribute("aria-busy", "true");
        const response = await fetch(url, {signal:request.signal});
        if (!response.ok) throw Error(`Wiki HTTP ${response.status}`);
        next = prepare(await response.text(), url);
      }
      if (request.signal.aborted) return;
      if (!pop && url.href !== location.href) history.pushState({}, "", url.href);
      renderedURL = url;
      if (next) commit(next);
      place(url, position);
      if (next && !pop) article.focus({preventScroll:true});
      savePosition();
    } catch (error) {
      if (!request.signal.aborted) location.assign(url.href);
    } finally {
      if (pending === request) { pending = null; article.removeAttribute("aria-busy"); }
    }
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const summary = event.target.closest(".contents-panel summary");
    if (summary) {
      event.preventDefault();
      resizePanel(contents, () => { summary.parentElement.open = !summary.parentElement.open; });
      return;
    }
    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href);
    if (!isWiki(url)) return;
    event.preventDefault();
    navigate(url.href);
  });
  window.addEventListener("popstate", event => navigate(location.href, {pop:true, position:event.state?.wikiPosition}));
  window.MFMWikiNavigation = {navigate, resizePanel};
})();
