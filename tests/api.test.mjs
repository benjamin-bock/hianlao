// Integration tests for the HianLao serverless API, without any network:
// a tiny in-memory Upstash-compatible REST server runs on 127.0.0.1 and the
// real handlers (api/*.js) are invoked with mock req/res objects.
// Run: node tests/api.test.mjs
import http from 'node:http';
import assert from 'node:assert/strict';

// ---- in-memory KV (subset of Upstash REST: POST / and /pipeline) ----
const store = new Map();
const zsets = new Map();
function cmd(args) {
  const [c, ...rest] = args.map(x => String(x));
  switch (c.toUpperCase()) {
    case 'GET': return store.has(rest[0]) ? store.get(rest[0]) : null;
    case 'SET': store.set(rest[0], rest[1]); return 'OK';
    case 'DEL': return store.delete(rest[0]) ? 1 : 0;
    case 'INCR': { const n = (parseInt(store.get(rest[0]) || '0', 10) + 1); store.set(rest[0], String(n)); return n; }
    case 'EXPIRE': return 1;
    case 'ZADD': { const z = zsets.get(rest[0]) || new Map(); z.set(rest[2], Number(rest[1])); zsets.set(rest[0], z); return 1; }
    case 'ZREVRANGE': {
      const z = zsets.get(rest[0]) || new Map();
      const [start, stop, ...flags] = rest.slice(1);
      const arr = [...z.entries()].sort((a, b) => b[1] - a[1]).slice(Number(start), Number(stop) + 1);
      const withScores = flags.includes('WITHSCORES');
      const out = [];
      for (const [m, s] of arr) { out.push(m); if (withScores) out.push(String(s)); }
      return out;
    }
    default: throw new Error('unsupported cmd ' + c);
  }
}
const kvServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    const payload = JSON.parse(body || '[]');
    if (req.url === '/pipeline') {
      res.end(JSON.stringify(payload.map(args => ({ result: cmd(args) }))));
    } else {
      res.end(JSON.stringify({ result: cmd(payload) }));
    }
  });
});
await new Promise(r => kvServer.listen(0, '127.0.0.1', r));
const kvPort = kvServer.address().port;
process.env.KV_REST_API_URL = `http://127.0.0.1:${kvPort}`;
process.env.KV_REST_API_TOKEN = 'test-token';

// ---- import handlers AFTER env vars are set ----
const { default: health } = await import('../api/health.js');
const { default: register } = await import('../api/auth/register.js');
const { default: login } = await import('../api/auth/login.js');
const { default: logout } = await import('../api/auth/logout.js');
const { default: me } = await import('../api/auth/me.js');
const { default: progress } = await import('../api/progress.js');
const { default: leaderboard } = await import('../api/leaderboard.js');
const { hashPassword, verifyPassword, validateUsername, validatePassword, validateProgress, mergeProgress } = await import('../api/_lib/auth.js');

// ---- mock req/res ----
function mockReq({ method = 'GET', body: b, cookie = '', origin = 'https://hianlao.test', query = {} } = {}) {
  return {
    method,
    headers: { host: 'hianlao.test', cookie, origin, 'x-forwarded-for': '127.0.0.1', 'content-type': 'application/json' },
    body: b,
    query,
    socket: { remoteAddress: '127.0.0.1' },
  };
}
function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    payload: null,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.payload = o; return this; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
  };
  return res;
}
const call = (h, reqOpts) => { const res = mockRes(); return h(mockReq(reqOpts), res).then(() => res); };
const cookieFrom = res => (res.headers['set-cookie'] || '').match(/hianlao_session=([a-f0-9]+)/)?.[1] || '';

let passed = 0;
function ok(cond, msg) { assert.ok(cond, msg); passed++; console.log('  ✔', msg); }

// ---- unit: crypto & validation ----
console.log('auth lib:');
const h = hashPassword('supersecret');
ok(verifyPassword('supersecret', h), 'scrypt hash verifies');
ok(!verifyPassword('wrongpass', h), 'wrong password rejected');
ok(validateUsername('lao_learner99') && !validateUsername('ab') && !validateUsername('bad name!'), 'username validation');
ok(validatePassword('12345678') && !validatePassword('short'), 'password validation');
const vp = validateProgress({ xp: 42, done: { u1l1: 123, bogus: 1 }, streak: 3, lastVisit: '2026-11-13' });
ok(vp.xp === 42 && vp.done.u1l1 === 123 && !('bogus' in vp.done), 'progress validation keeps known lessons only');
const merged = mergeProgress({ xp: 10, done: { u1l1: 1 }, streak: 1, lastVisit: '2026-01-01' }, { xp: 50, done: { u1l2: 2 }, streak: 5, lastVisit: '2026-02-02' });
ok(merged.xp === 50 && merged.done.u1l1 && merged.done.u1l2 && merged.streak === 5 && merged.lastVisit === '2026-02-02', 'progress merge takes max/union');

