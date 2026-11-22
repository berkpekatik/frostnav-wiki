/**
 * wiki.frostnav.com Worker'ı.
 *
 * Statik siteyi (build/) Cloudflare Assets sunar. Bu kod yalnızca /oauth/* yollarında çalışır
 * (wrangler.jsonc → assets.run_worker_first) ve Decap CMS (/admin) için GitHub girişini yapar:
 *
 *   /oauth/auth      → GitHub yetkilendirme sayfasına yönlendirir
 *   /oauth/callback  → kodu erişim anahtarına çevirir, anahtarı /admin penceresine postMessage ile verir
 *
 * Gerekli gizli değerler (wrangler secret put ...): GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET.
 * Repo herkese açık ve panel "open authoring" modunda: düzenleyici kendi fork'unda çalışıp PR açar,
 * bu yüzden yalnızca "public_repo" izni istenir. Anahtar giriş yapan kişinin kendi GitHub yetkisini taşır.
 */

const STATE_COOKIE = 'decap_oauth_state';
/** Decap'in isteyebileceği izinler. Varsayılan en dar olanı. */
const ALLOWED_SCOPES = new Set(['public_repo', 'repo']);
const DEFAULT_SCOPE = 'public_repo';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/oauth/auth') return startAuth(url, env);
    if (url.pathname === '/oauth/callback') return finishAuth(request, url, env);

    return env.ASSETS.fetch(request);
  },
};

function startAuth(url, env) {
  if (!env.GITHUB_CLIENT_ID) return text('GITHUB_CLIENT_ID ayarlı değil.', 500);

  const state = crypto.randomUUID();
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${url.origin}/oauth/callback`);
  const requested = url.searchParams.get('scope');
  const scope = ALLOWED_SCOPES.has(requested) ? requested : DEFAULT_SCOPE;
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `${STATE_COOKIE}=${state}; Path=/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

async function finishAuth(request, url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = readCookie(request.headers.get('Cookie'), STATE_COOKIE);

  if (!code || !state || !cookie || state !== cookie) {
    return reply(url.origin, 'error', {message: 'Giriş doğrulanamadı. Pencereyi kapatıp tekrar deneyin.'});
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'frostnav-wiki'},
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/oauth/callback`,
    }),
  });
  const data = await res.json().catch(() => ({}));

  if (!data.access_token) {
    return reply(url.origin, 'error', {message: data.error_description || 'GitHub anahtar vermedi.'});
  }
  return reply(url.origin, 'success', {token: data.access_token, provider: 'github'});
}

/** Decap CMS'in beklediği el sıkışma: önce "authorizing:github", cevap gelince sonucu yalnızca kendi origin'imize gönder. */
function reply(origin, status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>FrostNav Wiki</title></head><body>
<p>${status === 'success' ? 'Giriş yapıldı, bu pencere kapanabilir.' : 'Giriş başarısız.'}</p>
<script>
(function () {
  var origin = ${JSON.stringify(origin)};
  var message = ${JSON.stringify(message).replace(/</g, '\\u003c')};
  function receive(e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(message, origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  if (window.opener) window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': `${STATE_COOKIE}=; Path=/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
}

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function text(body, status) {
  return new Response(body, {status, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
}
