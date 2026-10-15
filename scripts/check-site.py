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
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.assets.append(attrs["href"])


class WikiChecks(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main(verbosity=2)
