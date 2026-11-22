'use client';

// Account: auth card (login/register) + profile with achievements.
// Ported from legacy account.js.
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import { api, initAuth, getState, getUser, totalDone, type ApiUser } from '@/lib/store';
import { unlockedAchievements, lockedAchievements } from '@/lib/achievements';
import { useShell } from '@/components/SiteShell';
import { BadgeIcon } from '@/components/Icons';
import { Flame, UserRound, Zap } from 'lucide-react';
import { UNITS } from '@/data/units.ts';

export default function AccountPage() {
  const { t } = useT();
  const { user, setUser } = useShell();
  const [, bump] = useState(0);
  const refresh = useCallback(() => bump((n) => n + 1), []);

  useEffect(() => {
    if (!getUser()) initAuth().then((u) => { if (u) setUser(u); refresh(); });
  }, [setUser, refresh]);

  return (
    <>
      <div className="page-head"><h1>{user ? t('profile_title') : t('account_title')}</h1></div>
      {user ? <ProfileCard user={user as ApiUser & { createdAt?: string }} onLogout={() => { setUser(null); refresh(); }} /> : <AuthCard onDone={() => refresh()} />}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function AuthCard({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const { setUser } = useShell();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      if (!api.available) { setErr(t('auth_offline')); return; }
      let r;
      if (mode === 'register') {
        if (pass !== pass2) { setErr(t('auth_pass_mismatch')); return; }
        r = await api.register(username.trim(), pass, displayName.trim());
      } else {
        r = await api.login(username.trim(), pass);
      }
      if (!r.ok) { setErr(r.error || t('auth_error')); return; }
      if (r.user) setUser(r.user);
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card auth-card">
      <h1>{t('auth_title')}</h1>
      <p className="section-sub">{t('auth_sub')}</p>
      <div className="mode-tabs">
        <button className={`chip${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setErr(''); }}>{t('sign_in')}</button>
        <button className={`chip${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setErr(''); }}>{t('tab_register')}</button>
      </div>
      <Field label={t('f_username')}>
        <input className="type-input" type="text" autoComplete="username" placeholder={t('ph_username')} value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <Field label={t('f_password')}>
        <input className="type-input" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={t('ph_pass')} value={pass} onChange={(e) => setPass(e.target.value)} />
      </Field>
      {mode === 'register' ? (
        <>
          <Field label={t('f_pass2')}>
            <input className="type-input" type="password" autoComplete="new-password" placeholder={t('ph_pass2')} value={pass2} onChange={(e) => setPass2(e.target.value)} />
          </Field>
          <Field label={t('f_display_name')}>
            <input className="type-input" type="text" placeholder={t('ph_optional')} maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
        </>
      ) : null}
      <p className="form-error">{err}</p>
      <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={busy} onClick={submit}>{t('sign_in')}</button>
      <p className="muted" style={{ marginTop: '.75rem' }}><Link href="/learn">{t('guest_cta')}</Link></p>
    </div>
  );
}

function ProfileCard({ user, onLogout }: { user: ApiUser & { createdAt?: string }; onLogout: () => void }) {
  const { t } = useT();
  const totalLessons = UNITS.reduce((n, u) => n + u.lessons.length, 0);
  const s = getState();
  const unlocked = unlockedAchievements().map((a) => ({ ...a, unlocked: true }));
  const locked = lockedAchievements().map((a) => ({ ...a, unlocked: false }));

  return (
    <div className="card auth-card">
      <h1><UserRound size={28} style={{ verticalAlign: '-.25em', marginRight: '.3em', color: 'var(--brand)' }} /> {user.displayName || user.username}</h1>
      <p className="muted">{t('member_since').replace('{x}', String(user.createdAt || '').slice(0, 10)).replace('{u}', user.username)}</p>
      <div className="summary-stats">
        <div className="stat"><strong><Zap size={18} style={{ verticalAlign: '-.2em', color: '#b8860b' }} /> {s.xp}</strong><span>XP</span></div>
        <div className="stat"><strong><Flame size={18} style={{ verticalAlign: '-.2em', color: '#ff7a00' }} /> {s.streak}</strong><span>{t('stat_streak')}</span></div>
        <div className="stat"><strong>{totalDone()}/{totalLessons}</strong><span>{t('stat_lessons_n')}</span></div>
      </div>
      <h2 style={{ marginTop: '1rem' }}>{t('summary_achievements')} ({unlocked.length}/{unlocked.length + locked.length})</h2>
      <div className="badge-grid">
        {[...unlocked, ...locked].map((a) => (
          <div key={a.id} className={`badge-card${a.unlocked ? '' : ' locked'}`}>
            <span className="badge-icon"><BadgeIcon id={a.id} /></span>
            <div><strong>{a.name}</strong><p>{a.desc}</p></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        <Link className="btn btn-primary" href="/learn">{t('cta_continue')}</Link>
        <button className="btn btn-ghost" onClick={async () => { await api.logout(); onLogout(); }}>{t('logout')}</button>
      </div>
    </div>
  );
}
