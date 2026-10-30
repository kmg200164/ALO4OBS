"""Prepare a public static editor locally: python build_site.py.

This command does not configure GitHub Pages or publish any files.
"""
from pathlib import Path
import hashlib
import json
import shutil
import uuid

import build as package


output = package.repository / 'dist' / 'site'
SITE_MARKER = '.alo4obs-site'


def site_entries():
    """Use the neutral distribution allowlist, without offline installers."""
    result = dict(package.entries)
    result.pop('assets/setup-workflow.png', None)
    result['settings.html'] = result['settings.html'].replace(
        b'<script', b'<script>window.ALO4OBS_WEB_EDITOR = true;</script><script', 1)
    guide = (package.source / 'web-guide.html').read_bytes()
    for language, name in [('en', 'guide-en.html'), ('ko', 'guide.html'), ('ja', 'guide-ja.html')]:
        result[name] = guide.replace(b'<html lang="en">', ('<html lang="' + language + '">').encode())
    # GitHub Pages serves foo.html at /foo, so the public site links without the extension.
    for name in ('internal/header.js', 'internal/i18n.js'):
        data = result[name]
        for page in ('guide-en', 'guide-ja', 'guide', 'settings'):
            data = data.replace(page.encode() + b'.html', page.encode())
        result[name] = data
    result['internal/web-guide.js'] = (package.source / 'web-guide.js').read_bytes()
    result['index.html'] = (
        '<!doctype html><html lang="en"><meta charset="utf-8">'
        '<title>ALO4OBS</title><meta http-equiv="refresh" content="0;url=settings">'
        '<body><a href="settings">Open ALO4OBS</a></body></html>\n'
    ).encode()
    result['.nojekyll'] = b''
    result[SITE_MARKER] = b'ALO4OBS generated public static editor\n'
    result['site-manifest.json'] = (json.dumps({
        'version': package.version,
        'runtimeVersion': package.lua_runtime_metadata['version'],
        'files': {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                  for name, data in sorted(result.items())},
    }, indent=2) + '\n').encode()
    return result


def _remove_owned_directory(path, parent):
    """Delete only a staging/backup directory created beside this build."""
    if (path.is_symlink() or path.resolve().parent != parent.resolve()
            or not path.name.startswith(('.site-build-', '.site-previous-'))):
        raise ValueError('Refusing to remove an unowned build directory.')
    shutil.rmtree(path)


def build_site(destination=output):
    result = site_entries()
    package.verify_entries(result)
    package.verify_entries(package.lua_runtime)
    destination = Path(destination)
    if destination.is_symlink():
        raise ValueError('Site output must not be a symbolic link.')
    destination = destination.resolve()
    if destination.exists() and (not destination.is_dir()
            or not (destination / SITE_MARKER).is_file()):
        raise ValueError('Refusing to replace a directory without the site build marker.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    stage = destination.parent / ('.site-build-' + uuid.uuid4().hex)
    previous = destination.parent / ('.site-previous-' + uuid.uuid4().hex)
    stage.mkdir()
    try:
        for name, data in result.items():
            path = stage / name
            if path.resolve().is_relative_to(stage.resolve()) is False:
                raise ValueError('Unsafe site output path: ' + name)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        actual = {path.relative_to(stage).as_posix(): path.read_bytes()
                  for path in stage.rglob('*') if path.is_file()}
        if actual != result:
            raise ValueError('Static site content verification failed.')
        if destination.exists():
            destination.replace(previous)
        try:
            stage.replace(destination)
        except OSError:
            if previous.exists():
                previous.replace(destination)
            raise
        if previous.exists():
            _remove_owned_directory(previous, destination.parent)
    finally:
        if stage.exists():
            _remove_owned_directory(stage, destination.parent)
    print(f'Built and verified {destination} v{package.version} ({len(result)} public files; no deployment)')
    return destination


if __name__ == '__main__':
    build_site()
