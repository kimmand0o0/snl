#!/usr/bin/env node
/**
 * 기수 cast 순서대로 발표 회차 파일을 만들어 줍니다.
 *
 *   npm run rotate -- --season s3 --start 2027-01-07
 *   npm run rotate -- --season s3 --start 2027-01-07 --every 7 --rounds 2 --skip 2027-02-11 --dry
 *
 * --season  seasons.yaml 의 id (필수)
 * --start   첫 발표일 YYYY-MM-DD (기본: 기수 start)
 * --every   간격(일), 기본 7
 * --rounds  cast 를 몇 바퀴 돌지, 기본 1
 * --skip    건너뛸 날짜(쉼표 구분). 휴방 주는 순서를 밀어냅니다.
 * --shuffle 순서를 섞기 (발표 순서 뽑기!)
 * --dry     파일을 쓰지 않고 미리보기만
 *
 * 이미 있는 회차 번호 파일은 덮어쓰지 않습니다.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { parse } from 'yaml';

const { values: o } = parseArgs({
  options: {
    season: { type: 'string' },
    start: { type: 'string' },
    every: { type: 'string', default: '7' },
    rounds: { type: 'string', default: '1' },
    skip: { type: 'string', default: '' },
    shuffle: { type: 'boolean', default: false },
    dry: { type: 'boolean', default: false },
  },
});

const seasons = parse(readFileSync('src/content/seasons.yaml', 'utf8'));
const season = seasons.find((s) => s.id === o.season);
if (!season) {
  console.error(`기수를 찾을 수 없어요: --season ${o.season ?? ''}\n가능: ${seasons.map((s) => s.id).join(', ')}`);
  process.exit(1);
}

let cast = [...season.cast];
if (o.shuffle) {
  for (let i = cast.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cast[i], cast[j]] = [cast[j], cast[i]];
  }
}
const order = Array.from({ length: Number(o.rounds) }, () => cast).flat();
const skip = new Set(o.skip.split(',').filter(Boolean));
const startStr = o.start ?? new Date(season.start).toISOString().slice(0, 10);
const day = new Date(`${startStr}T00:00:00Z`);
const dir = join('src/content/episodes', season.id);
if (!o.dry) mkdirSync(dir, { recursive: true });

const iso = (d) => d.toISOString().slice(0, 10);
let n = 1;
while (existsSync(join(dir, `e${String(n).padStart(2, '0')}.md`))) n++;

console.log(`\n📺 ${season.number}기 「${season.title}」 편성${o.dry ? ' (미리보기)' : ''}\n`);
for (const presenter of order) {
  while (skip.has(iso(day))) {
    console.log(`   ${iso(day)}  — 휴방`);
    day.setUTCDate(day.getUTCDate() + Number(o.every));
  }
  const file = join(dir, `e${String(n).padStart(2, '0')}.md`);
  const md = `---
season: ${season.id}
number: ${n}
date: ${iso(day)}
presenter: ${presenter}
title: 제목 미정
status: scheduled
materials: []
---
`;
  console.log(`   ${iso(day)}  E${String(n).padStart(2, '0')}  ${presenter}`);
  if (!o.dry) writeFileSync(file, md);
  n++;
  day.setUTCDate(day.getUTCDate() + Number(o.every));
}
console.log(o.dry ? '\n--dry 를 빼면 파일이 생성돼요.\n' : `\n✓ ${dir} 에 생성 완료\n`);
