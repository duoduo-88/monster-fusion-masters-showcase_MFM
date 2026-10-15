"""Check the deployed static pages without third-party dependencies."""
from html.parser import HTMLParser
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
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
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
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.assets.append(attrs["href"])


class WikiChecks(unittest.TestCase):
    def test_game_explanations_have_local_visual_examples(self):
        import re
        for folder in ("", "en"):
            for name, sections in {
                "rules.html": ("board", "tiles", "placement", "connections", "scoring", "turns"),
                "modes.html": ("rounds", "ranked", "features"),
                "index.html": ("overview", "quick-start", "origin"),
                "history.html": ("timeline",),
            }.items():
                html = (ROOT / folder / name).read_text(encoding="utf-8")
                for section in sections:
                    with self.subTest(page=f"{folder}/{name}", section=section):
                        content = re.search(r'<section[^>]*id="' + section + r'"[^>]*>(.*?)</section>', html, re.S)
                        self.assertIsNotNone(content)
                        self.assertRegex(content.group(1), r'<(?:img|picture|video)\b', "Explanation lacks an illustration")

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

                with self.subTest(locale=folder or "zh-Hant", article=page, component="download"):
                    archive = html.split('<div class="reference-card frame">', 1)[1].split("</div>", 1)[0]
                    self.assertIn("releases/tag/v0.1.1", archive)
                    self.assertEqual(archive.count("releases/tag/v0.1.1"), 1)

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


    def test_sidebar_and_font_layout_contract(self):
        css = (ROOT / "wiki.css").read_text(encoding="utf-8")
        self.assertIn('font-family:"Cubic 11"', css)
        self.assertIn('scrollbar-gutter:stable', css)
        self.assertIn('--mfm-scroll-size:12px', css)
        self.assertIn('--mfm-scroll-content-gutter:14px', css)
        self.assertIn('.wiki-scroll-rail', css)
        self.assertIn('scrollbar-width:none', css)
        self.assertIn('overflow-y:auto', css)
        self.assertNotIn("BoutiqueBitmap9x9", css)
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
                    self.assertIn("Cubic11-LICENSE.txt", source)


if __name__ == "__main__":
    unittest.main(verbosity=2)
