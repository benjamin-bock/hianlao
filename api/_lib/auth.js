// Auth & progress helpers for HianLao. Passwords are scrypt-hashed, sessions are
// random tokens stored in KV (httpOnly cookie on the client).
import crypto from 'node:crypto';
import { kv } from './kv.js';
import { LESSON_BY_ID } from '../../assets/js/data/units.js';

export const USER_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const MIN_PASSWORD = 8;

export function validateUsername(u) {
  return typeof u === 'string' && USER_RE.test(u);
}

export function validatePassword(p) {
  return typeof p === 'string' && p.length >= MIN_PASSWORD && p.length <= 128;
}

export function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(pw, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw, stored) {
  if (typeof stored !== 'string') return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(pw, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

export async function getUser(username) {
  const raw = await kv('GET', `user:${username.toLowerCase()}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function createUser(username, password, displayName) {
  const key = `user:${username.toLowerCase()}`;
  const record = {
    username,
    displayName: displayName || username,
    hash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await kv('SET', key, JSON.stringify(record));
  return { username: record.username, displayName: record.displayName, createdAt: record.createdAt };
}

export async function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  await kv('SET', `session:${token}`, username.toLowerCase(), 'EX', String(60 * 60 * 24 * 30));
  return token;
}

export async function userFromToken(token) {
  if (!token) return null;
  const u = await kv('GET', `session:${token}`);
  return u || null;
}

export async function destroySession(token) {
  if (token) await kv('DEL', `session:${token}`);
}

// ---- progress model ----
export function validateProgress(p) {
  if (!p || typeof p !== 'object') return { xp: 0, done: {}, streak: 0, lastVisit: null };
  const xp = Number.isInteger(p.xp) && p.xp >= 0 && p.xp <= 1e7 ? p.xp : 0;
  const streak = Number.isInteger(p.streak) && p.streak >= 0 && p.streak <= 3650 ? p.streak : 0;
  const lastVisit = typeof p.lastVisit === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.lastVisit) ? p.lastVisit : null;
  const done = {};
  if (p.done && typeof p.done === 'object') {
    for (const [k, v] of Object.entries(p.done)) {
      if (LESSON_BY_ID[k] && Number.isFinite(v)) done[k] = v;
    }
  }
  return { xp, done, streak, lastVisit };
}

export function mergeProgress(a, b) {
  const x = validateProgress(a);
  const y = validateProgress(b);
  return {
    xp: Math.max(x.xp, y.xp),
    done: { ...x.done, ...y.done },
    streak: Math.max(x.streak, y.streak),
    lastVisit: [x.lastVisit, y.lastVisit].filter(Boolean).sort().pop() || null,
  };
}

export async function getProgress(username) {
  const raw = await kv('GET', `progress:${username.toLowerCase()}`);
  if (!raw) return { xp: 0, done: {}, streak: 0, lastVisit: null };
  return validateProgress(typeof raw === 'string' ? JSON.parse(raw) : raw);
}

export async function saveProgress(username, progress) {
  const clean = validateProgress(progress);
  await kv('SET', `progress:${username.toLowerCase()}`, JSON.stringify(clean));
  await kv('ZADD', 'lb:xp', String(clean.xp), username.toLowerCase());
  return clean;
}

export async function leaderboard(limit = 10) {
  const res = await kv('ZREVRANGE', 'lb:xp', '0', String(limit - 1), 'WITHSCORES');
  if (!Array.isArray(res)) return [];
  const out = [];
  for (let i = 0; i < res.length; i += 2) {
    const username = res[i];
    const xp = Number(res[i + 1]);
    const user = await getUser(username);
    out.push({ username, displayName: user?.displayName || username, xp });
  }
  return out;
}
