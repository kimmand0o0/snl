import type { APIRoute } from 'astro';
import { loadAll } from '../lib/data';

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const GET: APIRoute = async ({ site, locals }) => {
  const { posts, memberById } = await loadAll(locals.supabase);
  const base = site?.href ?? 'https://snl.example.com/';
  const items = posts
    .map((p) => {
      const url = new URL(`/blog/${p.id}`, base).href;
      return `<item><title>${esc(p.data.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><author>${esc(memberById.get(p.data.author.id)?.data.name ?? '')}</author>${p.data.description ? `<description>${esc(p.data.description)}</description>` : ''}</item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SNL · Study Night Live</title><link>${base}</link><description>SNL 출연진의 백스테이지 노트</description><language>ko</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
