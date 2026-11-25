---
title: 새벽 3시의 데드락 — 발표 그 후
description: S2·E01 발표에서 못다 한 이야기와 Q&A 정리
date: 2026-10-31
author: hanbyeol
tags: [postgres, incident]
episode: s2/e01
---

발표 끝나고 받은 질문 중 가장 많았던 건 "그래서 락 순서를 어떻게 강제했냐"였어요.

## 락 순서를 코드로 강제하기

결론은 단순합니다. **항상 id 오름차순으로 잠근다.**

```go
func lockAccounts(ctx context.Context, tx pgx.Tx, ids ...int64) error {
	slices.Sort(ids)
	_, err := tx.Exec(ctx,
		`SELECT 1 FROM accounts WHERE id = ANY($1) ORDER BY id FOR UPDATE`, ids)
	return err
}
```

## advisory lock 은?

다음 회차 숙제였던 advisory lock 은 — 쓸 수는 있지만 트랜잭션 경계를 넘는 순간 디버깅 지옥이 열립니다.

> 락은 적게, 짧게, 같은 순서로.

## 다음에 해볼 것

- `lock_timeout` 을 API 경로에만 짧게
- 데드락 발생 시 Slack 알림
