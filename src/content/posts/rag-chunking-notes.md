---
title: 청킹 전략 4가지 비교해 본 기록
description: 고정 길이, 문단, 시맨틱, 계층형 — 같은 데이터로 돌려봤다
date: 2026-07-20
author: seoyeon
tags: [llm, rag]
episode: s1/e03
---

1기 발표 때 보여드린 실험의 전체 수치를 정리합니다.

## 실험 설정

평가셋 300문항, recall@5 기준.

| 전략 | recall@5 |
| --- | --- |
| 고정 512 토큰 | 0.61 |
| 문단 단위 | 0.68 |
| 시맨틱 분할 | 0.71 |
| 계층형 (요약 + 원문) | **0.79** |

## 배운 점

임베딩 모델을 바꾸는 것보다 **청킹을 바꾸는 게 더 싸고 효과적**이었어요.

```python
def hierarchical_chunks(doc: str) -> list[Chunk]:
    sections = split_by_heading(doc)
    return [Chunk(summary=summarize(s), body=s) for s in sections]
```
