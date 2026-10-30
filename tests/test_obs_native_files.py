"""Exercise installed libobs file APIs in a separate process, without opening OBS."""
import ctypes
import os
from pathlib import Path
import shutil
import unittest
import uuid


OBS = Path(r'C:\Program Files\obs-studio\bin\64bit')


@unittest.skipUnless((OBS / 'obs.dll').is_file(), 'Windows libobs is not installed')
class NativeFileTests(unittest.TestCase):
    def test_native_directory_and_replace_support_standalone_runtime(self):
        base = Path(__file__).resolve().parents[1] / 'dist'
        base.mkdir(exist_ok=True)
        root = base / ('native-files-' + uuid.uuid4().hex)
        with os.add_dll_directory(str(OBS)):
            lib = ctypes.CDLL(str(OBS / 'obs.dll'))
            lib.os_mkdirs.argtypes = [ctypes.c_char_p]
            lib.os_mkdirs.restype = ctypes.c_int
            lib.os_rename.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
            lib.os_rename.restype = ctypes.c_int
            lib.os_unlink.argtypes = [ctypes.c_char_p]
            lib.os_unlink.restype = ctypes.c_int
            encode = lambda path: str(path).encode('utf-8')
            try:
                nested = root / '한글-runtime' / 'assets'
                self.assertGreaterEqual(lib.os_mkdirs(encode(nested)), 0)
                self.assertGreaterEqual(lib.os_mkdirs(encode(nested)), 0)
                original = nested / 'original.bin'
                replacement = nested / 'replacement.bin'
                original.write_bytes(b'previous')
                replacement.write_bytes(b'updated\x00bytes')
                self.assertEqual(lib.os_rename(encode(replacement), encode(original)), 0)
                self.assertEqual(original.read_bytes(), b'updated\x00bytes')
                self.assertFalse(replacement.exists())
                self.assertEqual(lib.os_unlink(encode(original)), 0)
                self.assertFalse(original.exists())
            finally:
                self.assertTrue(root.resolve().is_relative_to(base.resolve()))
                if root.exists():
                    shutil.rmtree(root)
