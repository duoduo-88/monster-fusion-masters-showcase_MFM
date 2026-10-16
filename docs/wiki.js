/* Progressive enhancement: the complete bilingual articles also work without JS. */
(() => {
  "use strict";
  const storageKey = "mfm:wiki:language";
  const currentLanguage = document.documentElement.lang;
  const languageLinks = [...document.querySelectorAll("a[data-language]")];
  let visibleSection = location.hash.slice(1);

  // Static counterpart links also support GitHub Pages project subpaths.
  const destination = link => {
    const url = new URL(link.href);
    url.search = location.search;
    url.searchParams.set("lang", link.dataset.language);
    url.hash = visibleSection ? `#${visibleSection}` : location.hash;
    return url;
  };
  let savedLanguage = null;
  try { savedLanguage = localStorage.getItem(storageKey); } catch { /* Storage can be disabled. */ }
  // Explicit language links, including new-tab clicks, override stored preferences.
  const requestedLanguage = new URL(location.href).searchParams.get("lang");
  if (languageLinks.some(link => link.dataset.language === requestedLanguage)) {
    savedLanguage = requestedLanguage;
    try { localStorage.setItem(storageKey, requestedLanguage); } catch { /* Optional preference. */ }
  }
  const preferredLink = languageLinks.find(link => link.dataset.language === savedLanguage);
  if (preferredLink && savedLanguage !== currentLanguage) {
    location.replace(destination(preferredLink).href);
    return;
  }
  const refreshLanguageLinks = () => {
    for (const link of languageLinks) link.href = destination(link).href;
  };
  refreshLanguageLinks();
  setupDesktopLaunch();
  for (const link of languageLinks) {
    link.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      try { localStorage.setItem(storageKey, link.dataset.language); } catch { /* Links still work. */ }
    });
  }
  // Desktop launch is owned here; the static href always remains the browser fallback.
  function setupDesktopLaunch() {
    const trigger = document.querySelector("[data-mfm-launch]");
    const dialog = document.querySelector("#mfm-launch-dialog");
    if (!trigger || typeof dialog?.showModal !== "function") return;
    const platform = navigator.userAgentData?.platform || navigator.platform || "";
    if (!/^(Windows|Win32|Win64|WinCE)$/i.test(platform)) return;
    let animation = null;
    let session = null;
    let closing = false;
    const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const center = "inset(49.5% 50% 49.5% 50%)";
    const line = "inset(49.5% 0 49.5% 0)";
    const open = "inset(0 0 0 0)";
    const frame = (clipPath, offset, vertical, horizontal) => ({
      clipPath, offset,
      "--launch-frame-y":`${dialog.offsetHeight * vertical}px`,
      "--launch-frame-x":`${dialog.offsetWidth * horizontal}px`
    });
    const stopAnimation = () => {
      if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
      delete dialog.dataset.animating;
    };
    const finishClose = () => {
      stopAnimation();
      session?.abort();
      session = null;
      dialog.close();
      closing = false;
      trigger.focus({ preventScroll: true });
    };
    const close = () => {
      if (closing || !dialog.open) return;
      closing = true;
      stopAnimation();
      if (reducedMotion() || typeof dialog.animate !== "function") { finishClose(); return; }
      dialog.dataset.animating = "";
      animation = dialog.animate([
        frame(open,0,0,0), frame(line,0.72,0.495,0), frame(center,1,0.495,0.5)
      ], {duration:180, easing:"cubic-bezier(0.4, 0, 0.6, 1)", fill:"both"});
      animation.onfinish = finishClose;
    };
    const launch = () => {
      // This stays synchronous inside a real click. A native prompt or exception
      // supplies no reliable evidence of installation, permission or launch outcome.
      try { window.location.assign("mfmdesktop://launch"); } catch { /* Choices stay available. */ }
    };
    trigger.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (dialog.open) { event.preventDefault(); return; }
      dialog.showModal();
      event.preventDefault();
      session = new AbortController();
      const options = {signal:session.signal};
      dialog.querySelector("[data-mfm-launch-retry]").addEventListener("click", launch, options);
      dialog.querySelector("[data-mfm-launch-close]").addEventListener("click", close, options);
      dialog.addEventListener("cancel", event => { event.preventDefault(); close(); }, options);
      dialog.addEventListener("keydown", event => {
        if (event.key !== "Tab") return;
        const actions = [...dialog.querySelectorAll("a[href], button:not(:disabled)")];
        const first = actions[0], last = actions.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }, options);
      // Native dialog owns the top layer and inert background; Tab wraps the actions.
      if (!reducedMotion() && typeof dialog.animate === "function") {
        dialog.dataset.animating = "";
        animation = dialog.animate([
          frame(center,0,0.495,0.5), frame(line,0.36,0.495,0), frame(open,1,0,0)
        ], {duration:260, easing:"cubic-bezier(0.16, 1, 0.3, 1)", fill:"both"});
        animation.onfinish = stopAnimation;
      }
      launch();
    });
  }
  // Mirrors the game's app-drawn persistent rail without importing its runtime.
  // Desktop-only styling preserves a normal document scrollbar on touch/mobile.
  const desktopRail = window.matchMedia("(min-width: 761px)");
  const scrollHosts = [...document.querySelectorAll(".page")];
  const pendingFrames = new WeakSet();
  const dimensions = element => {
    const height = Math.max(0, element.clientHeight);
    const scrollHeight = Math.max(height, element.scrollHeight);
    const inner = Math.max(0, height - 4);
    const maxScroll = Math.max(0, scrollHeight - height);
    const thumb = inner <= 0 ? 0 : maxScroll > 1
      ? Math.min(inner, Math.max(28, inner * height / scrollHeight))
      : inner;
    const travel = Math.max(0, inner - thumb);
    const y = 2 + (maxScroll ? travel * Math.max(0, Math.min(1, element.scrollTop / maxScroll)) : 0);
    return { thumb, travel, maxScroll, y };
  };
  const updateRail = element => {
    if (!desktopRail.matches) return;
    const { thumb, y } = dimensions(element);
    element.style.setProperty("--wiki-scroll-thumb-h", `${thumb}px`);
    element.style.setProperty("--wiki-scroll-thumb-y", `${y}px`);
  };
  const scheduleRail = element => {
    if (!desktopRail.matches || pendingFrames.has(element)) return;
    pendingFrames.add(element);
    requestAnimationFrame(() => {
      pendingFrames.delete(element);
      updateRail(element);
    });
  };
  const railResizeObserver = "ResizeObserver" in window
    ? new ResizeObserver(entries => {
      for (const entry of entries) scheduleRail(entry.target);
    }) : null;
  for (const element of scrollHosts) {
    element.classList.add("wiki-scroll-rail");
    let dragPointer = null;
    let dragOffset = 0;
    const moveThumb = clientY => {
      const rect = element.getBoundingClientRect();
      const { thumb, travel, maxScroll } = dimensions(element);
      if (!travel || !maxScroll) return;
      const position = Math.max(0, Math.min(travel, clientY - rect.top - 2 - dragOffset));
      element.scrollTop = maxScroll * position / travel;
      updateRail(element);
    };
    element.addEventListener("scroll", () => scheduleRail(element), { passive: true });
    element.addEventListener("pointerdown", event => {
      if (!desktopRail.matches || event.button !== 0 || (event.pointerType && event.pointerType !== "mouse")) return;
      const rect = element.getBoundingClientRect();
      if (event.clientX < rect.right - 16 || event.clientX > rect.right) return;
      const { thumb, y } = dimensions(element);
      if (event.clientY < rect.top || event.clientY > rect.bottom) return;
      const localY = event.clientY - rect.top;
      dragOffset = localY >= y && localY <= y + thumb ? localY - y : thumb / 2;
      dragPointer = event.pointerId;
      element.setAttribute("data-wiki-scroll-dragging", "");
      element.removeAttribute("data-wiki-scroll-hover");
      element.setPointerCapture?.(event.pointerId);
      moveThumb(event.clientY);
      event.preventDefault();
    });
    element.addEventListener("pointermove", event => {
      if (event.pointerId === dragPointer) {
        moveThumb(event.clientY);
        event.preventDefault();
        return;
      }
      if (!desktopRail.matches) return;
      const rect = element.getBoundingClientRect();
      const { thumb, y } = dimensions(element);
      const localY = event.clientY - rect.top;
      element.toggleAttribute("data-wiki-scroll-hover",
        event.clientX >= rect.right - 16 && event.clientX <= rect.right &&
        localY >= y && localY <= y + thumb);
    });
    element.addEventListener("pointerleave", () => {
      if (dragPointer === null) element.removeAttribute("data-wiki-scroll-hover");
    });
    const stopDrag = event => {
      if (event.pointerId !== dragPointer) return;
      dragPointer = null;
      element.removeAttribute("data-wiki-scroll-dragging");
      try { element.releasePointerCapture?.(event.pointerId); } catch { /* Capture may already be released. */ }
    };
    element.addEventListener("pointerup", stopDrag);
    element.addEventListener("pointercancel", stopDrag);
    railResizeObserver?.observe(element);
    updateRail(element);
  }
  window.addEventListener("resize", () => scrollHosts.forEach(scheduleRail), { passive: true });
  window.addEventListener("wiki:content-resize", () => scrollHosts.forEach(scheduleRail));
  desktopRail.addEventListener?.("change", () => scrollHosts.forEach(updateRail));
  const contents = document.querySelector(".contents-panel details");
  if (contents && window.matchMedia("(max-width: 1000px)").matches) contents.open = false;
  const tocLinks = [...document.querySelectorAll(".toc a")];
  const selectSection = id => {
    visibleSection = id;
    refreshLanguageLinks();
    for (const link of tocLinks) {
      if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  selectSection(location.hash.slice(1) || "overview");
  window.addEventListener("hashchange", () => selectSection(location.hash.slice(1) || "overview"));
  for (const link of tocLinks) link.addEventListener("click", () => selectSection(link.hash.slice(1)));
  if (!("IntersectionObserver" in window)) return;
  const desktopArticleScroll = window.matchMedia("(min-width: 761px)");
  const article = document.querySelector(".page");
  let sectionObserver;
  const observeSections = () => {
    sectionObserver?.disconnect();
    sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) selectSection(entry.target.id);
    }, {
      root: desktopArticleScroll.matches ? article : null,
      rootMargin: "-5% 0px -65% 0px",
      threshold: 0
    });
    for (const link of tocLinks) {
      const section = document.getElementById(link.hash.slice(1));
      if (section) sectionObserver.observe(section);
    }
  };
  observeSections();
  desktopArticleScroll.addEventListener?.("change", observeSections);
})();
