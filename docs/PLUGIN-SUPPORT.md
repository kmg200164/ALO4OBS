# Composite Blur bundle expansion checkpoint

Official release: https://github.com/FiniteSingularity/obs-composite-blur/releases/tag/v1.6.0
Official OBS install locations: https://obsproject.com/kb/plugins-guide
Upstream Flatpak instruction: https://github.com/FiniteSingularity/obs-composite-blur/tree/v1.6.0#installation

| Environment | Official package / target | Current verification |
|---|---|---|
| Windows x64 OBS 30-32 | Legacy, ProgramData/obs-studio/plugins/obs-composite-blur | 32 was previously installed; 30/31 selection not actual-host tested |
| Windows x64 OBS 33 | modern, same plugin root | Pinned package/manifest; no OBS33 runtime available. Portable33 refused |
| macOS Intel/Apple Silicon | universal PKG; official installer chooses destination | Hash verified; helper requires pkgutil signature and Gatekeeper acceptance. OBS30-33 conservative guard, actual OS validation pending |
| Linux native Debian/Ubuntu amd64 | Legacy30-32 / modern33, official DEB package manager | Package metadata checked; libc6 >=2.14 and obs-studio dependencies; conflicts with alternate variant. Real ELF/runtime validation pending |
| Linux Flatpak | com.obsproject.Studio.Plugin.CompositeBlur extension | Native DEB never copied into sandbox; no pinned offline extension artifact yet |
| Other Linux/ARM/custom OBS | No verified automatic target yet | Refuse rather than guess |

Package SHA-256 pins are vendor/obs-composite-blur-1.6.0/packages.json. Existing source.zip and GPL notices cover the same upstream 1.6.0 source. No package installation executed during expansion. macOS opens the official signed PKG only after system trust checks. Linux opens the pinned official DEB in the graphical package manager; dependencies/conflicts and authorization remain visible. No sudo, security-policy changes or automatic prompt approval. Windows supports only a recognized native standard install (or previously verified legacy portable target). Helpers never terminate OBS. Linux Flatpak is explicitly unfinished, not technically impossible: it requires a separately pinned extension and matching runtime, unavailable in this Windows execution environment. The upstream referenced Flathub manifest currently shows 1.5.1, so it must not be represented as the pinned upstream 1.6.0 binary/source bundle.

Only the three guide HTML files were synchronized to the user's review folder; no new platform installer was copied or executed there. Candidate ZIP and Library remain earlier checkpoints until final integrated validation.

## Follow-up validation

Helpers explicitly limit automatic selection to OBS 30-33 (30-32 Legacy, 33 modern), rejecting 34 and unknown versions. Windows verifies the OBS PE x64 machine and the pinned DLL's Authenticode signature; native Debian verifies installed OBS package architecture. Different installed plugin versions are rejected. Mac/Linux installer-launch failures propagate instead of reporting success. A differing same-version package still requires the native OS package manager's review; no force overwrite flags are passed.

Three command-stub test methods cover 36 scenarios: Windows version/payload selection, unsupported/future version, host/EXE architecture, signature failure, running OBS, disk failure, existing differing bytes; Mac Intel/Apple Silicon, unsupported version/architecture, running OBS, checksum/signature rejection, different installed version, installer failure, check-only; Linux version/package selection, unsupported version/architecture, running OBS, checksum mismatch, installed version/DEB architecture, Flatpak refusal, package-launch failure, check-only. Test copies redirect platform commands and absolute app paths to private temporary fixtures. These are not real Mac/Linux installations. Additional package integrity/manifest/helper checks: 5 methods; guide checks: 2 methods. Git Bash syntax validation passed for both POSIX helpers. Both real official Windows DLL Authenticode statuses are Valid. Mac PKG signature remains for macOS system verification, not inferred from the Windows hash check.

The public candidate was rebuilt once with all four additional pinned official packages, modern Windows payload, three helpers, existing corresponding source.zip and GPL notices. Final source/ZIP consistency is recorded in the ignored platform-validation.json. No install was performed on a user system, no security settings changed, and only three guide files were synced to the review folder.

Flatpak minimal online route is the upstream documented `flatpak install flathub com.obsproject.Studio.Plugin.CompositeBlur`. It can avoid website/manual copying but still downloads from Flathub, requires a verified configured remote and matching runtime/architecture, and leaves confirmation visible. It is not an offline 1.6.0 bundle. No online installation helper was enabled without a pinned compatible extension/repository trust check. Official Flathub source manifest currently references 1.5.1, commit adaeef80f8216e0852e2dace66abb51606ad6373. An offline extension export plus matching source/runtime identity remains a separate blocker; no unofficial binary was added. See https://docs.flatpak.org/en/latest/using-flatpak.html and https://github.com/flathub/com.obsproject.Studio.Plugin.CompositeBlur .
