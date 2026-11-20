// Integration tests for the HianLao API (Next.js route handlers), without
// any network: a tiny in-memory Upstash-compatible REST server runs on
// 127.0.0.1 and the real GET/POST/PUT handlers are invoked with Request
// objects. Run: node tests/api.test.mjs
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
delete process.env.AZURE_SPEECH_KEY;
delete process.env.AZURE_TTS_KEY;
delete process.env.AZURE_SPEECH_REGION;

// ---- import handlers AFTER env vars are set ----
const health = await import('../app/api/health/route.ts');
const register = await import('../app/api/auth/register/route.ts');
const login = await import('../app/api/auth/login/route.ts');
const logout = await import('../app/api/auth/logout/route.ts');
const me = await import('../app/api/auth/me/route.ts');
const progress = await import('../app/api/progress/route.ts');
const leaderboard = await import('../app/api/leaderboard/route.ts');
const tts = await import('../app/api/tts/route.ts');
const lib = await import('../app/api/_lib/auth.ts');

const HOST = 'https://hianlao.test';
const H = { host: 'hianlao.test', origin: 'https://hianlao.test', 'x-forwarded-for': '127.0.0.1' };
const req = (path, { method = 'GET', json, cookie } = {}) => new Request(HOST + path, {
  method,
  headers: { ...H, ...(cookie ? { cookie } : {}), ...(json ? { 'content-type': 'application/json' } : {}) },
  body: json ? JSON.stringify(json) : undefined,
});
const call = async (mod, handler, opts) => {
  const res = await mod[handler](req(opts.path, opts));
  const payload = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  return { status: res.status, res, payload, setCookie: res.headers.get('set-cookie') || '' };
};
const cookieFrom = r => r.setCookie.match(/hianlao_session=([a-f0-9]+)/)?.[1] || '';

let passed = 0;
function ok(cond, msg) { assert.ok(cond, msg); passed++; console.log('  ✔', msg); }

// ---- unit: crypto & validation ----
console.log('auth lib:');
const h = lib.hashPassword('supersecret');
ok(lib.verifyPassword('supersecret', h), 'scrypt hash verifies');
ok(!lib.verifyPassword('wrongpass', h), 'wrong password rejected');
ok(lib.validateUsername('lao_learner99') && !lib.validateUsername('ab') && !lib.validateUsername('bad name!'), 'username validation');
ok(lib.validatePassword('12345678') && !lib.validatePassword('short'), 'password validation');
const vp = lib.validateProgress({ xp: 42, done: { u1l1: 123, bogus: 1 }, streak: 3, lastVisit: '2026-11-13' });
ok(vp.xp === 42 && vp.done.u1l1 === 123 && !('bogus' in vp.done), 'progress validation keeps known lessons only');
const merged = lib.mergeProgress({ xp: 10, done: { u1l1: 1 }, streak: 1, lastVisit: '2026-01-01' }, { xp: 50, done: { u1l2: 2 }, streak: 5, lastVisit: '2026-02-02' });
ok(merged.xp === 50 && merged.done.u1l1 && merged.done.u1l2 && merged.streak === 5 && merged.lastVisit === '2026-02-02', 'progress merge takes max/union');

// ---- integration: full flow ----
console.log('api flow:');
let r = await call(health, 'GET', { path: '/api/health' });
ok(r.status === 200 && r.payload.ok && r.payload.kv === true, 'health ok with kv');

r = await call(register, 'POST', { path: '/api/auth/register', method: 'POST', json: { username: 'bad name!', password: '12345678' } });
ok(r.status === 400, 'register rejects invalid username');
r = await call(register, 'POST', { path: '/api/auth/register', method: 'POST', json: { username: 'tester', password: 'short' } });
ok(r.status === 400, 'register rejects short password');
r = await call(register, 'POST', { path: '/api/auth/register', method: 'POST', json: { username: 'tester', password: 'password123', displayName: 'Test', localProgress: { xp: 30, done: { u1l1: 111 }, streak: 2, lastVisit: '2026-11-10' } } });
ok(r.status === 200 && r.payload.user.username === 'tester', 'register works');
ok(r.payload.progress.xp === 30 && r.payload.progress.done.u1l1 === 111, 'register merges local progress');
const token = cookieFrom(r);
ok(token.length === 64, 'session cookie set (httpOnly)');
ok(r.setCookie.includes('HttpOnly'), 'cookie is HttpOnly');

