# OBS Streaming Template

Current version: 0.4.0-dev.1 (pre-release QA)

변경 기록: [CHANGELOG.md](CHANGELOG.md)

게임 화면과 캠·채팅 같은 콘텐츠를 벤토 그리드의 서로 다른 칸에 놓아 가리지 않게 하는 OBS 로컬 템플릿입니다. 1920×1080 화면에는 패널 1~7이 있으며, **어느 칸도 게임·채팅·캠 같은 용도로 고정되지 않습니다.** 각 칸의 콘텐츠와 활성화 여부를 따로 정하고, 남은 칸은 자동으로 정렬됩니다. OBS 소스와 웹 위젯은 사용자가 선택한 것만 연결합니다. 별도 온라인 서비스 없이 로컬 파일과 OBS Lua 스크립트로 사용합니다.

## 스트리머 시작 방법

**개발 사전 공개 버전입니다. macOS·Chrome 업로드 검증은 진행 중입니다.**

GitHub **Code → Download ZIP**으로 받아 압축을 풀고 `guide.html`을 엽니다. 한국어/영어/일본어를 선택할 수 있습니다.

1. `preview.html`에서 패널 1~7을 하나씩 선택합니다. 각 패널의 **콘텐츠**를 `없음`, `OBS 소스`, `웹 주소`, `이미지/영상` 중에서 고르고, 활성화와 상위·하위 프레임 위치를 지정합니다. 웹 위젯은 해당 서비스가 제공한 **OBS 표시용 URL**을 입력합니다. 전체 배경·패널 채우기·테두리도 이 화면에서 설정합니다. 변경 사항은 미리보기에 즉시 반영되고, 미리보기의 숫자는 칸을 구별하기 위한 안내이며 OBS 출력에는 나오지 않습니다.
2. **ZIP 파일로 저장**을 눌러 받은 `OBS-settings.zip`을 `obs-setup.lua`와 `overlay.html`이 있는 폴더에 풉니다. `config.js`, `obs-settings.json`, 업로드 자산과 패널 마스크를 함께 교체합니다. 설정 ZIP에는 개인 위젯 주소가 들어갈 수 있으므로 공개하지 마세요.
3. OBS 기본 캔버스를 1920×1080으로 설정하고 **도구 → 스크립트**에서 `obs-setup.lua`를 추가합니다. 콘텐츠가 `OBS 소스`인 패널마다 기존 소스를 하나씩 선택하고 **저장한 설정 / 자동 배치 적용**을 누릅니다. 같은 OBS 소스를 두 칸에 중복 선택할 수 없습니다. 예를 들어 일곱 칸 모두 캠을 쓰려면 OBS에 서로 다른 캠 소스 일곱 개를 준비해야 합니다.
4. 다음 변경부터 설정 ZIP을 교체하고 적용 버튼만 누릅니다. 링크를 OBS에 다시 입력하거나 위치를 직접 맞출 필요가 없습니다.

설정 화면은 넓은 창에서 세 열, 중간 너비에서 두 열, 좁은 창에서 한 열로 배열됩니다. 상위·하위 프레임이 패널 위치를 정하고, 비활성 패널이 생기면 남은 패널의 크기를 다시 계산합니다. 패널 채우기는 콘텐츠 뒤에 표시됩니다. 미리보기 상단의 **샘플 표시**는 샘플 테스트 입력란의 내용 하나를 표시하고, **샘플 비우기**는 샘플만 지웁니다. **전체화면 보기**는 현재 미리보기를 확대하며 `Esc` 또는 화면의 돌아가기 버튼으로 설정으로 돌아옵니다.

OBS 소스는 미리보기 화면에서 고르는 것이 아니라 OBS 스크립트의 **해당 패널 번호 선택기**에서 고릅니다. OBS 소스가 아닌 웹 주소와 이미지/영상은 설정 ZIP의 정보를 사용합니다. 스크립트는 OBS Streaming Template 장면에 패널을 배치하고 원본 비율을 유지해 맞춥니다. 투명 모서리용 알파 마스크는 템플릿 전용 그룹에 적용하며, 원본 소스의 다른 장면 설정은 바꾸지 않습니다. 기존 장면, 캡처 장치 설정, 송출 키를 바꾸거나 방송을 시작하지 않습니다.

| 영역 | x | y | 너비 | 높이 |
| --- | ---: | ---: | ---: | ---: |
| 패널 1 | 32 | 32 | 1384 | 778 |
| 패널 2 | 32 | 842 | 440 | 206 |
| 패널 3 | 504 | 842 | 440 | 206 |
| 패널 4 | 976 | 842 | 440 | 206 |
| 패널 5 | 1448 | 32 | 440 | 317 |
| 패널 6 | 1448 | 381 | 440 | 317 |
| 패널 7 | 1448 | 730 | 440 | 318 |

