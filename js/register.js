// =====================================================================
// register.js — business & investor registration + edit
// =====================================================================
const CFG = window.LAGANISANJAL_CONFIG;
const params = new URLSearchParams(location.search);
let activeType = params.get('type') === 'investor' ? 'investor' : 'business';
const editId = params.get('edit');          // present when editing
let user = null;
let existingImages = [];                     // urls already uploaded (edit mode)
let newFiles = [];                           // File objects to upload

// ---- populate select options ----
$('#bizIndustry').innerHTML = INDUSTRIES.map(i => `<option value="${i}">${i}</option>`).join('');
$('#bizProvince').innerHTML = '<option value="">Select province</option>' +
  PROVINCES.map(p => `<option value="${p}">${p}</option>`).join('');
$('#invRegion').innerHTML = '<option value="">Any region</option>' +
  PROVINCES.map(p => `<option value="${p}">${p}</option>`).join('');
$('#invIndustries').innerHTML = INDUSTRIES.map(i =>
  `<label class="check"><input type="checkbox" value="${i}"> ${i}</label>`).join('');
$('#maxImgLabel').textContent = CFG.MAX_IMAGES;

// ---- tab switching ----
function setType(t) {
  activeType = t;
  $$('#typeTabs button').forEach(b => b.classList.toggle('active', b.dataset.type === t));
  $('#bizForm').style.display = t === 'business' ? 'block' : 'none';
  $('#invForm').style.display = t === 'investor' ? 'block' : 'none';
}
$$('#typeTabs button').forEach(b => b.addEventListener('click', () => {
  if (editId) return; // can't switch type while editing
  setType(b.dataset.type);
}));

