import { defineMiddleware } from 'astro:middleware';
import { serverClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (ctx, next) => {
  // Redirect URL 허용 목록에 없으면 Supabase 가 Site URL(/?code=…)로 돌려보내요. 그 경우도 로그인 처리로 넘깁니다.
  const code = ctx.url.searchParams.get('code');
  if (ctx.url.pathname === '/' && code) return ctx.redirect(`/auth/callback?code=${encodeURIComponent(code)}`);

  const supabase = serverClient(ctx.request, ctx.cookies);
  ctx.locals.supabase = supabase;
  ctx.locals.user = null;
  ctx.locals.me = null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    ctx.locals.user = user;
    const { data } = await supabase.from('members').select('*').eq('id', user.id).maybeSingle();
    ctx.locals.me = data;
  }

  const path = ctx.url.pathname;
  const back = encodeURIComponent(path + ctx.url.search);
  if ((path.startsWith('/me') || path.startsWith('/admin') || path.startsWith('/blog/write')) && !user)
    return ctx.redirect(`/login?next=${back}`);
  if (user && !ctx.locals.me && (path.startsWith('/me') || path.startsWith('/admin') || path.startsWith('/blog/write')))
    return ctx.redirect(`/join?next=${back}`);
  if (path.startsWith('/admin') && !ctx.locals.me?.is_admin) return ctx.redirect('/me');

  const res = await next();
  // 로그인 상태에 따라 내용이 달라지므로 공유 캐시에 저장하지 않습니다.
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
});
