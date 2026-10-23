"""Check the deployed static pages without third-party dependencies."""
from html.parser import HTMLParser
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlsplit
import unittest

ROOT = Path(__file__).resolve().parents[1] / "docs"
PAGES = ("index.html", "rules.html", "modes.html", "history.html")


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.links, self.languages, self.assets = [], [], {}, []
        self.lang = None
        self.h1s = 0
        self.canonicals, self.alternates, self.descriptions = [], {}, []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "meta" and attrs.get("name") == "description":
            self.descriptions.append(attrs.get("content", ""))
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href"))
        if tag == "link" and attrs.get("rel") == "alternate" and attrs.get("hreflang"):
            self.alternates[attrs["hreflang"]] = attrs.get("href")
        if tag == "html":
            self.lang = attrs.get("lang")
        if tag == "h1":
            self.h1s += 1
        if tag == "a" and "href" in attrs:
            self.links.append(attrs["href"])
            if "data-language" in attrs:
                self.languages[attrs["data-language"]] = attrs["href"]
        if tag in ("img", "script") and "src" in attrs:
            self.assets.append(attrs["src"])
        for key in ("data-animation", "data-still", "data-demo-src", "data-demo-still"):
            if key in attrs:
                self.assets.append(attrs[key])
        if tag == "link" and attrs.get("rel") in ("stylesheet", "icon"):
            self.assets.append(attrs["href"])


