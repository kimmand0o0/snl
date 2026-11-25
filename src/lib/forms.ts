/** 폼 처리 공통 함수. 모든 쓰기는 사용자 권한의 Supabase 클라이언트로 하고, 권한 검사는 RLS 가 합니다. */

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
export const opt = (fd: FormData, k: string) => str(fd, k) || null;
export const list = (fd: FormData, k: string) =>
  str(fd, k)
    .split(/[,\n]/)
    .map((s) => s.trim().replace(/^#/, ''))
    .filter(Boolean);

/** http(s) 링크만 허용합니다 (javascript: 같은 주소 차단). */
export const isHttpUrl = (v: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

/** 처리 후 같은 페이지로 돌아가며 상단에 메시지를 띄웁니다. */
export function back(url: URL, msg: string, path = url.pathname, hash = '') {
  const to = new URL(path, url);
  to.searchParams.set('msg', msg);
  return new Response(null, { status: 303, headers: { Location: to.pathname + to.search + hash } });
}

/** Postgres/RLS 오류를 사람이 읽을 수 있는 말로 */
export function explain(err: { message: string; code?: string } | null) {
  if (!err) return '';
  if (err.code === '23505') return '이미 쓰이고 있는 값이에요 (주소나 번호가 겹쳐요).';
  if (err.code === '42501' || /row-level security/.test(err.message)) return '권한이 없어요.';
  if (err.code === '23514') return '입력 형식이 맞지 않아요.';
  return err.message;
}

/** 로그인 후 돌아갈 곳. 다른 사이트로 튕겨 나가지 않도록 같은 사이트 경로만 허용 */
export const safeNext = (v: string) => (v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/');
