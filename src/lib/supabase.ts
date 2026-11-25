import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from 'astro:env/server';

/** 요청마다 로그인 쿠키를 읽고 쓰는 Supabase 클라이언트. RLS 가 이 사용자 권한으로 적용됩니다. */
export function serverClient(request: Request, cookies: AstroCookies) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () =>
        parseCookieHeader(request.headers.get('Cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' })),
      setAll: (list) => list.forEach(({ name, value, options }) => cookies.set(name, value, options)),
    },
  });
}

/** 브라우저에서 파일을 바로 Storage 로 올릴 때 쓰는 공개 설정(anon 키는 공개해도 되는 값). */
export const publicConfig = () => ({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY });

export type DB = ReturnType<typeof serverClient>;