class WikiChecks(unittest.TestCase):
    def test_footer_destinations_and_about_language_metadata(self):
        base = "https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/"
        game = "https://mfm.monster-fusion-masters-online.workers.dev"
        for folder in ("", "en"):
            for name in (*PAGES, "about.html"):
                path = ROOT / folder / name
                with self.subTest(page=str(path.relative_to(ROOT))):
                    self.assertTrue(path.is_file(), "Missing About article")
                    html = path.read_text(encoding="utf-8")
                    footer = re.search(r'<footer class="site-footer">(.*?)</footer>', html, re.S)
                    self.assertIsNotNone(footer)
                    self.assertIn(game + "/terms", footer.group(1))
                    self.assertIn(game + "/privacy", footer.group(1))
                    self.assertIn('href="./about.html"', footer.group(1))
                    self.assertIn('href="https://github.com/duoduo-88/monster-fusion-masters-online/issues/new/choose" target="_blank" rel="noopener noreferrer"', footer.group(1))
                    self.assertNotIn('class="footer-credits"', footer.group(1))
                    self.assertNotIn("CUBIC 11", footer.group(1))
                    for route in ("terms", "privacy"):
                        expected = game + "/" + route + "?from=wiki&lang=" + ("en" if folder else "zh-Hant")
                        self.assertIn(expected, Page(path).links)
        self.assertTrue((ROOT / "fonts" / "Cubic11-LICENSE.txt").is_file())
        for folder in ("", "en"):
            if not (ROOT / folder / "about.html").is_file():
                continue
            page = Page(ROOT / folder / "about.html")
            self.assertEqual(page.canonicals, [base + ("en/" if folder else "") + "about.html"])
            self.assertEqual(page.alternates, {"zh-Hant": base + "about.html", "en": base + "en/about.html"})
            self.assertEqual(page.h1s, 1)
            self.assertEqual(set(page.languages), {"zh-Hant", "en"})

    def test_game_explanations_have_local_visual_examples(self):
        import re
        for folder in ("", "en"):
            for name, sections in {
                "rules.html": ("board", "tiles", "placement", "connections", "scoring", "turns"),
                "modes.html": ("rounds", "ranked", "features"),
                "index.html": ("overview", "origin"),
                "history.html": ("timeline",),
            }.items():
                html = (ROOT / folder / name).read_text(encoding="utf-8")
                for section in sections:
                    with self.subTest(page=f"{folder}/{name}", section=section):
                        content = re.search(r'<section[^>]*id="' + section + r'"[^>]*>(.*?)</section>', html, re.S)
                        self.assertIsNotNone(content)
                        self.assertRegex(content.group(1), r'<(?:img|picture|video)\b', "Explanation lacks an illustration")

    def test_index_markers_gallery_and_search_clarity(self):
        """Keep decorative markers aligned and gallery screenshots fully visible."""
        css = (ROOT / "wiki.css").read_text(encoding="utf-8")
        self.assertIn(".nav-index{align-self:center;", css)
        self.assertIn(".entry-number{align-self:center;", css)
        self.assertIn(".feature-gallery img{height:185px;object-fit:contain;object-position:center}", css)
        self.assertIn(".feature-gallery img{height:140px}", css)
        self.assertNotIn(".search-help", css)
        self.assertIn(".search-status{", css)

        for folder in ("", "en"):
            prefix = ROOT / folder
            index = (prefix / "index.html").read_text(encoding="utf-8")
            modes = (prefix / "modes.html").read_text(encoding="utf-8")
            with self.subTest(locale=folder or "zh-Hant", feature="markers"):
                self.assertEqual(index.count('class="entry-number"'), 3)
                for page in PAGES:
                    article = (prefix / page).read_text(encoding="utf-8")
                    self.assertEqual(article.count('class="nav-index"'), 4)

            with self.subTest(locale=folder or "zh-Hant", feature="spectator"):
                self.assertIn("spectator-seats.webp", modes)
                self.assertEqual(modes.count("spectator-seats.webp"), 1)

            for page in PAGES:
                with self.subTest(locale=folder or "zh-Hant", page=page, feature="search"):
                    article = (prefix / page).read_text(encoding="utf-8")
                    self.assertNotIn('class="search-help"', article)
                    self.assertNotIn('aria-describedby="wiki-search-help"', article)
                    self.assertIn('id="wiki-search-input"', article)
                    self.assertIn('aria-controls="wiki-search-results"', article)
                    self.assertIn('class="search-status"', article)
                    self.assertRegex(article, r'<link rel="stylesheet" href="\.\.?/wiki\.css\?v=[^"]+">')

    def test_editorial_media_placement_and_contribution_ownership(self):
        """Keep visual examples in their canonical article and community actions in the rail."""
        import re
        for folder in ("", "en"):
            prefix = ROOT / folder
            index = (prefix / "index.html").read_text(encoding="utf-8")
            rules = (prefix / "rules.html").read_text(encoding="utf-8")
            modes = (prefix / "modes.html").read_text(encoding="utf-8")

            with self.subTest(locale=folder or "zh-Hant", article="index"):
                self.assertNotIn('data-demo-gallery', index)
                origin = re.search(r'<section[^>]+id="origin"[^>]*>(.*?)</section>', index, re.S)
                self.assertIsNotNone(origin)
                self.assertIn("original-tabletop-2020.webp", origin.group(1))
                self.assertNotIn('id="quick-start"', index)
                self.assertNotIn('href="#quick-start"', index)

            with self.subTest(locale=folder or "zh-Hant", article="rules"):
                placement = re.search(r'<section[^>]+id="placement"[^>]*>(.*?)</section>', rules, re.S)
                self.assertIsNotNone(placement)
                self.assertEqual(placement.group(1).count('data-demo-gallery'), 1)
                for clip in ("move-connect.gif", "move-close.gif", "move-chain.gif"):
                    self.assertIn(clip, placement.group(1))
                self.assertEqual(rules.count('data-demo-gallery'), 1)

            with self.subTest(locale=folder or "zh-Hant", article="modes"):
                section = re.search(r'<section[^>]+id="game-modes"[^>]*>(.*?)</section>', modes, re.S)
                self.assertIsNotNone(section)
                self.assertEqual(section.group(1).count('class="mode-card"'), 4)
                self.assertNotIn("room-players.webp", section.group(1))
                self.assertNotIn("ranked-panel.webp", section.group(1))
                # The existing mode introduction still provides the lobby illustration.
                overview = re.search(r'<section[^>]+id="overview"[^>]*>(.*?)</section>', modes, re.S)
                self.assertIsNotNone(overview)
                self.assertRegex(overview.group(1), r'<(?:img|picture|video)\b')

            for page in PAGES:
                html = (prefix / page).read_text(encoding="utf-8")
                with self.subTest(locale=folder or "zh-Hant", article=page, component="contribute"):
                    main = html.split("</main>", 1)[0]
                    self.assertNotIn("wiki-contribution", main)
                    rail = html.split('<aside class="right-rail">', 1)[1].split("</aside>", 1)[0]
                    self.assertEqual(rail.count('class="reference-card frame wiki-contribution"'), 1)
                    self.assertLess(rail.index('class="contents-panel frame"'),
                                    rail.index('class="reference-card frame wiki-contribution"'))
                    self.assertIn("issues/new?template=wiki-suggestion.yml", rail)
                    self.assertIn('class="pixel-btn cyan" href="https://github.com/duoduo-88/monster-fusion-masters-showcase_MFM/issues/new?template=wiki-suggestion.yml"', rail)
                    self.assertNotIn("需登入 GitHub", rail)
                    self.assertNotIn("Requires GitHub sign-in", rail)

                with self.subTest(locale=folder or "zh-Hant", article=page, component="download"):
                    archive = html.split('<div class="reference-card frame">', 1)[1].split("</div>", 1)[0]
                    self.assertIn("releases/latest", archive)
                    self.assertEqual(archive.count("releases/latest"), 1)

    def test_every_article_has_a_complete_english_counterpart(self):
        for name in PAGES:
            with self.subTest(page=name):
                path = ROOT / "en" / name
                self.assertTrue(path.is_file(), f"Missing English article: {name}")
                page = Page(path)
                self.assertEqual(page.lang, "en")
                self.assertEqual(page.h1s, 1)
                chinese = Page(ROOT / name)
                # Shared section IDs let readers switch languages at their current section.
                self.assertEqual(set(page.ids), set(chinese.ids))

    def test_language_links_keep_the_current_article(self):
        for folder in ("", "en"):
            for name in PAGES:
                path = ROOT / folder / name
                if not path.exists():
                    continue
                with self.subTest(page=str(path.relative_to(ROOT))):
                    page = Page(path)
                    self.assertEqual(set(page.languages), {"zh-Hant", "en"})
                    for lang, href in page.languages.items():
                        target = (path.parent / urlsplit(href).path).resolve()
                        expected = (ROOT / ("en" if lang == "en" else "") / name).resolve()
                        self.assertEqual(target, expected)

    def test_local_navigation_assets_and_fragment_targets_exist(self):
        for path in ROOT.rglob("*.html"):
            if path.parent == ROOT and re.fullmatch(r"google[0-9a-f]+\.html", path.name):
                with self.subTest(verification=path.name):
                    self.assertEqual(path.read_text(encoding="utf-8").strip(),
                                     f"google-site-verification: {path.name}")
                continue
            page = Page(path)
            with self.subTest(page=str(path.relative_to(ROOT))):
                self.assertEqual(len(page.ids), len(set(page.ids)), "Duplicate IDs")
                self.assertEqual(page.h1s, 1)
                for href in page.links + page.assets:
                    url = urlsplit(href)
                    if url.scheme or url.netloc:
                        continue
                    target = (path.parent / unquote(url.path)).resolve() if url.path else path.resolve()
                    self.assertTrue(target.is_relative_to(ROOT.resolve()), f"Link leaves docs: {href}")
                    self.assertTrue(target.is_file(), f"Missing file: {href}")
                    if url.fragment and target.suffix == ".html":
                        self.assertIn(unquote(url.fragment), Page(target).ids, f"Broken anchor: {href}")


    def test_public_search_metadata_and_sitemap(self):
        base = "https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/"
        expected = {}
        for name in (*PAGES, "about.html"):
            zh = base if name == "index.html" else base + name
            en = base + "en/" + name
            for folder, canonical in (("", zh), ("en", en)):
                page = Page(ROOT / folder / name)
                with self.subTest(page=f"{folder}/{name}"):
                    self.assertEqual(page.canonicals, [canonical])
                    self.assertEqual(page.alternates, {"zh-Hant": zh, "en": en})
                    self.assertEqual(len(page.descriptions), 1)
                    self.assertTrue(page.descriptions[0].strip())
                expected[canonical] = {"zh-Hant": zh, "en": en}
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9",
              "x": "http://www.w3.org/1999/xhtml"}
        root = ET.parse(ROOT / "sitemap.xml").getroot()
        found = {}
        for item in root.findall("s:url", ns):
            loc = item.findtext("s:loc", namespaces=ns)
            self.assertNotIn(loc, found)
            found[loc] = {link.attrib["hreflang"]: link.attrib["href"]
                          for link in item.findall("x:link", ns)}
        self.assertEqual(found, expected)

    def test_sidebar_and_font_layout_contract(self):
        css = (ROOT / "wiki.css").read_text(encoding="utf-8")
        self.assertIn('font-family:"Cubic 11"', css)
        self.assertIn('scrollbar-gutter:stable', css)
        self.assertIn('--mfm-scroll-size:12px', css)
        self.assertIn('--mfm-scroll-content-gutter:14px', css)
        self.assertIn('.wiki-scroll-rail', css)
        self.assertIn(".reference-card:not(.wiki-contribution)>a", css)
        self.assertIn(".wiki-contribution>.pixel-btn", css)
        self.assertIn('scrollbar-width:none', css)
        self.assertIn('overflow-y:auto', css)
        self.assertNotIn("mfm-pixel.ttf", css)
        self.assertFalse((ROOT / "fonts" / "mfm-pixel.ttf").exists())
        for folder in ("", "en"):
            for name in PAGES:
                with self.subTest(folder=folder or "zh-Hant", page=name):
                    source = (ROOT / folder / name).read_text(encoding="utf-8")
                    note = source.index('class="rail-note frame"')
                    reference = source.index('class="reference-card frame"')
                    left_end = source.index("</aside>", source.index('class="left-rail"'))
                    self.assertLess(note, reference)
                    self.assertLess(reference, left_end)
                    self.assertNotIn('class="facts frame"', source)
                    self.assertNotIn('class="pixel-btn primary play-button"', source)
                    self.assertNotIn("BoutiqueBitmap9x9", source)
                    self.assertNotIn("↗", source, "Northeast arrow must not return")
                    self.assertNotIn('class="footer-credits"', source)


if __name__ == "__main__":
    unittest.main(verbosity=2)
