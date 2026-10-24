#!/bin/sh
set -eu
fail(){ printf '%s\n' "$1" >&2; exit 1; }
[ "$(uname -s)" = Darwin ] || fail 'This helper requires macOS.'
case "$(uname -m)" in x86_64|arm64) ;; *) fail 'Unsupported architecture.';; esac
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
app=/Applications/OBS.app
[ -d "$app" ] || fail 'Standard /Applications/OBS.app not found; custom installs require verification.'
version=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$app/Contents/Info.plist")
major=${version%%.*}
case "$major" in 30|31|32|33) ;; *) fail 'This macOS package is not verified for this OBS major.';; esac
archs=$(/usr/bin/lipo -archs "$app/Contents/MacOS/OBS")
case " $archs " in *" $(uname -m) "*) ;; *) fail 'OBS architecture does not match this Mac.';; esac
if /usr/bin/pgrep -x OBS >/dev/null; then fail 'Close OBS first. OBS was not stopped.'; fi
pkg="$root/plugin/packages/obs-composite-blur-1.6.0-macos-universal.pkg"
actual=$(/usr/bin/shasum -a 256 "$pkg" | /usr/bin/awk '{print $1}')
[ "$actual" = 11b9e3f781c5ee196987bdaa6cd6d19795d8f2a19d1352a5745ba8f19fa2ad6c ] || fail 'Package checksum mismatch.'
/usr/sbin/pkgutil --check-signature "$pkg" || fail 'Installer signature could not be verified.'
/usr/sbin/spctl --assess --type install "$pkg" || fail 'macOS rejected the installer. Security settings were not changed.'
for plugins in "$HOME/Library/Application Support/obs-studio/plugins" "/Library/Application Support/obs-studio/plugins"; do
    info="$plugins/obs-composite-blur.plugin/Contents/Info.plist"
    if [ -f "$info" ]; then
        installed=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$info") || fail 'Installed plugin version is unknown.'
        [ "$installed" = 1.6.0 ] || fail 'A different Composite Blur version is installed. No files changed.'
    fi
done
[ "${1:-}" != --check ] || exit 0
printf '%s\n' 'The official installer will open. Review its destination and approve installation if requested. Reopen OBS afterward.'
/usr/bin/open "$pkg"
