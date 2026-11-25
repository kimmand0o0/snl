import type { DB } from './supabase';
import type { MaterialInput, MaterialType } from './materials';

/* ───────── DB 행 ───────── */
export type MemberRow = {
  id: string;
  slug: string;
  name: string;
  role: string;
  tagline: string | null;
  avatar_url: string | null;
  accent: string;
  stack: string[];
  github: string | null;
  blog: string | null;
  links: { label: string; url: string }[];
  bio: string;
  card_html: string | null;
  is_admin: boolean;
  created_at: string;
};
type SeasonRow = {
  id: number;
  number: number;
  title: string;
  theme: string | null;
  start_date: string;
  end_date: string | null;
  time: string;
  place: string;
};
type CastRow = { season_id: number; member_id: string; position: number };
type EpisodeRow = {
  id: number;
  season_id: number;
  number: number;
  date: string;
  time: string | null;
  presenter_id: string | null;
  title: string;
  summary: string | null;
  tags: string[];
  status: 'scheduled' | 'done' | 'skipped';
  notes: string;
};
export type MaterialRow = {
  id: number;
  episode_id: number;
  url: string;
  type: MaterialType | null;
  label: string | null;
  file_path: string | null;
  created_by: string | null;
};
type PostRow = {
  id: number;
  slug: string;
  author_id: string;
  title: string;
  description: string | null;
  body: string;
  tags: string[];
  episode_id: number | null;
  draft: boolean;
  published_at: string;
};

/* ───────── 화면에서 쓰는 모양 ───────── */
export type Member = {
  id: string;
  uid: string;
  bio: string;
  card: string | null;
  isAdmin: boolean;
  data: {
    name: string;
    handle: string;
    role: string;
    tagline?: string;
    avatar?: string;
    accent: string;
    stack: string[];
    github?: string;
    blog?: string;
    links: { label: string; url: string }[];
  };
};
export type Season = {
  id: string;
  dbId: number;
  data: {
    number: number;
    title: string;
    theme?: string;
    start: Date;
    end?: Date;
    time: string;
    place: string;
    cast: { id: string }[];
  };
};
export type Episode = {
  id: string;
  dbId: number;
  body: string;
  presenterUid: string | null;
  materialRows: MaterialRow[];
  data: {
    season: { id: string };
    number: number;
    date: Date;
    time?: string;
    presenter: { id: string };
    title: string;
    summary?: string;
    tags: string[];
    status: 'scheduled' | 'done' | 'skipped';
    materials: MaterialInput[];
  };
};
export type Post = {
  id: string;
  dbId: number;
  body: string;
  authorUid: string;
  data: {
    title: string;
    description?: string;
    date: Date;
    author: { id: string };
    tags: string[];
    episode?: { id: string };
    draft: boolean;
  };
};

/** 날짜는 모두 KST 기준 YYYY-MM-DD 문자열로 비교합니다. */
export const ymd = (d: Date) => d.toISOString().slice(0, 10);
const day = (s: string) => new Date(`${s}T00:00:00Z`);

export function todayKST(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export function formatDate(d: Date, withDay = true) {
  const s = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
  return withDay ? `${s} (${WEEKDAYS[d.getUTCDay()]})` : s;
}

export const slate = (season: number, ep: number) => `S${season} · E${String(ep).padStart(2, '0')}`;
export const episodeSlug = (season: number, ep: number) => `s${season}/e${String(ep).padStart(2, '0')}`;

export function toMember(r: MemberRow): Member {
  return {
    id: r.slug,
    uid: r.id,
    bio: r.bio,
    card: r.card_html,
    isAdmin: r.is_admin,
    data: {
      name: r.name,
      handle: r.github || r.slug,
      role: r.role,
      tagline: r.tagline ?? undefined,
      avatar: r.avatar_url ?? undefined,
      accent: r.accent,
      stack: r.stack,
      github: r.github ?? undefined,
      blog: r.blog ?? undefined,
      links: r.links ?? [],
    },
  };
}

/** 탈퇴 등으로 발표자가 비어 있는 회차용 */
const NOBODY: Member = toMember({
  id: '',
  slug: '',
  name: '미정',
  role: '',
  tagline: null,
  avatar_url: null,
  accent: '#77706a',
  stack: [],
  github: null,
  blog: null,
  links: [],
  bio: '',
  card_html: null,
  is_admin: false,
  created_at: '',
});

const must = <T>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data ?? ([] as T);
};

/**
 * 사이트 전체 데이터. 스터디 규모라 한 번에 다 읽어도 충분히 가볍습니다.
 * 한 요청 안에서는(페이지 + 헤더 등) 한 번만 읽도록 클라이언트별로 기억해 둡니다.
 * 데이터를 바꾼 뒤에는 항상 리다이렉트하므로 같은 요청에서 옛 값을 볼 일은 없어요.
 */
