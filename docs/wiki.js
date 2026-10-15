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
  for (const link of languageLinks) {
    link.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      try { localStorage.setItem(storageKey, link.dataset.language); } catch { /* Links still work. */ }
    });
  }
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
