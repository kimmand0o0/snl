---
title: SNL 호스트 가이드 — 발표 준비부터 아카이브까지
description: 내 차례가 왔을 때 이 사이트에 무엇을 올리면 되는지
date: 2026-10-20
author: jiwoo
tags: [guide]
---

## 1. 내 회차 확인

[편성표](/schedule)에서 내 이름을 찾아요. 캘린더 구독(.ics)을 해두면 놓칠 일이 없습니다.

## 2. 제목 정하기

`src/content/episodes/s2/eNN.md` 의 `title`, `summary` 를 채워 PR을 올립니다.

## 3. 발표 후 자료 올리기

`materials` 에 **링크만** 붙이면 종류는 자동으로 알아봐요.

```yaml
materials:
  - https://docs.google.com/presentation/d/.../edit   # 구글 슬라이드 → 임베드
  - https://www.youtube.com/watch?v=...                # 녹화본 → 임베드
  - https://github.com/me/demo                         # 코드
  - /materials/s2e05.pdf                               # public/ 에 올린 PDF
  - url: https://www.notion.so/...
    label: 발표 대본
```

## 4. 회고 글 쓰기

`src/content/posts/` 에 마크다운을 쓰고 `episode: s2/e05` 를 달면 에피소드 페이지에 자동으로 연결돼요.