const cache = new WeakMap<DB, ReturnType<typeof fetchAll>>();
export function loadAll(db: DB) {
  let p = cache.get(db);
  if (!p) cache.set(db, (p = fetchAll(db)));
  return p;
}

async function fetchAll(db: DB) {
  const [mr, sr, cr, er, mat, pr] = await Promise.all([
    db.from('members').select('*'),
    db.from('seasons').select('*').order('number'),
    db.from('season_cast').select('*').order('position'),
    db.from('episodes').select('*').order('date').order('number'),
    db.from('materials').select('*').order('created_at'),
    db.from('posts').select('*').order('published_at', { ascending: false }),
  ]);
  const memberRows = must<MemberRow[]>(mr);
  const seasonRows = must<SeasonRow[]>(sr);
  const castRows = must<CastRow[]>(cr);
  const episodeRows = must<EpisodeRow[]>(er);
  const materialRows = must<MaterialRow[]>(mat);
  const postRows = must<PostRow[]>(pr);

  const members = memberRows.map(toMember);
  const byUid = new Map(members.map((m) => [m.uid, m]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  const seasons: Season[] = seasonRows.map((s) => ({
    id: `s${s.number}`,
    dbId: s.id,
    data: {
      number: s.number,
      title: s.title,
      theme: s.theme ?? undefined,
      start: day(s.start_date),
      end: s.end_date ? day(s.end_date) : undefined,
      time: s.time,
      place: s.place,
      cast: castRows
        .filter((c) => c.season_id === s.id && byUid.has(c.member_id))
        .map((c) => ({ id: byUid.get(c.member_id)!.id })),
    },
  }));
  const seasonByDb = new Map(seasons.map((s) => [s.dbId, s]));
  const seasonById = new Map(seasons.map((s) => [s.id, s]));

  const episodes: Episode[] = episodeRows.flatMap((e) => {
    const s = seasonByDb.get(e.season_id);
    if (!s) return [];
    const rows = materialRows.filter((m) => m.episode_id === e.id);
    return [
      {
        id: episodeSlug(s.data.number, e.number),
        dbId: e.id,
        body: e.notes,
        presenterUid: e.presenter_id,
        materialRows: rows,
        data: {
          season: { id: s.id },
          number: e.number,
          date: day(e.date),
          time: e.time ?? undefined,
          presenter: { id: (e.presenter_id && byUid.get(e.presenter_id)?.id) || '' },
          title: e.title,
          summary: e.summary ?? undefined,
          tags: e.tags,
          status: e.status,
          materials: rows.map((m) => ({ url: m.url, type: m.type ?? undefined, label: m.label ?? undefined })),
        },
      },
    ];
  });
  const episodeByDb = new Map(episodes.map((e) => [e.dbId, e]));

  const posts: Post[] = postRows.flatMap((p) => {
    const a = byUid.get(p.author_id);
    if (!a) return [];
    const ep = p.episode_id ? episodeByDb.get(p.episode_id) : undefined;
    return [
      {
        id: p.slug,
        dbId: p.id,
        body: p.body,
        authorUid: p.author_id,
        data: {
          title: p.title,
          description: p.description ?? undefined,
          date: new Date(p.published_at),
          author: { id: a.id },
          tags: p.tags,
          episode: ep ? { id: ep.id } : undefined,
          draft: p.draft,
        },
      },
    ];
  });
  const published = posts.filter((p) => !p.data.draft);

  const seasonOf = (e: Episode) => seasonById.get(e.data.season.id)!;
  const presenterOf = (e: Episode) => memberById.get(e.data.presenter.id) ?? NOBODY;
  const timeOf = (e: Episode) => e.data.time ?? seasonOf(e).data.time;

  const today = todayKST();
  const upcoming = episodes.filter((e) => e.data.status === 'scheduled' && ymd(e.data.date) >= today);
  const current =
    [...seasons].reverse().find((s) => ymd(s.data.start) <= today) ?? seasons[seasons.length - 1];

  const cohortsOf = (memberId: string) =>
    seasons.filter((s) => s.data.cast.some((c) => c.id === memberId)).map((s) => s.data.number);

  return {
    cohortsOf,
    members,
    seasons,
    episodes,
    posts: published,
    allPosts: posts,
    memberById,
    memberByUid: byUid,
    seasonById,
    seasonOf,
    presenterOf,
    timeOf,
    upcoming,
    next: upcoming[0] as Episode | undefined,
    currentSeason: current as Season | undefined,
  };
}

export type Site = Awaited<ReturnType<typeof fetchAll>>;

export function initials(name: string) {
  const t = name.trim();
  return /[가-힣]/.test(t) ? t.slice(-2) : t.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/** 이 사용자가 회차 내용을 고칠 수 있는지 (발표자 본인 또는 관리자) */
export const canEditEpisode = (me: MemberRow | null, e: Episode) =>
  Boolean(me && (me.is_admin || e.presenterUid === me.id));
