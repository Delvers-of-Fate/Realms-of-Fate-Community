"""Check wiki links, copy blocks and downloadable JSON with the Python standard library."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import sys

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.copies, self.code, self.downloads = set(), [], [], {}, {}
        self.active = None
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate ID: {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag == 'a' and 'href' in attrs: self.links.append(attrs['href'])
        if tag in ('link','script'):
            self.links.append(attrs.get('href', attrs.get('src', '')))
        if 'data-copy' in attrs: self.copies.append(attrs['data-copy'])
        if tag == 'code' and attrs.get('class') == 'language-json':
            self.active = attrs['id']
            self.code[self.active] = ''
            if 'data-download' in attrs: self.downloads[self.active] = attrs['data-download']

    def handle_data(self, data):
        if self.active: self.code[self.active] += data

    def handle_endtag(self, tag):
        if tag == 'code': self.active = None

pages = {path.resolve(): Page(path) for path in root.rglob('*.html')}
assert pages, 'No HTML pages found'
blocks = 0
mod_blocks = 0
for path, page in pages.items():
    for href in page.links:
        url = urlsplit(href)
        if url.scheme or url.netloc: continue
        target = (path.parent / unquote(url.path)).resolve() if url.path else path
        assert target.is_relative_to(root), f'Link leaves site: {href}'
        assert target.exists(), f'Missing target: {href} in {path.name}'
        if url.fragment:
            assert target in pages and unquote(url.fragment) in pages[target].ids, f'Missing anchor: {href}'
    for copy in page.copies:
        assert copy in page.code, f'Missing copy block: {copy}'
    for id, text in page.code.items():
        value = json.loads(text)
        if id in page.downloads:
            download = (path.parent / page.downloads[id]).resolve()
            assert download.is_relative_to(root), 'Download leaves site'
            assert json.loads(download.read_text(encoding='utf-8')) == value, f'Download differs: {id}'
            mod_blocks += 1
            continue
        assert isinstance(value.get('achievements'), list) and value['achievements']
        download = root / 'examples/achievements' / (id.removeprefix('code-') + '.dat')
        assert json.loads(download.read_text(encoding='utf-8')) == value, f'Download differs: {id}'
        for achievement in value['achievements']:
            assert achievement.get('id') and achievement.get('name')
            requirements = achievement.get('requirements', [])
            keys = [r['id'] for r in requirements]
            assert len(keys) == len(set(keys)), f'Duplicate requirement keys: {id}'
        blocks += 1
assert blocks == 6, f'Expected six examples, found {blocks}'
assert mod_blocks == 10, f'Expected ten current mod examples, found {mod_blocks}'
print(f'PASS: {len(pages)} pages, local links and anchors, {blocks} legacy and {mod_blocks} current copyable JSON examples matching downloads.')
