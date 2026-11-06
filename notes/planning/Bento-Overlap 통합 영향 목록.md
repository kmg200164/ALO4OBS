---
parent: "[[ALO4OBS]]"
tags: [project, alo4obs, analysis]
created: 2026-10-30
updated: 2026-10-30
description: "Bento와 Overlap을 하나로 합칠 때 코드·설정·테스트·안내에서 깨지는 곳의 목록. 읽기 전용 조사, 코드 변경 없음."
---

명기가 2026-10-30에 "Bento와 Overlap을 합친다"고 결정했다([[ALO4OBS]] 허브). 이 노트는 합치기 전에 알아야 할 **차이와 깨지는 곳**만 모은다. 기준 코드는 저장소 `dev` `fa8aa1b`(작업 사본 `C:\Users\KMG\Documents\Codex\2026-10-30\task-2\ALO4OBS`)다. 코드는 바꾸지 않았다.

## 한 줄 결론

개념은 합칠 수 있다. 하지만 **배치 계산 방식이 서로 달라서** "메인을 쓰느냐 마느냐"만의 차이가 아니다. 합치려면 배치 모델을 하나로 새로 정해야 한다.

## 두 레이아웃의 실제 차이

| 항목 | Bento | Overlap |
|---|---|---|
| 패널 이름 | 7개: `game`(Main), `custom1~3`(Sub), `chat`·`translation`·`hand`(Side) | 16개: `game` + 5열 × 3행 칸(`panel1_1`~`panel5_3`) |
| 메인 크기 | 한 칸. 비율 16:9 등 설정 가능 | 항상 전체 화면(0, 0, 1920×1080)으로 고정 |
| 배치 계산 | `autoLayout`: 계층 규칙(왼쪽/오른쪽, 위/가운데/아래)과 크기 방식으로 자동 계산 | `overlapLayout`: 5열 격자. 열 너비, 열 켜기/끄기, 행 높이, 세로 위치, 열 정렬 |
| 겹침 | 어떤 패널도 서로 겹치면 안 됨 | 메인만 다른 패널과 겹칠 수 있음 |
| 배경 | 자체 배경(이미지나 색)을 직접 합성 | 메인 영상을 따라감. 패널 채우기·그림자가 메인 위, 내용 아래에 놓임 |
| 흐림 | 설정한 배경 이미지·색을 흐리게 함 | 패널 뒤 실제 영상을 흐리게 함(Composite Blur 플러그인) |
| 기본 간격 | 32px | 24px |
| 패널 최소 높이 | 없음 | 128px |
| OBS 장면 접두사 | `ALO4OBS · BENTO · ` | `ALO4OBS · OVERLAP · ` |
| Lua 파일 이름 | `script-bento.lua` | `script-overlap.lua` |
| 소수점 좌표 | 정수만 | 허용(`allowDecimals`) |

## 설정 데이터

- 저장 형식: `layoutVersion: 4`, `layoutMode`(`bento` 또는 `overlap`), `layoutPresets`(두 레이아웃의 스냅샷을 각각 보관).
- 공통 필드: `panelGap`, `panelEnabled`(단, 키가 서로 다른 집합).
- Bento 전용 필드: `panelPlacement`, `panelSizing`, `sidePosition`.
- Overlap 전용 필드: `overlapPlacement`, `overlapSizing`, `overlapPositions`, `overlapColumnAlignment`, `overlapColumns`.
- 옛 이름 변환표 `legacyOverlapKeys`(예: `custom1` → `panel2_3`)가 이미 있다. 이전에도 한 번 키를 옮긴 이력이다.
- 이미 저장된 Lua와 브라우저 저장소에는 두 레이아웃 데이터가 **둘 다** 들어 있을 수 있다. 합치면 이 둘을 새 구조로 옮기는 변환이 필요하다.

## 코드에서 손대야 할 곳

