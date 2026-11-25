// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // 배포 주소로 바꿔주세요 (RSS·캘린더 구독 링크에 쓰입니다)
  site: 'https://snl.example.com',
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed', wrap: true },
  },
});
