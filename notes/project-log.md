---
up: '[[alo4obs]]'
created: 2026-10-02
updated: 2026-11-06
tags: [log, alo4obs]
description: "ALO4OBS 결정·요구사항·버전별 진행 기록. 2026-11-06(t301) 구조 정리 때 루트 허브 본문을 여기로 옮겼다."
---

# ALO4OBS 진행 기록

2026-10-06 이름을 OBS Streaming Template에서 **Auto Layout Overlay for OBS**(약칭 ALO4OBS)로 바꿨다. GitHub 저장소 주소는 현재 `kmg200164/ALO4OBS`이다. 최신 요구사항은 아래 0.11.0 절을 따른다. 2026-10-23 중지·재개 상태와 0.9.1 등 이전 절은 당시 기록이며, 현재 0.11.0 dev 구현과 검증 상태는 아래 절에 적었다.

콘텐츠가 서로 가리지 않도록 패널을 자동 배치하는 OBS 오버레이 템플릿이다. 홍보는 자동 정렬(패널끼리 가리지 않음)에 집중하고, 무료·다국어는 내세우지 않는다. OBS 공식 포럼에는 올리지 않는다(AI로 만든 리소스를 받지 않는 정책). 0.11.0은 GitHub Pages 설정 사이트를 사용한다(아래 확정 요구사항).

코드, 사용법, 이슈, 검수 기록, 변경 기록, 배포 파일의 정본은 공개 저장소다. 기존 Windows 원본은 `W:\Project\OBS-streaming-template`이며, 이번 dev 작업 복사본은 아래 구현 상태에 적었다. 이 허브는 현재 상태와 남은 일, 이관 전 Vault 기록의 위치만 적는다.

## 공개 저장소

