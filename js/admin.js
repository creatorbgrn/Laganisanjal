// =====================================================================
// admin.js — metrics + submission management (admin only)
// =====================================================================
let adminTab = 'businesses';
let adminStatus = '';

function fmtDetail(row, type) {
  if (type === 'businesses') {
    return `
      ${row.pitch ? `<p style="margin-bottom:10px">${escapeHtml(row.pitch)}</p>` : ''}
      <div class="kv"><span>Owner</span><span>${escapeHtml(row.owner_name || '—')}</span></div>
      <div class="kv"><span>Funding sought</span><span>${formatNRs(row.funding_amount)}</span></div>
      <div class="kv"><span>Industry / stage</span><span>${escapeHtml(row.industry || '—')} · ${escapeHtml(row.stage || '—')}</span></div>
      <div class="kv"><span>Location</span><span>${escapeHtml([row.city, row.province].filter(Boolean).join(', ') || '—')}</span></div>
      <div class="kv"><span>Contact (private)</span><span>${escapeHtml(row.contact_email || '—')} ${escapeHtml(row.contact_phone || '')}</span></div>
      ${row.business_plan ? `<h3 style="font-size:.95rem;margin:14px 0 4px">Business plan</h3><p class="muted" style="white-space:pre-wrap">${escapeHtml(row.business_plan)}</p>` : ''}
      ${row.future_plan ? `<h3 style="font-size:.95rem;margin:14px 0 4px">Future plan</h3><p class="muted" style="white-space:pre-wrap">${escapeHtml(row.future_plan)}</p>` : ''}
      ${row.funds_use ? `<h3 style="font-size:.95rem;margin:14px 0 4px">Use of funds</h3><p class="muted" style="white-space:pre-wrap">${escapeHtml(row.funds_use)}</p>` : ''}
      ${(row.images && row.images.length) ? `<div class="gallery__thumbs" style="margin-top:12px">${row.images.map(u => `<img src="${escapeHtml(u)}">`).join('')}</div>` : ''}`;
  }
  return `
    ${row.bio ? `<p style="margin-bottom:10px">${escapeHtml(row.bio)}</p>` : ''}
    <div class="kv"><span>Type</span><span>${escapeHtml(row.investor_type || '—')}</span></div>
    <div class="kv"><span>Amount range</span><span>${formatNRs(row.min_amount)} – ${formatNRs(row.max_amount)}</span></div>
    <div class="kv"><span>Preferred stage</span><span>${escapeHtml(row.preferred_stage || '—')}</span></div>
    <div class="kv"><span>Region</span><span>${escapeHtml(row.region || '—')}</span></div>
    <div class="kv"><span>Industries</span><span>${escapeHtml((row.industries || []).join(', ') || '—')}</span></div>
    <div class="kv"><span>Involvement</span><span>${escapeHtml(row.involvement || '—')}</span></div>
    <div class="kv"><span>Contact (private)</span><span>${escapeHtml(row.contact_email || '—')} ${escapeHtml(row.contact_phone || '')}</span></div>`;
}

function adminCard(row, type) {
  const title = type === 'businesses' ? row.business_name : row.full_name;
  return `<div class="card" data-id="${row.id}">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap">
      <div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <strong style="color:var(--ink);font-size:1.05rem">${escapeHtml(title)}</strong>
          ${statusBadge(row.status)}
        </div>
        <div class="muted" style="font-size:.82rem;margin-top:3px">Submitted ${timeAgo(row.created_at)}</div>
      </div>
      <div class="row-actions">
        ${row.status !== 'approved' ? `<button class="btn btn--success btn--sm" data-act="approve">Approve</button>` : ''}
        ${row.status !== 'rejected' ? `<button class="btn btn--ghost btn--sm" data-act="reject">Reject</button>` : ''}
        ${row.status !== 'removed' ? `<button class="btn btn--ghost btn--sm" data-act="remove">Remove</button>` : ''}
        <a class="btn btn--ghost btn--sm" href="register.html?type=${type === 'businesses' ? 'business' : 'investor'}&edit=${row.id}">Edit</a>
        <button class="btn btn--danger btn--sm" data-act="delete">Delete</button>
      </div>
    </div>
    <details style="margin-top:12px">
      <summary class="muted" style="cursor:pointer;font-size:.88rem">View full details</summary>
      <div style="margin-top:12px">${fmtDetail(row, type)}</div>
    </details>
  </div>`;
}

async function setStatus(table, id, status) {
  const { error } = await sb.from(table).update({ status }).eq('id', id);
  if (error) { toast('Update failed: ' + error.message, 'err'); return false; }
  return true;
}

