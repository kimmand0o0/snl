# SNL · Study Night Live

매주 밤 한 명씩 돌아가며 무대에 서는 개발자 스터디 블로그. Astro 정적 사이트로, **모든 데이터는 이 저장소의 파일**이고 멤버는 PR로 기여합니다.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ 에 정적 사이트 생성
```

## 페이지

| 경로 | 내용 |
| --- | --- |
| `/` | 다음 방송 큐카드 · 이번 기수 출연진 · 지난 방송 · 최근 글 |
| `/schedule` | 월간 달력 + 기수별 로테이션 순서 + 회차 목록 |
| `/episodes` | 발표 자료 아카이브 (자료 종류별 필터) |
| `/episodes/s2/e01` | 회차 상세: 자료 임베드, 방송 노트, 관련 글 |
| `/cast` · `/cast/<id>` | 출연진 카드 · 프로필 (커스텀 ↔ 기본 카드 전환) |
| `/cast/playground` | 커스텀 카드 라이브 에디터 |
| `/blog` | 멤버 블로그 |
| `/calendar.ics` | 구글/애플 캘린더 구독 피드 |
| `/rss.xml` | 블로그 RSS |

헤더의 방송 표시등은 방문 시각 기준으로 `D-n` → `TONIGHT` → 🔴 `ON AIR`(발표 시작 후 2시간)로 바뀝니다.

## 데이터 구조

```
src/content/
  seasons.yaml           # 기수: 기간, 시간, 장소, cast(= 발표 순서)
  members/<id>.md        # 멤버 프로필 (본문 = 자기소개)
  cards/<id>.html        # (선택) 커스텀 카드
  episodes/s2/e05.md     # 회차: 날짜, 발표자, 제목, 자료 (본문 = 방송 노트)
  posts/*.md             # 블로그 글 (episode: s2/e05 로 회차 연결)
```

## 새 기수 편성하기

`seasons.yaml`에 기수를 추가한 뒤, 로테이션 스크립트로 회차 파일을 한 번에 만듭니다.

```bash
npm run rotate -- --season s3 --start 2027-01-07 --rounds 2 --skip 2027-02-11 --dry
npm run rotate -- --season s3 --start 2027-01-07 --rounds 2 --skip 2027-02-11
```

`--shuffle`을 붙이면 발표 순서를 무작위로 뽑습니다. 이미 있는 파일은 덮어쓰지 않아요. 날짜를 바꾸거나 순서를 맞바꿀 때는 해당 `eNN.md`의 `date`/`presenter`만 고치면 되고, 휴방은 `status: skipped`로 표시합니다.

## 발표 자료 올리기

`materials`에 링크만 붙이면 종류를 자동으로 감지하고, 임베드할 수 있는 건 페이지 안에서 바로 보여줍니다.

```yaml
materials:
  - https://docs.google.com/presentation/d/.../edit  # 구글 슬라이드 → 임베드
  - https://www.youtube.com/watch?v=...               # 녹화본 → 임베드 (Vimeo, Loom도 지원)
  - https://www.figma.com/...                         # 피그마 → 임베드
  - /materials/s2e05.pdf                              # public/materials 에 둔 PDF → 임베드
  - https://github.com/me/demo                        # 코드
  - https://speakerdeck.com/...                       # 링크 카드
  - url: https://www.notion.so/...
    label: 발표 대본
    type: doc          # 자동 감지 대신 직접 지정 (slides|pdf|video|repo|doc|design|image|post|link)
```

## 커스텀 카드

`/cast/playground`에서 바로 미리 보며 만들 수 있고, 다 만들면 `src/content/cards/<내-id>.html`로 저장해 PR을 올리면 됩니다.

- 크기: 320 × 460. `<style>`, `<script>`, SVG 모두 사용할 수 있습니다.
- 치환자: `{{name}} {{handle}} {{role}} {{tagline}} {{avatar}} {{accent}} {{github}} {{stack}} {{cohorts}}`
- 카드는 `sandbox` iframe(allow-same-origin 없음)에서 실행되므로 사이트의 쿠키나 DOM에는 접근할 수 없습니다.

## 배포

`main`에 머지되면 Vercel이 자동 배포하고, PR마다 미리보기 링크를 붙입니다. 기여 방법은 [CONTRIBUTING.md](CONTRIBUTING.md)를 보세요.

`npm run build` 결과물(`dist/`)은 정적 파일이라 GitHub Pages, Vercel, Cloudflare Pages 어디든 올릴 수 있습니다. 배포 전에 `astro.config.mjs`의 `site`를 실제 주소로 바꿔야 캘린더 구독과 RSS 링크가 맞게 생성됩니다.

> 지금 들어 있는 멤버·회차·글·자료 링크는 모두 **예시 데이터**입니다.
