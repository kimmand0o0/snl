/**
 * 커스텀 카드 HTML 을 sandbox iframe 의 srcdoc 으로 감쌉니다.
 * 서버(프로필 페이지)와 브라우저(카드 플레이그라운드)가 같은 함수를 씁니다.
 *
 * 카드 안에서 쓸 수 있는 치환자: {{name}} {{handle}} {{role}} {{tagline}}
 * {{avatar}} {{accent}} {{github}} {{stack}} {{cohorts}}
 */
export const CARD_WIDTH = 320;
export const CARD_HEIGHT = 460;

export type CardVars = Record<string, string | undefined>;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function buildCardDoc(html: string, vars: CardVars): string {
  const body = html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => escapeHtml(vars[key] ?? ''));
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=${CARD_WIDTH}">
<base target="_blank">
<style>*,*::before,*::after{box-sizing:border-box}html,body{margin:0;width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;overflow:hidden;background:transparent;font-family:Pretendard,system-ui,sans-serif}</style>
</head><body>${body}</body></html>`;
}

export const CARD_STARTER = `<!-- 320 × 460 안에서 마음껏 꾸며보세요. <style>, <script>, SVG 전부 OK -->
<style>
  .card {
    width: 100%; height: 100%;
    padding: 28px;
    border-radius: 20px;
    background: linear-gradient(160deg, {{accent}}, #12121a 70%);
    color: #fff;
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  .name { font-size: 40px; font-weight: 800; margin: 0; }
  .role { opacity: .75; margin: 4px 0 16px; }
  .chip { display: inline-block; padding: 4px 10px; margin: 0 4px 4px 0;
          border: 1px solid #fff5; border-radius: 99px; font-size: 12px; }
</style>
<div class="card">
  <p class="role">@{{handle}}</p>
  <h1 class="name">{{name}}</h1>
  <p class="role">{{role}}</p>
  <div id="stack"></div>
</div>
<script>
  '{{stack}}'.split(',').filter(Boolean).forEach((s) => {
    const el = document.createElement('span');
    el.className = 'chip';
    el.textContent = s.trim();
    document.getElementById('stack').append(el);
  });
</script>
`;
