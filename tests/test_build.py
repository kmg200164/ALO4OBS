"""Delivery integrity regressions; builds only into a temporary directory."""
import importlib.util
from contextlib import contextmanager
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch
from zipfile import ZipFile


spec = importlib.util.spec_from_file_location('overlay_build', Path(__file__).parents[1] / 'build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


@contextmanager
def temporary_destination():
    # Use a file in system TEMP: the Windows sandbox can reject mkdtemp's 0700 directory.
    with tempfile.NamedTemporaryFile(prefix='QA-test-build-', suffix='.zip', delete=False) as handle:
        destination = Path(handle.name)
    try:
        yield destination
    finally:
        destination.unlink(missing_ok=True)


class BuildTests(unittest.TestCase):
    def test_saved_package_contains_independent_lua_runtime(self):
        import base64, json
        script = builder.entries['internal/export-runtime.js'].decode()
        runtime = json.loads(script.removeprefix('window.OBS_EXPORT_RUNTIME = ').strip().removesuffix(';'))
        self.assertIn('OBS-script.lua', runtime)
        self.assertIn('overlay.html', runtime)
        self.assertFalse(any(name.endswith('.js') for name in runtime))
        lua = base64.b64decode(runtime['OBS-script.lua']).decode()
        self.assertIn("internal/panel-media.js", lua)
        self.assertIn('window.OVERLAY_CONFIG', lua)

    def test_setup_infographic_is_distributed_without_bloating_obs_runtime(self):
        import json
        self.assertEqual(builder.entries['assets/setup-workflow.png'],
                         (builder.repository / 'docs/images/setup-workflow.png').read_bytes())
        runtime = json.loads(builder.entries['internal/export-runtime.js'].decode()
                             .removeprefix('window.OBS_EXPORT_RUNTIME = ').strip().removesuffix(';'))
        self.assertNotIn('assets/setup-workflow.png', runtime)

    def test_delivery_filename_contract(self):
        self.assertEqual(builder.output.name, f'ALO4OBS-v{builder.version}.zip')

    def test_filename_includes_version(self):
        version_js = (builder.source / 'version.js').read_text(encoding='utf-8')
        version = re.search(r"'([0-9.]+)'", version_js).group(1)
        self.assertEqual(builder.output.name, f'ALO4OBS-v{version}.zip')

    def test_neutral_defaults_inventory_and_crc(self):
        with temporary_destination() as destination:
            builder.build(destination)
            with ZipFile(destination) as archive:
                self.assertIsNone(archive.testzip())
                self.assertEqual(archive.read('files/config.js'), builder.public_config)
                self.assertNotIn('files/obs-settings.json', archive.namelist())
                self.assertIn('files/assets/THIRD-PARTY-NOTICES.md', archive.namelist())
                self.assertIn('files/internal/panel-media.js', archive.namelist())
                self.assertIn("script_path()..'internal/panel-media.js'", archive.read('files/OBS-script.lua').decode('utf-8'))
                self.assertNotIn('files/assets/asset-sources.md', archive.namelist())
                self.assertNotIn('files/assets/platform-sources.md', archive.namelist())
                self.assertIn('files/LICENSE.txt', archive.namelist())
                self.assertNotIn('files/LICENSE', archive.namelist())
                self.assertEqual(archive.read('files/VERSION').decode().strip(), builder.version)
                names = set(archive.namelist())
                self.assertEqual({name.split('/')[0] for name in names}, {'settings.html', 'files'})
                self.assertIn('files/settings.html', archive.read('settings.html').decode())
                private_assets = {
                    'sample-handcam-topview.png', 'sample-mission-widget.png', 'season-11-lobby.png',
                    'team-tgm25.jpg', 'tgm26-logo.png', 'tgm26-qualified-banner.png',
                }
                self.assertFalse(any(name.rsplit('/', 1)[-1] in private_assets for name in names))
                unused_assets = {
                    'demo-player.svg', 'neutral-logo.svg',
                    'header-github.svg', 'header-guide.svg', 'header-language.svg',
                    'header-theme.svg', 'header-accent.svg', 'header-background.svg',
                    'header-moon-figma.svg', 'header-square-figma.svg', 'header-settings-figma.svg',
                    'action-play.svg', 'action-clear.svg', 'action-example.svg',
                    'action-apply.svg', 'action-reset.svg', 'action-save.svg',
                }
                self.assertFalse(any(name.rsplit('/', 1)[-1] in unused_assets for name in names))
                for logo in ('chzzk.png', 'soop.ico', 'twitch.png', 'youtube.png'):
                    self.assertNotIn('files/assets/' + logo, names)
                overlay = archive.read('files/internal/overlay.js').decode('utf-8')
                self.assertIn("badge.className='platform-label'", overlay)
                demo_html = archive.read('files/demo.html').decode('utf-8')
                demo_js = archive.read('files/internal/demo.js').decode('utf-8')
                self.assertIn('config.public.js', demo_html)
                self.assertNotIn('config.js', demo_html)
                import re
                for entry in archive.namelist():
                    if not entry.endswith('.html') or entry.endswith('/demo.html'):
                        continue
                    scripts = re.findall(r'<script[^>]*src="([^"]+)"', archive.read(entry).decode('utf-8'))
                    if 'internal/config.public.js' in scripts:
                        self.assertEqual(scripts.count('internal/config.public.js'), 1)
                        # Guide pages only need the public repository/donation links, not a
                        # full local-settings override.
                        if entry.rsplit('/', 1)[-1].startswith('guide'):
                            self.assertNotIn('config.js', scripts)
                            continue
                        self.assertEqual(scripts.count('config.js'), 1)
                        self.assertLess(scripts.index('internal/config.public.js'), scripts.index('config.js'))
                self.assertNotRegex(demo_js, r'team-tgm|tgm26|sample-mission|season-11|sample-handcam')

    def test_inline_css_missing_font_preserves_existing_zip(self):
        with temporary_destination() as destination:
            destination.write_bytes(b'previous delivery')
            incomplete = dict(builder.entries)
            del incomplete['assets/InterVariable.woff2']
            with patch.object(builder, 'entries', incomplete):
                with self.assertRaisesRegex(ValueError, 'Missing package reference'):
                    builder.build(destination)
            self.assertEqual(destination.read_bytes(), b'previous delivery')

    def test_missing_demo_script_is_rejected(self):
        incomplete = dict(builder.entries)
        del incomplete['internal/demo.js']
        with self.assertRaisesRegex(ValueError, 'Missing package reference'):
            builder.verify_entries(incomplete)

    def test_replace_failure_preserves_existing_zip(self):
        with temporary_destination() as destination:
            destination.write_bytes(b'previous delivery')
            temporary_paths = []
            create_temporary = builder.tempfile.NamedTemporaryFile

            def track_temporary(*args, **kwargs):
                handle = create_temporary(*args, **kwargs)
                temporary_paths.append(Path(handle.name))
                return handle

            with patch.object(Path, 'replace', side_effect=PermissionError('locked destination')), \
                    patch.object(builder.tempfile, 'NamedTemporaryFile', side_effect=track_temporary):
                with self.assertRaises(PermissionError):
                    builder.build(destination)
            self.assertEqual(destination.read_bytes(), b'previous delivery')
            self.assertTrue(temporary_paths)
            self.assertTrue(all(not path.exists() for path in temporary_paths))


class PublicConfigUrlGuardTests(unittest.TestCase):
    def test_allowlisted_repository_and_donation_links_pass(self):
        builder.check_public_config_urls(
            b'repository: "https://github.com/kmg200164/ALO4OBS", '
            b'donation: "https://buymeacoffee.com/kmg200164"'
        )

    def test_other_url_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Public defaults must not contain personal URLs.'):
            builder.check_public_config_urls(b'"https://example.com/not-allowed"')


if __name__ == '__main__':
    unittest.main()


class VersionFormatTests(unittest.TestCase):
    def test_build_rejects_version_suffix(self):
        original_read = Path.read_text
        def read_with_suffix(path, *args, **kwargs):
            if path.name == 'version.js':
                return "window.KMG_VERSION = '0.4.0-dev.1';\n"
            return original_read(path, *args, **kwargs)
        alternate = importlib.util.module_from_spec(spec)
        with patch.object(Path, 'read_text', read_with_suffix):
            with self.assertRaisesRegex(ValueError, 'Invalid version.js'):
                spec.loader.exec_module(alternate)
