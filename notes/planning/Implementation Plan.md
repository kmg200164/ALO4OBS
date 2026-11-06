---
parent: '[[ALO4OBS|ALO4OBS]]'
created: 2026-10-02
updated: 2026-10-02
tags: [obs, web_overlay, implementation_plan]
---

## OBS Streaming Template Implementation Plan

> Agentic workers: use superpowers:executing-plans to implement task by task in this chat. No delegation requested.

**Goal:** Figma Template 3의 4열 구조를 지키는 다운로드형 OBS 오버레이와 설정·샘플 미리보기를 만든다.

**Architecture:** 의존성 없는 HTML/CSS/JavaScript. 로컬 파일 실행에 맞춰 ES module fetch 대신 일반 script와 설정 JS를 사용한다. 데이터 normalization과 중복 제거는 DOM 렌더링과 분리한다. 실시간 외부 서비스 연결은 후속 작업이다.

**Tech Stack:** HTML, CSS Grid/Flex, JavaScript, Node 내장 테스트 러너(가용 runtime 확인 후 사용).

**Spec:** [[ALO4OBS|ALO4OBS]]

## Global Constraints

- 코드 위치: `projects/ALO4OBS/Source/`. 개인 지식 문서는 배포 패키지에 넣지 않는다.
- 원본 1920×1080, 4열 456px, gap 32px. Game 1432×805, Bottom y837, Sponsor 456×243, Translation 944×243. Right x1464, Donation 456×250, Chat y282 456×424, Hand y738 456×342.
- DOM은 Left/Game/Bottom(Sponsor,Translation)와 Right(Donation,Chat,Hand)의 Figma 계층을 유지한다. CSS는 명시적인 4열 토큰에서 폭을 계산하고 작은 화면은 전체 캔버스를 비례 축소한다. 스트림 화면을 임의로 재배열하지 않는다.
- Translation padding/gap 32px, panel radius 16, 배경 #1A1A1A. 게임·손캠 자리는 투명하다. 외곽 검정 32px outside stroke는 원본 크기 밖으로 그린다. OBS에서 바깥으로 나간 부분은 캔버스 경계에서 잘릴 수 있음을 안내한다.
- 첫 버전은 실제 API 인증·번역 엔진·판매·공개 배포를 포함하지 않는다. 샘플임을 미리보기에서 명시한다.
- 손캠 미사용은 기본 4열 위치를 유지하고 해당 자리에 중립 로고를 표시한다. 레이아웃 변경 프리셋은 후속으로 분리한다.

## Review Focus

- 긴 자막·긴 닉네임·공백 없는 문자열: 패널 경계를 침범하지 않는다.
- 동일 이벤트 재수신과 여러 플랫폼의 같은 닉네임: 출처를 보존하고 원본 ID 중복만 제거한다.
- 손캠 비활성·알림 없는 상태: 기준선과 게임 크기가 변하지 않는다.
- 로컬 파일 로딩과 잘못된 미디어 경로: 설정과 샘플 실행을 확인하며 미디어 실패는 중립 배경으로 복귀한다.
- 새로고침·영상 반복·샘플 폭주: 저장한 설정을 다시 불러오고 영상은 muted/loop, 표시 기록과 큐는 제한한다.

## Task 1: 4열 오버레이와 로컬 실행

Create: `Source/overlay.html`, `Source/overlay.css`, `Source/config.js`, `Source/assets/neutral-logo.svg`.

Produces: 1920×1080 `.overlay`, Figma와 같은 6개 영역의 `data-region`, 전역 `window.OVERLAY_CONFIG`.

- [x] 위 치수 표를 렌더 측정의 기대값으로 준비한다.
- [x] CSS 4열 토큰과 Flex 계층으로 영역을 구현한다. 참조 이미지 대신 투명 캡처 자리와 중립 홍보물을 사용한다.
- [x] 브라우저에서 실제 각 영역 bounding box를 표와 대조한다. 투명 캡처 자리·radius·축소 가독성을 직접 확인한다.

## Task 2: 공통 이벤트와 표시

Create: `Source/events.js`, `Source/overlay.js`, `Source/tests/events.test.cjs`.

Interfaces: `normalizeEvent(input)` → `{platform,channelId,id,type,nickname,text,timestamp}` 또는 null. `createEventStore(limit)` → `{accept(event),items()}`. `window.Overlay.receive(input)`은 정규화·중복 제거 후 DOM에 텍스트로 표시한다. type은 chat/subtitle/donation/subscription, platform은 chzzk/twitch/youtube/soop/external.

- [x] 테스트: 같은 platform/channel/id 두 번은 한 건, 플랫폼이 다르면 각각 한 건, ID 없는 동일 문구는 별개, 잘못된 type은 거절, limit 초과 시 오래된 기록 제거. 구현 전 실패를 확인한다.
- [x] 최소 이벤트 로직을 구현하고 테스트를 통과시킨다.
- [x] 자막·채팅 렌더와 알림 큐를 연결한다. 최신 자막을 강조하고 overflow는 영역 안에서 처리한다. 긴 메시지는 전체 문자열 보존 상태에서 영역 내 스크롤한다.
- [x] 브라우저로 HTML 주입 문자열·긴 자막·연속 채팅·알림 대기열·손캠 비활성 상태를 확인한다.

## Task 3: 설정·미리보기·패키지

Create: `Source/preview.html`, `Source/preview.js`, `Source/preview.css`, `Source/README.md`.

Consumes: OVERLAY_CONFIG, Overlay.receive. Produces: 저장/불러오기 가능한 config.js 다운로드와 샘플 재생, 플랫폼 표시 필터, 테스트 입력.

- [x] 설정 화면에서 색상·이름·로고·홍보 경로·표시 여부·플랫폼 필터를 수정하고 iframe 미리보기에 즉시 반영한다.
- [x] 저장은 설정 파일 다운로드로 제공한다. OBS와 일반 브라우저가 localStorage를 공유한다고 가정하지 않는다.
- [x] 샘플 자막과 네 플랫폼 채팅·알림을 재생하고 테스트 입력을 제공한다. 미디어 실패를 검증한다.
- [x] README에 OBS 로컬 파일 선택, 1920×1080, 게임/손캠 치수·위치, 설정 파일 교체, 샘플/실시간 차이와 후속 연결 경로를 설명한다.
- [x] 브라우저 기준 검수 후 OBS가 접근 가능하면 로컬 소스를 직접 확인한다. 접근 불가하면 OBS 미검증으로 명시한다.
- [x] 소스만 포함한 ZIP을 생성하고 파일 목록을 확인한다. 프로젝트 상태·task를 실제 완료 범위에 맞춰 갱신한다.

## 검증 한계

코드 및 소스 ZIP 작성 완료. OBS 렌더·실제 영상/외부 위젯 재생·브라우저 ZIP 저장 파일은 미검증이다. 체크 항목은 구현 단계 수행 기록이며 이 검증들을 통과했다는 뜻이 아니다. 최종 손캠 치수는 사용자 추가 요청에 따라 456×243/y837, 후원은 456×243, 채팅은 456×530/y275로 변경했다. 팀 업로드와 설정 ZIP 기능을 추가했다.

## Execution

현재 채팅에서 직접 실행하는 방법을 제안한다. 2026-10-02 사용자 승인으로 직접 실행했다. 새 Codex 채팅이나 외부 저장소를 자동으로 만들지 않는다.
