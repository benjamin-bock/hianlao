import { el, renderShell } from './main.js';
import { t } from './ui.js';
import { api, initAuth, getState, getUser, totalDone } from './store.js';
import { unlockedAchievements, lockedAchievements } from './achievements.js';
import { UNITS } from './data/units.js';

renderShell('learn');

const app = document.getElementById('app');
const totalLessons = UNITS.reduce((n, u) => n + u.lessons.length, 0);

function field(labelText, input) {
  return el('label', { class: 'field' }, el('span', {}, labelText), input);
}

function authCard() {
  const user = el('input', { class: 'type-input', type: 'text', autocomplete: 'username', placeholder: 'e.g. laogirl_21' });
  const pass = el('input', { class: 'type-input', type: 'password', autocomplete: 'current-password', placeholder: 'min. 8 characters' });
  const pass2 = el('input', { class: 'type-input', type: 'password', autocomplete: 'new-password', placeholder: 'repeat password' });
  const name = el('input', { class: 'type-input', type: 'text', placeholder: 'optional', maxlength: '40' });
  const err = el('p', { class: 'form-error' });
  const modeTabs = el('div', { class: 'mode-tabs' });
  let mode = 'login';
  const nameRow = field('Display name (optional)', name);
  const pass2Row = field('Repeat password', pass2);
  nameRow.style.display = 'none'; pass2Row.style.display = 'none';

  function tab(label, m) {
    const b = el('button', { class: `chip${mode === m ? ' active' : ''}` }, label);
    b.addEventListener('click', () => {
      mode = m;
      modeTabs.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const reg = mode === 'register';
      nameRow.style.display = reg ? '' : 'none';
      pass2Row.style.display = reg ? '' : 'none';
      err.textContent = '';
    });
    return b;
  }
  modeTabs.append(tab('Sign in', 'login'), tab('Create account', 'register'));

  const submit = el('button', { class: 'btn btn-primary btn-lg', style: 'width:100%' }, 'Sign in');
  submit.addEventListener('click', async () => {
    err.textContent = '';
    submit.disabled = true;
    try {
      if (!api.available) {
        err.textContent = 'Backend not available right now — you can keep learning as a guest (progress stays on this device).';
        return;
      }
      let r;
      if (mode === 'register') {
        if (pass.value !== pass2.value) { err.textContent = 'Passwords do not match.'; return; }
        r = await api.register(user.value.trim(), pass.value, name.value.trim());
      } else {
        r = await api.login(user.value.trim(), pass.value);
      }
      if (!r.ok) { err.textContent = r.error || 'Something went wrong.'; return; }
      render();
    } finally {
      submit.disabled = false;
    }
  });

  return el('div', { class: 'card auth-card' },
    el('h1', {}, 'Your HianLao account'),
    el('p', { class: 'section-sub' }, 'Free forever. Syncs your XP, streak and completed lessons across all your devices, and puts you on the leaderboard. Without an account, progress stays in this browser (localStorage).'),
    modeTabs,
    field('Username', user),
    field('Password', pass),
    nameRow, pass2Row,
    err,
    submit,
    el('p', { class: 'muted', style: 'margin-top:.75rem' }, el('a', { href: 'learn.html' }, 'Continue as guest →')),
  );
}

function badge(a) {
  return el('div', { class: `badge-card${a.unlocked ? '' : ' locked'}` },
    el('span', { class: 'badge-icon' }, a.icon),
    el('div', {}, el('strong', {}, a.name), el('p', {}, a.desc)));
}

function profileCard(u) {
  const s = getState();
  const unlocked = unlockedAchievements();
  const locked = lockedAchievements();
  const logout = el('button', { class: 'btn btn-ghost' }, 'Log out');
  logout.addEventListener('click', async () => { await api.logout(); render(); });
  return el('div', { class: 'card auth-card' },
    el('h1', {}, `👤 ${u.displayName || u.username}`),
    el('p', { class: 'muted' }, `Member since ${String(u.createdAt || '').slice(0, 10)} · @${u.username} · synced to your account ✔`),
    el('div', { class: 'summary-stats' },
      el('div', { class: 'stat' }, el('strong', {}, `⚡ ${s.xp}`), el('span', {}, 'XP')),
      el('div', { class: 'stat' }, el('strong', {}, `🔥 ${s.streak}`), el('span', {}, 'day streak')),
      el('div', { class: 'stat' }, el('strong', {}, `${totalDone()}/${totalLessons}`), el('span', {}, 'lessons')),
    ),
    el('h2', { style: 'margin-top:1rem' }, `🏅 Achievements (${unlocked.length}/${unlocked.length + locked.length})`),
    el('div', { class: 'badge-grid' }, [...unlocked, ...locked].map(a => badge({ ...a, unlocked: unlocked.includes(a) }))),
    el('div', { style: 'display:flex; gap:.75rem; margin-top:1.25rem; flex-wrap:wrap' },
      el('a', { class: 'btn btn-primary', href: 'learn.html' }, 'Continue learning →'),
      logout),
  );
}

async function render() {
  app.innerHTML = '';
  const user = getUser() || await initAuth();
  app.append(el('div', { class: 'page-head' }, el('h1', {}, user ? t('profile_title') : t('account_title'))));
  app.append(user ? profileCard(user) : authCard());
}

render();
