import { getCollection, type CollectionEntry } from 'astro:content';

export type Member = CollectionEntry<'members'>;
export type Season = CollectionEntry<'seasons'>;
export type Episode = CollectionEntry<'episodes'>;
export type Post = CollectionEntry<'posts'>;

/** 날짜는 모두 KST 기준 YYYY-MM-DD 문자열로 비교합니다. */
export const ymd = (d: Date) => d.toISOString().slice(0, 10);

export function todayKST(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export function formatDate(d: Date, withDay = true) {
  const s = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
  return withDay ? `${s} (${WEEKDAYS[d.getUTCDay()]})` : s;
}

export const slate = (season: number, ep: number) => `S${season} · E${String(ep).padStart(2, '0')}`;

export async function loadAll() {
  const [members, seasons, episodes, posts] = await Promise.all([
    getCollection('members'),
    getCollection('seasons'),
    getCollection('episodes'),
    getCollection('posts', (p) => import.meta.env.DEV || !p.data.draft),
  ]);
  const memberById = new Map(members.map((m) => [m.id, m]));
  const seasonById = new Map(seasons.map((s) => [s.id, s]));

  seasons.sort((a, b) => a.data.number - b.data.number);
  episodes.sort((a, b) => +a.data.date - +b.data.date || a.data.number - b.data.number);
  posts.sort((a, b) => +b.data.date - +a.data.date);

  const seasonOf = (e: Episode) => seasonById.get(e.data.season.id)!;
  const presenterOf = (e: Episode) => memberById.get(e.data.presenter.id)!;
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
    posts,
    memberById,
    seasonById,
    seasonOf,
    presenterOf,
    timeOf,
    upcoming,
    next: upcoming[0],
    currentSeason: current,
  };
}

/** 커스텀 카드: src/content/cards/<member-id>.html */
const cardFiles = import.meta.glob('/src/content/cards/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function customCardOf(id: string): string | undefined {
  return cardFiles[`/src/content/cards/${id}.html`];
}

export function initials(name: string) {
  const t = name.trim();
  return /[가-힣]/.test(t) ? t.slice(-2) : t.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
