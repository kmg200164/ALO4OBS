"""Public site and raw single-Lua runtime packaging regressions."""
import base64
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import sys
import unittest
from unittest.mock import patch
import uuid


repository = Path(__file__).parents[1]
sys.path.insert(0, str(repository))
spec = importlib.util.spec_from_file_location('public_site_build', repository / 'build_site.py')
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)
builder = site.package


class StaticSiteTests(unittest.TestCase):
    def setUp(self):
        # Directory renames in the Windows sandbox TEMP mapping are denied.
        # Keep isolated build fixtures in the writable workspace instead.
        self.root = repository / 'dist' / ('site-test-' + uuid.uuid4().hex)
        self.root.mkdir(parents=True)

    def tearDown(self):
        self.assertTrue(self.root.resolve().is_relative_to((repository / 'dist').resolve()))
        shutil.rmtree(self.root)

    def test_site_contains_neutral_complete_editor_and_both_runtimes(self):
        destination = site.build_site(self.root / 'site')
        actual = {path.relative_to(destination).as_posix(): path.read_bytes()
                  for path in destination.rglob('*') if path.is_file()}
        self.assertEqual(actual, site.site_entries())
        builder.verify_entries(actual)
        self.assertEqual(actual['config.js'], (builder.source / 'config.public.js').read_bytes())
        self.assertNotIn('obs-settings.json', actual)
        self.assertFalse(any('plugin/' in name or 'install.' in name for name in actual))
        self.assertIn('url=settings"', actual['index.html'].decode())
        html = actual['settings.html'].decode()
        self.assertIn('window.ALO4OBS_WEB_EDITOR = true;', html)
        self.assertNotIn(b'window.ALO4OBS_WEB_EDITOR', builder.entries['settings.html'])
        scripts = re.findall(r'<script[^>]*src="([^"?]+)', html)
        for name in ['internal/export-runtime.js', 'internal/lua-runtime.js',
                     'internal/lua-preset.js', 'internal/preview.js']:
            self.assertIn(name, actual)
            self.assertIn(name, scripts)
        self.assertLess(scripts.index('internal/lua-runtime.js'), scripts.index('internal/lua-preset.js'))
        self.assertLess(scripts.index('internal/lua-preset.js'), scripts.index('internal/preview.js'))
        self.assertEqual(scripts.count('internal/lua-runtime.js'), 1)
        for name, data in actual.items():
            if name.endswith('.html'):
                versions = re.findall(rb'[?&]v=([0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?)', data)
                self.assertTrue(all(version.decode() == builder.version for version in versions), name)

    def test_resource_manifest_and_runtime_versions_match(self):
        entries = site.site_entries()
        manifest = json.loads(entries['site-manifest.json'])
        self.assertEqual(manifest['version'], builder.version)
        self.assertEqual(manifest['runtimeVersion'], builder.version)
        self.assertEqual(entries['internal/version.js'].decode().strip(), f"window.KMG_VERSION = '{builder.version}';")
        runtime_script = entries['internal/lua-runtime.js'].decode()
        lines = dict(re.findall(r'window\.(\w+) = (.*);', runtime_script))
        self.assertEqual(json.loads(lines['OBS_LUA_RUNTIME_VERSION']), builder.version)
        runtime = json.loads(lines['OBS_LUA_RUNTIME'])
        metadata = json.loads(lines['OBS_LUA_RUNTIME_METADATA'])
        self.assertEqual(metadata, builder.lua_runtime_metadata)
        self.assertEqual(metadata['version'], builder.version)
        for name, info in manifest['files'].items():
            self.assertEqual(info, {'bytes': len(entries[name]), 'sha256': hashlib.sha256(entries[name]).hexdigest()})
        for name, data in runtime.items():
            decoded = base64.b64decode(data, validate=True)
            self.assertEqual(decoded, builder.lua_runtime[name])
            self.assertEqual(metadata['files'][name]['sha256'], hashlib.sha256(decoded).hexdigest())

    def test_raw_runtime_has_no_installer_prelude_or_editor_media(self):
        runtime = builder.lua_runtime
        builder.verify_entries(runtime)
        raw = (builder.source / 'OBS-script.lua').read_bytes()
        self.assertEqual(runtime['OBS-script.lua'], raw)
        self.assertTrue(raw.startswith(b'obs = obslua'))
        self.assertNotIn(b'Install bundled browser runtime', raw)
        self.assertNotIn(b"do local f=assert(io.open(script_path()..", raw)
        self.assertIn('internal/panel-media.js', runtime)
        self.assertIn('assets/InterVariable.woff2', runtime)
        self.assertEqual({name for name in runtime if name.startswith('assets/')}, {
            'assets/InterVariable.woff2', 'assets/Inter-LICENSE.txt',
            'assets/Lucide-LICENSE.txt', 'assets/figma-squircle-LICENSE.txt',
            'assets/THIRD-PARTY-NOTICES.md',
        })
        for name in runtime:
            self.assertNotRegex(name, r'guide|setup-workflow|preview|upload-storage|lua-preset|pack\.js|camera-preview|demo|header|i18n|plugin')

    def test_legacy_runtime_still_installs_javascript_inside_lua(self):
        script = builder.entries['internal/export-runtime.js'].decode()
        runtime = json.loads(script.removeprefix('window.OBS_EXPORT_RUNTIME = ').strip().removesuffix(';'))
        self.assertFalse(any(name.endswith('.js') for name in runtime))
        lua = base64.b64decode(runtime['OBS-script.lua'])
        self.assertTrue(lua.endswith((builder.source / 'OBS-script.lua').read_bytes()))
        self.assertIn(b'Install bundled browser runtime', lua)
        self.assertIn(b'internal/panel-media.js', lua)
        self.assertNotIn(b'internal/lua-preset.js', lua)

    def test_rebuild_removes_stale_files_only_in_owned_output(self):
        destination = site.build_site(self.root / 'site')
        (destination / 'stale.txt').write_text('old output')
        sibling = self.root / 'keep.txt'
        sibling.write_text('untouched')
        site.build_site(destination)
        self.assertFalse((destination / 'stale.txt').exists())
        self.assertEqual(sibling.read_text(), 'untouched')
        self.assertEqual(list(self.root.glob('.site-*')), [])

    def test_unowned_output_is_preserved(self):
        destination = self.root / 'site'
        destination.mkdir()
        (destination / 'keep.txt').write_text('untouched')
        with self.assertRaisesRegex(ValueError, 'without the site build marker'):
            site.build_site(destination)
        self.assertEqual((destination / 'keep.txt').read_text(), 'untouched')

    def test_missing_dependency_preserves_previous_site(self):
        destination = site.build_site(self.root / 'site')
        original = (destination / 'settings.html').read_bytes()
        incomplete = site.site_entries()
        del incomplete['internal/lua-preset.js']
        with patch.object(site, 'site_entries', return_value=incomplete):
            with self.assertRaisesRegex(ValueError, 'Missing package reference'):
                site.build_site(destination)
        self.assertEqual((destination / 'settings.html').read_bytes(), original)

    def test_swap_failure_restores_previous_site(self):
        destination = site.build_site(self.root / 'site')
        original = (destination / 'settings.html').read_bytes()
        replace = Path.replace

        def fail_stage(path, target):
            if path.name.startswith('.site-build-'):
                raise PermissionError('locked destination')
            return replace(path, target)

        with patch.object(Path, 'replace', fail_stage):
            with self.assertRaisesRegex(PermissionError, 'locked destination'):
                site.build_site(destination)
        self.assertEqual((destination / 'settings.html').read_bytes(), original)
        self.assertEqual(list(self.root.glob('.site-*')), [])


if __name__ == '__main__':
    unittest.main()
