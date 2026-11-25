/* Interactive templates: AI Use Case Canvas, evaluation sheet and critique questions.
   Fields, case types and questions are read from the framework markdown via window.CADF.
   Answers are stored per project in localStorage and can be exported or imported. */
(function () {
  'use strict';

  const C = window.CADF;
  if (!C) return;
  const { esc, plain, slugify, svg, store, tablesIn, roleOf, bySlug, CHAPTERS, ROLES } = C;
  const STORE = 'cadf.projects.v1';
  const STORE_ROLE = 'cadf.canvasRole.v1';
  const MAX_IMPORT = 1024 * 1024;
  const MAX_STR = 20000;
  const NATIVE_SIZE = !!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'));

  const arrow = svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 14);
  const plusIcon = svg('<path d="M12 5v14M5 12h14"/>', 14);
  const xIcon = svg('<path d="M18 6 6 18M6 6l12 12"/>', 14);
  const tickIcon = svg('<path d="M20 6 9 17l-5-5"/>', 14);
  const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ------------------------------------------------------------------
     Definitions from the markdown
     ------------------------------------------------------------------ */
  const allLines = CHAPTERS.flatMap(c => c.secs.flatMap(s => s.lines));
  const tplLines = bySlug.templates ? bySlug.templates.secs.flatMap(s => s.lines) : [];
  function underH3(lines, re) {
    const out = [];
    let on = false;
    for (const l of lines) {
      if (/^#{2,3} /.test(l)) { on = /^### /.test(l) && re.test(plain(l.slice(4))); continue; }
      if (on) out.push(l);
    }
    return out;
  }
  const anchorOf = (re) => { const l = tplLines.find(x => /^### /.test(x) && re.test(plain(x.slice(4)))); return l ? slugify(plain(l.slice(4)).replace(/:$/, '')) : ''; };
  const ANCHOR = { canvas: anchorOf(/^AI Use Case Canvas/i), eval: anchorOf(/^Evaluation sheet/i) };
  function findTable(pred) {
    for (const c of CHAPTERS) for (const s of c.secs) { const t = tablesIn(s.lines).find(pred); if (t) return t; }
    return null;
  }
  const colOf = (head, re) => head.findIndex(h => re.test(plain(h)));
  const parts = (s, sep) => s.split(sep).map(x => x.trim()).filter(Boolean);
  const listItems = (lines) => lines.map(l => /^[-*]\s+(.*)$/.exec(l)).filter(Boolean).map(m => plain(m[1]));

  const CASE_TYPES = ((findTable(t => /^case type$/i.test(plain(t.head[0]))) || {}).body || []).map(r => plain(r[0])).filter(Boolean);
  const METRICS = ((findTable(t => /^metric$/i.test(plain(t.head[0]))) || {}).body || []).map(r => plain(r[0])).filter(Boolean);
  const EXTRA_RULES = ((findTable(t => /if the answer is yes/i.test(plain(t.head[0]))) || {}).body || []).map(r => plain(r[1] || ''));
  const CRITICAL = (() => {
    const i = allLines.findIndex(l => /^\*\*A critical failure\*\*/i.test(l));
    const out = [];
    if (i < 0) return out;
    for (let j = i + 1; j < allLines.length; j++) {
      const l = allLines[j];
      if (!l.trim()) { if (out.length) break; continue; }
      const m = /^[-*]\s+(.*)$/.exec(l);
      if (!m) break;
      out.push(plain(m[1]));
    }
    return out;
  })();
  const QUESTIONS = listItems(underH3(tplLines, /^Review questions/i));

  const et = tablesIn(underH3(tplLines, /^Evaluation sheet/i))[0];
  const ei = et && { id: colOf(et.head, /^case id$/i), cap: colOf(et.head, /^capability$/i), type: colOf(et.head, /^case type$/i), input: colOf(et.head, /^user input$/i), expected: colOf(et.head, /^expected/i), result: colOf(et.head, /^result$/i) };
  const CRITERIA = et && ei.expected >= 0 && ei.result > ei.expected ? et.head.slice(ei.expected + 1, ei.result).map(plain) : ['Correct', 'Grounded', 'Honest', 'In bounds'];
  const EXAMPLE_CASES = et ? et.body.map(r => ({ id: plain(r[ei.id] || ''), cap: plain(r[ei.cap] || ''), type: plain(r[ei.type] || ''), input: plain(r[ei.input] || ''), expected: plain(r[ei.expected] || ''), c: CRITERIA.map(() => ''), crit: '' })) : [];

  function specFor(f) {
    const q = parts(f.prompt, '?').map(x => x + '?');
    const make = {
      'interaction-model': () => ({ type: 'choice', options: ['Conventional UI', 'Hybrid', 'Conversational AI'] }),
      'capabilities': () => ({ type: 'rows', cols: parts(f.prompt, /→|->/).map(ucfirst), add: 'Add capability' }),
      'boundaries': () => ({ type: 'lists', cols: parts(f.prompt, '/') }),
      'extra-checks': () => ({ type: 'yesno', items: q }),
      'metrics-and-response-time': () => ({ type: 'metrics' }),
      'behavior-spec': () => ({ type: 'link' }),
      'pass-rate': () => ({ type: 'computed' }),
      'release-readiness': () => ({ type: 'checks', items: q }),
      'memory-and-handoff': () => ({ type: 'multi', items: q }),
      'review': () => ({ type: 'multi', items: parts(f.prompt, ',').map(ucfirst) }),
    }[f.key];
    const s = make ? make() : null;
    if (!s || (s.cols && s.cols.length < 2) || (s.items && s.items.length < 2)) return { type: 'text' };
    return s;
  }

  const FIELDS = [];
  const ct = tablesIn(underH3(tplLines, /^AI Use Case Canvas/i))[0];
  if (ct) {
    const ix = { phase: colOf(ct.head, /^phase$/i), field: colOf(ct.head, /^field$/i), prompt: colOf(ct.head, /^prompt$/i), owner: colOf(ct.head, /^owner$/i), example: colOf(ct.head, /^example/i) };
    for (const r of ct.body) {
      const name = plain(r[ix.field] || '');
      if (!name) continue;
      const phase = plain(r[ix.phase] || '');
      const f = {
        key: slugify(name), name, phase,
        prompt: plain(r[ix.prompt] || ''),
        owner: roleOf(r[ix.owner] || '') || plain(r[ix.owner] || ''),
        example: ix.example >= 0 ? plain(r[ix.example] || '') : '',
        chapter: CHAPTERS.find(c => c.phase && c.title.toLowerCase() === phase.toLowerCase()) || null,
      };
      if (FIELDS.some(x => x.key === f.key)) continue;
      f.spec = specFor(f);
      FIELDS.push(f);
    }
  }
  const FIELD = Object.fromEntries(FIELDS.map(f => [f.key, f]));
  const PHASES = [...new Set(FIELDS.map(f => f.phase))];
  const EXTRA = FIELD['extra-checks'];

  /* ------------------------------------------------------------------
     State and sanitising (used for localStorage and for imports)
     ------------------------------------------------------------------ */
  const str = (v, max = MAX_STR) => typeof v === 'string' ? v.slice(0, max) : '';
  const arr = (v, max = 200) => Array.isArray(v) ? v.slice(0, max) : [];
  const at = (v, i) => Array.isArray(v) ? v[i] : undefined;
  const obj = (v) => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  function cleanValue(spec, v) {
    const o = obj(v);
    switch (spec.type) {
      case 'choice': return { choice: spec.options.includes(o.choice) ? o.choice : '', why: str(o.why) };
      case 'rows': return arr(v).map(r => spec.cols.map((_, i) => str(at(r, i))));
      case 'lists': return spec.cols.map((_, i) => str(at(v, i)));
      case 'multi': return spec.items.map((_, i) => str(at(v, i)));
      case 'yesno': return spec.items.map((_, i) => ['yes', 'no'].includes(at(v, i)) ? at(v, i) : '');
      case 'checks': return { done: spec.items.map((_, i) => at(o.done, i) === true), note: str(o.note) };
      case 'metrics': return { rows: arr(o.rows, 20).map(r => [str(at(r, 0), 500), str(at(r, 1), 500)]), rt: str(o.rt, 500) };
      case 'link': return { url: str(o.url, 2000), version: str(o.version, 200) };
      case 'computed': return null;
      default: return str(v);
    }
  }
  const blank = (name) => ({ name, created: Date.now(), updated: Date.now(), canvas: {}, evals: [], critique: {} });
  function cleanProject(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
    const out = blank(str(p.name, 120).trim() || 'Untitled project');
    if (Number.isFinite(p.created)) out.created = p.created;
    if (Number.isFinite(p.updated)) out.updated = p.updated;
    const cv = obj(p.canvas);
    for (const f of FIELDS) {
      const e = obj(cv[f.key]);
      if (Object.keys(e).length) out.canvas[f.key] = { v: cleanValue(f.spec, e.v), agreed: e.agreed === true };
    }
    out.evals = arr(p.evals, 1000).filter(e => e && typeof e === 'object').map(e => ({
      id: str(e.id, 40), cap: str(e.cap, 200), type: str(e.type, 200), input: str(e.input), expected: str(e.expected),
      c: CRITERIA.map((_, i) => ['pass', 'fail'].includes(at(e.c, i)) ? at(e.c, i) : ''),
      crit: CRITICAL.includes(e.crit) ? e.crit : '',
    }));
    const cr = obj(p.critique);
    for (const q of QUESTIONS) {
      const k = slugify(q), e = obj(cr[k]);
      if (Object.keys(e).length) out.critique[k] = { a: ['yes', 'no', 'unsure'].includes(e.a) ? e.a : '', note: str(e.note, 2000) };
    }
    return out;
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const S = { active: null, projects: {} };
  (function load() {
    const raw = obj(store.get(STORE, null));
    for (const [id, p] of Object.entries(obj(raw.projects))) {
      const clean = /^[a-z0-9]{4,40}$/.test(id) && cleanProject(p);
      if (clean) S.projects[id] = clean;
    }
    if (!Object.keys(S.projects).length) S.projects[uid()] = blank('My project');
    S.active = S.projects[raw.active] ? raw.active : Object.keys(S.projects)[0];
  })();
  const P = () => S.projects[S.active];
  let saveTimer = null;
  const persist = () => { saveTimer = null; store.set(STORE, { v: 1, active: S.active, projects: S.projects }); flash('Saved in this browser'); };
  function save(now) {
    P().updated = Date.now();
    clearTimeout(saveTimer);
    if (now) persist(); else saveTimer = setTimeout(persist, 300);
  }
  window.addEventListener('pagehide', () => { if (saveTimer) { clearTimeout(saveTimer); persist(); } });
  let flashTimer = null;
  function flash(msg) {
    document.querySelectorAll('[data-ws-saved]').forEach(el => { el.textContent = msg; el.classList.add('is-flash'); });
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => document.querySelectorAll('[data-ws-saved]').forEach(el => el.classList.remove('is-flash')), 1500);
  }

  const entry = (f) => P().canvas[f.key] || (P().canvas[f.key] = { v: cleanValue(f.spec, undefined), agreed: false });
  const filled = (v) => typeof v === 'string' ? v.trim() !== '' : v === true ? true
    : Array.isArray(v) ? v.some(filled) : v && typeof v === 'object' ? Object.values(v).some(filled) : false;
  const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);
  function setPath(o, path, val) {
    const ks = path.split('.');
    if (ks.some(k => UNSAFE.has(k))) return;
    for (let i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
      o = o[ks[i]];
    }
    o[ks[ks.length - 1]] = val;
  }
  const getPath = (o, path) => path.split('.').reduce((a, k) => a == null ? a : a[k], o);
  function statusOf(f) {
    const e = P().canvas[f.key];
    const has = f.spec.type === 'computed' ? evalStats().scored > 0 : !!(e && filled(e.v));
    return !has ? 'empty' : e && e.agreed ? 'agreed' : 'draft';
  }
  function counts(fields) {
    const st = fields.map(statusOf);
    return { n: fields.length, agreed: st.filter(s => s === 'agreed').length, draft: st.filter(s => s === 'draft').length };
  }
  const extraYes = () => { const v = EXTRA && P().canvas[EXTRA.key]; return v && Array.isArray(v.v) ? v.v : []; };
  function threshold() {
    if (!EXTRA || EXTRA.spec.type !== 'yesno') return 90;
    const yes = extraYes();
    return EXTRA.spec.items.some((q, i) => yes[i] === 'yes' && /action|patient|medicine/i.test(q)) ? 95 : 90;
  }
  const safeUrl = (s) => { try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };

  /* ------------------------------------------------------------------
     Shared bits
     ------------------------------------------------------------------ */
  function autosize(t) {
    if (NATIVE_SIZE || !t.offsetParent) return;
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 2 + 'px';
  }
  const ta = (path, val, label, rows = 2, ph = '') =>
    `<textarea data-p="${path}" rows="${rows}" aria-label="${esc(label)}"${ph ? ` placeholder="${esc(ph)}"` : ''}>${esc(val || '')}</textarea>`;
  const inp = (path, val, label, extra = '') =>
    `<input type="text" data-p="${path}" value="${esc(val || '')}" aria-label="${esc(label)}"${extra}>`;
  const seg = (label, path, cur, options) =>
    `<div class="seg" role="group" aria-label="${esc(label)}">${options.map(([v, t]) => `<button type="button" class="chip" data-set="${path}" data-val="${esc(v)}" aria-pressed="${cur === v}">${esc(t)}</button>`).join('')}</div>`;
  const STATUS = { empty: ['Empty', 'tag--outline is-muted'], draft: ['Draft', 'tag--neutral'], agreed: ['Agreed', 'tag--ok'] };
  const statusTag = (s) => `<span class="tag ${STATUS[s][1]}" data-status>${STATUS[s][0]}</span>`;
  function progHtml(scope) {
    const fs = scope === '*' ? FIELDS : FIELDS.filter(f => f.phase === scope);
    const c = counts(fs);
    return `<span class="progress"><span style="width:${c.n ? c.agreed / c.n * 100 : 0}%"></span></span><span>${c.agreed} of ${c.n} agreed${c.draft ? ` · ${c.draft} draft` : ''}</span>`;
  }
  const prog = (scope) => `<span class="ws-prog" data-cv-count="${esc(scope)}">${progHtml(scope)}</span>`;
  function updateCounts() {
    document.querySelectorAll('#main [data-cv-count]').forEach(el => { el.innerHTML = progHtml(el.dataset.cvCount); });
  }

  /* ------------------------------------------------------------------
     Project bar
     ------------------------------------------------------------------ */
  function barHtml(compact) {
    const opts = Object.entries(S.projects).sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([id, p]) => `<option value="${esc(id)}"${id === S.active ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
    const menu = (label, items) => `<details class="ws-menu"><summary class="btn btn--outline btn--sm">${label}</summary><div class="ws-menu__list" role="menu">${items.map(([a, t]) => `<button type="button" role="menuitem" data-ws="${a}">${t}</button>`).join('')}</div></details>`;
    return `<div class="ws-bar${compact ? ' ws-bar--compact' : ''}">
      <label class="ws-bar__project"><span>Project</span><select data-ws="switch">${opts}</select></label>
      ${compact ? '' : `<button type="button" class="btn btn--outline btn--sm" data-ws="new">${plusIcon} New</button>
      ${menu('Manage', [['rename', 'Rename'], ['duplicate', 'Duplicate'], ['delete', 'Delete']])}
      ${menu('Export', [['copy-md', 'Copy as Markdown'], ['export-md', 'Download Markdown'], ['export-json', 'Download JSON (backup)'], ['import', 'Import JSON…']])}
      <input type="file" accept="application/json,.json" data-ws="file" hidden>`}
      <span class="ws-saved" data-ws-saved title="Answers are stored in this browser only. Export to share or back up.">Saved in this browser</span>
    </div>`;
  }

  /* ------------------------------------------------------------------
     Canvas
     ------------------------------------------------------------------ */
  function controls(f) {
    const v = entry(f).v, s = f.spec;
    const delBtn = (i, what) => `<button type="button" class="btn btn--ghost btn--icon btn--xs" data-act="del-row" data-i="${i}" aria-label="Remove ${what} ${i + 1}">${xIcon}</button>`;
    switch (s.type) {
      case 'choice':
        return seg(f.name, 'v.choice', v.choice, s.options.map(o => [o, o])) + ta('v.why', v.why, 'Why', 2, 'Why this model?');
      case 'rows': {
        const rows = v.length ? v : [s.cols.map(() => '')];
        return `<div class="ws-rows" style="--cols:${s.cols.length}"><div class="ws-rows__head" aria-hidden="true">${s.cols.map(c => `<span>${esc(c)}</span>`).join('')}<span></span></div>
          ${rows.map((r, i) => `<div class="ws-rows__row">${s.cols.map((c, j) => ta(`v.${i}.${j}`, r[j], `${c}, row ${i + 1}`, 1, c)).join('')}${delBtn(i, 'row')}</div>`).join('')}</div>
          <button type="button" class="btn btn--ghost btn--sm" data-act="add-row">${plusIcon} ${esc(s.add || 'Add row')}</button>`;
      }
      case 'lists':
        return `<div class="ws-cols" style="--cols:${s.cols.length}">${s.cols.map((c, i) => `<label class="ws-sub"><span>${esc(c)}</span>${ta(`v.${i}`, v[i], c, 3, 'One item per line')}</label>`).join('')}</div>`;
      case 'multi':
        return s.items.map((q, i) => `<label class="ws-sub"><span>${esc(q)}</span>${ta(`v.${i}`, v[i], q, 1)}</label>`).join('');
      case 'yesno': {
        const adds = s.items.map((q, i) => v[i] === 'yes' && EXTRA_RULES[i] ? `<li>${esc(EXTRA_RULES[i])}</li>` : '').join('');
        return `<div class="ws-yesno">${s.items.map((q, i) => `<div class="ws-yn"><span>${esc(q)}</span>${seg(q, `v.${i}`, v[i], [['yes', 'Yes'], ['no', 'No']])}</div>`).join('')}</div>
          <div class="ws-hint">${adds ? `<b>Extra checks to plan:</b><ul>${adds}</ul>` : ''}Evaluation pass threshold: <b>${threshold()}%</b>.</div>`;
      }
      case 'checks':
        return `<div class="ws-checks">${s.items.map((q, i) => `<label class="check"><input type="checkbox" data-p="v.done.${i}"${v.done[i] ? ' checked' : ''}><span>${esc(q)}</span></label>`).join('')}</div>${ta('v.note', v.note, 'Notes', 1, 'Notes')}`;
      case 'metrics': {
        const rows = v.rows.length ? v.rows : [['', '']];
        return `<div class="ws-rows" style="--cols:2"><div class="ws-rows__head" aria-hidden="true"><span>Metric</span><span>Target</span><span></span></div>
          ${rows.map((r, i) => `<div class="ws-rows__row">${inp(`v.rows.${i}.0`, r[0], `Metric ${i + 1}`, ' list="ws-metrics" placeholder="Metric"')}${inp(`v.rows.${i}.1`, r[1], `Target ${i + 1}`, ' placeholder="Target"')}${delBtn(i, 'metric')}</div>`).join('')}</div>
          <datalist id="ws-metrics">${METRICS.map(m => `<option value="${esc(m)}">`).join('')}</datalist>
          <button type="button" class="btn btn--ghost btn--sm" data-act="add-row">${plusIcon} Add metric</button>
          <label class="ws-sub"><span>Response-time target</span>${inp('v.rt', v.rt, 'Response-time target', ' placeholder="e.g. streaming starts within 2 s, full answer within 10 s"')}</label>`;
      }
      case 'link': {
        const ok = safeUrl(v.url);
        return `<div class="ws-cols" style="--cols:2"><label class="ws-sub"><span>Link</span><input type="url" data-p="v.url" value="${esc(v.url)}" placeholder="https://" aria-label="Link to behavior spec"></label>
          <label class="ws-sub"><span>Version</span>${inp('v.version', v.version, 'Version')}</label></div>
          ${ok ? `<a class="link-arrow" href="${esc(ok)}" target="_blank" rel="noopener noreferrer">Open the spec ${arrow}</a>` : ''}`;
      }
      case 'computed': {
        const st = evalStats();
        return st.total ? statsHtml(st) + `<a class="link-arrow" href="#/templates/${ANCHOR.eval}">Open the evaluation sheet ${arrow}</a>`
          : `<p class="ws-hint">Filled in automatically from the evaluation sheet. <a href="#/templates/${ANCHOR.eval}">Add test cases</a></p>`;
      }
      default:
        return ta('v', v, f.name, 2);
    }
  }
  function fieldCard(f, level) {
    const st = statusOf(f), e = entry(f);
    return `<div class="ws-field" data-key="${f.key}" data-owner="${esc(f.owner)}" data-level="${level}">
      <div class="ws-field__head">
        <div><h${level} class="ws-field__name">${esc(f.name)}</h${level}><p class="ws-field__prompt">${esc(f.prompt)}</p></div>
        <div class="ws-field__meta"><span class="tag tag--outline">${esc(f.owner)}</span>${statusTag(st)}</div>
      </div>
      <div class="ws-field__body">${controls(f)}</div>
      <div class="ws-field__foot">
        ${f.example ? `<details class="ws-example"><summary>Example</summary><p>${esc(f.example)}</p>${f.spec.type === 'text' ? '<button type="button" class="btn btn--ghost btn--sm" data-act="use-example">Use as a starting point</button>' : ''}</details>` : '<span></span>'}
        <button type="button" class="btn btn--outline btn--sm" data-act="agree" aria-pressed="${e.agreed}"${st === 'empty' ? ' disabled' : ''}>${e.agreed ? tickIcon + ' Agreed' : 'Mark agreed'}</button>
      </div>
    </div>`;
  }
  let roleFilter = store.get(STORE_ROLE, 'All');
  if (roleFilter !== 'All' && !ROLES.includes(roleFilter)) roleFilter = 'All';
  function canvasHtml() {
    if (!FIELDS.length) return '<p class="ws-hint">The canvas table wasn\'t found in the framework.</p>';
    return `<div class="ws-toolbar">
        <div class="seg" role="group" aria-label="Show rows owned by">${['All', ...ROLES].map(r => `<button type="button" class="chip" data-role="${esc(r)}" aria-pressed="${roleFilter === r}">${esc(r)}</button>`).join('')}</div>
        ${prog('*')}
      </div>
      ${PHASES.map(ph => {
        const fs = FIELDS.filter(f => f.phase === ph), ch = fs[0].chapter;
        return `<section class="ws-phase" data-phase="${esc(ph)}">
          <div class="ws-phase__head">${ch ? `<span class="tag tag--neutral">Phase ${ch.phase}</span>` : ''}<h4>${ch ? `<a href="#/${ch.slug}">${esc(ph)}</a>` : esc(ph)}</h4>${prog(ph)}</div>
          ${fs.map(f => fieldCard(f, 5)).join('')}
        </section>`;
      }).join('')}`;
  }
  function applyFilter(root) {
    root.querySelectorAll('.ws-field').forEach(el => { el.hidden = roleFilter !== 'All' && el.dataset.owner !== roleFilter; });
    root.querySelectorAll('.ws-phase').forEach(sec => { sec.hidden = ![...sec.querySelectorAll('.ws-field')].some(el => !el.hidden); });
    root.querySelectorAll('textarea').forEach(autosize);
  }
  function repaintField(f, focusEl) {
    const want = focusEl && ['act', 'set', 'val', 'i'].filter(k => focusEl.dataset[k] != null).map(k => `[data-${k}="${CSS.escape(focusEl.dataset[k])}"]`).join('');
    document.querySelectorAll(`#main .ws-field[data-key="${f.key}"]`).forEach(card => {
      const tmp = document.createElement('div');
      tmp.innerHTML = fieldCard(f, +card.dataset.level || 5);
      const n = tmp.firstElementChild;
      n.hidden = card.hidden;
      const open = card.querySelector('.ws-example[open]');
      if (open) n.querySelector('.ws-example').open = true;
      card.replaceWith(n);
      n.querySelectorAll('textarea').forEach(autosize);
      const target = want && n.querySelector(want);
      if (target && !target.disabled) target.focus();
    });
  }
  function updateFieldStatus(card, f) {
    const st = statusOf(f);
    card.querySelector('[data-status]').outerHTML = statusTag(st);
    const btn = card.querySelector('[data-act="agree"]');
    if (!btn) return;
    const on = entry(f).agreed;
    btn.disabled = st === 'empty';
    btn.setAttribute('aria-pressed', String(on));
    btn.innerHTML = on ? tickIcon + ' Agreed' : 'Mark agreed';
  }
  function fieldChanged(f, card) {
    const e = entry(f);
    if (f.spec.type !== 'computed' && !filled(e.v)) e.agreed = false;
    save();
    if (card && card.isConnected) updateFieldStatus(card, f);
    updateCounts();
    if (f.key === 'capabilities') refreshEval(true);
  }

  /* ------------------------------------------------------------------
     Evaluation sheet
     ------------------------------------------------------------------ */
  function resultOf(e) {
    if (e.crit || e.c.includes('fail')) return 'fail';
    return e.c.length && e.c.every(x => x === 'pass') ? 'pass' : 'pending';
  }
  function evalStats() {
    let pass = 0, fail = 0, crit = 0;
    for (const e of P().evals) { const r = resultOf(e); if (r === 'pass') pass++; else if (r === 'fail') fail++; if (e.crit) crit++; }
    const total = P().evals.length, scored = pass + fail;
    return { total, pass, fail, crit, scored, pending: total - scored, rate: scored ? Math.round(pass / scored * 1000) / 10 : null, threshold: threshold() };
  }
  function verdict(st) {
    if (!st.total) return { k: 'pending', t: 'No cases yet', d: 'Add test cases to get a pass rate.' };
    if (st.crit) return { k: 'bad', t: 'Fix and re-test', d: `${st.crit} critical failure${st.crit > 1 ? 's' : ''}. Ship needs zero.` };
    if (st.pending) return { k: 'pending', t: 'Not finished', d: `${st.pending} case${st.pending > 1 ? 's' : ''} still to score.` };
    return st.rate >= st.threshold ? { k: 'ok', t: 'Ready to ship', d: 'Threshold met with zero critical failures.' }
      : { k: 'bad', t: 'Fix and re-test', d: `Pass rate is below ${st.threshold}%.` };
  }
  function statsHtml(st) {
    const v = verdict(st);
    const why = st.threshold > 90 ? 'Raised because the AI takes actions or serves patients' : 'Set by the extra checks in the canvas';
    return `<div class="ws-stats">
      <div><b>${st.rate == null ? '–' : st.rate + '%'}</b><span>Pass rate · ${st.scored} of ${st.total} scored</span></div>
      <div><b>${st.crit}</b><span>Critical failures</span></div>
      <div><b>${st.threshold}%</b><span>${why}</span></div>
      <div class="ws-verdict ws-verdict--${v.k}" role="status"><b>${esc(v.t)}</b><span>${esc(v.d)}</span></div>
    </div>`;
  }
  const RESULT = { pass: ['Pass', 'tag--ok'], fail: ['Fail', 'tag--bad'], pending: ['Pending', 'tag--outline is-muted'] };
  const resultTag = (r) => `<span class="tag ${RESULT[r][1]}">${RESULT[r][0]}</span>`;
  function capNames() {
    const seen = new Map();
    const add = (s) => { const t = plain(s || ''); if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t); };
    const cap = FIELD.capabilities && P().canvas.capabilities;
    if (cap && Array.isArray(cap.v)) cap.v.forEach(r => add(at(r, 0)));
    P().evals.forEach(e => add(e.cap));
    return [...seen.values()];
  }
  function caseRow(e, i) {
    const types = !e.type || CASE_TYPES.includes(e.type) ? CASE_TYPES : [e.type, ...CASE_TYPES];
    const n = e.id || `row ${i + 1}`;
    const opt = (v, t, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(t)}</option>`;
    return `<tr data-case="${i}">
      <td><input class="ws-id" data-e="id" value="${esc(e.id)}" aria-label="Case ID"></td>
      <td><input data-e="cap" list="ws-caps" value="${esc(e.cap)}" aria-label="Capability, ${esc(n)}"></td>
      <td><select data-e="type" aria-label="Case type, ${esc(n)}">${opt('', 'Choose…', e.type)}${types.map(t => opt(t, t, e.type)).join('')}</select></td>
      <td><textarea data-e="input" rows="2" aria-label="User input, ${esc(n)}">${esc(e.input)}</textarea></td>
      <td><textarea data-e="expected" rows="2" aria-label="Expected behavior, ${esc(n)}">${esc(e.expected)}</textarea></td>
      ${CRITERIA.map((c, j) => `<td class="c"><select class="ws-score" data-e="c.${j}" data-score="${e.c[j]}" aria-label="${esc(c)}, ${esc(n)}">${opt('', '–', e.c[j])}${opt('pass', 'Pass', e.c[j])}${opt('fail', 'Fail', e.c[j])}</select></td>`).join('')}
      <td><select class="ws-crit" data-e="crit" data-score="${e.crit ? 'fail' : ''}" aria-label="Critical failure, ${esc(n)}">${opt('', 'None', e.crit)}${CRITICAL.map(t => opt(t, t, e.crit)).join('')}</select></td>
      <td data-result>${resultTag(resultOf(e))}</td>
      <td><button type="button" class="btn btn--ghost btn--icon btn--xs" data-act="del-case" aria-label="Remove ${esc(n)}">${xIcon}</button></td>
    </tr>`;
  }
  function coverageHtml() {
    const caps = capNames();
    if (!caps.length || !CASE_TYPES.length) return '';
    const anyExtra = extraYes().includes('yes');
    const count = (cap, type) => P().evals.filter(e => e.cap.trim().toLowerCase() === cap.toLowerCase() && e.type === type).length;
    let gaps = 0;
    const rows = CASE_TYPES.map(t => {
      const optional = /\(if /i.test(t) && !anyExtra;
      return `<tr><th scope="row">${esc(t)}</th>${caps.map(c => {
        const n = count(c, t);
        if (!n && !optional) gaps++;
        return `<td class="c${n ? '' : optional ? ' is-optional' : ' is-gap'}">${n || (optional ? 'n/a' : '0')}</td>`;
      }).join('')}</tr>`;
    }).join('');
    return `<details class="ws-cov"${gaps ? ' open' : ''}><summary>Coverage: ${gaps ? `<b>${gaps} gap${gaps > 1 ? 's' : ''}</b>` : 'every case type covered'} across ${caps.length} capabilit${caps.length > 1 ? 'ies' : 'y'}</summary>
      <div class="table-wrap"><table><thead><tr><th scope="col">Case type</th>${caps.map(c => `<th scope="col" class="c">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }
  function evalHtml() {
    const ev = P().evals;
    return `<p class="ws-hint">A case passes only when every criterion passes. Any critical failure blocks the release.</p>
      <div data-ws-stats>${statsHtml(evalStats())}</div>
      ${ev.length ? `<div class="table-wrap ws-eval"><table><thead><tr>
          <th scope="col">ID</th><th scope="col">Capability</th><th scope="col">Case type</th><th scope="col">User input</th><th scope="col">Expected behavior</th>
          ${CRITERIA.map(c => `<th scope="col" class="c">${esc(c)}</th>`).join('')}<th scope="col">Critical failure</th><th scope="col">Result</th><th scope="col"><span class="visually-hidden">Remove</span></th>
        </tr></thead><tbody>${ev.map(caseRow).join('')}</tbody></table></div>` : ''}
      <div class="btn-row">
        <button type="button" class="btn btn--outline btn--sm" data-act="add-case">${plusIcon} Add case</button>
        ${EXAMPLE_CASES.length ? '<button type="button" class="btn btn--ghost btn--sm" data-act="add-examples">Add the example cases</button>' : ''}
        ${ev.length ? '<button type="button" class="btn btn--ghost btn--sm" data-act="export-csv">Download CSV</button>' : ''}
      </div>
      <div data-ws-cov>${coverageHtml()}</div>
      <datalist id="ws-caps">${capNames().map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
  }
  function nextId() {
    const ids = P().evals.map(e => /^(.*?)(\d+)$/.exec(e.id)).filter(Boolean);
    const last = ids[ids.length - 1];
    const prefix = last ? last[1] : 'TC-';
    const max = ids.filter(m => m[1] === prefix).reduce((a, m) => Math.max(a, +m[2]), 0);
    return prefix + String(max + 1).padStart(2, '0');
  }
  function refreshEval(structural) {
    const st = document.querySelector('#main [data-ws-stats]');
    if (st) st.innerHTML = statsHtml(evalStats());
    if (structural) {
      const cov = document.querySelector('#main [data-ws-cov]');
      if (cov) cov.innerHTML = coverageHtml();
      const dl = document.getElementById('ws-caps');
      if (dl) dl.innerHTML = capNames().map(c => `<option value="${esc(c)}">`).join('');
    }
    if (FIELD['pass-rate']) { repaintField(FIELD['pass-rate']); updateCounts(); }
  }

  /* ------------------------------------------------------------------
     Critique questions
     ------------------------------------------------------------------ */
  const critOf = (k) => P().critique[k] || (P().critique[k] = { a: '', note: '' });
  function critiqueSummary() {
    const a = QUESTIONS.map(q => (P().critique[slugify(q)] || {}).a || '');
    const open = a.filter(x => x === 'no' || x === 'unsure').length;
    return `${a.filter(Boolean).length} of ${QUESTIONS.length} answered${open ? ` · <b>${open} to follow up</b>` : ''}`;
  }
  function critiqueHtml() {
    if (!QUESTIONS.length) return '';
    return `<p class="ws-hint">Answer as a team during critique. Anything marked No or Unsure becomes a follow-up. <span data-cq-sum>${critiqueSummary()}</span></p>
      <ol class="ws-cq">${QUESTIONS.map(q => {
        const k = slugify(q), e = P().critique[k] || {};
        return `<li data-q="${k}" class="${e.a === 'no' || e.a === 'unsure' ? 'is-open' : ''}">
          <div class="ws-cq__q"><span>${esc(q)}</span>${seg(q, 'a', e.a || '', [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Unsure']])}</div>
          <input type="text" data-note value="${esc(e.note || '')}" placeholder="Note or follow-up" aria-label="Note: ${esc(q)}">
        </li>`;
      }).join('')}</ol>
      <button type="button" class="btn btn--ghost btn--sm" data-act="clear-critique">Clear answers</button>`;
  }

  /* ------------------------------------------------------------------
     Export and import
     ------------------------------------------------------------------ */
  const cellMd = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>').trim();
  const lines = (s) => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const table = (head, rows) => [`| ${head.map(cellMd).join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.map(cellMd).join(' | ')} |`)];
  function valueMd(f) {
    const v = entry(f).v, s = f.spec;
    if (s.type === 'computed') { const st = evalStats(); return st.total ? [`${st.rate == null ? '–' : st.rate + '%'} pass rate (${st.scored} of ${st.total} scored), ${st.crit} critical failures, threshold ${st.threshold}%. ${verdict(st).t}.`] : []; }
    if (!filled(v)) return [];
    switch (s.type) {
      case 'choice': return [`**${v.choice || 'Not chosen'}**${v.why.trim() ? `: ${v.why.trim()}` : ''}`];
      case 'rows': return table(s.cols, v.filter(filled));
      case 'lists': return s.cols.map((c, i) => `- **${c}:** ${lines(v[i]).join('; ') || '–'}`);
      case 'multi': return s.items.map((q, i) => `- **${q}** ${lines(v[i]).join(' ') || '–'}`);
      case 'yesno': return [...s.items.map((q, i) => `- ${q} **${v[i] ? ucfirst(v[i]) : '–'}**`), '', `Evaluation threshold: ${threshold()}%.`];
      case 'checks': return [...s.items.map((q, i) => `- [${v.done[i] ? 'x' : ' '}] ${q}`), ...(v.note.trim() ? ['', v.note.trim()] : [])];
      case 'metrics': return [...table(['Metric', 'Target'], v.rows.filter(filled)), '', `Response-time target: ${v.rt.trim() || '–'}`];
      case 'link': { const u = safeUrl(v.url); return [`${u ? `[${u}](${u})` : v.url}${v.version.trim() ? ` · version ${v.version.trim()}` : ''}`]; }
      default: return lines(v).length > 1 ? [lines(v).join('  \n')] : [v.trim()];
    }
  }
  function toMarkdown() {
    const p = P(), out = [`# ${p.name}`, '', `Exported ${new Date().toISOString().slice(0, 10)} from the ${C.docTitle} portal.`, '', '## AI Use Case Canvas', ''];
    const c = counts(FIELDS);
    out.push(`${c.agreed} of ${c.n} rows agreed, ${c.draft} in draft.`, '');
    for (const ph of PHASES) {
      out.push(`### ${ph}`, '');
      for (const f of FIELDS.filter(x => x.phase === ph)) {
        const body = valueMd(f);
        out.push(`**${f.name}** · ${f.owner} · ${STATUS[statusOf(f)][0]}`, '', ...(body.length ? body : ['_Not filled in yet._']), '');
      }
    }
    if (p.evals.length) {
      const st = evalStats();
      out.push('## Evaluation sheet', '', `Pass rate ${st.rate == null ? '–' : st.rate + '%'} (${st.scored} of ${st.total} scored) · ${st.crit} critical failures · threshold ${st.threshold}% · **${verdict(st).t}**`, '');
      out.push(...table(['Case ID', 'Capability', 'Case type', 'User input', 'Expected behavior', ...CRITERIA, 'Critical failure', 'Result'],
        p.evals.map(e => [e.id, e.cap, e.type, e.input, e.expected, ...e.c.map(x => x ? ucfirst(x) : '–'), e.crit || '–', RESULT[resultOf(e)][0]])), '');
    }
    const cq = QUESTIONS.map(q => [q, P().critique[slugify(q)] || {}]).filter(([, e]) => e.a || (e.note || '').trim());
    if (cq.length) {
      out.push('## Design critique', '');
      cq.forEach(([q, e]) => out.push(`- **${e.a ? ucfirst(e.a) : '–'}** · ${q}${(e.note || '').trim() ? ` ${e.note.trim()}` : ''}`));
      out.push('');
    }
    return out.join('\n');
  }
  function toCsv() {
    const cell = (s) => { let t = String(s || ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
    const head = ['Case ID', 'Capability', 'Case type', 'User input', 'Expected behavior', ...CRITERIA, 'Critical failure', 'Result'];
    return [head, ...P().evals.map(e => [e.id, e.cap, e.type, e.input, e.expected, ...e.c.map(x => x ? ucfirst(x) : ''), e.crit, RESULT[resultOf(e)][0]])]
      .map(r => r.map(cell).join(',')).join('\r\n');
  }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const fileBase = () => slugify(P().name) || 'canvas';
  function uniqueName(name) {
    const names = new Set(Object.values(S.projects).map(p => p.name));
    if (!names.has(name)) return name;
    let i = 2;
    while (names.has(`${name} (${i})`)) i++;
    return `${name} (${i})`;
  }
  function importFile(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT) { alert('That file is too large to import (1 MB maximum).'); return; }
    file.text().then(text => {
      let data;
      try { data = JSON.parse(text); } catch { alert('That file isn\'t valid JSON.'); return; }
      const p = data && data.format === 'cadf-project' ? cleanProject(data.project) : null;
      if (!p) { alert('That file isn\'t an exported canvas project.'); return; }
      p.name = uniqueName(p.name);
      const id = uid();
      S.projects[id] = p;
      S.active = id;
      save(true);
      repaintAll();
      flash(`Imported “${p.name}”`);
    });
  }
  function wsAction(a, el) {
    const menu = el.closest('details');
    if (menu) menu.open = false;
    const p = P();
    if (a === 'new') {
      const name = prompt('Name for the new project', 'Untitled project');
      if (name == null) return;
      const id = uid();
      S.projects[id] = blank(uniqueName(name.trim().slice(0, 120) || 'Untitled project'));
      S.active = id;
      save(true); repaintAll();
    } else if (a === 'rename') {
      const name = prompt('Project name', p.name);
      if (name == null || !name.trim()) return;
      p.name = name.trim().slice(0, 120);
      save(true); repaintAll();
    } else if (a === 'duplicate') {
      const copy = cleanProject(JSON.parse(JSON.stringify(p)));
      copy.name = uniqueName(`${p.name} copy`);
      copy.created = copy.updated = Date.now();
      const id = uid();
      S.projects[id] = copy;
      S.active = id;
      save(true); repaintAll();
    } else if (a === 'delete') {
      if (!confirm(`Delete “${p.name}”? This can't be undone. Export it first if you might need it.`)) return;
      delete S.projects[S.active];
      if (!Object.keys(S.projects).length) S.projects[uid()] = blank('My project');
      S.active = Object.keys(S.projects)[0];
      save(true); repaintAll();
    } else if (a === 'copy-md') {
      const md = toMarkdown();
      (navigator.clipboard ? navigator.clipboard.writeText(md) : Promise.reject())
        .then(() => flash('Copied as Markdown'), () => download(fileBase() + '.md', md, 'text/markdown'));
    } else if (a === 'export-md') download(fileBase() + '.md', toMarkdown(), 'text/markdown');
    else if (a === 'export-json') download(fileBase() + '.json', JSON.stringify({ format: 'cadf-project', version: 1, framework: C.docTitle, exported: new Date().toISOString(), project: p }, null, 2), 'application/json');
    else if (a === 'import') { const f = el.closest('.ws-bar').querySelector('[data-ws="file"]'); if (f) f.click(); }
  }

  /* ------------------------------------------------------------------
     Mounting and events
     ------------------------------------------------------------------ */
  const $main = document.getElementById('main');
  function paint(root) {
    const r = root.dataset.root;
    root.innerHTML = r === 'bar' ? barHtml(false) : r === 'canvas' ? canvasHtml() : r === 'eval' ? evalHtml()
      : r === 'critique' ? critiqueHtml() : '';
    if (r === 'canvas') applyFilter(root);
    root.querySelectorAll('textarea').forEach(autosize);
  }
  const repaintAll = () => $main.querySelectorAll('.ws-root').forEach(paint);
  function mount(chapter) {
    if (!chapter) return;
    const art = $main.querySelector('.article');
    if (!art) return;
    if (chapter.slug === 'templates') {
      const bar = document.createElement('div');
      bar.className = 'ws-root ws-sticky';
      bar.dataset.root = 'bar';
      art.prepend(bar);
      art.querySelectorAll('.tool[data-tool]').forEach(m => { m.classList.add('ws-root', 'ws-tool'); m.dataset.root = m.dataset.tool; });
    }
    repaintAll();
  }

  $main.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.closest('.ws-root')) return;
    if (el.tagName === 'TEXTAREA') autosize(el);
    const card = el.closest('.ws-field');
    if (card && el.dataset.p != null) {
      const f = FIELD[card.dataset.key];
      if (!f) return;
      setPath(entry(f), el.dataset.p, el.type === 'checkbox' ? el.checked : el.value);
      fieldChanged(f, card);
      return;
    }
    const row = el.closest('[data-case]');
    if (row && el.dataset.e) {
      const c = P().evals[+row.dataset.case];
      if (!c) return;
      setPath(c, el.dataset.e, el.value);
      if (el.dataset.score != null) el.dataset.score = el.dataset.e === 'crit' ? (el.value ? 'fail' : '') : el.value;
      row.querySelector('[data-result]').innerHTML = resultTag(resultOf(c));
      save();
      refreshEval(el.dataset.e === 'cap' || el.dataset.e === 'type');
      return;
    }
    const q = el.closest('[data-q]');
    if (q && el.dataset.note != null) { critOf(q.dataset.q).note = el.value.slice(0, 2000); save(); }
  });

  $main.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.closest('.ws-root')) return;
    if (el.dataset.ws === 'switch' && S.projects[el.value]) { S.active = el.value; save(true); repaintAll(); }
    else if (el.dataset.ws === 'file') importFile(el);
    else if (el.dataset.p === 'v.url') { const card = el.closest('.ws-field'); if (card) repaintField(FIELD[card.dataset.key]); }
  });

  $main.addEventListener('click', (e) => {
    const el = e.target.closest('button');
    if (!el || !el.closest('.ws-root')) return;
    const d = el.dataset;
    const card = el.closest('.ws-field');
    const f = card && FIELD[card.dataset.key];

    if (d.ws) { wsAction(d.ws, el); return; }
    if (d.role) {
      roleFilter = d.role;
      store.set(STORE_ROLE, roleFilter);
      el.parentElement.querySelectorAll('[data-role]').forEach(b => b.setAttribute('aria-pressed', String(b === el)));
      applyFilter(el.closest('.ws-root'));
      return;
    }
    if (d.set && f) {
      setPath(entry(f), d.set, getPath(entry(f), d.set) === d.val ? '' : d.val);
      fieldChanged(f, card);
      repaintField(f, el);
      if (f === EXTRA) refreshEval(true);
      return;
    }
    const q = el.closest('[data-q]');
    if (d.set === 'a' && q) {
      const c = critOf(q.dataset.q);
      c.a = c.a === d.val ? '' : d.val;
      save();
      q.classList.toggle('is-open', c.a === 'no' || c.a === 'unsure');
      q.querySelectorAll('[data-set="a"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === c.a)));
      const sum = $main.querySelector('[data-cq-sum]');
      if (sum) sum.innerHTML = critiqueSummary();
      return;
    }
    const evalRoot = () => $main.querySelector('.ws-root[data-root="eval"]');
    switch (d.act) {
      case 'add-row': {
        const rows = f.spec.type === 'metrics' ? entry(f).v.rows : entry(f).v;
        const blankRow = () => f.spec.type === 'metrics' ? ['', ''] : f.spec.cols.map(() => '');
        if (!rows.length) rows.push(blankRow());
        rows.push(blankRow());
        save();
        repaintField(f);
        const n = $main.querySelector(`.ws-field[data-key="${f.key}"] .ws-rows__row:last-child textarea, .ws-field[data-key="${f.key}"] .ws-rows__row:last-child input`);
        if (n) n.focus();
        break;
      }
      case 'del-row': {
        const rows = f.spec.type === 'metrics' ? entry(f).v.rows : entry(f).v;
        rows.splice(+d.i, 1);
        fieldChanged(f, card);
        repaintField(f);
        break;
      }
      case 'use-example':
        entry(f).v = f.example;
        fieldChanged(f, card);
        repaintField(f);
        break;
      case 'agree':
        entry(f).agreed = !entry(f).agreed;
        save();
        repaintField(f, el);
        updateCounts();
        homeCard();
        break;
      case 'add-case': {
        const last = P().evals[P().evals.length - 1];
        P().evals.push({ id: nextId(), cap: last ? last.cap : (capNames()[0] || ''), type: '', input: '', expected: '', c: CRITERIA.map(() => ''), crit: '' });
        save();
        const root = evalRoot();
        if (root) { paint(root); const t = root.querySelector('tbody tr:last-child textarea'); if (t) t.focus(); }
        refreshEval(false);
        break;
      }
      case 'add-examples': {
        const have = new Set(P().evals.map(x => x.id));
        const add = EXAMPLE_CASES.filter(x => !have.has(x.id)).map(x => ({ ...x, c: [...x.c] }));
        if (!add.length) { flash('Example cases are already in the sheet'); break; }
        P().evals.push(...add);
        save();
        if (evalRoot()) paint(evalRoot());
        refreshEval(false);
        break;
      }
      case 'del-case': {
        const row = el.closest('[data-case]');
        const c = row && P().evals[+row.dataset.case];
        if (!c) break;
        if ((c.input || c.expected) && !confirm(`Remove case ${c.id || ''}?`)) break;
        P().evals.splice(+row.dataset.case, 1);
        save();
        if (evalRoot()) paint(evalRoot());
        refreshEval(false);
        break;
      }
      case 'export-csv':
        download(fileBase() + '-evaluation.csv', '\ufeff' + toCsv(), 'text/csv');
        break;
      case 'clear-critique': {
        if (!confirm('Clear all critique answers and notes for this project?')) break;
        P().critique = {};
        save();
        const root = $main.querySelector('.ws-root[data-root="critique"]');
        if (root) paint(root);
        break;
      }
    }
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.ws-menu[open]').forEach(m => { if (!m.contains(e.target)) m.open = false; });
  });
  document.addEventListener('cadf:render', (e) => mount(e.detail.chapter));
  mount(C.current());
})();
