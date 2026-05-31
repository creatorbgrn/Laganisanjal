// =====================================================================
// LaganiSanjal — shared front-end helpers, navigation & auth state
// =====================================================================
const sb = window.sb;

// ---------- tiny DOM helpers ----------
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const el = (tag, attrs = {}, html) => {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v);
  });
  if (html != null) n.innerHTML = html;
  return n;
};

// ---------- formatting ----------
function formatNRs(n) {
  if (n == null || n === '' || isNaN(n)) return '—';
  return 'NRs ' + Number(n).toLocaleString('en-IN');
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function timeAgo(ts) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + ' min ago';
  if (d < 86400) return Math.floor(d / 3600) + ' hr ago';
  if (d < 604800) return Math.floor(d / 86400) + ' d ago';
  return new Date(ts).toLocaleDateString();
}
function statusBadge(status) {
  const map = {
    approved: ['badge--green', 'Approved · Live'],
    pending:  ['badge--amber', 'Pending review'],
    rejected: ['badge--red', 'Rejected'],
    removed:  ['badge--gray', 'Removed'],
  };
  const [cls, label] = map[status] || ['badge--gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}
const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
const INDUSTRIES = ['Agriculture', 'Technology', 'Retail & E-commerce', 'Food & Beverage',
  'Tourism & Hospitality', 'Manufacturing', 'Health', 'Education', 'Handicrafts',
  'Finance', 'Energy', 'Services', 'Other'];

// ---------- toast ----------
function toast(msg, type = '') {
  let host = $('.toast-host');
  if (!host) { host = el('div', { class: 'toast-host' }); document.body.appendChild(host); }
  const t = el('div', { class: 'toast ' + (type ? 'toast--' + type : '') }, escapeHtml(msg));
  host.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ---------- auth ----------
async function currentUser() {
  const { data } = await sb.auth.getUser();
  return data.user || null;
}
async function currentProfile() {
  const user = await currentUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data ? { ...data, email: user.email } : { id: user.id, email: user.email, is_admin: false };
}
async function requireAuth(redirect = 'login.html') {
  const user = await currentUser();
  if (!user) {
    location.href = redirect + '?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
    return null;
  }
  return user;
}
async function logout() {
  await sb.auth.signOut();
  location.href = 'index.html';
}

// ---------- navbar + footer (rendered once, shared by all pages) ----------
async function buildChrome() {
  const profile = await currentProfile();
  const here = location.pathname.split('/').pop() || 'index.html';
  const link = (href, label) =>
    `<a href="${href}" class="${here === href ? 'active' : ''}">${label}</a>`;

  let right = profile
    ? `${link('dashboard.html', 'My Dashboard')}
       ${profile.is_admin ? link('admin.html', 'Admin') : ''}
       <a href="#" id="logoutBtn">Log out</a>`
    : `${link('login.html', 'Log in')}
       <a href="register.html" class="btn btn--primary btn--sm" style="color:#fff">Register</a>`;

  const header = $('#site-header');
  if (header) {
    header.className = 'nav';
    header.innerHTML = `
      <div class="container nav__inner">
        <a href="index.html" class="brand">
          <span class="brand__mark">LS</span> LaganiSanjal
        </a>
        <button class="nav__toggle" id="navToggle" aria-label="Menu">Menu</button>
        <nav class="nav__links" id="navLinks">
          ${link('index.html', 'Home')}
          ${link('browse.html', 'Browse')}
          ${link('how.html', 'How it works')}
          ${link('about.html', 'About')}
          ${right}
        </nav>
      </div>`;
    const tog = $('#navToggle'), links = $('#navLinks');
    tog && tog.addEventListener('click', () => links.classList.toggle('open'));
    const lo = $('#logoutBtn');
    lo && lo.addEventListener('click', e => { e.preventDefault(); logout(); });
  }

  const footer = $('#site-footer');
  if (footer) {
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="container">
        <div class="footer__grid">
          <div>
            <div class="footer__brand">LaganiSanjal</div>
            <p style="max-width:340px;font-size:.92rem">A platform that connects Nepali entrepreneurs
              and small businesses with investors who want to support and grow local ventures.</p>
          </div>
          <div>
            <h4>Platform</h4>
            <a href="browse.html">Browse opportunities</a>
            <a href="how.html">How it works</a>
            <a href="register.html">Register</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="about.html">About us</a>
            <a href="login.html">Member log in</a>
          </div>
        </div>
        <div class="footer__bottom">
          <span>&copy; ${new Date().getFullYear()} LaganiSanjal. All rights reserved.</span>
          <span>Made for the Nepali market</span>
        </div>
      </div>`;
  }
}

// ---------- page-view tracking (best-effort, never blocks UI) ----------
function trackView() {
  const path = location.pathname.split('/').pop() || 'index.html';
  sb.from('page_views').insert({ path }).then(() => {}, () => {});
}

document.addEventListener('DOMContentLoaded', () => {
  buildChrome();
  trackView();
});
