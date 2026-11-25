import type { APIRoute } from 'astro';
import { safeNext } from '../../lib/forms';

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next') ?? '/');
  if (!code) return redirect(`/login?msg=${encodeURIComponent(url.searchParams.get('error_description') ?? '로그인이 취소됐어요')}`);
  const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);
  if (error) return redirect(`/login?msg=${encodeURIComponent(error.message)}`);
  // 아직 출연진 등록 전이면 가입 화면으로
  const { data: me } = await locals.supabase.from('members').select('id').eq('id', data.user.id).maybeSingle();
  return redirect(me ? next : `/join?next=${encodeURIComponent(next)}`);
};
