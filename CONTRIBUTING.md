# 기여하기

SNL 저장소는 누구나 PR을 올릴 수 있어요. 로컬 설치 없이 GitHub 웹에서도 됩니다.

## 웹에서 바로 올리기

1. 고칠 파일을 GitHub에서 열고 ✏️(Edit) 버튼을 누릅니다. 권한이 없으면 GitHub이 자동으로 포크를 만들어 줘요.
2. 수정한 뒤 **Propose changes** → **Create pull request**.
3. 파일(PDF 등)은 `public/materials/` 폴더에서 **Add file → Upload files**로 올리고, 회차 파일에 `/materials/<파일명>`으로 적어 주세요.

## 자주 하는 작업

| 하고 싶은 것 | 파일 |
| --- | --- |
| 발표 자료 추가 | `src/content/episodes/<기수>/eNN.md`의 `materials` |
| 커스텀 카드 | `src/content/cards/<내-id>.html` (`/cast/playground`에서 만들기) |
| 내 프로필 | `src/content/members/<내-id>.md` |
| 블로그 글 | `src/content/posts/<slug>.md` |

자세한 형식은 [README](README.md)를 참고하세요.

## 로컬에서 작업하기

```sh
npm install
npm run dev      # http://localhost:4321
npm run check    # 타입·스키마 검사
```

PR마다 Vercel 미리보기가 만들어지니, 머지 전에 확인해 주세요.
