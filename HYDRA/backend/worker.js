const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const encoder = new TextEncoder();
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
const fail = (message, status = 400, extra = {}) => json({ error: message }, status, extra);
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const fromB64url = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)), c => c.charCodeAt(0));
const randomToken = (n = 32) => { const b = crypto.getRandomValues(new Uint8Array(n)); return b64url(b); };
const sha256 = async value => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
const hex = bytes => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
const now = () => new Date().toISOString();
const safeEqual = (a, b) => { const x = encoder.encode(String(a)), y = encoder.encode(String(b)); let d = x.length ^ y.length; for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0); return d === 0; };

function cors(request, env) {
  const origin = request.headers.get('origin') || '*';
  const allowed = (env.ALLOWED_ORIGIN || '*').split(',').map(x => x.trim());
  const allowOrigin = allowed.includes('*') || allowed.includes(origin) ? origin : 'null';
  return { 'access-control-allow-origin': allowOrigin, 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': 'content-type,authorization', 'access-control-max-age': '86400', 'vary': 'Origin' };
}
async function encrypt(env, value) {
  if (!env.CREDENTIALS_KEY) throw new Error('Segredo CREDENTIALS_KEY não configurado no Worker.');
  const keyBytes = await sha256(env.CREDENTIALS_KEY);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(value)));
  return `${b64url(iv)}.${b64url(data)}`;
}
async function decrypt(env, value) {
  if (!env.CREDENTIALS_KEY) throw new Error('Segredo CREDENTIALS_KEY não configurado no Worker.');
  const [ivText, dataText] = String(value || '').split('.');
  const key = await crypto.subtle.importKey('raw', await sha256(env.CREDENTIALS_KEY), 'AES-GCM', false, ['decrypt']);
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64url(ivText) }, key, fromB64url(dataText));
  return JSON.parse(new TextDecoder().decode(clear));
}
async function signToken(env, subject) {
  if (!env.SESSION_SECRET) throw new Error('Segredo SESSION_SECRET não configurado no Worker.');
  const payload = b64url(encoder.encode(JSON.stringify({ sub: subject, exp: Date.now() + 8 * 60 * 60 * 1000 })));
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${payload}.${b64url(signature)}`;
}
async function verifyToken(env, token) {
  try {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature || !env.SESSION_SECRET) return null;
    const key = await crypto.subtle.importKey('raw', encoder.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, fromB64url(signature), encoder.encode(payload));
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return data.exp > Date.now() ? data.sub : null;
  } catch { return null; }
}
async function adminGuard(request, env) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return await verifyToken(env, token) === 'admin' ? true : false;
}
async function customerGuard(request, env, id) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const row = await env.DB.prepare('SELECT token_hash FROM customers WHERE id = ?').bind(id).first();
  return !!row && safeEqual(hex(await sha256(token)), row.token_hash);
}
async function body(request) { try { return await request.json(); } catch { return null; } }
async function adminRoutes(request, env, url) {
  const path = url.pathname;
  if (path === '/api/admin/login' && request.method === 'POST') {
    const data = await body(request);
    if (!data?.username || !data?.password || !env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) return fail('Credenciais administrativas não configuradas.', 503);
    if (!safeEqual(data.username.trim().toLowerCase(), env.ADMIN_USERNAME.trim().toLowerCase()) || !safeEqual(data.password, env.ADMIN_PASSWORD)) return fail('Usuário ou senha incorretos.', 401);
    return json({ token: await signToken(env, 'admin'), expires_in: 28800 });
  }
  if (!await adminGuard(request, env)) return fail('Sessão administrativa inválida ou expirada.', 401);
  if (path === '/api/admin/summary' && request.method === 'GET') {
    const row = await env.DB.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) pending, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active, SUM(CASE WHEN access_type='trial' THEN 1 ELSE 0 END) trials FROM customers`).first();
    return json(row || { total: 0, pending: 0, active: 0, trials: 0 });
  }
  if (path === '/api/admin/customers' && request.method === 'GET') {
    const { results = [] } = await env.DB.prepare(`SELECT id,name,contact,status,access_type,expires_at,xtream_username,created_at FROM customers ORDER BY created_at DESC`).all();
    return json({ customers: results });
  }
  const customerMatch = path.match(/^\/api\/admin\/customers\/([^/]+)$/);
  if (customerMatch && request.method === 'PATCH') {
    const id = customerMatch[1], data = await body(request);
    if (!data || !['pending', 'active', 'suspended'].includes(data.status || 'active')) return fail('Dados ou status inválidos.');
    const current = await env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
    if (!current) return fail('Cliente não encontrado.', 404);
    let secret = current.xtream_secret;
    let username = current.xtream_username;
    if (data.client_password || (!secret && data.client_username)) {
      if (!data.client_username || !data.client_password) return fail('Informe login e senha do cliente.');
      username = String(data.client_username).trim();
      secret = await encrypt(env, { username, password: String(data.client_password) });
    }
    if (data.status === 'active' && !secret) return fail('Informe o login e a senha do cliente para liberar o acesso.');
    await env.DB.prepare(`UPDATE customers SET status=?, access_type=?, expires_at=?, xtream_username=?, xtream_secret=?, updated_at=? WHERE id=?`)
      .bind(data.status || current.status, data.access_type ? (data.access_type === 'trial' ? 'trial' : 'regular') : current.access_type, data.expires_at === undefined ? current.expires_at : (data.expires_at || null), username, secret, now(), id).run();
    await env.DB.prepare('INSERT INTO audit_logs (id,admin_id,action,target_id,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), 'admin', 'customer_update', id, now()).run();
    return json({ ok: true });
  }
  return fail('Rota administrativa não encontrada.', 404);
}