- [ALO4OBS 저장소](https://github.com/kmg200164/ALO4OBS) — 코드·사용법·버전 관리의 정본. 2026-10-04 생성.
- [피드백과 문제 신고](https://github.com/kmg200164/ALO4OBS/issues)

## 0.11.0 방향과 사용자 피드백 (2026-10-30)

### 확정한 요구사항

- `settings.html`을 내려받아 실행하는 대신 GitHub Pages 설정 사이트에서 직접 편집하거나 기본 프리셋을 고른다.
- 다운로드 버튼은 OBS에서 추가할 커스텀 **Lua 스크립트 단일 파일**을 내려받는다. ZIP 다운로드와 압축 해제 단계는 없앤다.
- **프리셋 자체가 Lua 스크립트다.** 별도 JSON 파일을 프리셋으로 가정하지 않는다. 저장한 Lua를 설정 사이트에 불러오면 설정 패널도 해당 값으로 복원되어야 한다. 프리셋 공유는 부가 기능이다.
- 보통 같은 컴퓨터에서 방송하므로 같은 컴퓨터·브라우저의 설정 자동 저장과 재접속 시 복원을 우선한다. 다른 기기에서 이어 쓰기는 필수 범위에서 제외하고, 필요할 때 Lua 프리셋 내보내기·불러오기로 대응한다.
- 사용자 피드백: 설명이 장황하고 이해·사용이 어려워 사용 의욕이 잘 생기지 않는다. 핵심 사용 흐름은 한 장의 단순한 이미지로 보여준다. 이미지에는 파일명 외 텍스트를 넣지 않는다.

- **사용자 정정:** Lua 스크립트는 배치 설정을 적용하는 파일이다. 영상·이미지 파일을 Lua에 내장하는 요구는 없다. 배치 설정을 Lua 하나로 OBS에 적용하고, 같은 Lua를 사이트에서 불러오면 설정 패널을 복원하는 요구에 집중한다.

- **사용자 결정(2026-10-30, 디자인 재정비 때 함께 반영):** 대부분의 스트리머가 Overlap 레이아웃을 쓰므로 **Composite Blur 플러그인 설치를 안내의 최우선 단계로 둔다.** 지금은 FAQ 항목에 "흐림을 0으로 두면 플러그인이 필요 없다"고만 적혀 있다. 이걸 사용 흐름 맨 앞으로 올린다. 단일 Lua 웹 흐름은 플러그인 파일을 담지 못하므로(옛 ZIP에는 `files/plugin/`과 설치 스크립트가 있었다), 공식 배포처 링크와 OBS 30–32용 설치 방법을 안내가 직접 가리켜야 한다. 공식 v1.6.0 Legacy 빌드가 후보이며 설치·재시작은 아직 미승인·미검증이다.
- **사용자 결정(2026-10-30): UI 강조색은 알로에 하나만 남기고, 라이트/다크는 사용자 컴퓨터의 시스템 설정(`prefers-color-scheme`)을 따른다.** 10색 프리셋과 헤더의 팔레트·라이트/다크 버튼은 없앤다. 방송 화면의 패널 색 설정은 UI 테마와 별개라 그대로 둔다. 코드 반영은 Figma `design-system` 페이지가 나온 뒤 새 화면과 함께 한다(지금 코드는 10색·토글 그대로, 미반영).
- **사용자 결정(2026-10-30): Bento와 Overlap을 하나로 합친다.** 배경도 패널이고, 차이는 그 패널을 메인 소스로 쓰느냐 마느냐뿐이다. 첫 화면의 레이아웃 양자택일(`#layout-chooser`)은 없애고, 처음 쓰는지 묻는 질문(`#first-use`) 하나만 남긴다. 헤더는 이름·버전을 왼쪽에, 버튼 4개(가이드/설정, 언어, 버그 신고, 후원)를 오른쪽에 모으는 안을 Figma에서 확정한다. 코드 반영은 Figma `design-system` 페이지 뒤에 한다(미반영).
- **코드 차이 조사 완료(2026-10-30, 읽기 전용):** [[notes/planning/bento-overlap-통합-영향-목록|Bento-Overlap 통합 영향 목록]]. 한 줄 결론: 개념은 합칠 수 있지만 배치 계산 방식(Bento 계층 규칙 vs Overlap 5열 격자)이 달라서 새 배치 모델을 정해야 한다.
- **새 화면 설계 준비:** [[notes/planning/화면-설계-기능-목록|화면 설계 기능 목록]](초안). 명기가 줄을 지우고 더해 기능을 확정하면 필요한 아이콘이 추려진다. 아이콘은 Figma Lucide 플러그인(v1.65.0)에서 필요한 것만 컴포넌트(`Icon/이름`)로 만든다.
- **결정(2026-10-30): 미리보기를 패널 배치 편집 화면으로 쓰고 모델은 격자 트랙으로 간다.** 열과 행의 크기가 고정(fixed)이거나 채움(fill)이고, 칸을 드래그로 합쳐 패널을 만든다. 터치와 키보드 전용 대안은 고려하지 않는다(스트리머는 PC·마우스 사용). "미리보기"와 "설정"이라는 이름은 없앤다. 둘 다 설정을 위한 하나의 도구이다. 아래는 처음 제안 내용이다.
- **아이디어 원문(2026-10-30): 미리보기 자체를 패널 배치 편집 화면으로 쓴다.** 그리드를 띄우고 드래그한 영역을 하나의 패널로 합친다. 패널 사이 여백에 마우스를 올리면 너비 조절 핸들이 되고, 드래그하면 한쪽은 고정(fixed), 다른 쪽은 채움(fill)이 된다(Figma 오토 레이아웃과 같은 경험). 합치기 전 확인할 점: ① 격자 트랙 모델(칸 합치기)과 중첩 분할 모델(나누기) 중 무엇인지 ② Lua와 JS의 배치 엔진을 같은 규칙으로 다시 만드는 비용 ③ 터치·키보드 대안 ④ 편집 모드와 패널 설정 모드의 구분.
- **합치기 전에 정해야 할 것(Figma에서 확정):** ① 합친 뒤의 기본 배치(대부분 Overlap을 쓰므로 배경이 메인이고 패널이 위에 놓이는 쪽이 기본인지) ② Bento의 Main·Sub·Side 구조와 Overlap의 칸 배치를 어떻게 한 모델로 만들지 ③ 이미 저장된 Lua·브라우저 설정의 두 레이아웃 데이터를 새 구조로 옮기는 변환 ④ 패널 뒤 흐림(Composite Blur)이 모든 사용자에게 걸리는 점(위 플러그인 최우선 안내 결정과 연결).

### dev 구현·검증 상태 (2026-10-30)

- 사용자 지시로 0.11.0 구현을 시작했다. 패널에 직접 넣는 이미지·영상 기능은 유지한다. 단일 Lua를 우선하고, 불가능하면 저장 시 내려받는 파일 수를 최소화한다는 추가 지시를 확인했다.
- 작업 사본: `C:\Users\KMG\Documents\Codex\2026-10-30\task-2\ALO4OBS`, 브랜치 `dev`, 최신 커밋 `529335cf55f92e0dc2c17e14641590eb99302611`. 원격 dev와 일치하고 작업 트리는 clean이다. 기존 main 기반으로 fast-forward한 뒤 구현했으며 main은 `c52b045a0dee25db2bf36bc5eef1df7ce1b68772` 그대로다.
- 기존 `W:\Project\ALO4OBS-development`의 `codex/overlap-development`와 미커밋 `docs/QA.md`, 미추적 제안서·superpowers 문서를 보존했다.
- 구현: 웹 설정 빌드, Lua 한 파일 다운로드·데이터만 읽는 불러오기, 기본 프리셋, 같은 브라우저 자동 저장·복원, 저장된 프리셋 적용 취소. 저장 실패 시 기존 설정을 유지하며 비활성 패널의 미완성 URL도 기존 방식대로 데이터로 보관한다.
- 기존 패널 이미지·영상, 전체 배경 이미지, 패널별 배경 이미지를 유지한다. 원본 미디어는 Lua에 넣지 않는다. 현재 구현에서는 로컬 참조를 OBS 파일 선택 항목으로 연결하고 적용할 때 복사·검증한다. 다른 브라우저의 미디어 미리보기는 원본을 다시 선택해야 한다. 이전 Lua만으로 이후 교체된 원본 파일의 바이트를 복구하지는 못한다.
- 내부 렌더링 코드·폰트·마스크 자동 준비는 단일 Lua를 위한 구현 방식이며 새 사용자 요구로 간주하지 않는다. 개인 원본 자산 내장 요구는 철회된 상태다. 웹 화면에서는 ZIP 저장 동선을 숨기고, 기존 오프라인 편집기의 ZIP 기능은 호환용으로 보존했다.
- 검증: JavaScript 311 통과·33 조건부 생략, Python 63 통과, 로컬 브라우저·오프라인 폰트·헤더 툴팁 검사 7 통과. 최신 공개 HTTPS에서도 Lua 다운로드·재불러오기·자동 저장·Undo·잘못된 가져오기·용량 오류·이미지/유효 WebM·3개 언어 1440/390px 흐름 5 통과. 공개 파일 71개와 매니페스트(총 72개)가 로컬 생성물과 일치하고 config는 중립 기본값이다. LuaJIT 실행 모델과 libobs 파일 API 검사는 실제 OBS 장면 검증과 구분한다.
- **공개 배포 완료:** https://kmg200164.github.io/ALO4OBS/ → settings.html. GitHub Pages 공식 `gh-pages` 루트 게시이며 HTTPS 적용, 최신 게시 커밋 `ce8f7a33d6bd31dd45f81f3b147838e0bd8dde74` 빌드 성공. 저장소 Website도 연결했다. README 최신 흐름은 dev에 반영했다(https://github.com/kmg200164/ALO4OBS/tree/dev). main 기본 README는 main 미변경 원칙에 따라 그대로다. Chrome에 실제 공개 설정·안내 화면과 별도 로컬 작업 현황을 표시했다. 이후 배포 절차는 저장소 `docs/pages-deployment.md`에 기록했다.
- **공개 주소에서 `.html` 제거 (2026-10-30):** 공개 사이트는 `/settings`, `/guide-ko`, `/guide-en`, `/guide-ja`로 열린다(GitHub Pages가 확장자 없는 경로를 `.html`로 연결). 한국어 가이드는 `guide.html`에서 `guide-ko`로 이름을 바꿨다. 공개 사이트 빌드(`build_site.py`)에서만 바꾸고 오프라인 ZIP은 `file://` 때문에 `.html`을 유지한다. dev `fa8aa1b`, gh-pages `265fdbf`. 실제 Chrome에서 `/settings`·`/guide-ko` 열림, 헤더 링크 확장자 없음, 가이드 언어 전환(`guide-ko` → `guide-en`), 루트 `/` → `/settings` 이동을 확인했다. 옛 `guide.html` 주소는 사라졌다. 정본은 저장소 `docs/pages-deployment.md`.
- **인계 (2026-10-30):** ChatGPT 세션은 Reason 실행 기기 없음으로 직접 메시지가 안 닿아, Vault 기록을 근거로 Claude가 이어받았다. 같은 날 `.html` 제거까지 끝냈다. 기존 `setup-workflow.png`(옛 ZIP 6단계)는 그대로 두었고, 안내 이미지는 실제 사이트·OBS 화면 기준으로 마지막 단계에서 새로 만든다.
### 다른 기기·에이전트에서 이어받기 (2026-10-30, `R5.1`~`R5.3`)

명기 설명: 2026년 말까지는 Claude·Codex·Grok Bot·ChatGPT를 함께 쓰고, 이듬해부터 Claude 중심으로 간다. 그때까지 아래 정본만 믿으면 기기·회사가 달라도 이어진다.

- **코드 정본은 GitHub다.** `kmg200164/ALO4OBS`의 **`dev`** 브랜치를 받는다(최신 `e3b0cd1`, 헤더 정리 `c9d7c66` 포함·미배포, 공개 사이트는 `fa8aa1b` 기준). `main`(`c52b045`)에는 `docs/design-system.md`와 `docs/pages-deployment.md`가 없다. main 병합은 미승인이라 하지 않았다.
- **공개 사이트:** `gh-pages` `265fdbf`. 배포 절차와 확장자 없는 주소 규칙은 저장소 `docs/pages-deployment.md`가 정본이다. 배포는 `dev`에서 `python build_site.py` → 결과를 `gh-pages` 체크아웃에 복사 → 일반 push(강제 push 금지)다.
- **Windows 데스크톱에만 있던 자료:** `W:\Project\ALO4OBS-development`(`codex/overlap-development`, `c52b045`)의 커밋 안 된 `docs/QA.md` 6줄 추가, `docs/presets-proposal-0.11.0.md`, `docs/superpowers/plans/2026-10-24-presets-0.11.0.md`. 공개 저장소에 올리지 않고 비공개 Vault에 패치로 보존했다 → `projects/ALO4OBS/Backup/windows-only-wip-2026-10-30.patch`(git 저장소 안에서 `git apply 파일경로`로 복원).
- **이번 작업 사본** `C:\Users\KMG\Documents\Codex\2026-10-30\task-2\ALO4OBS`는 전부 push되어 있어 없어져도 손실이 없다. 다른 기기에서는 새로 clone하면 된다.
- **함정:** 이 저장소는 git `user.name`·`user.email`이 비어 있다. 커밋은 `git -c user.name="Myeong-gi Kim" -c user.email="79262764+kmg200164@users.noreply.github.com" commit`으로 한다(기존 커밋과 같은 noreply 주소).
- **ChatGPT 세션은 Reason으로 직접 닿지 않았다**("Reason 실행 기기 없음"). 메시지로 인계하지 말고 이 절과 위 "dev 구현·검증 상태"를 읽고 시작한다.
- **Claude Code 권한(Windows 데스크톱 전용):** `gh-pages` push는 분류기가 막으므로 `~/.claude/settings.json`에 허용 규칙을 넣었다. 맥북에서 배포하려면 따로 넣어야 한다([audit-device_environment](obsidian://open?vault=second-brain-archive&file=_trash%2Fcore%2FAudits%2Faudit-device_environment)).
- **디자인 정본 (2026-10-30 명기 정정):** Figma 파일 `PHYDbj9r5xSIRrcTWECX0D`의 `sample`·`html`·`theme color` 페이지는 예전에 잠깐 쓴 작업물이라 **현재 기준이 아니다.** 새 기준은 명기가 `design-system` 페이지(지금 비어 있음)에 직접 만든다. 그 전에는 `tests/fixtures/figma-theme-tokens.json`(옛 `theme color`의 10색 팔레트 검수본)과 현재 사이트 화면을 새 디자인의 근거로 삼지 않는다. 명기가 현재 화면에 만족하지 않아 디자인 시스템부터 새로 만든다. 새 시스템이 나오면 그 페이지에서 값을 읽어 저장소 사본(`docs/design-system.md`·토큰 파일)을 새로 만든다. Claude 디자인 시스템 아티팩트도 그때 만든다. 그 전까지 헤더·화면 추가 수정과 공개 배포를 하지 않는다(dev의 헤더 3개씩 정리 `c9d7c66`은 미배포).
- **디자인 규칙 대조·수정:** Vault 0.8.0·0.8.1 작업 지시문, 디자인 시스템 운영 원칙, 저장소 Figma 토큰 fixture와 기존 settings.html을 대조했다. 안내 화면은 기존 guide CSS·컴포넌트를 공유하고 본문 설정 버튼을 제거했다. 헤더 톱니바퀴 아래 hover/focus 툴팁 “설정 열기”와 키보드 이동을 유지한다. 전체 설정·가이드 UI는 자체 포함 Inter 우선이다. 실제 Windows Chrome의 한글은 Malgun Gothic, 일본어는 Yu Gothic UI fallback이며 로컬 오프라인 Inter 로드도 검증했다. 보편 매뉴얼에 Inter 명시 규칙이 있다고 과장하지 않는다. 정본 구현 규칙은 저장소 `docs/design-system.md`에 기록했다.
- **남은 일:** Chrome 외 화면 제어는 승인되지 않아 실제 OBS 등록·원본 파일 선택·장면 렌더 검증은 미실행이다. macOS/Linux 실제 환경 검사와 확정 흐름에 맞춘 파일명 외 텍스트 없는 한 장 안내 이미지도 남아 있다. main 병합, 태그·Release는 하지 않았다. 코드·Pages·Vault 정상 push는 완료했고 진행 중 배포나 승인 차단은 없다.

## Windows 긴급 패치 중지·재개 상태 (2026-10-23 귀가 후 재개)

- 최신 지시로 구현·검증·푸시를 중지했다.
- 10월 23일 학교에서는 AML에 집중한다. ALO4OBS는 귀가 후 Windows에서 재개한다.
- 저장소: `W:\Project\ALO4OBS-development`, 브랜치: `codex/overlap-development`만 사용한다.
- HEAD: `4bd9b3f13ec85d1d5e7d893f42cbcb179d6bfc1f`. 제품 버전은 `0.10.3` 그대로다.
- 기존 미커밋 16개를 보존했다. 이번에는 `tests/panel-shape.test.cjs`의 기대값 두 줄만 추가 수정했다.
- 별도로 `tests/test_live_blur.py`가 미추적 초안으로 저장되어 있다. 제품 블러 구현은 아직 없다.
- 이름 분리 확인 완료: 개인 ZIP에 `OBS-script-Bento.lua` / `OBS-script-Overlap.lua`가 각각 들어간다.
- 이름 분리 검증: Node 292 통과·23 생략, Python 35 통과, 실제 Chrome 양쪽 ZIP 내보내기 통과.
- 그 뒤 추가한 블러 검사 초안은 36개 중 4개 실패했다. 새 기능이 없어 실패한 상태이며 전체 통과로 보고하면 안 된다.
- Bento·Overlap 동시 블러 수정은 승인됐다. 현재 공통 코드는 고정 배경 이미지만 흐리게 한다.
- 구현 후보는 원본 캡처를 선명하게 유지하는 별도 레이어 + Composite Blur다. 아직 제품 코드에 넣지 않았다.
- OBS는 32.2.2다. 표준 경로에서 블러 플러그인은 찾지 못했다. 공식 v1.6.0의 OBS 30–32용 Legacy 빌드가 후보이다.
- 플러그인 다운로드·설치·OBS 재시작은 별도 승인 전 대기다. 실제 움직이는 영상의 OBS 블러 검증은 못 했다.
- 사용자 OBS 장면·송출·녹화는 건드리지 않았다. 음악 위젯 FAQ·버전·CHANGELOG는 제안 상태다.
- 검증 후 ALO4OBS commit·main push는 승인됐지만 최신 중지 지시에 따라 미실행이다. 필수 검사 미완료이므로 지금 push하지 않는다.
- 태그·Release는 미승인이다. Vault 파일 삭제·commit·push도 하지 않았다.
- 귀가 후 첫 단계: 이 절 → git status/브랜치/HEAD와 17개 파일 보존 확인 → 블러 검사 초안 정리 → 설치 승인 확인 → 양쪽 구현·실제 움직이는 입력 검증.
- 재개 시 알려진 블러·ZIP 문제뿐 아니라 사용자가 아직 발견하지 못한 버그도 함께 점검한다.
- 작업 파일은 디스크에 저장됐다. 이 세션이 시작한 실행 중 서버·OBS·설치·푸시는 없다. 데스크톱을 종료해도 이 파일들은 남는다.
- 상세 버전 이력은 전용 저장소의 CHANGELOG와 docs가 정본이다.

## 다음 패치: 레이아웃별 스크립트 이름 (2026-10-19, 포트폴리오 촬영 중 발견)

Bento와 Overlap 개인 ZIP(`Settings-Bento.zip`, `Settings-Overlap.zip`)에 들어 있는 스크립트 파일 이름이 둘 다 `OBS-script.lua`다. 한 스트리머가 두 레이아웃을 함께 쓰면 OBS Tools > Scripts 목록에서 어느 쪽인지 구분되지 않고, 장면(`ALO4OBS · BENTO` / `ALO4OBS · OVERLAP`)을 전환할 때 헷갈린다. 0.10.3(Windows 배포본)에서 확인함. 개발은 Codex가 했고 누락된 업데이트다.

- **패치 내용:** 내보내는 스크립트 이름을 레이아웃에 맞춰 `OBS-script-Bento.lua`, `OBS-script-Overlap.lua`로 바꾼다. OBS 스크립트 목록에서 한눈에 구분되게 한다. 스크립트 안의 설명 글(`script_description`)과 로그 접두어에도 레이아웃 이름을 넣는 것을 검토한다.
- **같이 고칠 곳:** `README.txt`·가이드 3개 언어(`guide.html`, `guide-en.html`, `guide-ja.html`)의 "OBS-script.lua" 문구, 스크립트가 같은 폴더의 `panel-media-*.html`·`config.js`를 찾는 문장("Keep ... beside OBS-script.lua"), 내보내기 코드(`export-runtime.js`), 업데이트·복구 절차의 파일 이름, 테스트.
- **확인할 것:** 두 레이아웃을 한 OBS에 함께 등록했을 때 이름이 충돌하지 않는지, 이미 쓰는 사용자의 업데이트 경로(기존 `OBS-script.lua` 등록 해제 안내), 압축을 푼 폴더가 레이아웃마다 분리되는지.
- **2026-10-19 적용(미커밋):** 개발 폴더 16개 파일 변경. 이름은 `template/pack.js`의 `isolateRuntime`에서 `scriptNames[mode]`로 정해지고, 저장 완료 문구(`preview.js`·`i18n.js` 3개 언어)도 따른다. Lua 오류 문구는 "beside this script"로 바꿔 파일 이름에 의존하지 않는다. README.txt·가이드 3개 언어에 같은 폴더 공존 안내와 옛 `OBS-script.lua` 등록 제거 안내를 넣었다. 내부 소스 이름(`template/OBS-script.lua`, `build.py` 키)은 유지했다. 검수에서 Node 315건(292 통과·0 실패·23 브라우저 skip), Python 35건·빌드 검증 통과를 직접 재확인했다. **남은 것:** 커밋·CHANGELOG·버전(명기 님 결정), 실제 OBS에서 두 스크립트 동시 로드 확인, 브라우저 테스트 23건, `assets/setup-workflow.png` 그림 속 옛 이름(캡션만 "예시"로 보강).
- **지금 상태(패치 전 기록):** 포트폴리오 스크린샷은 어쩔 수 없이 패치 전 이름(`OBS-script.lua`)으로 찍되, 촬영할 때 파일 이름을 레이아웃에 맞게 바꿔서 보여 준다(포트폴리오 설명에는 "다음 버전 예정"으로 적지 않고 실제 패치 뒤 정리한다).
- **작업 위치:** `W:\Project\ALO4OBS-development`(`codex/overlap-development` 브랜치). 브랜치 전환·릴리스는 명기 님이 정한다.
## 이전 상태 (2026-10-06 15:20, GitHub 기준)

Fredy가 읽기만 해서 확인했다. Windows PC가 꺼져 있어 Windows 폴더에 push하지 않은 커밋이나 커밋하지 않은 변경이 있는지는 확인하지 못했다.

- **버전:** 0.7.1(`template/version.js`). 마지막 커밋 `3b44626` "docs: pin verified 0.7.1 download"(10/5 23:44). `dev`와 `main`이 같고, 태그와 Release는 아직 없다.
- **0.4.0 이후 바뀐 것:** 0.4.x에서 일곱 패널 번호와 `OST ·` 장면 구조, 내보낸 설정 복원, JSON 내보내기, `settings.html`. 0.5.0에서 `OBS-script.lua`를 포함한 완전한 패키지. 0.5.1에서 저장 창과 LICENSE.txt. 0.6.0에서 Auto/Manual 크기 조절과 업로드 파일 복원. 0.7.0에서 1번 패널 비율 선택. 0.7.1에서 2~4번 패널 최소 폭 206px. 자세한 내용은 저장소 CHANGELOG에 있다.
- **라이선스:** 코드는 MIT(Copyright (c) 2026 KMG). 타사 자산은 THIRD-PARTY-NOTICES에 Figma SDS 아이콘(CC BY 4.0), Lucide(ISC), Inter(OFL)로 적혀 있다. 공개 자산은 Inter 폰트, 문서용 PNG 3개, 인라인 SVG뿐이다.

## 이전 출시 계획 (2026-10-06 당시)

1. **10/7부터 Windows에서 할 수정**(명기가 Codex나 Claude Code로 진행, 지시문은 Jecky가 작성). 모두 아직 시작하지 않았다. 붙여 넣을 지시문 전문과 봇 논의 기록은 [[notes/work-orders/0.8.0-작업-지시문|0.8.0 작업 지시문]]에 있다(정본).
   - 언어 아이콘을 지구본에서 Lucide `languages`로 바꾸고, THIRD-PARTY-NOTICES에 이름을 추가한다.
   - 저장된 언어가 없으면 브라우저 언어를 따른다. 지금은 무조건 영어로 시작한다(`i18n.js:307`).
   - 패널 이름(Main·Sub·Side), Side 위치 조정 제거, 빈 공간 경고(아래 명기 결정).
   - 이름을 ALO4OBS로 바꾼다. README, HTML title, 헤더 제목, `i18n.js`, `build.py`, `OBS-script.lua` 장면 이름에 옛 이름이 남아 있다. 장면 접두사 `OST ·`도 `ALO · `로 바꾸고, README에 업데이트 방법을 적는다(아래 명기 결정).
2. **남은 검수**(`docs/QA.md`): 0.6·0.7을 실제 OBS에 적용해 보기, Windows 기본 압축 풀기, 0.4.0 Lua와 접힌 그룹 실기 확인, `file://`로 열었을 때 브라우저 저장, 저장 창으로 ZIP 받기, Chrome에서 받은 ZIP을 OBS에 적용하기, 적용 실패 시 롤백. Windows 전용으로 내면 Mac 확인은 출시 조건이 아니다.
3. **자산 권리 확인**(자산 출처 기록에 남은 것): Figma 아이콘을 하나씩 대조하기, GitHub 로고 사용 정책, `header.js` 인라인 SVG 출처, Inter 버전과 해시 기록.
4. **출시 절차**(`docs/QA.md:62-64`): `dev`에서 수정 → 검증 → `main`에 병합 → 태그 → Release에 ZIP 첨부. 이때 저장소 주소를 `ALO4OBS`로 바꾸고, 버전을 0.8.0으로 올리고 ZIP 이름에 버전을 붙이며(`ALO4OBS-v0.8.0.zip`, 하이픈 형식) README 다운로드 링크도 함께 바꾼다. README는 간결하게 다시 쓴다.
5. **출시 뒤:** Jecky가 시연 영상을 만들고 Maki가 게시글을 쓴다. 첫 게시부터 댓글·질문 답장 초안과 버그 제보 정리는 Maki가 맡는다. 밖으로 나가는 글은 모두 명기 승인 후에 보낸다.

## 명기 결정 (2026-10-06)

- **OBS 장면 접두사는 `OST ·`에서 `ALO · `로 바꾼다.** `OBS-script.lua` 33곳과 테스트 9곳이 대상이다. 새 스크립트는 예전 장면을 알아보지 못하므로, README에 업데이트 방법을 적는다: 예전 `OST ·` 장면을 통째로 지우고 → 새 ZIP으로 다시 설정하고 → 스크립트를 다시 올린다. 롤백은 같은 버전 안에서만 된다는 것도 함께 적는다.
- **정식 버전은 0.8.0이다.** 다운로드 파일 이름은 하이픈 형식 `ALO4OBS-vX.Y.Z.zip`이다(2026-10-07 명기 최종 결정, Maki 전달). 같은 날 아침 잠깐 밑줄 형식 `ALO4OBS_vX.Y.Z.zip`이 전달됐지만 취소됐다. build.py는 이미 하이픈 형식이라 그대로 두고, 공개 `downloads/` 파일과 README 링크만 맞춘다. 첫 정식 Release는 0.8.1로 낸다(0.8.0은 태그·Release 없이 main에만 있음).
- **패널 이름을 역할대로 바꾼다.** `패널 1~7` 대신 Main, Sub 1, Sub 2, Sub 3, Side 1, Side 2, Side 3으로 부른다. Sub은 예전 이름이 Bottom이었지만 Main과 위아래를 바꿀 수 있어서 Sub으로 정했다. Sub과 Side 번호는 화면에 놓이는 순서(왼쪽에서 오른쪽, 위에서 아래)와 맞춘다.
- **Side 위치 조정은 뺀다.** 너비와 높이를 직접 정할 수 있으니 Side는 켜기·끄기만 남긴다. 위아래 바꾸기는 Main과 Sub에만 둔다. → 0.8.1에서 일부 되돌림: 2026-10-07 명기 결정으로 Side 열 전체를 왼쪽/오른쪽으로 바꾸는 스위치를 넣는다(Main/Sub 위아래 바꾸기와 같은 방식). 이유는 Side는 옆에 붙는 패널일 뿐 오른쪽에 고정된 패널이 아니기 때문이다. 0.7.x의 패널별 위치 조정은 되살리지 않는다.
- **빈 공간 경고를 띄운다.** Sub 세 개가 모두 Manual이고 너비 합이 위쪽 왼쪽 프레임에 모자라면 빈 공간이 생긴다(명기가 10/5 직접 확인). 패널을 마음대로 자동으로 바꾸지 않고 "Sub 패널 하나의 너비를 자동으로 바꾸면 채워진다"는 경고만 띄운다. 저장과 OBS 적용은 막지 않는다.
- **README에 최신 패치노트를 보여 준다.** 일반 사용자는 CHANGELOG를 모르므로, README 다운로드 링크 근처에 "이번 버전에서 바뀐 점"(최신 버전 하나, 짧게)을 넣고 전체 기록은 CHANGELOG 링크로 넘긴다. 정식 Release 본문에도 같은 패치노트를 붙이고, 다음 버전부터는 Release 절차에 "README 패치노트 교체"를 넣는다.
- 내보낸 설정 파일의 키는 바꾸지 않는다. 화면에 보이는 이름만 바꿔서 예전 설정도 복원되게 한다(Fredy 지시문 판단).
- **헤더를 다시 짠다.** 가이드 버튼 아이콘을 펼친 책(Lucide `book-open`)으로 바꾼다. 서비스 이름 `ALO4OBS` 오른쪽에 버전, GitHub, 버그 신고, 후원 버튼을 묶어 이름과 함께 왼쪽에 둔다. 후원 버튼은 Buy Me a Coffee(https://buymeacoffee.com/kmg200164, Maki 확인) 하나만 연결한다. 나머지 버튼은 오른쪽 정렬을 유지한다. 설정과 가이드는 라이트/다크 모드처럼 버튼 하나로 전환하는 방식으로 한다. 처음엔 `설정 | 가이드` 두 칸 탭으로 정했지만 Claude·Codex 결과물이 마음에 들지 않아 명기가 전환 방식으로 바꿨다(2026-10-07 확인, 이것이 최종).
- **간격은 슬라이더 하나로 5단계를 고른다.** 패널 사이 간격과 바깥 여백에 같은 값이 들어가고, 8/16/24/32/48(px) 중 기본값은 넓음(32)이라 기존 화면은 그대로다. 여백 0은 패널 테두리가 없던 초기 시안 방식이라 빼고, 방송인이 설정하기 쉽게 둘을 합쳤다(명기 20:55 결정, 이전의 간격·여백 따로 안을 대체).
- **0.9.0 Sub 최소 너비 기준(2026-10-08 사용자 재확인).** Main이 16:9일 때 남는 Sub 행 높이를 각 Sub 패널의 최소 너비로 사용해 최소 상태가 1:1이 되게 한다. 현재 Main 비율이나 Side 위치에 따라 기준을 다시 잡지 않는다. 1920×1080 화면, Side 폭 440px, 공통 바깥/패널 간격 8·16·24·32·48px에서는 각각 237·227·216·206·185px이다. 이 값은 고정 폭이 아니라 최소값이며 더 넓게 늘릴 수 있다.
- Windows 작업 폴더 이름 변경은 아직 계획에 없다.

## 이관 전 Vault 기록

아래는 공개 저장소로 옮기기 전 기록이다. 지금 제품 사양이나 사용법으로 쓰지 않는다.

- `Source/`는 0.4.0-dev.1(10/4) 사본이라 공개판보다 많이 뒤처져 있다. `OBS-script.lua`, `settings.html`, `upload-storage.js`가 없고, 옛 `obs-setup.lua`·`preview.html` 구조다. `Source/assets/`에는 개인 파일과 권리를 확인하지 않은 파일(플랫폼 파비콘, 대회 이미지, 손캠 샘플, 게임 로비 이미지, 개인 설정)이 있으니 공개 저장소로 옮기지 않는다.
- [[notes/qa/test-results|테스트 결과]] — v0.3.2까지의 검증 기록.
- [[notes/planning/implementation-plan|구현 계획]] — 최초 구현 설계.
- [[README|사용 안내(0.4.0-dev.1)]], [[CHANGELOG|변경 기록(0.4.0-dev.1까지)]], 경쟁 제품 비교, 플랫폼 아이콘 출처

## 0.9.1 현재 상태 (2026-10-08 Windows 확인)

- **main 반영 완료:** 사용자 Chrome 검수·승인 뒤 0.9.1 구현과 문서를 커밋·push했다. 현재 원격 main은 [`74d5902`](https://github.com/kmg200164/ALO4OBS/commit/74d590284242d2e14a82a862e62a9328d7bfd85e)이다. [README](https://github.com/kmg200164/ALO4OBS)에서 `ALO4OBS-v0.9.1.zip`을 다운로드한다. 기존 0.9.0 ZIP은 바이트와 SHA-256을 유지했다. 태그·GitHub Release·SNS 게시를 수행하지 않았다.
- **변경 정본:** [CHANGELOG](https://github.com/kmg200164/ALO4OBS/blob/main/CHANGELOG.md)와 [0.9.1 작업 보고](https://github.com/kmg200164/ALO4OBS/blob/main/docs/dev/work-report-0.9.1.md). 개별 패널/전역 슬라이더 통일, 모드별 카드 불투명도, pure white/black 입력·선택 필드, 체리·풍선껌 라이트 강조색 내부 흰 글자, 영역 스타일 구분선, 점진적으로 펼치는 3개 언어 가이드와 인포그래픽, 강조색 카드 호버/내부 파일명 반전, 패널 호버·선택 배율 오차를 고쳤다. 기존 0.9.0 요구를 유지했다.
- **검증:** Chrome 렌더 검사를 포함한 JavaScript 221개·Python 13개 통과, ZIP CRC·구성·버전 확인. 격리된 Windows OBS 32.2.2에서 0.9.0 개인 설정을 0.9.1로 옮겨 원본 소스 설정·필터, 다른 장면 위치, OST 장면·그룹, ALO4OBS 장면 재사용과 재적용 시 중복 없음을 확인했다. 이후 설정 편집기 CSS·가이드·호버 수정은 Chrome에서 확인했으며 최종 ZIP으로 실제 OBS 검증을 다시 했다고 쓰지 않는다.
- **남은 검수:** 실제 `file://` 편집기·Windows 압축 해제/파일 선택·저장/재열기 전체 흐름, 원본 캡처·카메라·개인 위젯, 실제 실패 복구, 같은 ZIP의 Mac 검수와 촬영. OBS 30.1은 필요한 API의 최소 버전이며 실제 검증 버전은 Windows 32.2.2뿐이다. 체리·풍선껌 라이트 강조색의 작은 흰 글자는 4.5:1 대비 기준 미달이며 사용자 시각 검수에 따른 예외로 보고했다.
- **업데이트 보존:** 일반 ALO4OBS 업데이트는 기존 장면을 삭제하지 않는다. 적용된 `config.js`와 참조한 개인 자산을 새 배포 폴더로 옮기고 새 개인 ZIP을 저장·전체 해제한 뒤 원본 OBS 소스를 다시 선택하고 적용한다. 구 OST 이관은 별도 ALO4OBS 장면과 공존시킨다. 아래 10/6의 OST 장면 삭제 지시는 최신 절차가 아니며 실행하지 않는다. 세부 설치·업데이트·복구 경계는 공개 README를 따른다.
- **다중 기기 작업 시작:** 이 Vault에서 ALO4OBS 기록을 수정하기 전에 원격을 fetch해 차이를 확인하고, 로컬 변경을 백업·보존한 뒤 승인된 pull/merge를 마친다. 이번에 Mac의 19개 커밋을 fast-forward한 뒤 Windows Sub 최소 너비 메모를 복원했다. `.obsidian/graph.json`은 Windows 표시 설정을 유지하고 Mac 설정은 백업·원격 이력에 보존했다.

## 공개 저장소 언어 (2026-10-08 사용자 결정)

GitHub 공개 저장소의 README·CHANGELOG·QA·작업 보고·Release 문안 등 설명 문서는 영어로 쓴다. 번역은 브라우저 기능에 맡긴다. 제품의 한국어·일본어 UI와 가이드 콘텐츠는 다국어 기능으로 유지한다. [영어 작업 보고](https://github.com/kmg200164/ALO4OBS/blob/main/docs/dev/work-report-0.9.0.md)와 [영어 QA 문구](https://github.com/kmg200164/ALO4OBS/blob/main/docs/QA.md)를 10/8 main 커밋 [`a26fc06`](https://github.com/kmg200164/ALO4OBS/commit/a26fc06103ca83e5459b843eb40ed46cc0ec791d)으로 반영했다. 공개 Markdown·workflow 문서의 한글 검색은 당시 0건이었다. 0.9.1에서는 [공개 README의 Documentation language](https://github.com/kmg200164/ALO4OBS#documentation-language)에 영어 작성 원칙을 명시했다(`74d5902`). 공통 AGENTS 지침에 프로젝트 전용 규칙을 넣지 않는다.

## 0.9.0 기록 (2026-10-08 당시)

- [공개 README](https://github.com/kmg200164/ALO4OBS)에서 `ALO4OBS-v0.9.0.zip` 다운로드를 확인했다. main 커밋 [`8e7abad`](https://github.com/kmg200164/ALO4OBS/commit/8e7abad5bafc7824b1e2cb404416341dc72ee1a6)은 10/8 00:58 KST에 올라왔다. 0.9.0에는 Side 좌우 전환과 Figma에서 승인한 10종 × 라이트/다크 UI 색상이 반영됐다. [CHANGELOG](https://github.com/kmg200164/ALO4OBS/blob/main/CHANGELOG.md), [작업 보고](https://github.com/kmg200164/ALO4OBS/blob/main/docs/dev/work-report-0.9.0.md).
- [QA 기록](https://github.com/kmg200164/ALO4OBS/blob/main/docs/QA.md)은 Node 212/212·Python 12/12 및 배포 ZIP 검증을 보고한다. 0.9.0의 직접 `file://` 열기·ZIP 저장/복원·실제 OBS 적용·Mac 검수는 아직 확인되지 않았다. GitHub 태그와 Releases 페이지도 비어 있다. 첫 정식 GitHub Release가 완료됐다고 쓰지 않는다.
- 마케팅 영상은 이 0.9.0 ZIP을 실기 검수한 뒤 실제 설정·OBS 결과로 촬영한다. 계획·게시 경계는 [10-12 마케팅 시안](obsidian://open?vault=second-brain&file=memory%2F1-experience%2F%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EC%82%AC%EA%B4%80%ED%95%99%EA%B5%90-7%EA%B8%B0%2Fportfolio-overview%2F10-12-%EB%A7%88%EC%BC%80%ED%8C%85-%EC%8B%9C%EC%95%88%2F10-12-%EB%A7%88%EC%BC%80%ED%8C%85-%EC%8B%9C%EC%95%88)을 따른다.

## 0.8.0 이후 기록 (2026-10-07 당시)

- 0.8.0 코드는 main(`7603968`)에 올라갔고 저장소 이름은 `kmg200164/ALO4OBS`로 바뀌었다. 태그·GitHub Release는 아직 없다.
- 0.8.1 최종 지시문: [[notes/work-orders/0.8.1-작업-지시문|0.8.1 작업 지시문]] (Codex가 이 문서를 읽고 수행).
- **10/7 추가 요구:** 설정 UI는 알로에 기본 + 한정 프리셋(light/dark별 배경·표면·강조 semantic 토큰)으로 바꾼다. 방송 출력의 사용자 색 설정과 UI 테마는 분리한다. 구현 범위·색 후보·호환·검수는 위 지시문이 소유한다.
- **홍보는 실제 설정 영상 중심.** 0.8.1 Windows 구현·검수·ZIP 생성과 사용자 확인 뒤 같은 빌드로 Mac 테스트·촬영을 진행한다. 더미 캐러셀은 메인에서 제외. 촬영 구성과 캡션·공개 조건은 [10-12 마케팅 시안](obsidian://open?vault=second-brain&file=memory%2F1-experience%2F%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EC%82%AC%EA%B4%80%ED%95%99%EA%B5%90-7%EA%B8%B0%2Fportfolio-overview%2F10-12-%EB%A7%88%EC%BC%80%ED%8C%85-%EC%8B%9C%EC%95%88%2F10-12-%EB%A7%88%EC%BC%80%ED%8C%85-%EC%8B%9C%EC%95%88)이 소유한다.
- 남은 마무리(0.8.1): 버전 0.8.1로 올리기, 공개 다운로드 파일을 `downloads/OBS-Streaming-Template.zip` → `downloads/ALO4OBS-v0.8.1.zip`으로 바꾸고 README 링크 맞추기(build.py는 그대로), Side 열 왼쪽/오른쪽 전환 스위치 추가(기본 오른쪽), CHANGELOG 0.8.1·`docs/release-notes-0.8.1.md`. 명기가 집 Windows 데스크톱에서 Codex에 시킨다. 커밋·push 전 보고하고 멈추게 했다.
- 명기 승인 뒤: 커밋·push → `v0.8.1` 태그 → Release(ZIP 첨부, `docs/release-notes-0.8.1.md`) → 저장소 설명을 "An OBS overlay that auto-arranges your panels so they never overlap."로 변경.
- Release가 나오면 Jecky가 Maki에게 알리고, Maki가 X 게시글(한국어·영어, 초안의 0.8.0은 0.8.1로 고침)을 명기 승인 뒤 올린다. 초안은 Maki가 조사한 내용에 있다.
- 파일 이름을 바꾸면 예전 `OBS-Streaming-Template.zip` 링크는 끊긴다.

## 사용자 결정 대기 — 패치 마무리 (2026-10-26, tasks-user에서 이관)

개발 저장소 `W:\Project\ALO4OBS-development`(브랜치 `codex/overlap-development`, 커밋 안 된 변경 16개). 슬라이드 먼저, 패치는 그 다음.

1. 스크립트 이름 구분(`OBS-script-Bento.lua`·`OBS-script-Overlap.lua`): 미커밋 16개에 일부 들어 있음, README는 이미 이 이름으로 안내.
2. Overlap 블러: 패널 채우기가 실제 게임 화면이 아니라 배경 이미지를 흐려 고정됨. 채팅 패널이 흐린 배경으로 보임. 고치기.
3. Bento도 같은 방식인지 확인.
4. 음악 위젯 안내: URL 복사 경로가 MSIX 가상화로 틀린 경로라는 점을 설치 안내·FAQ에 넣을지 결정.
5. 커밋·푸시·버전·CHANGELOG 결정. GitHub Releases가 비어 있으니 이때 릴리스도 올릴지 정하기.