위 표는 7개 패널의 기본 위치입니다. 상위·하위 프레임 설정이나 패널 활성화를 바꾸면 위치와 크기가 달라집니다. 오른쪽 칸은 16:9가 아니므로 캠 등 OBS 소스는 원본 비율을 유지해 맞추며 잘라서 채우지 않습니다. 모든 패널에 같은 네 가지 콘텐츠 형식을 쓸 수 있습니다. `없음`은 칸을 비우고, `OBS 소스`는 OBS에 이미 있는 캡처·미디어 등 영상 소스를 선택하며, `웹 주소`는 HTTPS/HTTP 표시용 위젯 주소를, `이미지/영상`은 업로드한 파일 또는 직접 미디어 URL을 사용합니다. OBS 장면과 그룹은 패널 소스로 선택할 수 없습니다. 일반 웹페이지나 동영상 시청 페이지 주소가 자동으로 OBS 표시용 URL로 변환되지는 않습니다.

OBS의 템플릿 소스는 전체 배경, 일곱 칸의 채우기, 각 칸의 콘텐츠, 테두리 순서로 쌓입니다. 채우기는 콘텐츠 뒤에 있으므로 영상이나 위젯을 가리지 않습니다. 전체 배경의 기본값은 검정, 패널 채우기는 흰색 20%·블러 32px, 테두리는 흰색 4px입니다. 배경·채우기·테두리의 색과 표시 여부를 바꿀 수 있습니다. 업로드한 파일은 설정 ZIP에 포함됩니다. 정지 이미지를 콘텐츠 대신 칸의 배경으로 쓰려면 해당 패널 콘텐츠를 `없음`으로 두고 패널 채우기 이미지를 설정합니다. 둥근 모서리는 설정 ZIP의 투명 PNG를 OBS 알파 마스크 필터에 적용해 처리합니다.

## 연결의 범위

`웹 주소`는 해당 패널 크기의 OBS 브라우저 소스로 표시합니다. 서비스에 구애받지 않으므로 채팅·번역·알림·후원·Discord Reactive 등 OBS 표시용 위젯 주소를 어느 패널에나 넣을 수 있습니다. 외부 위젯의 글꼴·닉네임·시간 표시·소리·작동 상태는 **위젯 제공자**에서 설정합니다. 템플릿의 패널 스타일이 위젯 내부 디자인을 바꾸지는 않습니다. 미리보기의 샘플은 실제 위젯 연결을 대신하지 않습니다.

