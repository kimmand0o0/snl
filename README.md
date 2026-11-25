# SNL · Study Night Live

매주 밤, 한 명씩 돌아가며 발표하는 개발 스터디 SNL의 사이트입니다. https://snl-zeta.vercel.app

- **출연진**: GitHub로 로그인 → 초대 코드 입력 → 프로필·커스텀 카드를 직접 꾸밉니다.
- **편성표**: 관리자가 기수를 만들고 출연 순서를 정하면 발표 날짜가 자동으로 배정됩니다. 캘린더 구독(.ics) 지원.
- **다시보기**: 발표자가 회차 페이지에서 링크를 붙이거나 파일(PDF 등, 50MB까지)을 올립니다. 구글 슬라이드·유튜브·피그마·PDF는 페이지 안에서 바로 보여요.
- **블로그**: 출연진이 사이트에서 마크다운으로 글을 씁니다.

## 누가 무엇을 할 수 있나

| | 방문자 | 출연진 | 발표자(그 회차) | 관리자 |
| --- | --- | --- | --- | --- |
| 모든 페이지 보기 | ✓ | ✓ | ✓ | ✓ |
| 내 프로필·카드·글 | | ✓ | ✓ | ✓ |
| 회차 제목·노트·자료 | | | ✓ | ✓ |
| 기수·편성·초대 코드·출연진 관리 | | | | ✓ |

권한은 Supabase RLS로 DB에서 강제됩니다 (`supabase/migrations`). **처음 가입한 사람이 관리자**가 되고, 초대 코드는 `/admin`에서 확인·변경합니다.

## 구조

- Astro(SSR) + `@astrojs/vercel`, 서울 리전(icn1)
- Supabase: Auth(GitHub), Postgres, Storage(`materials` 버킷)
- 커스텀 카드는 `allow-same-origin` 없는 sandbox iframe에서 실행돼 사이트 쿠키·DOM에 접근할 수 없습니다.
- 사용자가 쓴 마크다운은 `sanitize-html`로 정리한 뒤 렌더링합니다.

## 로컬 개발

```sh
npm install
supabase start                 # Docker 필요. 마이그레이션이 자동 적용돼요 (API 55421 포트)
SUPABASE_URL=http://127.0.0.1:55421 SUPABASE_ANON_KEY=<supabase start 가 알려주는 Publishable 키> npm run dev
```

로컬에서는 OAuth 대신 Supabase 대시보드(또는 `supabase` CLI)로 이메일 계정을 만들어 테스트할 수 있어요.

## DB 변경

`supabase/migrations/`에 새 SQL 파일을 추가하고, 운영 DB에는 `psql "$POSTGRES_URL_NON_POOLING" -f <파일>`로 적용합니다 (`vercel env pull .env.local`로 접속 정보를 받을 수 있어요).