function showMsg(boxId, text, kind) {
  $('#' + boxId).innerHTML = `<div class="notice notice--${kind}">${escapeHtml(text)}</div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- image preview / selection ----
function renderImagePreview() {
  const host = $('#bizImagePreview');
  const all = [
    ...existingImages.map((u, i) => ({ url: u, existing: true, i })),
    ...newFiles.map((f, i) => ({ url: URL.createObjectURL(f), existing: false, i })),
  ];
  host.innerHTML = all.map(item =>
    `<div class="thumb"><img src="${item.url}">
      <button type="button" data-existing="${item.existing}" data-i="${item.i}">&times;</button></div>`).join('');
  $$('#bizImagePreview .thumb button').forEach(btn => btn.addEventListener('click', () => {
    const isExisting = btn.dataset.existing === 'true';
    const idx = Number(btn.dataset.i);
    if (isExisting) existingImages.splice(idx, 1); else newFiles.splice(idx, 1);
    renderImagePreview();
  }));
}
$('#bizImages').addEventListener('change', e => {
  const max = CFG.MAX_IMAGES, maxBytes = CFG.MAX_IMAGE_MB * 1024 * 1024;
  for (const f of e.target.files) {
    if (existingImages.length + newFiles.length >= max) { toast(`Maximum ${max} photos.`, 'err'); break; }
    if (f.size > maxBytes) { toast(`${f.name} is larger than ${CFG.MAX_IMAGE_MB} MB.`, 'err'); continue; }
    newFiles.push(f);
  }
  e.target.value = '';
  renderImagePreview();
});

async function uploadImages() {
  const urls = [...existingImages];
  for (const file of newFiles) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await sb.storage.from(CFG.IMAGE_BUCKET).upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = sb.storage.from(CFG.IMAGE_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

function formToObject(form, fields) {
  const o = {};
  fields.forEach(f => {
    const elx = form.elements[f];
    if (!elx) return;
    let v = elx.value.trim();
    if (elx.type === 'number') v = v === '' ? null : Number(v);
    o[f] = v === '' ? null : v;
  });
  return o;
}

// ---- submit: business ----
$('#bizForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = $('#bizSubmit');
  btn.disabled = true; btn.textContent = 'Uploading…';
  try {
    const payload = formToObject(form, ['business_name', 'owner_name', 'industry', 'stage',
      'province', 'city', 'pitch', 'business_plan', 'future_plan', 'funding_amount',
      'current_revenue', 'funds_use', 'team_size', 'website', 'contact_email', 'contact_phone']);
    payload.images = await uploadImages();
    let error;
    if (editId) {
      ({ error } = await sb.from('businesses').update(payload).eq('id', editId));
    } else {
      payload.user_id = user.id;
      ({ error } = await sb.from('businesses').insert(payload));
    }
    if (error) throw error;
    location.href = 'dashboard.html?submitted=1';
  } catch (err) {
    showMsg('bizMsg', err.message || 'Could not submit. Please try again.', 'err');
    btn.disabled = false; btn.textContent = editId ? 'Save changes' : 'Submit for review';
  }
});

// ---- submit: investor ----
$('#invForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = $('#invSubmit');
  btn.disabled = true; btn.textContent = 'Submitting…';
  try {
    const payload = formToObject(form, ['full_name', 'investor_type', 'region', 'preferred_stage',
      'min_amount', 'max_amount', 'involvement', 'bio', 'contact_email', 'contact_phone']);
    payload.industries = $$('#invIndustries input:checked').map(c => c.value);
    let error;
    if (editId) {
      ({ error } = await sb.from('investors').update(payload).eq('id', editId));
    } else {
      payload.user_id = user.id;
      ({ error } = await sb.from('investors').insert(payload));
    }
    if (error) throw error;
    location.href = 'dashboard.html?submitted=1';
  } catch (err) {
    showMsg('invMsg', err.message || 'Could not submit. Please try again.', 'err');
    btn.disabled = false; btn.textContent = editId ? 'Save changes' : 'Submit for review';
  }
});

// ---- prefill when editing ----
async function loadForEdit() {
  const table = activeType === 'investor' ? 'investors' : 'businesses';
  const { data, error } = await sb.from(table).select('*').eq('id', editId).maybeSingle();
  if (error || !data) { showMsg(activeType === 'investor' ? 'invMsg' : 'bizMsg',
    'Could not load this submission for editing.', 'err'); return; }
  $('#pageTitle').textContent = 'Edit your submission';
  $$('#typeTabs button').forEach(b => b.style.display = b.dataset.type === activeType ? '' : 'none');

  if (activeType === 'business') {
    const f = $('#bizForm');
    ['business_name','owner_name','industry','stage','province','city','pitch','business_plan',
     'future_plan','funding_amount','current_revenue','funds_use','team_size','website',
     'contact_email','contact_phone'].forEach(k => { if (f.elements[k] && data[k] != null) f.elements[k].value = data[k]; });
    existingImages = data.images || [];
    renderImagePreview();
    $('#bizSubmit').textContent = 'Save changes';
  } else {
    const f = $('#invForm');
    ['full_name','investor_type','region','preferred_stage','min_amount','max_amount',
     'involvement','bio','contact_email','contact_phone'].forEach(k => { if (f.elements[k] && data[k] != null) f.elements[k].value = data[k]; });
    (data.industries || []).forEach(ind => {
      const cb = $$('#invIndustries input').find(c => c.value === ind);
      if (cb) cb.checked = true;
    });
    $('#invSubmit').textContent = 'Save changes';
  }
}

// ---- init: require auth, then show form ----
(async () => {
  setType(activeType);
  user = await currentUser();
  if (!user) {
    const here = 'register.html' + location.search;
    $('#gate').innerHTML = `<div class="notice notice--info">
      Please <a href="login.html?next=${encodeURIComponent(here)}">log in or create a free account</a>
      to register a business or investor profile.</div>`;
    $('#bizForm').style.display = 'none';
    $('#invForm').style.display = 'none';
    return;
  }
  if (editId) await loadForEdit();
})();