async function loadList() {
  const box = $('#adminList');
  box.innerHTML = '<div class="spinner"></div>';
  const table = adminTab;
  let q = sb.from(table).select('*').order('created_at', { ascending: false });
  if (adminStatus) q = q.eq('status', adminStatus);
  const { data, error } = await q;
  if (error) { box.innerHTML = `<div class="empty">Could not load: ${escapeHtml(error.message)}</div>`; return; }
  box.innerHTML = data.length
    ? `<div class="grid">${data.map(r => adminCard(r, table)).join('')}</div>`
    : `<div class="empty">No ${table} with this status.</div>`;

  $$('#adminList [data-act]').forEach(btn => btn.addEventListener('click', async () => {
    const card = btn.closest('[data-id]');
    const id = card.dataset.id;
    const act = btn.dataset.act;
    if (act === 'delete') {
      if (!confirm('Permanently delete this submission?')) return;
      const { error } = await sb.from(table).delete().eq('id', id);
      if (error) return toast('Delete failed.', 'err');
      toast('Deleted.', 'ok'); loadList(); loadMetrics(); return;
    }
    const map = { approve: 'approved', reject: 'rejected', remove: 'removed' };
    if (await setStatus(table, id, map[act])) {
      toast('Status updated to ' + map[act] + '.', 'ok');
      loadList(); loadMetrics();
    }
  }));
}

async function loadMetrics() {
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);

  const [biz, inv, views30, viewsToday, liveBiz] = await Promise.all([
    sb.from('businesses').select('status', { count: 'exact' }),
    sb.from('investors').select('status', { count: 'exact' }),
    sb.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', since30),
    sb.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', startToday.toISOString()),
    sb.from('businesses').select('funding_amount, industry').eq('status', 'approved'),
  ]);

  const bizRows = biz.data || [], invRows = inv.data || [];
  const count = (rows, s) => rows.filter(r => r.status === s).length;

  $('#mBiz').textContent = biz.count ?? bizRows.length;
  $('#mInv').textContent = inv.count ?? invRows.length;
  $('#mPending').textContent = count(bizRows, 'pending') + count(invRows, 'pending');
  $('#mApproved').textContent = count(bizRows, 'approved') + count(invRows, 'approved');
  $('#mRejected').textContent = count(bizRows, 'rejected') + count(invRows, 'rejected');
  $('#mViews').textContent = views30.count ?? 0;
  $('#mToday').textContent = viewsToday.count ?? 0;

  const live = liveBiz.data || [];
  const totalFund = live.reduce((s, r) => s + (Number(r.funding_amount) || 0), 0);
  $('#mFund').textContent = formatNRs(totalFund);

  // by industry
  const byInd = {};
  live.forEach(r => { const k = r.industry || 'Other'; byInd[k] = (byInd[k] || 0) + 1; });
  const indEntries = Object.entries(byInd).sort((a, b) => b[1] - a[1]);
  const max = indEntries.length ? indEntries[0][1] : 1;
  $('#byIndustry').innerHTML = indEntries.length ? indEntries.map(([k, v]) =>
    `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:.85rem">
        <span>${escapeHtml(k)}</span><span class="muted">${v}</span></div>
      <div style="height:8px;background:var(--blue-50);border-radius:6px;margin-top:3px">
        <div style="height:100%;width:${(v / max * 100)}%;background:var(--blue-600);border-radius:6px"></div></div>
    </div>`).join('') : '<div class="muted">No live businesses yet.</div>';
}

async function loadRecent() {
  const [{ data: b }, { data: v }] = await Promise.all([
    sb.from('businesses').select('business_name, status, created_at').order('created_at', { ascending: false }).limit(5),
    sb.from('investors').select('full_name, status, created_at').order('created_at', { ascending: false }).limit(5),
  ]);
  const items = [
    ...(b || []).map(x => ({ name: x.business_name, kind: 'Business', status: x.status, at: x.created_at })),
    ...(v || []).map(x => ({ name: x.full_name, kind: 'Investor', status: x.status, at: x.created_at })),
  ].sort((a, c) => new Date(c.at) - new Date(a.at)).slice(0, 7);

  $('#recent').innerHTML = items.length ? items.map(i =>
    `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:.88rem">
      <span>${escapeHtml(i.name)} <span class="muted">· ${i.kind}</span></span>
      ${statusBadge(i.status)}
    </div>`).join('') : '<div class="muted">No activity yet.</div>';
}

// ---- wire tabs ----
$$('#adminTabs button').forEach(b => b.addEventListener('click', () => {
  $$('#adminTabs button').forEach(x => x.classList.remove('active'));
  b.classList.add('active'); adminTab = b.dataset.tab; loadList();
}));
$$('#statusFilter button').forEach(b => b.addEventListener('click', () => {
  $$('#statusFilter button').forEach(x => x.classList.remove('active'));
  b.classList.add('active'); adminStatus = b.dataset.status; loadList();
}));

// ---- init: admin gate ----
(async () => {
  const user = await currentUser();
  if (!user) { location.href = 'login.html?next=admin.html'; return; }
  const profile = await currentProfile();
  if (!profile || !profile.is_admin) {
    $('#adminGate').innerHTML = `<div class="notice notice--err">
      This area is for administrators only. If you are the site owner, mark your profile as admin
      in Supabase (see the README), then reload this page.</div>`;
    return;
  }
  $('#adminMain').style.display = 'block';
  loadMetrics();
  loadRecent();
  loadList();
})();
