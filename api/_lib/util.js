// Shared helpers for HianLao serverless functions (Vercel /api/*).
// No secrets here: everything sensitive comes from env vars.

export function json(res, status, obj) {
  res.status(status).json(obj);
}

export function getCookies(req) {
  const out = {};
  const raw = req.headers?.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export const SESSION_COOKIE = 'hianlao_session';

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

// Same-origin guard: if an Origin header is present it must match our host.
export function sameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return true;
  try {
    const host = req.headers?.host || '';
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  return (fwd ? String(fwd).split(',')[0].trim() : req.socket?.remoteAddress || 'unknown');
}

export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
