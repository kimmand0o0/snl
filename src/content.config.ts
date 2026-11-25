import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** 출연진(스터디 멤버). 커스텀 카드는 src/content/cards/<id>.html 에 두면 자동으로 쓰입니다. */
const members = defineCollection({
  loader: glob({ base: './src/content/members', pattern: '*.md' }),
  schema: z.object({
    name: z.string(),
    handle: z.string(),
    role: z.string(),
    tagline: z.string().optional(),
    avatar: z.string().optional(),
    accent: z.string().default('#ffc531'),
    stack: z.array(z.string()).default([]),
    github: z.string().optional(),
    blog: z.url().optional(),
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    joined: z.string().optional(),
  }),
});

/** 기수. cast 순서가 곧 발표 로테이션 순서입니다. */
const seasons = defineCollection({
  loader: file('./src/content/seasons.yaml'),
  schema: z.object({
    number: z.number(),
    title: z.string(),
    theme: z.string().optional(),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    time: z.string().default('20:00'),
    place: z.string().default('온라인'),
    cast: z.array(reference('members')),
  }),
});

/**
 * 발표 자료. URL만 적으면 종류를 자동 감지하고,
 * 필요하면 { url, type, label } 로 직접 지정할 수 있습니다.
 */
const material = z.union([
  z.string(),
  z.object({
    url: z.string(),
    type: z
      .enum(['slides', 'pdf', 'video', 'repo', 'doc', 'design', 'image', 'post', 'link'])
      .optional(),
    label: z.string().optional(),
    embed: z.boolean().optional(),
  }),
]);

/** 회차(에피소드). src/content/episodes/<season>/eNN.md */
const episodes = defineCollection({
  loader: glob({ base: './src/content/episodes', pattern: '**/*.md' }),
  schema: z.object({
    season: reference('seasons'),
    number: z.number(),
    date: z.coerce.date(),
    time: z.string().optional(),
    presenter: reference('members'),
    title: z.string().default('제목 미정'),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['scheduled', 'done', 'skipped']).default('scheduled'),
    materials: z.array(material).default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/[^_]*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    author: reference('members'),
    tags: z.array(z.string()).default([]),
    episode: reference('episodes').optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { members, seasons, episodes, posts };
