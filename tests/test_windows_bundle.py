import unittest
import tempfile
from pathlib import Path
from zipfile import ZipFile
import build

class WindowsBundleTest(unittest.TestCase):
    def test_unpinned_binary_is_rejected_before_output(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            archive = root / 'bad.zip'
            archive.write_bytes(b'untrusted')
            output = root / 'output.zip'
            with self.assertRaisesRegex(ValueError, 'checksum'):
                build.build_windows(output, archive, archive)
            self.assertFalse(output.exists())

    def test_installer_does_not_stop_obs_or_elevate_or_change_execution_policy(self):
        command = (build.source / 'composite-blur-install.cmd').read_text()
        for forbidden in ['Stop-Process', 'taskkill', 'RunAs', 'ExecutionPolicy', 'Set-ExecutionPolicy']:
            self.assertNotIn(forbidden.lower(), command.lower())
        self.assertIn("Get-Process -Name obs64", command)
        self.assertIn("$major -eq 33", command)
        self.assertIn("Get-AuthenticodeSignature", command)
        self.assertIn('A different Composite Blur is installed', command)
        self.assertIn('ALO4OBS_CHECK_ONLY', command)

    def test_default_build_includes_binary_source_license_and_hashes(self):
        import hashlib, json
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'candidate.zip'
            build.build(output)
            with ZipFile(output) as archive:
                self.assertIsNone(archive.testzip())
                self.assertEqual(set(n for n in archive.namelist() if '/' not in n), {'settings.html','composite-blur-install.cmd','composite-blur-install.command','composite-blur-install.sh'})
                manifest = json.loads(archive.read('files/plugin/manifest.json'))
                self.assertEqual(manifest['supported_obs_major'], 32)
                self.assertEqual(hashlib.sha256(archive.read('files/plugin/source.zip')).hexdigest(), manifest['source_sha256'])
                self.assertEqual(len(manifest['files']), 37)
                for name, digest in manifest['files'].items():
                    self.assertEqual(hashlib.sha256(archive.read('files/plugin/payload/' + name)).hexdigest(), digest)
                self.assertIn(b'GNU GENERAL PUBLIC LICENSE', archive.read('files/plugin/LICENSE.txt'))
                self.assertIn(b'composite-blur-install.cmd', archive.read('files/guide-en.html'))


class PlatformBundleTest(unittest.TestCase):
    def test_pinned_platform_packages_and_source_are_bundled(self):
        import json, hashlib
        with tempfile.TemporaryDirectory() as folder:
            output=Path(folder)/'platform.zip'
            build.build(output)
            with ZipFile(output) as z:
                pins=json.loads(z.read('files/plugin/packages.json'))
                self.assertEqual(len(pins['sha256']),4)
                for name,digest in pins['sha256'].items():
                    self.assertEqual(hashlib.sha256(z.read('files/plugin/packages/'+name)).hexdigest(),digest)
                modern=json.loads(z.read('files/plugin/manifest-modern.json'))
                for name,digest in modern['files'].items():
                    self.assertEqual(hashlib.sha256(z.read('files/plugin/payload-modern/'+name)).hexdigest(),digest)
                self.assertTrue(modern['plugin_url'].endswith('/obs-composite-blur-1.6.0-windows-x64.zip'))
                self.assertEqual(modern['plugin_sha256'],pins['sha256']['obs-composite-blur-1.6.0-windows-x64.zip'])
                self.assertEqual(json.loads(z.read('files/plugin/manifest.json'))['supported_obs_majors'],[30,31,32])
                for ext in ['command','sh']:
                    self.assertTrue((z.getinfo('composite-blur-install.'+ext).external_attr>>16)&0o111)
                self.assertIn('files/plugin/source.zip',z.namelist())

    def test_other_os_helpers_fail_closed_and_leave_authorization_to_os(self):
        mac=(build.source/'composite-blur-install.command').read_text()
        linux=(build.source/'composite-blur-install.sh').read_text()
        for text in [mac,linux]:
            for forbidden in ['sudo ', 'killall ', 'xattr -d', 'spctl --master-disable', 'chmod 777']:
                self.assertNotIn(forbidden,text)
            self.assertIn('--check',text)
            self.assertIn('checksum mismatch',text.lower())
        self.assertIn('pkgutil --check-signature',mac)
        self.assertIn('spctl --assess --type install',mac)
        self.assertLess(mac.index('spctl --assess'),mac.index('/usr/bin/open'))
        self.assertIn('dpkg-query',linux)
        self.assertIn('dpkg-deb',linux)
        self.assertIn('--flatpak',linux)
        self.assertIn('no native files were copied',linux)
