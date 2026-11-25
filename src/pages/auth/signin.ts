import type { APIRoute } from 'astro';
import { safeNext } from '../../lib/forms';

/** GitHub 로그인 시작. Supabase 가 PKCE 코드 검증값을 쿠키에 넣고 공급자 화면으로 보냅니다. */
export const POST: APIRoute = async ({ request, locals, url, redirect }) => {
  const fd = await request.formData();
  const provider = String(fd.get('provider'));
  if (provider !== 'github') return redirect('/login?msg=지원하지 않는 로그인 방식이에요');
  const next = safeNext(String(fd.get('next') ?? '/'));
  const { data, error } = await locals.supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return redirect(`/login?msg=${encodeURIComponent(error?.message ?? '로그인을 시작하지 못했어요')}`);
  return redirect(data.url);
};

