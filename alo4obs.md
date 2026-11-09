---
type: hub
created: 2026-10-02
updated: 2026-11-06
tags: [hub, project]
description: "ALO4OBS(Auto Layout Overlay for OBS) 허브. 공개 제품 폴더와 개인 노트(notes·assets·tmp)의 위치만 안내한다."
---

# ALO4OBS — Auto Layout Overlay for OBS

콘텐츠가 서로 가리지 않도록 패널을 자동 배치하는 OBS 오버레이. 현재 상태는 [second-brain의 프로젝트 노트](obsidian://open?vault=second-brain&file=projects%2Falo4obs.md), 결정·요구사항·버전별 기록은 [[notes/project-log|진행 기록]]에 있다.

- 저장소: [kmg200164/alo4obs](https://github.com/kmg200164/alo4obs) · [이슈](https://github.com/kmg200164/alo4obs/issues)

## 제품 (공개, 배포 정본)

| 경로 | 내용 |
| --- | --- |
| `README.md` `CHANGELOG.md` `LICENSE` | 사용자 안내, 변경 기록, MIT 라이선스 |
| `build.py` | 배포 ZIP 빌드 진입점 |
| `template/` | 오버레이 소스(HTML·JS·CSS·Lua, `assets/`) |
| `tests/` | Node(`*.test.cjs`)·Python(`test_*.py`) 테스트 |
| `docs/` | 사용자 문서: `QA.md` `PLUGIN-SUPPORT.md` `release-notes-*` `images/` |
| `docs/dev/` | 메인테이너 문서: 작업 보고, 출시 검증, 개발 기록, 제안서 |
| `downloads/` | 버전별 배포 ZIP (README 다운로드 링크가 가리킴) |
| `vendor/` | 번들 서드파티(Composite Blur 1.6.0) |
| `.github/` | 이슈 템플릿, FUNDING |

## 개인 노트 (DANS, 제품 아님)

| 경로 | 내용 |
| --- | --- |
| `notes/project-log.md` | 결정·요구사항·버전별 진행 기록 (옛 허브 본문) |
| `notes/work-orders/` | 0.8.0·0.8.1 작업 지시문 |
| `notes/planning/` | 구현 계획, 화면 설계 기능 목록, Bento-Overlap 통합 영향 목록 |
| `notes/qa/` | 테스트 결과 |
| `assets/attachments/` | 옛 템플릿 ZIP·원본, QA 메모 (Obsidian 첨부 폴더) |
| `assets/screenshots/` | 2026-10-24 포트폴리오 스크린샷 패키지 |
| `tmp/backup/` | 보류된 패치(Windows-only WIP) |

`docs/`는 제품 문서가 쓰는 이름이라 개인 자료는 넣지 않는다. 제품 소스는 `template/`이라 별도 `src/`는 두지 않는다.

## Folders

- [[assets/assets|assets]]
- [[docs/docs|docs]]
- [[downloads/downloads|downloads]]
- [[notes/notes|notes]]
- [[template/template|template]]
- [[tests/tests|tests]]
- [[tmp/tmp|tmp]]
