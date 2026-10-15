/* Local bilingual search. All result text is inserted as text, never HTML. */
((root) => {
  "use strict";
  const normalize = text => text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  const excerpt = (text, terms) => {
    const normalized = normalize(text);
    const first = terms.map(term => normalized.indexOf(term)).filter(i => i >= 0);
    const start = first.length ? Math.max(0, Math.min(...first) - 28) : 0;
    return `${start ? "…" : ""}${text.slice(start, start + 105)}${text.length > start + 105 ? "…" : ""}`;
  };
  const search = (records, query, language) => {
    const terms = normalize(query).split(" ").filter(Boolean);
    if (!terms.length) return [];
    return records.flatMap(record => {
      const variants = Object.values(record.variants);
      const all = variants.map(v => normalize(`${v.title} ${v.heading} ${v.text}`)).join(" ");
      if (!terms.every(term => all.includes(term))) return [];
      const localized = record.variants[language];
      if (!localized) return [];
      const weight = variant => terms.reduce((sum, term) => sum +
        (normalize(variant.heading).includes(term) ? 10 : 0) +
        (normalize(variant.title).includes(term) ? 3 : 0) +
        (normalize(variant.text).includes(term) ? 1 : 0), 0);
      const score = Math.max(...variants.map(weight)) + weight(localized) / 100;
      const coverage = variant => terms.filter(term => normalize(variant.text).includes(term)).length;
      const snippetVariant = variants.reduce((best, variant) => coverage(variant) > coverage(best) ? variant : best, localized);
      return [{id: record.id, title: localized.title, heading: localized.heading,
        href: `${record.page}?lang=${language}#${encodeURIComponent(record.id)}`,
        snippet: excerpt(snippetVariant.text, terms), score}];
    }).sort((a, b) => b.score - a.score);
  };
  if (typeof module === "object" && module.exports) {
    module.exports = {search};
    return;
  }
  const panel = root.document.querySelector("[data-wiki-search]");
  if (!panel || !root.MFMWikiSearchIndex) return;
  const language = root.document.documentElement.lang;
  const english = language === "en";
  const input = panel.querySelector("input");
  const list = panel.querySelector(".search-results");
  const status = panel.querySelector(".search-status");
  const clear = panel.querySelector(".search-clear");
  let matches = [];
  let composing = false;
  const update = () => {
    const query = input.value.trim();
    matches = search(root.MFMWikiSearchIndex, query, language);
    list.replaceChildren();
    clear.hidden = !query;
    list.hidden = !matches.length;
    status.hidden = !query;
    status.textContent = !query ? "" : !matches.length
      ? (english ? "No matches. Try another keyword." : "找不到相關章節，試試其他關鍵字。")
      : (english ? `${matches.length} sections · Enter opens the first` : `${matches.length} 個章節 · Enter 開啟第一筆`);
    for (const result of matches.slice(0, 8)) {
      const item = root.document.createElement("li");
      const link = root.document.createElement("a");
      const title = root.document.createElement("span");
      const heading = root.document.createElement("strong");
      const snippet = root.document.createElement("span");
      title.className = "search-result-page";
      snippet.className = "search-result-snippet";
      title.textContent = result.title;
      heading.textContent = result.heading;
      snippet.textContent = result.snippet;
      link.href = result.href;
      link.append(title, heading, snippet);
      item.append(link);
      list.append(item);
    }
    if (matches.length > 8) {
      status.textContent += english ? " · Showing 8; refine to narrow" : " · 顯示前 8 筆，可加字縮小範圍";
    }
    // Search results change a desktop scroll host's content height.
    panel.dispatchEvent(new Event("wiki:content-resize", {bubbles: true}));
  };
  input.addEventListener("input", update);
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => { composing = false; update(); });
  input.addEventListener("keydown", event => {
    if (event.key === "Escape" && !composing) { input.value = ""; update(); }
  });
  clear.addEventListener("click", () => { input.value = ""; update(); input.focus(); });
  panel.querySelector("form").addEventListener("submit", event => {
    event.preventDefault();
    if (composing) return;
    update();
    if (matches.length) root.location.assign(new URL(matches[0].href, root.location.href).href);
  });
  panel.hidden = false;
})(typeof window === "undefined" ? globalThis : window);
