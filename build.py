"""Build the streamer ZIP with Python's standard library: python build.py."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import re
import posixpath
import tempfile

repository = Path(__file__).resolve().parent
source = repository / 'template'
output = repository / 'dist' / 'OBS-Streaming-Template.zip'
public_config = (source / 'config.public.js').read_bytes()
version_source = (source / 'version.js').read_text(encoding='utf-8')
match = re.fullmatch(r"window\.KMG_VERSION = '((?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))';\s*", version_source)
if not match:
    raise ValueError('Invalid version.js')
version = match.group(1)
if re.search(rb'https?://|chrome-extension://', public_config, re.I):
    raise ValueError('Public defaults must not contain personal URLs.')
gift_files = {
    'background.html', 'background.js', 'camera-preview.js', 'config.public.js', 'demo.html', 'demo.js', 'events.js',
    'CHANGELOG.md', 'LICENSE', 'frame.html', 'gradient.css', 'gradient.js', 'guide-en.html', 'guide-ja.html', 'guide-layout.css', 'guide-layout.js', 'guide.html', 'header.css', 'header.js', 'i18n.js', 'obs-setup.lua',
    'overlay.css', 'overlay.html', 'overlay.js', 'pack.js', 'panel-media.js',
    'panel-media-game.html', 'panel-media-custom1.html', 'panel-media-custom2.html',
    'panel-media-custom3.html', 'panel-media-chat.html', 'panel-media-translation.html',
    'panel-media-hand.html', 'preview.css', 'README.txt',
    'preview.html', 'preview.js', 'version.js', 'wallpaper.html',
}
files = [(repository if name in {'CHANGELOG.md', 'LICENSE'} else source) / name for name in sorted(gift_files)]
# Explicit neutral runtime package allowlist; private settings and artwork are excluded.
gift_assets = {
    'THIRD-PARTY-NOTICES.md',
    'InterVariable.woff2', 'Inter-LICENSE.txt', 'Lucide-LICENSE.txt',
}
files += [source / 'assets' / name for name in sorted(gift_assets)]
entries = {'config.js': public_config, 'VERSION': (version + '\n').encode()}
for path in sorted(files):
    relative = path.relative_to(source).as_posix() if path.is_relative_to(source) else path.name
    data = path.read_bytes()
    if path.name == 'THIRD-PARTY-NOTICES.md':
        data = data.replace(b'(../../LICENSE)', b'(../LICENSE)')
    if path.suffix == '.html':
        data = re.sub(r'((?:src|href)=")([^"/]+\.(?:js|css))(\")',
                      lambda m: m[1] + ('' if m[2] == 'config.js' else 'internal/') + m[2] + m[3],
                      data.decode()).encode()
    if path.suffix in {'.js', '.css'} and path.name != 'config.js':
        relative = 'internal/' + relative
        if path.suffix == '.css':
            data = data.replace(b'url("assets/', b'url("../assets/')
    entries[relative] = data
def verify_entries(package):
    """Check references before replacing any existing delivery ZIP."""
    if 'obs-settings.json' in package:
        raise ValueError('Personal OBS settings must not be bundled.')
    if package.get('config.js') != public_config:
        raise ValueError('Bundle config.js must use neutral defaults.')
    for name, data in package.items():
        if name.endswith(('.html', '.css', '.js')):
            text = data.decode('utf-8')
            targets = []
            if name.endswith('.html'):
                targets += re.findall(r'(?:src|href)=["\']([^"\'?#]+)', text)
            if name.endswith(('.html', '.css')):
                targets += re.findall(r'url\(["\']([^"\']+)["\']\)', text)
            for target in targets:
                if target.startswith(('http:', 'https:', 'data:', '#')):
                    continue
                resolved = posixpath.normpath(posixpath.join(posixpath.dirname(name), target))
                if resolved not in package:
                    raise ValueError(f'Missing package reference: {name} -> {target}')
            if name.endswith('.js'):
                # Runtime asset paths are relative to the root HTML, not internal/.
                for target in re.findall(r'["\'](assets/[^"\'\s]+\.[a-zA-Z0-9]+)["\']', text):
                    if target not in package:
                        raise ValueError(f'Missing runtime asset: {name} -> {target}')


def build(destination=output):
    verify_entries(entries)
    destination = Path(destination)
    destination.parent.mkdir(exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, suffix='.zip', delete=False) as handle:
            temporary = Path(handle.name)
        with ZipFile(temporary, 'w', ZIP_DEFLATED) as archive:
            for name, data in entries.items():
                archive.writestr('files/' + name, data)
            archive.writestr('Setting.html', '<!doctype html><html lang="en"><meta charset="utf-8"><title>OBS Streaming Template</title><meta http-equiv="refresh" content="0;url=files/guide-en.html"><body><a href="files/guide-en.html">Open OBS Streaming Template</a></body></html>')
        with ZipFile(temporary) as archive:
            if archive.testzip() is not None:
                raise ValueError('Bundle ZIP CRC verification failed.')
            expected = {'files/' + name for name in entries} | {'Setting.html'}
            if set(archive.namelist()) != expected:
                raise ValueError('Bundle ZIP inventory does not match the allowlist.')
            if any(archive.read('files/' + name) != data for name, data in entries.items()):
                raise ValueError('Bundle ZIP content verification failed.')
        temporary.replace(destination)
        temporary = None
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    print(f'Built and verified {destination} v{version} ({len(entries)} files; neutral prerelease package)')


if __name__ == '__main__':
    build()
