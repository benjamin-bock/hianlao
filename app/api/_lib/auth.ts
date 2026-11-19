// Auth & progress helpers. Passwords are scrypt-hashed, sessions are random
// tokens stored in KV (httpOnly cookie on the client).
import crypto from 'node:crypto';
import { kv } from './kv.ts';
import { LESSON_BY_ID } from '../../../src/data/units.ts';

export const USER_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const MIN_PASSWORD = 8;

export interface UserRecord {
  username: string;
  displayName: string;
  hash: string;
  createdAt: string;
}

export type PublicUser = Pick<UserRecord, 'username' | 'displayName' | 'createdAt'>;

export interface ProgressEntry { due: number; iv: number }
export interface ServerProgress {
  xp: number;
  done: Record<string, number>;
  streak: number;
  lastVisit: string | null;
  goal: number;
  reviews: Record<string, ProgressEntry>;
}

export const DEFAULT_GOAL = 20;

export function validateUsername(u: unknown): boolean {
  return typeof u === 'string' && USER_RE.test(u);
}

export function validatePassword(p: unknown): boolean {
  return typeof p === 'string' && p.length >= MIN_PASSWORD && p.length <= 128;
}

export function hashPassword(pw: string, salt = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.scryptSync(pw, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: unknown): boolean {
  if (typeof stored !== 'string') return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(pw, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

export async function getUser(username: string): Promise<UserRecord | null> {
  const raw = await kv('GET', `user:${username.toLowerCase()}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserRecord;
  } catch {
    return null;
  }
}

export async function createUser(username: string, password: string, displayName: string): Promise<PublicUser> {
  const key = `user:${username.toLowerCase()}`;
  const record: UserRecord = {
    username,
    displayName: displayName || username,
    hash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await kv('SET', key, JSON.stringify(record));
  return { username: record.username, displayName: record.displayName, createdAt: record.createdAt };
}

export async function createSession(username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await kv('SET', `session:${token}`, username.toLowerCase(), 'EX', String(60 * 60 * 24 * 30));
  return token;
}

export async function userFromToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  return (await kv('GET', `session:${token}`)) || null;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (token) await kv('DEL', `session:${token}`);
}

const EMPTY: ServerProgress = { xp: 0, done: {}, streak: 0, lastVisit: null, goal: DEFAULT_GOAL, reviews: {} };

export function validateProgress(p: unknown): ServerProgress {
  if (!p || typeof p !== 'object') return { ...EMPTY };
  const o = p as Record<string, unknown>;
  const xp = Number.isInteger(o.xp) && (o.xp as number) >= 0 && (o.xp as number) <= 1e7 ? (o.xp as number) : 0;
  const streak = Number.isInteger(o.streak) && (o.streak as number) >= 0 && (o.streak as number) <= 3650 ? (o.streak as number) : 0;
  const lastVisit = typeof o.lastVisit === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.lastVisit) ? o.lastVisit : null;
  const goal = Number.isInteger(o.goal) && (o.goal as number) >= 10 && (o.goal as number) <= 500 ? (o.goal as number) : DEFAULT_GOAL;
  const done: Record<string, number> = {};
  if (o.done && typeof o.done === 'object') {
    for (const [k, v] of Object.entries(o.done as Record<string, unknown>)) {
      if (LESSON_BY_ID[k] && Number.isFinite(v)) done[k] = v as number;
    }
  }
  const reviews: Record<string, ProgressEntry> = {};
  if (o.reviews && typeof o.reviews === 'object') {
    for (const [k, v] of Object.entries(o.reviews as Record<string, unknown>)) {
      const e = v as Partial<ProgressEntry> | null;
      if (LESSON_BY_ID[k] && e && Number.isFinite(e.due) && Number.isFinite(e.iv)) {
        reviews[k] = { due: e.due as number, iv: Math.min(Math.max(e.iv as number, 1), 30) };
      }
    }
  }
  return { xp, done, streak, lastVisit, goal, reviews };
}

export function mergeProgress(a: unknown, b: unknown): ServerProgress {
  const x = validateProgress(a);
  const y = validateProgress(b);
  const reviews = { ...x.reviews };
  for (const [k, v] of Object.entries(y.reviews)) {
    reviews[k] = !reviews[k] || reviews[k].due < v.due ? v : reviews[k];
  }
  return {
    xp: Math.max(x.xp, y.xp),
    done: { ...x.done, ...y.done },
    streak: Math.max(x.streak, y.streak),
    lastVisit: [x.lastVisit, y.lastVisit].filter(Boolean).sort().pop() || null,
    goal: y.goal || x.goal,
    reviews,
  };
}

export async function getProgress(username: string): Promise<ServerProgress> {
  const raw = await kv('GET', `progress:${username.toLowerCase()}`);
  if (!raw) return { xp: 0, done: {}, streak: 0, lastVisit: null, goal: DEFAULT_GOAL, reviews: {} };
  try {
    return validateProgress(JSON.parse(raw));
  } catch {
    return { ...EMPTY };
  }
}

// ISO week key, e.g. "2026-W46" — the weekly leaderboard bucket.
export function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const fday = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fday + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export async function saveProgress(username: string, progress: unknown): Promise<ServerProgress> {
  const clean = validateProgress(progress);
  await kv('SET', `progress:${username.toLowerCase()}`, JSON.stringify(clean));
  await kv('ZADD', 'lb:xp', String(clean.xp), username.toLowerCase());
  await kv('ZADD', `lb:xp:w${weekKey()}`, String(clean.xp), username.toLowerCase());
  return clean;
}

export interface LeaderEntry { username: string; displayName: string; xp: number }

export async function leaderboard(limit = 10, period: 'all' | 'week' = 'all'): Promise<LeaderEntry[]> {
  const key = period === 'week' ? `lb:xp:w${weekKey()}` : 'lb:xp';
  const res = await kv('ZREVRANGE', key, '0', String(limit - 1), 'WITHSCORES');
  if (!res || !Array.isArray(res)) return [];
  const out: LeaderEntry[] = [];
  for (let i = 0; i + 1 < res.length; i += 2) {
    const username = String(res[i]);
    const xp = Number(res[i + 1]);
    const user = await getUser(username);
    out.push({ username, displayName: user?.displayName || username, xp });
  }
  return out;
}