| 파일 | 줄 수 | 레이아웃 관련 | 내용 |
|---|---|---|---|
| `template/events.js` | 525 | 약 31곳 | 키 목록, `autoLayout`, `overlapLayout`, 스냅샷·프리셋·변환 함수. 가장 핵심 |
| `template/preview.js` | 1101 | 약 68곳 | 설정 화면. Overlap 열 컨트롤(열 1~5, 더 넓은 너비), 위치 모드, 정렬, 안전 가이드 |
| `template/OBS-script.lua` | 1242 | 약 22곳 | 장면 접두사, 겹침 검사, 배경 처리 분기, 채우기·흐림 순서 |
| `template/lua-preset.js` | 334 | 약 10곳 | Lua 저장·불러오기 검증(두 레이아웃 스냅샷 검사) |
| `template/pack.js` | 161 | 약 5곳 | 스크립트 이름 `script-bento.lua`·`script-overlap.lua`, 레이아웃 종류 검사 |
| `template/overlay.js`, `background.js`, `panel-shape.js` | | 각 1곳 | 클래스·배경 분기 |
| 설정 화면 HTML | | | 첫 화면 레이아웃 선택(`#layout-chooser`), 헤더·툴바의 `#change-layout` |
| 가이드 3개 언어, README, FAQ | | | 두 레이아웃 전제의 문장·그림 |

## 테스트

- 테스트 파일 68개 중 레이아웃 이름이 나오는 것이 약 40개다.
- 가장 많은 곳: `layout-presets.test.cjs`(100), `test_overlap_obs.py`(58), `overlap-fixed-export.test.cjs`(49), `preset-entry-ui.test.cjs`(38), `panel-shape.test.cjs`(30), `overlap-position-ui.test.cjs`(29), `overlap-column-controls.test.cjs`(28), `overlap-column-widths.test.cjs`(25).
- 그다음: `test_live_blur.py`, `overlap-default-grid.test.cjs`, `all-panel-height-ui.test.cjs`(각 14), `web-lua-workflow-ui.test.cjs`(13).
- 브라우저 테스트 33개는 이 환경에서 실행되지 않아, 합친 뒤 검증은 브라우저를 쓸 수 있는 환경에서 따로 해야 한다.

## 깨지는 곳(합칠 때 위험)

1. **저장된 설정:** 옛 Lua·브라우저 저장소의 두 레이아웃 데이터. 변환 없이 새 구조로 열면 값이 사라진다.
2. **OBS 장면:** 이미 `ALO4OBS · BENTO · `·`ALO4OBS · OVERLAP · ` 접두사의 장면과 소스가 OBS에 만들어져 있다. 접두사를 바꾸면 옛 장면이 남는다. 허브 기록상 업데이트는 기존 장면을 삭제하지 않는 원칙이다.
3. **스크립트 이름:** 두 이름(`script-bento.lua`, `script-overlap.lua`)이 하나로 바뀌면 이미 등록한 사용자의 스크립트와 짝이 끊긴다.
4. **Composite Blur:** 합치면 모든 사용자가 블러를 쓰게 된다. 플러그인 설치를 안내의 최우선으로 둔 결정과 이어진다.
5. **Bento 전용 기능 소실:** Main·Sub·Side 구조, Side 열 왼쪽/오른쪽 전환, Main 비율, Sub·Side 개수. 합친 모델이 이걸 어떻게 표현할지 정해야 한다.
6. **Overlap 전용 기능:** 5열 격자, 열 너비·정렬, 세로 위치 고정, 128px 최소 높이.
7. **방송 화면 불일치:** 같은 설정이라도 계산 방식이 바뀌면 방송에 나오는 위치가 달라질 수 있다. 옛 설정으로 만든 장면을 그대로 유지하는지 검증이 필요하다.

## 합친 모델 후보(설계 질문, Figma에서 확정)

- **A. Overlap 격자를 기준으로 삼기.** 5열 × 3행 격자와 메인을 기본으로 한다. 메인에 "전체 화면(배경)" 또는 "칸 차지(예: 3열 × 여러 행)" 옵션을 둔다. Bento의 모습은 "메인이 칸을 차지하는" 설정으로 표현한다. 대부분의 사용자가 Overlap이라는 점과 맞다.
- **B. Bento의 계층 규칙을 기준으로 삼기.** 메인을 "전체 화면"으로 바꾸는 옵션만 추가한다. Overlap의 열 격자와 세로 위치 기능은 약해진다.
- **C. 계산 엔진은 둘 다 두고 화면만 합치기.** 코드 변경은 작지만 "하나로 합친다"는 목표에 못 미친다.
- 판단 기준: 사용자가 보는 설정 개수가 줄어드는지, 옛 설정을 그대로 옮길 수 있는지.

## 아직 확인하지 못한 것

- 코드는 핵심 함수와 호출 횟수 위주로 읽었다. 숨은 차이가 더 있을 수 있다.
- 실제 OBS에서의 동작 차이는 보지 못했다.
- 사용자 실제 분포("대부분 Overlap")는 명기 설명이며 별도 근거는 없다.