// ---- integration: full flow ----
console.log('api flow:');
let r = await call(health, {});
ok(r.statusCode === 200 && r.payload.ok && r.payload.kv === true, 'health ok with kv');

r = await call(register, { method: 'POST', body: { username: 'bad name!', password: '12345678' } });
ok(r.statusCode === 400, 'register rejects invalid username');
r = await call(register, { method: 'POST', body: { username: 'tester', password: 'short' } });
ok(r.statusCode === 400, 'register rejects short password');
r = await call(register, { method: 'POST', body: { username: 'tester', password: 'password123', displayName: 'Test', localProgress: { xp: 30, done: { u1l1: 111 }, streak: 2, lastVisit: '2026-11-10' } } });
ok(r.statusCode === 200 && r.payload.user.username === 'tester', 'register works');
ok(r.payload.progress.xp === 30 && r.payload.progress.done.u1l1 === 111, 'register merges local progress');
const token = cookieFrom(r);
ok(token.length === 64, 'session cookie set (httpOnly)');
ok((r.headers['set-cookie'] || '').includes('HttpOnly'), 'cookie is HttpOnly');

r = await call(register, { method: 'POST', body: { username: 'tester', password: 'password123' } });
ok(r.statusCode === 409, 'duplicate username -> 409');

r = await call(me, { cookie: `hianlao_session=${token}` });
ok(r.payload.user?.username === 'tester' && r.payload.progress.xp === 30, 'me returns user + progress');

r = await call(login, { method: 'POST', body: { username: 'tester', password: 'wrong-password' } });
ok(r.statusCode === 401, 'login wrong password -> 401');
r = await call(login, { method: 'POST', body: { username: 'tester', password: 'password123', localProgress: { xp: 80, done: { u1l2: 222 }, streak: 0, lastVisit: null } } });
ok(r.statusCode === 200 && r.payload.progress.xp === 80 && r.payload.progress.done.u1l2 === 222, 'login merges local progress (xp max=80)');
const token2 = cookieFrom(r);

r = await call(progress, { method: 'GET', cookie: `hianlao_session=${token2}` });
ok(r.statusCode === 200 && r.payload.progress.xp === 80, 'GET progress');
r = await call(progress, { method: 'PUT', cookie: `hianlao_session=${token2}`, body: { progress: { xp: 120, done: { u1l1: 1, u9l3: 5, evil: 9 }, streak: 4, lastVisit: '2026-11-13' } } });
ok(r.statusCode === 200 && r.payload.progress.xp === 120 && !('evil' in r.payload.progress.done), 'PUT progress sanitizes unknown lesson ids');
r = await call(progress, { method: 'GET' });
ok(r.statusCode === 401, 'progress without session -> 401');

// second user for the leaderboard
await call(register, { method: 'POST', body: { username: 'champ', password: 'password123' } });
await call(progress, { method: 'PUT', cookie: `hianlao_session=${cookieFrom(await call(login, { method: 'POST', body: { username: 'champ', password: 'password123' } }))}`, body: { progress: { xp: 500, done: {}, streak: 1, lastVisit: '2026-11-13' } } });
r = await call(leaderboard, { query: { limit: '10' } });
ok(r.payload.entries.length === 2 && r.payload.entries[0].username === 'champ' && r.payload.entries[0].xp === 500, 'leaderboard sorted by xp desc');

r = await call(logout, { method: 'POST', cookie: `hianlao_session=${token2}` });
ok(r.statusCode === 200, 'logout ok');
r = await call(me, { cookie: `hianlao_session=${token2}` });
ok(r.payload.user === null, 'session destroyed after logout');

// same-origin guard
r = await call(health, { origin: 'https://evil.example' });
ok(r.statusCode === 403, 'cross-origin request rejected');

kvServer.close();
console.log(`\nAPI TESTS PASSED ✔ (${passed} assertions)`);
process.exit(0);
