export type MaterialType =
  | 'slides'
  | 'pdf'
  | 'video'
  | 'repo'
  | 'doc'
  | 'design'
  | 'image'
  | 'post'
  | 'link';

export type MaterialInput =
  | string
  | { url: string; type?: MaterialType; label?: string; embed?: boolean };

export interface Material {
  url: string;
  type: MaterialType;
  label: string;
  host: string;
  /** iframe 로 띄울 수 있으면 그 주소 */
  embedUrl?: string;
}

export const TYPE_META: Record<MaterialType, { label: string; icon: string }> = {
  slides: { label: '슬라이드', icon: '▤' },
  pdf: { label: 'PDF', icon: '⎙' },
  video: { label: '다시보기', icon: '▶' },
  repo: { label: '코드', icon: '⌥' },
  doc: { label: '문서', icon: '❏' },
  design: { label: '디자인', icon: '◈' },
  image: { label: '이미지', icon: '◩' },
  post: { label: '글', icon: '✎' },
  link: { label: '링크', icon: '↗' },
};

function hostOf(url: string): string {
  if (url.startsWith('/')) return '이 사이트';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** URL 패턴으로 자료 종류와 임베드 주소를 알아냅니다. */
function detect(url: string): { type: MaterialType; embedUrl?: string } {
  const path = url.split(/[?#]/)[0].toLowerCase();
  if (path.endsWith('.pdf')) return { type: 'pdf', embedUrl: url };
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) return { type: 'image' };

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { type: 'link' };
  }
  const host = u.hostname.replace(/^www\./, '');

  // YouTube
  const yt =
    host === 'youtu.be'
      ? u.pathname.slice(1)
      : host.endsWith('youtube.com')
        ? (u.searchParams.get('v') ?? u.pathname.match(/\/(?:live|shorts|embed)\/([\w-]+)/)?.[1])
        : undefined;
  if (yt) return { type: 'video', embedUrl: `https://www.youtube-nocookie.com/embed/${yt}` };

  if (host === 'vimeo.com') {
    const id = u.pathname.match(/\/(\d+)/)?.[1];
    return { type: 'video', embedUrl: id ? `https://player.vimeo.com/video/${id}` : undefined };
  }
  if (host === 'loom.com') {
    const id = u.pathname.match(/\/share\/(\w+)/)?.[1];
    return { type: 'video', embedUrl: id ? `https://www.loom.com/embed/${id}` : undefined };
  }

  // Google Slides / Docs / Drive
  if (host === 'docs.google.com') {
    const m = u.pathname.match(/\/(presentation|document|spreadsheets)\/d\/([\w-]+)/);
    if (m?.[1] === 'presentation')
      return { type: 'slides', embedUrl: `https://docs.google.com/presentation/d/${m[2]}/embed` };
    if (m) return { type: 'doc', embedUrl: `https://docs.google.com/${m[1]}/d/${m[2]}/preview` };
  }
  if (host === 'drive.google.com') {
    const id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1];
    return { type: 'doc', embedUrl: id ? `https://drive.google.com/file/d/${id}/preview` : undefined };
  }

  if (host === 'speakerdeck.com' || host === 'slideshare.net' || host.endsWith('slides.com'))
    return { type: 'slides' };
  if (host === 'pitch.com') return { type: 'slides', embedUrl: url.replace('/v/', '/embed/') };
  if (host === 'canva.com' && u.pathname.includes('/view'))
    return { type: 'slides', embedUrl: `${u.origin}${u.pathname}?embed` };

  if (host === 'github.com' || host === 'gitlab.com' || host === 'codesandbox.io' || host === 'stackblitz.com')
    return { type: 'repo' };
  if (host === 'gist.github.com') return { type: 'repo' };

  if (host === 'figma.com')
    return {
      type: 'design',
      embedUrl: `https://www.figma.com/embed?embed_host=snl&url=${encodeURIComponent(url)}`,
    };

  if (host.endsWith('notion.so') || host.endsWith('notion.site') || host.endsWith('hackmd.io'))
    return { type: 'doc' };

  if (
    host === 'velog.io' ||
    host.endsWith('tistory.com') ||
    host.endsWith('medium.com') ||
    host === 'dev.to' ||
    host.endsWith('github.io') ||
    host.endsWith('brunch.co.kr')
  )
    return { type: 'post' };

  return { type: 'link' };
}

export function normalizeMaterial(input: MaterialInput): Material {
  const raw = typeof input === 'string' ? { url: input } : input;
  const detected = detect(raw.url);
  const type = raw.type ?? detected.type;
  const embedUrl = raw.embed === false ? undefined : detected.embedUrl;
  const host = hostOf(raw.url);
  return {
    url: raw.url,
    type,
    label: raw.label ?? `${TYPE_META[type].label} · ${host}`,
    host,
    embedUrl,
  };
}