r = await call(register, 'POST', { path: '/api/auth/register', method: 'POST', json: { username: 'tester', password: 'password123' } });
ok(r.status === 409, 'duplicate username -> 409');

r = await call(me, 'GET', { path: '/api/auth/me', cookie: `hianlao_session=${token}` });
ok(r.payload.user?.username === 'tester' && r.payload.progress.xp === 30, 'me returns user + progress');

r = await call(login, 'POST', { path: '/api/auth/login', method: 'POST', json: { username: 'tester', password: 'wrong-password' } });
ok(r.status === 401, 'login wrong password -> 401');
r = await call(login, 'POST', { path: '/api/auth/login', method: 'POST', json: { username: 'tester', password: 'password123', localProgress: { xp: 80, done: { u1l2: 222 }, streak: 0, lastVisit: null } } });
ok(r.status === 200 && r.payload.progress.xp === 80 && r.payload.progress.done.u1l2 === 222, 'login merges local progress (xp max=80)');
const token2 = cookieFrom(r);

r = await call(progress, 'GET', { path: '/api/progress', cookie: `hianlao_session=${token2}` });
ok(r.status === 200 && r.payload.progress.xp === 80, 'GET progress');
r = await call(progress, 'PUT', { path: '/api/progress', method: 'PUT', cookie: `hianlao_session=${token2}`, json: { progress: { xp: 120, done: { u1l1: 1, u9l3: 5, evil: 9 }, streak: 4, lastVisit: '2026-11-13' } } });
ok(r.status === 200 && r.payload.progress.xp === 120 && !('evil' in r.payload.progress.done), 'PUT progress sanitizes unknown lesson ids');
r = await call(progress, 'GET', { path: '/api/progress' });
ok(r.status === 401, 'progress without session -> 401');

// cross-origin guard
r = await call(health, 'GET', { path: '/api/health', headers: { origin: 'https://evil.example' } }).catch(() => null);
// (call() above doesn't accept headers — do it manually)
{
  const res = await health.GET(new Request(HOST + '/api/health', { headers: { host: 'hianlao.test', origin: 'https://evil.example' } }));
  ok(res.status === 403, 'cross-origin request rejected');
}

// second user for the leaderboard
await register.POST(req('/api/auth/register', { method: 'POST', json: { username: 'champ', password: 'password123' } }));
{
  const lr = await call(login, 'POST', { path: '/api/auth/login', method: 'POST', json: { username: 'champ', password: 'password123' } });
  await call(progress, 'PUT', { path: '/api/progress', method: 'PUT', cookie: `hianlao_session=${cookieFrom(lr)}`, json: { progress: { xp: 500, done: {}, streak: 1, lastVisit: '2026-11-13' } } });
}
r = await call(leaderboard, 'GET', { path: '/api/leaderboard?limit=10' });
ok(r.payload.entries.length === 2 && r.payload.entries[0].username === 'champ' && r.payload.entries[0].xp === 500, 'leaderboard sorted by xp desc');

r = await call(leaderboard, 'GET', { path: '/api/leaderboard?limit=10&period=week' });
ok(r.payload.period === 'week' && r.payload.entries.length === 2, 'weekly leaderboard (?period=week) works');

r = await call(progress, 'PUT', { path: '/api/progress', method: 'PUT', cookie: `hianlao_session=${token2}`, json: { progress: { xp: 200, done: {}, streak: 1, lastVisit: '2026-11-14', goal: 50, reviews: { u1l1: { due: 1, iv: 2 }, bogus: { due: 1, iv: 1 } } } } });
ok(r.status === 200 && r.payload.progress.goal === 50 && r.payload.progress.reviews.u1l1?.iv === 2 && !('bogus' in r.payload.progress.reviews), 'goal + SRS reviews validated on PUT');
r = await call(progress, 'PUT', { path: '/api/progress', method: 'PUT', cookie: `hianlao_session=${token2}`, json: { progress: { xp: 5, goal: 99999, reviews: {} } } });
ok(r.payload.progress.goal === 20, 'invalid goal falls back to default 20');