export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    try {
      const url = new URL(request.url), path = url.pathname;
      if (path === '/health') return json({ ok: true, service: 'HYDRA API', time: now() }, 200, headers);
      if (path.startsWith('/api/admin/')) return await adminRoutes(request, env, url).then(r => { const h = new Headers(r.headers); Object.entries(headers).forEach(([k,v])=>h.set(k,v)); return new Response(r.body,{status:r.status,headers:h}); });
      if (path === '/api/client/login' && request.method === 'POST') {
        const data = await body(request);
        const username = String(data?.username || '').trim();
        const password = String(data?.password || '');
        if (!username || !password) return fail('Informe usuário e senha.', 400, headers);
        const row = await env.DB.prepare("SELECT id,status,expires_at,xtream_secret FROM customers WHERE xtream_username=? ORDER BY updated_at DESC LIMIT 1").bind(username).first();
        if (!row || row.status !== 'active' || !row.xtream_secret) return fail('Acesso não encontrado ou ainda não liberado.', 401, headers);
        if (row.expires_at && new Date(row.expires_at + 'T23:59:59').getTime() < Date.now()) return fail('Este acesso expirou.', 403, headers);
        const credentials = await decrypt(env, row.xtream_secret);
        if (!safeEqual(credentials.password, password)) return fail('Usuário ou senha incorretos.', 401, headers);
        return json({ credentials: { username: credentials.username, password: credentials.password } }, 200, headers);
      }
      if (path === '/api/register' && request.method === 'POST') {
        const data = await body(request);
        const name = String(data?.name || '').trim(), contact = String(data?.contact || '').trim();
        if (name.length < 2 || contact.length < 5) return fail('Informe nome e contato válidos.', 400, headers);
        const id = crypto.randomUUID(), token = randomToken(), tokenHash = hex(await sha256(token));
        await env.DB.prepare(`INSERT INTO customers(id,name,contact,username,status,access_type,token_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`)
          .bind(id, name, contact, `pending_${id}`, 'pending', 'regular', tokenHash, now(), now()).run();
        return json({ id, token }, 201, headers);
      }
      const accessMatch = path.match(/^\/api\/access\/([^/]+)$/);
      if (accessMatch && request.method === 'GET') {
        const id = accessMatch[1];
        if (!await customerGuard(request, env, id)) return fail('Cadastro não autorizado neste aparelho.', 401, headers);
        const customer = await env.DB.prepare('SELECT status,expires_at,xtream_secret FROM customers WHERE id=?').bind(id).first();
        if (!customer) return fail('Cadastro não encontrado.', 404, headers);
        let status = customer.status;
        if (status === 'active' && customer.expires_at && new Date(customer.expires_at + 'T23:59:59').getTime() < Date.now()) status = 'expired';
        const credentials = status === 'active' && customer.xtream_secret ? await decrypt(env, customer.xtream_secret) : null;
        return json({ status, credentials }, 200, headers);
      }
      return fail('Rota não encontrada.', 404, headers);
    } catch (error) {
      return json({ error: error?.message || 'Erro interno do serviço.' }, 500, headers);
    }
  }
};