예를 들어 WEFLAB 등 채팅 서비스나 Speech Translator 등 번역 프로그램이 OBS용 **표시 주소**를 제공하면 사용할 수 있습니다. 이 서비스들은 선택 사항이며 템플릿을 쓰기 위한 계정·프로그램 의존성이 아닙니다. [WEFLAB 공식 채팅 가이드](https://weflab.com/guide/chat.pdf)와 [Speech Translator 공식 안내](https://github.com/speech-translator-ext/speech-translator-readme)는 제공자별 연결법 참고 자료입니다. 서비스별 데이터 인터페이스와 위젯 스타일의 동작은 제공자 문서를 확인하세요.

번역이나 실시간 채팅 위젯처럼 실행 중인 서비스에 의존하는 콘텐츠는 그 서비스를 켜 두어야 표시됩니다. 설정·관리 페이지의 URL과 OBS 표시용 URL은 서로 다를 수 있습니다. 공급자 URL에 개인 토큰이 들어 있으면 설정 ZIP도 비공개로 보관하세요.

외부 알림 위젯을 여러 패널에 배치할 수 있지만, 템플릿은 서로 다른 제공자의 알림을 하나의 대기열로 합치지 않습니다.

이미지/GIF/MP4/WebM은 사용하려는 패널에서 업로드하거나 직접 미디어 URL로 지정합니다. 업로드는 로컬에서 처리됩니다. 자체 영상은 무음 반복이며 외부 위젯 음소거는 제공 프로그램의 설정을 따릅니다.

데모와 전달 ZIP에는 중립적인 플레이어 설정을 사용합니다. 개인용 홍보 이미지, 시즌 배경, 대회 아트워크, 캠 스틸은 전달 ZIP에서 제외하며 원본은 소스 폴더에 보존합니다. 실제 방송용 이미지나 캠은 사용 권한이 있는 파일과 OBS 소스를 별도로 연결하세요.

개인 위젯 URL에는 토큰이 포함될 수 있습니다. `OBS-settings.zip`, `obs-settings.json`, 개인 설정이 들어간 `config.js`를 공개하지 마세요. 개발 폴더에서는 개인 설정과 업로드 자산을 Git에서 제외합니다. `build.py`는 중립 `config.public.js`를 배포 ZIP 안의 `config.js`로 넣고, 배포 자산을 허용 목록으로 제한합니다. 프로젝트 자체 코드는 [MIT 라이선스](LICENSE)를 사용합니다. 번들에 포함된 타사 자산은 각자의 라이선스와 브랜드 사용 조건을 따릅니다.

## 개발과 재현 검증

설정 스키마 `layoutVersion 4`의 `panelContent`는 화면 이름과 별개로 기존 내부 키 `game`, `custom1`~`custom3`, `chat`, `translation`, `hand`를 사용합니다. 각각 `{type, url}` 형식이며 `type`은 `none`, `source`, `web`, `media` 중 하나입니다. 패널 1~7은 이 순서의 사용자용 이름입니다. `source`를 선택했을 때 실제 OBS 소스 지정은 `obs-setup.lua`의 패널별 선택기가 담당합니다. `web`에는 HTTP(S) 위젯 주소, `media`에는 업로드한 로컬 자산 또는 직접 미디어 주소를 사용합니다.

```sh
node --test --test-isolation=none tests/background.test.cjs tests/events.test.cjs tests/pack.test.cjs
python3 -m unittest discover -s tests -p 'test_build.py'
python3 build.py
python3 -m http.server 8873 --bind 127.0.0.1
```

Windows는 Python 명령을 `py`로 바꿀 수 있습니다. 테스트는 Node 기본 테스트 러너, 빌드는 Python 표준 라이브러리만 사용합니다. build.py는 `dist/OBS-Streaming-Template.zip`을 만들고, ZIP 내부 최상위 폴더는 `streaming-template`입니다. 내부 JS/CSS를 internal 폴더로 묶고 HTML·CSS·정적 JavaScript 자산 참조, ZIP CRC·구성·내용을 확인한 뒤 기존 ZIP을 교체합니다. 검증 실패 시 기존 ZIP을 보존합니다. 개인 설정 파일·업로드 자산·개인용 예시 아트워크·오래된 검정 모서리 자산·mock-*.html은 배포되지 않습니다.

미리보기 브라우저 저장값은 OBS와 공유되지 않으므로 설정 ZIP을 실제 폴더에 풀어야 합니다. 업로드 파일 자체는 브라우저에 보관하지 않으므로 설정 화면을 다시 연 뒤 ZIP을 새로 만들 때는 파일을 다시 선택하세요. 일부 브라우저의 로컬 파일 iframe 접근이 막히면 링크 입력/저장은 그대로 사용하고 OBS에서 확인하거나 http://127.0.0.1:8873/preview.html로 개발 미리보기를 엽니다. localhost URL은 실행한 PC에서만 사용합니다.

내보낸 `config.js`의 `layoutVersion 4`에는 패널 1~7 각각의 콘텐츠 형식과 주소가 저장됩니다. 이 파일을 설치 폴더에 덮어쓰면 설정 화면은 그 값을 초기값으로 복원합니다. 같은 파일을 쓰는 동안에는 브라우저의 편집값이 우선하며, 새 설정 파일로 바꾸면 새 파일을 읽습니다. 초기화 기본값은 중립 `config.public.js`에서 가져옵니다. 업로드한 파일을 복원하려면 `config.js`와 `assets/`를 함께 풀어야 합니다.

## 공개 저장소와 자산

이 저장소는 개인 Vault 이력을 가져오지 않은 독립 공개 저장소입니다. 개인 `config.js`, `obs-settings.json`, 설정 ZIP과 검수 자료는 추적하지 않습니다. 공개 중립 설정은 `config.public.js`이며, 배포 빌드는 이를 `config.js`로 넣습니다. 개인 위젯 주소가 포함된 설정 ZIP은 공유하지 마세요.

자체 코드는 [MIT 라이선스](LICENSE)를 사용합니다. Figma Simple Design System 아이콘(CC BY 4.0), Lucide 아이콘(ISC), Inter 폰트(OFL)의 출처와 변경 사항은 [제3자 자산 고지](assets/THIRD-PARTY-NOTICES.md)에 있습니다. GitHub 헤더 링크는 변형 마크 대신 텍스트로 표시합니다.

## Windows와 macOS

두 환경 모두 ZIP 전체를 먼저 풀고, 같은 폴더의 `preview.html`을 브라우저로 엽니다. 설정 ZIP도 `obs-setup.lua`가 있는 폴더에 풀어 같은 이름의 파일을 교체합니다. macOS는 Finder로 압축을 풀 수 있으며 OBS의 도구 → 스크립트에서 Lua 파일을 선택합니다. 경로는 스크립트가 있는 폴더 기준입니다. OBS 소스 목록과 장치 권한은 운영체제마다 다를 수 있습니다.

macOS의 브라우저 파일 열기·카메라 권한·OBS 장치·Lua 적용은 이번 버전에서 실행 검증하지 않았습니다. Windows의 실제 Chrome·OBS 실행 검증 여부는 별도 QA 결과를 기준으로 판단해야 합니다. 로컬 파일의 카메라 지원 여부와 외부 URL 제한은 브라우저와 공급자 정책에 따릅니다.

## Build

Run `python build.py` to create `dist/OBS-Streaming-Template.zip` with neutral defaults. Private local settings are excluded.

## Development

This project uses two permanent branches: `main` for verified snapshots and `dev` for ongoing development and QA. Work on `dev`, then merge into `main` after reviewing the diff and running `node --test tests/*.test.cjs` and `python -m unittest discover -s tests -p test_build.py`.