r = await call(logout, 'POST', { path: '/api/auth/logout', method: 'POST', cookie: `hianlao_session=${token2}` });
ok(r.status === 200, 'logout ok');
r = await call(me, 'GET', { path: '/api/auth/me', cookie: `hianlao_session=${token2}` });
ok(r.payload.user === null, 'session destroyed after logout');

// tts endpoint: id validation + graceful "not configured" when no Azure key
r = await call(tts, 'GET', { path: '/api/tts?id=hello' });
ok(r.status === 503 && r.payload.ok === false, 'tts returns 503 when not configured');
r = await call(tts, 'GET', { path: '/api/tts' });
ok(r.status === 404 && r.payload.ok === false, 'tts rejects unknown/missing id');

// ---- stt endpoint: mic-exercise fallback via Azure Speech STT (mocked) ----
console.log('stt endpoint:');
const sttMock = http.createServer((req2, res) => {
  const chunks = [];
  req2.on('data', (d) => chunks.push(d));
  req2.on('end', () => {
    const bodyBuf = Buffer.concat(chunks);
    if (bodyBuf.includes('FAILMARK')) { res.writeHead(500); res.end('{}'); return; }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ RecognitionStatus: 'Success', DisplayText: 'ສະບາຍດີ ' }));
  });
});
await new Promise((r) => sttMock.listen(0, '127.0.0.1', r));
process.env.AZURE_SPEECH_KEY = 'test-key';
process.env.AZURE_SPEECH_REGION = 'eu-mock';
process.env.AZURE_SPEECH_ENDPOINT = `http://127.0.0.1:${sttMock.address().port}`;
const stt = await import('../app/api/stt/route.ts');
const sttLib = await import('../app/api/_lib/stt.ts');
ok(sttLib.sttEnabled, 'stt lib enabled with key + region');

r = { status: (await stt.POST(new Request(HOST + '/api/stt', { method: 'POST', headers: { origin: 'https://evil.example' } }))).status };
ok(r.status === 403, 'stt rejects cross-origin upload');
{
  const res = await stt.POST(new Request(HOST + '/api/stt', { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: '{}' }));
  ok(res.status === 400, 'stt rejects missing audio file');
}
{
  const fdBig = new FormData();
  fdBig.append('audio', new File([Buffer.alloc(7 * 1024 * 1024)], 'big.wav', { type: 'audio/wav' }));
  const res = await stt.POST(new Request(HOST + '/api/stt', { method: 'POST', headers: H, body: fdBig }));
  ok(res.status === 413, 'stt rejects oversized audio');
}
{
  const fd = new FormData();
  fd.append('audio', new File([Buffer.from('RIFF....DATA')], 'speech.wav', { type: 'audio/wav' }));
  fd.append('lang', 'lo-LA');
  const res = await stt.POST(new Request(HOST + '/api/stt', { method: 'POST', headers: H, body: fd }));
  const payload = await res.json();
  ok(res.status === 200 && payload.text === 'ສະບາຍດີ', 'stt transcribes via azure (mock), trims DisplayText');
}
{
  const fdFail = new FormData();
  fdFail.append('audio', new File([Buffer.concat([Buffer.from('RIFF'), Buffer.from('FAILMARK'), Buffer.alloc(64)])], 'speech.wav', { type: 'audio/wav' }));
  const res = await stt.POST(new Request(HOST + '/api/stt', { method: 'POST', headers: H, body: fdFail }));
  ok(res.status === 502, 'stt surfaces azure errors as 502');
}
sttMock.close();

kvServer.close();
console.log(`\nAPI TESTS PASSED ✔ (${passed} assertions)`);
process.exit(0);
