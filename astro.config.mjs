// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://snl-zeta.vercel.app',
  // 모든 데이터가 Supabase 에 있어서 요청마다 서버에서 렌더링합니다.
  output: 'server',
  adapter: vercel(),
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_ANON_KEY: envField.string({ context: 'server', access: 'secret' }),
    },
  },
  security: { checkOrigin: true },
});
