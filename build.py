"""Build the streamer ZIP with Python's standard library: python build.py."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import re
import posixpath
import tempfile
import hashlib

repository = Path(__file__).resolve().parent
source = repository / 'template'
public_config = (source / 'config.public.js').read_bytes()
version_source = (source / 'version.js').read_text(encoding='utf-8')
match = re.fullmatch(r"window\.KMG_VERSION = '((?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))';\s*", version_source)
if not match:
    raise ValueError('Invalid version.js')
version = match.group(1)
output = repository / 'dist' / f'ALO4OBS-v{version}.zip'
# Only these two public links (repository, donation) may appear in the shipped
# public config; anything else (chrome-extension:// included) is personal data.
PUBLIC_URL_ALLOWLIST = {
    'https://github.com/kmg200164/ALO4OBS',
    'https://buymeacoffee.com/kmg200164',
}


def check_public_config_urls(data):
    if re.search(rb'chrome-extension://', data, re.I):
        raise ValueError('Public defaults must not contain personal URLs.')
    for match in re.findall(rb'https?://[^\s"\'<>]+', data):
        if match.decode() not in PUBLIC_URL_ALLOWLIST:
            raise ValueError('Public defaults must not contain personal URLs.')


check_public_config_urls(public_config)
gift_files = {
    'background.html', 'background.js', 'camera-preview.js', 'config.public.js', 'demo.html', 'demo.js', 'events.js',
    'CHANGELOG.md', 'LICENSE', 'frame.html', 'gradient.css', 'gradient.js', 'guide-en.html', 'guide-ja.html', 'guide-base.css', 'guide-layout.css', 'guide-layout.js', 'guide.html', 'header.css', 'header.js', 'i18n.js', 'OBS-script.lua',
    'overlay.css', 'overlay.html', 'overlay.js', 'pack.js', 'lua-preset.js', 'panel-media.js', 'panel-shape.js',
    'panel-media-game.html', 'panel-media-custom1.html', 'panel-media-custom2.html',
    'panel-media-custom3.html', 'panel-media-chat.html', 'panel-media-translation.html',
    'panel-media-hand.html', 'preview.css', 'README.txt',
    'settings.html', 'preview.js', 'upload-storage.js', 'version.js', 'wallpaper.html',
}
gift_files.update(f'panel-media-panel{column}_{row}.html' for column in range(1, 6) for row in range(1, 4))
files = [(repository if name in {'CHANGELOG.md', 'LICENSE'} else source) / name for name in sorted(gift_files)]
# Explicit neutral runtime package allowlist; private settings and artwork are excluded.
gift_assets = {
    'setup-workflow.png', 'THIRD-PARTY-NOTICES.md',
    'InterVariable.woff2', 'Inter-LICENSE.txt', 'Lucide-LICENSE.txt', 'figma-squircle-LICENSE.txt',
}
files += [source / 'assets' / name for name in sorted(gift_assets)]
entries = {'config.js': public_config, 'VERSION': (version + '\n').encode()}
for path in sorted(files):
    relative = path.relative_to(source).as_posix() if path.is_relative_to(source) else path.name
    if relative == 'LICENSE': relative = 'LICENSE.txt'
    data = path.read_bytes()
    if path.name == 'THIRD-PARTY-NOTICES.md':
        data = data.replace(b'(../../LICENSE)', b'(../LICENSE.txt)')
    if path.suffix == '.html':
        data = re.sub(r'((?:src|href)=")([^"/]+\.(?:js|css))(\?[^\"]*)?(\")',
                      lambda m: m[1] + ('' if m[2] == 'config.js' else 'internal/') + m[2] + (m[3] or '') + m[4],
                      data.decode()).encode()
        data = re.sub(rb'([?&]v=)[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?',
                      lambda m: m[1] + version.encode(), data)
    if path.suffix in {'.js', '.css'} and path.name != 'config.js':
        relative = 'internal/' + relative
        if path.suffix == '.css':
            data = data.replace(b'url("assets/', b'url("../assets/')
    entries[relative] = data
# The distribution editor and personal OBS ZIP have different inventories;
# a saved settings ZIP carries its own OBS runtime. JavaScript is installed
# locally by the explicitly loaded Lua script, rather than downloaded as .js.
import base64
import json
runtime_names = [name for name in entries if name not in {'config.js', 'VERSION', 'OBS-script.lua', 'assets/setup-workflow.png', 'internal/lua-preset.js'} and not name.startswith(('guide', 'settings', 'README', 'CHANGELOG')) and not name.startswith(('internal/preview', 'internal/upload-storage'))]
js_names = [name for name in runtime_names if name.endswith('.js')]
lua = entries['OBS-script.lua'].decode('utf-8')
install = ['-- Install bundled browser runtime when this OBS script is loaded.']
for name in js_names:
    content = entries[name].decode('utf-8')
    delimiter = '='
    while ']' + delimiter + ']' in content: delimiter += '='
    install.append("do local f=assert(io.open(script_path().." + repr(name) + ", 'wb'));assert(f:write([" + delimiter + '[' + content + ']' + delimiter + ']));assert(f:close()) end')
saved_runtime = {name: base64.b64encode(entries[name]).decode('ascii') for name in runtime_names if name not in js_names}
saved_runtime['OBS-script.lua'] = base64.b64encode(('\n'.join(install) + '\n' + lua).encode()).decode('ascii')
entries['internal/export-runtime.js'] = ('window.OBS_EXPORT_RUNTIME = ' + json.dumps(saved_runtime) + ';\n').encode()
entries['settings.html'] = re.sub(
    rb'(?=<script src="internal/pack\.js(?:\?[^\"]*)?">)',
    ('<script src="internal/export-runtime.js?v=' + version + '"></script>').encode(),
    entries['settings.html'], count=1)

# The single-Lua export embeds raw runtime bytes. Unlike the legacy ZIP's Lua,
# this source has no prepended file writes: the codec creates directories first.
lua_runtime_names = {
    'OBS-script.lua', 'config.js', 'LICENSE.txt',
    'background.html', 'frame.html', 'overlay.html', 'wallpaper.html',
    'internal/background.js', 'internal/config.public.js', 'internal/events.js',
    'internal/gradient.js', 'internal/overlay.css', 'internal/overlay.js',
    'internal/panel-media.js', 'internal/panel-shape.js',
    'assets/InterVariable.woff2', 'assets/Inter-LICENSE.txt',
    'assets/Lucide-LICENSE.txt', 'assets/figma-squircle-LICENSE.txt',
    'assets/THIRD-PARTY-NOTICES.md',
}
lua_runtime_names.update(name for name in entries if re.fullmatch(r'panel-media-(?:game|custom[1-3]|chat|translation|hand|panel[1-5]_[1-3])\.html', name))
lua_runtime = {name: entries[name] for name in sorted(lua_runtime_names)}
lua_runtime_metadata = {
    'version': version,
    'encoding': 'base64',
    'files': {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
              for name, data in lua_runtime.items()},
}
entries['internal/lua-runtime.js'] = (
    'window.OBS_LUA_RUNTIME_VERSION = ' + json.dumps(version) + ';\n'
    'window.OBS_LUA_RUNTIME = ' + json.dumps({name: base64.b64encode(data).decode('ascii')
                                            for name, data in lua_runtime.items()}) + ';\n'
    'window.OBS_LUA_RUNTIME_METADATA = ' + json.dumps(lua_runtime_metadata) + ';\n'
).encode()
entries['settings.html'] = re.sub(
    rb'(?=<script src="internal/(?:lua-preset|pack)\.js(?:\?[^\"]*)?">)',
    ('<script src="internal/lua-runtime.js?v=' + version + '"></script>').encode(),
    entries['settings.html'], count=1)

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
                # GitHub Pages serves foo.html at /foo, so the public site links without the extension.
                if resolved not in package and resolved + '.html' not in package:
                    raise ValueError(f'Missing package reference: {name} -> {target}')
            if name.endswith('.js'):
                # Runtime asset paths are relative to the root HTML, not internal/.
                for target in re.findall(r'["\'](assets/[^"\'\s]+\.[a-zA-Z0-9]+)["\']', text):
                    if target not in package:
                        raise ValueError(f'Missing runtime asset: {name} -> {target}')


def build_editor(destination=output):
    verify_entries(entries)
    verify_entries(lua_runtime)
    destination = Path(destination)
    destination.parent.mkdir(exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, suffix='.zip', delete=False) as handle:
            temporary = Path(handle.name)
        with ZipFile(temporary, 'w', ZIP_DEFLATED) as archive:
            for name, data in entries.items():
                archive.writestr('files/' + name, data)
            archive.writestr('settings.html', '<!doctype html><html lang="en"><meta charset="utf-8"><title>ALO4OBS</title><meta http-equiv="refresh" content="0;url=files/settings.html"><body><a href="files/settings.html">Open ALO4OBS</a></body></html>')
        with ZipFile(temporary) as archive:
            if archive.testzip() is not None:
                raise ValueError('Bundle ZIP CRC verification failed.')
            expected = {'files/' + name for name in entries} | {'settings.html'}
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


def build_windows(destination, plugin_archive, source_archive):
    """Create an offline Windows OBS 32 candidate; never install or publish it."""
    import hashlib
    import io
    lock = {
        'plugin_version': '1.6.0',
        'supported_obs_major': 32,
        'plugin_url': 'https://github.com/FiniteSingularity/obs-composite-blur/releases/download/v1.6.0/obs-composite-blur-1.6.0-windows-portable-legacy-x64.zip',
        'plugin_sha256': '8279b2ddc73947d7a864102b55eaf406443846267eb24ea0cdafb2f3dda9e4da',
        'source_commit': '0783c13660a939143bb2d0c3b1f69310f413348a',
        'source_url': 'https://codeload.github.com/FiniteSingularity/obs-composite-blur/zip/0783c13660a939143bb2d0c3b1f69310f413348a',
        'source_sha256': 'aa944119e4db957f5b2ed86d6511e453367d6f21a7fd06782e0f0cdb63dda2ed',
    }
    payload = {}
    for path, key in [(plugin_archive, 'plugin'), (source_archive, 'source')]:
        blob = Path(path).read_bytes()
        if hashlib.sha256(blob).hexdigest() != lock[key + '_sha256']:
            raise ValueError('Pinned ' + key + ' checksum mismatch')
        payload[key] = blob
    added = {}
    hashes = {}
    with ZipFile(io.BytesIO(payload['plugin'])) as archive:
        if archive.testzip() is not None:
            raise ValueError('Plugin archive CRC mismatch')
        for name in archive.namelist():
            if name.endswith('/'):
                continue
            if name.startswith('obs-plugins/64bit/obs-composite-blur.'):
                relative = 'bin/64bit/' + name.split('/')[-1]
            elif name.startswith('data/obs-plugins/obs-composite-blur/'):
                relative = 'data/' + name.removeprefix('data/obs-plugins/obs-composite-blur/')
            else:
                raise ValueError('Unexpected plugin member')
            if '..' in Path(relative).parts or relative.startswith('/'):
                raise ValueError('Unsafe plugin member')
            blob = archive.read(name)
            added['files/plugin/payload/' + relative] = blob
            hashes[relative] = hashlib.sha256(blob).hexdigest()
    with ZipFile(io.BytesIO(payload['source'])) as archive:
        if archive.testzip() is not None:
            raise ValueError('Source archive CRC mismatch')
        prefix = 'obs-composite-blur-' + lock['source_commit'] + '/'
        for name in ['LICENSE', 'CMakeLists.txt', 'src/obs-composite-blur-plugin.c']:
            archive.read(prefix + name)
        added['files/plugin/LICENSE.txt'] = archive.read(prefix + 'LICENSE')
    added['files/plugin/source.zip'] = payload['source']
    lock['files'] = hashes
    added['files/plugin/manifest.json'] = json.dumps(lock, indent=2).encode()
    added['files/plugin/NOTICE.txt'] = (
        'Composite Blur 1.6.0 by FiniteSingularity. Unmodified official release binaries and packages.\n'
        'Redistributed under GNU GPL version 2; see LICENSE.txt and complete corresponding source.zip.\n'
        'The source archive retains upstream copyright, warranty and build notices.\n'
        'This is aggregation with ALO4OBS; the plugin is independently licensed.\n'
        'Windows x64 OBS 30-32 Legacy / OBS 33 modern; macOS universal PKG; Linux amd64 native DEB. Flatpak offline extension pending.\n'
        'Close OBS, then run composite-blur-install.cmd once. No website or manual copying required.\n'
        'No UAC auto-accept, execution-policy change, OBS termination or profile modification.\n'
    ).encode()
    added['composite-blur-install.cmd'] = (source / 'composite-blur-install.cmd').read_bytes()
    # Additional official platforms are pinned and kept offline alongside the same GPL source.
    vendor = repository / 'vendor' / 'obs-composite-blur-1.6.0'
    packages = json.loads((vendor / 'packages.json').read_text())
    for name, digest in packages['sha256'].items():
        blob = (vendor / name).read_bytes()
        if hashlib.sha256(blob).hexdigest() != digest:
            raise ValueError('Pinned platform package checksum mismatch: ' + name)
        added['files/plugin/packages/' + name] = blob
    modern_files = {}
    with ZipFile(vendor / 'obs-composite-blur-1.6.0-windows-x64.zip') as archive:
        for name in archive.namelist():
            if name.endswith('/'): continue
            if name.startswith('data/'):
                relative = name
            elif name in {'obs-composite-blur.dll', 'obs-composite-blur.pdb'}:
                relative = 'bin/64bit/' + name
            else: raise ValueError('Unexpected modern Windows member')
            if '..' in Path(relative).parts: raise ValueError('Unsafe platform member')
            blob = archive.read(name)
            added['files/plugin/payload-modern/' + relative] = blob
            modern_files[relative] = hashlib.sha256(blob).hexdigest()
    modern_lock = dict(lock, files=modern_files, supported_obs_major=33, minimum_obs_major=33, supported_obs_majors=[33], plugin_url=packages['release'].replace('/tag/', '/download/') + '/obs-composite-blur-1.6.0-windows-x64.zip', plugin_sha256=packages['sha256']['obs-composite-blur-1.6.0-windows-x64.zip'])
    added['files/plugin/manifest-modern.json'] = json.dumps(modern_lock, indent=2).encode()
    lock['supported_obs_majors'] = [30, 31, 32]
    added['files/plugin/manifest.json'] = json.dumps(lock, indent=2).encode()
    added['files/plugin/packages.json'] = json.dumps(packages, indent=2).encode()
    for helper in ['composite-blur-install.command', 'composite-blur-install.sh']:
        added[helper] = (source / helper).read_bytes()
    # Keep the root entry and all existing editor files byte-for-byte intact.
    with tempfile.TemporaryDirectory() as temporary:
        neutral = Path(temporary) / 'neutral.zip'
        build_editor(neutral)
        with ZipFile(neutral) as archive:
            combined = {name: archive.read(name) for name in archive.namelist()}
        combined.update(added)
        destination = Path(destination)
        with ZipFile(destination, 'w', ZIP_DEFLATED) as archive:
            for name, blob in combined.items():
                if name.endswith(('.command', '.sh')):
                    from zipfile import ZipInfo
                    info = ZipInfo(name)
                    info.create_system = 3
                    info.external_attr = 0o100755 << 16
                    archive.writestr(info, blob, compress_type=ZIP_DEFLATED)
                else:
                    archive.writestr(name, blob)
        with ZipFile(destination) as archive:
            if archive.testzip() is not None or set(n for n in archive.namelist() if '/' not in n) != {'settings.html','composite-blur-install.cmd','composite-blur-install.command','composite-blur-install.sh'}:
                raise ValueError('Windows bundle verification failed')
    print('Verified offline Windows candidate: ' + str(destination))


def build(destination=output):
    dependency = repository / 'vendor' / 'obs-composite-blur-1.6.0'
    return build_windows(destination, dependency / 'windows-legacy-x64.zip', dependency / 'source.zip')


if __name__ == '__main__':
    build()
