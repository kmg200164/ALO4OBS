#!/bin/sh
set -eu
fail(){ printf '%s\n' "$1" >&2; exit 1; }
[ "$(uname -s)" = Linux ] || fail 'This helper requires Linux.'
[ "$(uname -m)" = x86_64 ] || fail 'Official native package requires x86_64.'
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# Native Debian packages cannot be placed in the Flatpak sandbox.
if [ "${1:-}" = --flatpak ]; then fail 'Flatpak needs its signed CompositeBlur extension. An offline extension is not bundled yet; no native files were copied.'; fi
command -v dpkg-query >/dev/null || fail 'Only native Debian/Ubuntu packaging is verified by this helper.'
version=$(dpkg-query -W -f='${Version}' obs-studio) || fail 'Native obs-studio package not installed; Flatpak/custom installs require separate verification.'
[ "$(dpkg-query -W -f='${Architecture}' obs-studio)" = amd64 ] || fail 'Native OBS architecture must be amd64.'
version=${version#*:};major=${version%%.*}
case "$major" in 30|31|32) suffix=-legacy;; 33) suffix=;; *) fail 'OBS package version is not verified.';; esac
if pgrep -x obs >/dev/null; then fail 'Close OBS first. OBS was not stopped.'; fi
pkg="$root/plugin/packages/obs-composite-blur-1.6.0-x86_64-linux-gnu${suffix}.deb"
case "$suffix" in -legacy) expected=a7aa448476b1fd95011a793517db2ff02701b705c02a0a0d801794cfa8714496;; *) expected=e3d07db0fa245063927f2e0dbe9e091cabfa5c91ff492d2d7f9b22a835e681c6;; esac
actual=$(sha256sum "$pkg" | awk '{print $1}')
[ "$actual" = "$expected" ] || fail 'Package checksum mismatch.'
[ "$(dpkg-deb -f "$pkg" Architecture)" = amd64 ] || fail 'Unexpected package architecture.'
[ "$(dpkg-deb -f "$pkg" Version)" = 1.6.0 ] || fail 'Unexpected plugin version.'
for installed in obs-composite-blur obs-composite-blur-legacy; do
    installed_version=$(dpkg-query -W -f='${Version}' "$installed" 2>/dev/null || true)
    if [ -n "$installed_version" ] && [ "$installed_version" != 1.6.0 ]; then
        fail 'A different Composite Blur version is installed. No files changed.'
    fi
done
command -v xdg-open >/dev/null || fail 'A graphical DEB installer is required; none was launched.'
[ "${1:-}" != --check ] || exit 0
printf '%s\n' 'Opening the bundled official DEB. Review dependency/conflict and privilege prompts in your package manager. No automatic elevation is performed.'
xdg-open "$pkg"
