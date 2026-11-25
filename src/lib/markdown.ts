import { Marked, type Tokens } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighter, type Highlighter } from 'shiki';

/** 사용자가 쓴 마크다운(글·방송 노트·소개)을 안전한 HTML 로 바꿉니다. */

const LANGS = ['ts', 'tsx', 'js', 'jsx', 'json', 'bash', 'sh', 'sql', 'python', 'go', 'java', 'kotlin', 'rust', 'yaml', 'html', 'css', 'diff', 'swift'];
let hl: Promise<Highlighter> | undefined;
const highlighter = () => (hl ??= createHighlighter({ themes: ['github-dark-dimmed'], langs: LANGS }));

export type Heading = { depth: number; slug: string; text: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

export async function renderMarkdown(src: string): Promise<{ html: string; headings: Heading[] }> {
  const h = await highlighter();
  const headings: Heading[] = [];
  const seen = new Map<string, number>();
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, '');
        let slug = slugify(plain) || 'section';
        const n = seen.get(slug) ?? 0;
        seen.set(slug, n + 1);
        if (n) slug += `-${n}`;
        headings.push({ depth, slug, text: plain });
        return `<h${depth} id="${slug}">${text}</h${depth}>`;
      },
      code({ text, lang }: Tokens.Code) {
        const l = (lang ?? '').split(/\s/)[0];
        return h.codeToHtml(text, { lang: LANGS.includes(l) ? l : 'text', theme: 'github-dark-dimmed' });
      },
    },
  });
  const raw = await marked.parse(src ?? '');
  const html = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'del', 'input', 'details', 'summary']),
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['id', 'class'],
      span: ['style', 'class'],
      pre: ['style', 'class', 'tabindex'],
      input: ['type', 'checked', 'disabled'],
      th: ['align'],
      td: ['align'],
    },
    allowedStyles: { '*': { color: [/^#[0-9a-f]{3,8}$/i], 'background-color': [/^#[0-9a-f]{3,8}$/i] } },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (_tag, attribs) => ({
        tagName: 'a',
        attribs: /^https?:/.test(attribs.href ?? '') ? { ...attribs, target: '_blank', rel: 'noopener nofollow' } : attribs,
      }),
    },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
  });
  return { html, headings };
}
