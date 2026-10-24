"""Execute helper copies with platform commands stubbed; never install software."""
import unittest, tempfile, subprocess, os
from pathlib import Path

BASH=Path(r'C:/Program Files/Git/bin/bash.exe')
ROOT=Path(__file__).resolve().parents[1]
@unittest.skipUnless(BASH.exists(), 'Git Bash needed for command-stub tests')
class PlatformHelpers(unittest.TestCase):
 def run_helper(self,platform,case):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);stubs=root/'stubs';stubs.mkdir();app=root/'OBS.app';app.mkdir()
   helper=(ROOT/'template'/('composite-blur-install.command' if platform=='mac' else 'composite-blur-install.sh')).read_text()
   # Only the test copy redirects absolute OS commands and app/plugin paths.
   helper=helper.replace('$HOME/Library/Application Support/obs-studio/plugins',(root/'user-plugins').as_posix())
   helper=helper.replace('/Applications/OBS.app',app.as_posix()).replace('/Library/Application Support/obs-studio/plugins',(root/'global-plugins').as_posix())
   for prefix in ['/usr/libexec/','/usr/sbin/','/usr/bin/']: helper=helper.replace(prefix,'')
   posix_stubs='/'+stubs.drive[0].lower()+stubs.as_posix()[2:]
   helper='PATH=\"'+posix_stubs+':/usr/bin:/bin\"\n'+helper
   helper_path=root/'helper.sh';helper_path.write_text(helper)
   stub="""#!/bin/sh
case "${0##*/}" in
uname) if [ "$1" = -s ]; then echo "$TEST_OS"; else echo "$TEST_ARCH"; fi;;
PlistBuddy) case "$*" in *obs-composite-blur*) echo "${TEST_INSTALLED:-1.6.0}";; *Architecture*) echo "$TEST_DEB_ARCH";; *) echo "$TEST_VERSION";; esac;;
lipo) echo "$TEST_ARCH";;
pgrep) [ "$TEST_RUNNING" = yes ];;
sha256sum|shasum) if [ "$TEST_HASH" = bad ]; then echo bad; elif [ "$TEST_OS" = Darwin ]; then echo 11b9e3f781c5ee196987bdaa6cd6d19795d8f2a19d1352a5745ba8f19fa2ad6c; else case "$*" in *legacy*) echo a7aa448476b1fd95011a793517db2ff02701b705c02a0a0d801794cfa8714496;; *) echo e3d07db0fa245063927f2e0dbe9e091cabfa5c91ff492d2d7f9b22a835e681c6;; esac; fi;;
pkgutil|spctl) [ "$TEST_SIGNATURE" = good ];;
dpkg-query) case "$*" in *obs-composite-blur*) [ -n "$TEST_INSTALLED" ] && echo "$TEST_INSTALLED";; *Architecture*) echo "$TEST_DEB_ARCH";; *) echo "$TEST_VERSION";; esac;;
dpkg-deb) case "$*" in *Architecture*) echo "$TEST_DEB_ARCH";; *) echo 1.6.0;; esac;;
open|xdg-open) echo "$*" > "$TEST_OPEN_LOG"; [ "$TEST_OPEN_FAIL" != yes ];;
esac
"""
   for name in ['uname','PlistBuddy','lipo','pgrep','sha256sum','shasum','pkgutil','spctl','dpkg-query','dpkg-deb','open','xdg-open']:
    (stubs/name).write_text(stub)
   # MSYS recognizes shebang files without requiring Windows executable metadata.
   env=dict(os.environ,TEST_OS='Darwin' if platform=='mac' else 'Linux',TEST_ARCH='arm64' if platform=='mac' else 'x86_64',TEST_VERSION='32.2.2',TEST_RUNNING='no',TEST_HASH='good',TEST_SIGNATURE='good',TEST_INSTALLED='',TEST_DEB_ARCH='amd64',TEST_OPEN_FAIL='no',TEST_OPEN_LOG=(root/'opened').as_posix())
   env.update(case);env['PATH']=stubs.as_posix()+':/usr/bin:/bin'
   if case.get('TEST_INSTALLED') and platform=='mac':
    info=root/'global-plugins/obs-composite-blur.plugin/Contents/Info.plist';info.parent.mkdir(parents=True);info.touch()
   result=subprocess.run([str(BASH),helper_path.as_posix()]+case.get('ARGS','').split(),env=env,capture_output=True,text=True)
   opened=(root/'opened').read_text() if (root/'opened').exists() else ''
   return result.returncode,opened,result.stdout+result.stderr
 def test_linux_version_selection_and_refusals(self):
  for version,suffix in [('30.2.0','-legacy.deb'),('31.1.0','-legacy.deb'),('32.2.2','-legacy.deb'),('33.0.0','gnu.deb')]:
   code,opened,output=self.run_helper('linux',{'TEST_VERSION':version});self.assertEqual(code,0,output);self.assertTrue(opened.strip().endswith(suffix),opened)
  for case in [{'TEST_VERSION':'34.0.0'},{'TEST_VERSION':'29.0.0'},{'TEST_ARCH':'aarch64'},{'TEST_RUNNING':'yes'},{'TEST_HASH':'bad'},{'TEST_INSTALLED':'1.5.1'},{'TEST_DEB_ARCH':'arm64'},{'ARGS':'--flatpak'}]:
   code,opened,output=self.run_helper('linux',case);self.assertNotEqual(code,0,output);self.assertEqual(opened,'')
  self.assertNotEqual(self.run_helper('linux',{'TEST_OPEN_FAIL':'yes'})[0],0)
  code,opened,output=self.run_helper('linux',{'ARGS':'--check'});self.assertEqual(code,0,output);self.assertEqual(opened,'')
 def test_mac_architecture_signature_version_and_failures(self):
  for arch in ['arm64','x86_64']:
   code,opened,output=self.run_helper('mac',{'TEST_ARCH':arch});self.assertEqual(code,0,output);self.assertTrue(opened.strip().endswith('.pkg'))
  for case in [{'TEST_ARCH':'other'},{'TEST_VERSION':'34.0.0'},{'TEST_RUNNING':'yes'},{'TEST_HASH':'bad'},{'TEST_SIGNATURE':'bad'},{'TEST_INSTALLED':'1.5.1'}]:
   code,opened,output=self.run_helper('mac',case);self.assertNotEqual(code,0,output);self.assertEqual(opened,'')
  self.assertNotEqual(self.run_helper('mac',{'TEST_OPEN_FAIL':'yes'})[0],0)
  code,opened,output=self.run_helper('mac',{'ARGS':'--check'});self.assertEqual(code,0,output);self.assertEqual(opened,'')

