OBS Streaming Template v0.4.0-dev.1 — 검수용 패키지 안내 / Pre-release package guide
변경 기록 / Release notes: CHANGELOG.md

한국어
설정과 OBS 연결 방법은 guide.html에서 확인하세요.
설정 화면은 preview.html입니다. 두 파일 모두 이 폴더에서 열 수 있습니다.
화면의 7칸은 패널 1~7로 표시되며 용도가 고정되지 않습니다.
각 칸에서 없음, OBS 소스, 웹 주소, 이미지/영상을 선택합니다.
OBS 소스는 스크립트에서 패널별로 선택하며 같은 소스를 중복 선택할 수 없습니다.
미리보기의 패널 번호는 OBS 방송 화면에 표시되지 않습니다.
위치는 상위 프레임과 하위 프레임으로 지정합니다.
자동 배치된 OBS 항목은 기본 잠금입니다. 패널 테두리를 꺼도 콘텐츠와 채우기는 유지됩니다.

English
Read guide-en.html for configuration and OBS setup.
The settings page is preview.html. Both files are in this folder.
The seven slots are labeled Panel 1–7. Each can show None, an OBS source, a web URL, or an image/video.
Choose existing sources per panel in the OBS script. The same OBS source cannot be chosen twice.
Preview panel numbers do not appear in the OBS output. Positions use Parent Frame and Child Frame.

日本語
設定とOBSへの接続方法はguide-ja.htmlをご覧ください。
7つの枠はパネル1～7と表示され、用途は固定されていません。
各枠で「なし」「OBSソース」「Webアドレス」「画像・動画」を選べます。
OBSソースはスクリプトで枠ごとに選び、同じソースを重複して使うことはできません。
プレビューの番号はOBS出力には表示されません。位置は親フレームと子フレームで指定します。


Your exported OBS-settings.zip contains personal links and settings. Keep it private.

This delivery is a pre-release QA bundle, not a public-cleared release.
Third-party asset credits and licenses: assets/THIRD-PARTY-NOTICES.md.
Inter font license: assets/Inter-LICENSE.txt. Identified Lucide icon notice: assets/Lucide-LICENSE.txt.
Project-authored code uses the MIT license in LICENSE; third-party assets retain their own terms.

Windows: extract the full ZIP before opening preview.html or adding obs-setup.lua in OBS.
macOS: extract the full ZIP in Finder, then open preview.html in a browser and add obs-setup.lua in OBS.
The original Source folder and this delivery use the same HTML entry points; internal/ files stay in place.
Always extract OBS-settings.zip into the folder containing obs-setup.lua and replace matching files.
OBS camera sources are selected in the script for individual panels. macOS OBS behavior has not
been tested for this pre-release.
