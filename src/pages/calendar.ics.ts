import type { APIRoute } from 'astro';
import { loadAll, slate, ymd } from '../lib/data';

/** 구글/애플 캘린더에서 구독할 수 있는 발표 일정 피드 */
const esc = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
// KST(UTC+9) → UTC "YYYYMMDDTHHMMSSZ"
const utc = (day: string, time: string, plusHours = 0) =>
  new Date(Date.parse(`${day}T${time}:00+09:00`) + plusHours * 3600_000)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

export const GET: APIRoute = async ({ site }) => {
  const { episodes, seasonOf, presenterOf, timeOf } = await loadAll();
  const base = site?.href ?? 'https://snl.example.com/';
  const stamp = utc(new Date().toISOString().slice(0, 10), '00:00');
  const events = episodes
    .filter((e) => e.data.status !== 'skipped')
    .map((e) => {
      const s = seasonOf(e);
      const p = presenterOf(e);
      const day = ymd(e.data.date);
      const url = new URL(`/episodes/${e.id}`, base).href;
      return [
        'BEGIN:VEVENT',
        `UID:${e.id.replace('/', '-')}@snl`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${utc(day, timeOf(e))}`,
        `DTEND:${utc(day, timeOf(e), 2)}`,
        `SUMMARY:${esc(`[SNL ${slate(s.data.number, e.data.number)}] ${p.data.name} — ${e.data.title}`)}`,
        `DESCRIPTION:${esc(`${e.data.summary ?? ''}\n${url}`.trim())}`,
        `LOCATION:${esc(s.data.place)}`,
        `URL:${url}`,
        'END:VEVENT',
      ].join('\r\n');
    });
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SNL Study Night Live//KO',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:SNL 발표 편성표',
    'X-WR-TIMEZONE:Asia/Seoul',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