class WindowsHelperStubs(unittest.TestCase):
 def run_case(self,case):
  import json,hashlib
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder); bundle=root/'bundle';bundle.mkdir();program=root/'program';exe=program/'obs-studio/bin/64bit/obs64.exe';exe.parent.mkdir(parents=True);pe=bytearray(256);pe[60:64]=(128).to_bytes(4,'little');pe[128:132]=b'PE\0\0';pe[132:134]=(0xAA64 if case.get('TEST_EXE_ARM') else 0x8664).to_bytes(2,'little');exe.write_bytes(pe)
   data=root/'data';target=data/'obs-studio/plugins/obs-composite-blur/bin/64bit/obs-composite-blur.dll'
   for kind,blob in [('payload',b'legacy fixture'),('payload-modern',b'modern fixture')]:
    dll=bundle/'plugin'/kind/'bin/64bit/obs-composite-blur.dll';dll.parent.mkdir(parents=True);dll.write_bytes(blob)
    manifest={'files':{'bin/64bit/obs-composite-blur.dll':hashlib.sha256(blob).hexdigest()}}
    (bundle/'plugin'/('manifest.json' if kind=='payload' else 'manifest-modern.json')).write_text(json.dumps(manifest))
   if case.get('TEST_EXISTING'):
    target.parent.mkdir(parents=True);target.write_bytes(b'preserve my plugin')
   cmd=(ROOT/'template/composite-blur-install.cmd').read_text()
   body=cmd.split('powershell.exe -NoProfile -Command "',1)[1].split('"\nset ',1)[0]
   stubs="""function Get-Item { param($LiteralPath) [pscustomobject]@{VersionInfo=[pscustomobject]@{ProductVersion=$env:TEST_VERSION}} }; function Get-AuthenticodeSignature { param($LiteralPath) [pscustomobject]@{Status=$env:TEST_SIGNATURE} }; function Get-Process { param($Name,$ErrorAction) if($env:TEST_RUNNING -eq 'yes'){[pscustomobject]@{Path=$null}} }; function Copy-Item { param($LiteralPath,$Destination) if($env:TEST_COPY_FAIL -eq 'yes'){throw 'Simulated disk failure'}; [IO.File]::Copy($LiteralPath,$Destination) }; """
   body=body.replace('try { if($env:PROCESSOR_ARCHITECTURE',stubs+'try { if($env:PROCESSOR_ARCHITECTURE',1)
   if 'PROCESSOR_ARCHITECTURE' in case: body="$env:PROCESSOR_ARCHITECTURE='"+case['PROCESSOR_ARCHITECTURE']+"'; "+body
   env=dict(os.environ,ALO4OBS_BUNDLE_ROOT=str(bundle),ALO4OBS_NO_OPEN='1',ALO4OBS_PORTABLE_ROOT='',ALO4OBS_CHECK_ONLY='',ProgramFiles=str(program),ProgramData=str(data),PROCESSOR_ARCHITECTURE='AMD64',TEST_VERSION='32.2.2',TEST_SIGNATURE='Valid',TEST_RUNNING='no',TEST_COPY_FAIL='no');env.update(case)
   env={k.upper():v for k,v in env.items()}
   body="$env:ProgramFiles='"+str(program).replace("'","''")+"'; $env:ProgramData='"+str(data).replace("'","''")+"'; "+body
   result=subprocess.run(['powershell.exe','-NoProfile','-Command',body],env=env,capture_output=True,text=True)
   return result.returncode,target.read_bytes() if target.exists() else None,result.stdout+result.stderr
 def test_version_payload_selection_and_safe_refusals(self):
  for version,expected in [('30.1.0',b'legacy fixture'),('31.0.0',b'legacy fixture'),('32.2.2',b'legacy fixture'),('33.0.0',b'modern fixture')]:
   code,blob,output=self.run_case({'TEST_VERSION':version});self.assertEqual(code,0,output);self.assertEqual(blob,expected)
  for case in [{'TEST_VERSION':'34.0.0'},{'TEST_VERSION':'29.0.0'},{'PROCESSOR_ARCHITECTURE':'ARM64'},{'TEST_RUNNING':'yes'},{'TEST_SIGNATURE':'NotSigned'},{'TEST_COPY_FAIL':'yes'},{'TEST_EXE_ARM':'yes'}]:
   code,blob,output=self.run_case(case);self.assertNotEqual(code,0,str(case)+output);self.assertIsNone(blob)
  code,blob,output=self.run_case({'TEST_EXISTING':'yes'});self.assertNotEqual(code,0,output);self.assertEqual(blob,b'preserve my plugin')
