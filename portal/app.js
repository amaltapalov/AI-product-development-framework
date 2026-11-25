/* Conversational AI Design Framework portal.
   Content comes from window.FRAMEWORK_MD (inlined by build.py from the framework .md file).
   No build-time dependencies. Mermaid is loaded at runtime for diagrams. */
(function () {
  'use strict';

  const MD = window.FRAMEWORK_MD || '';
  const STORE_CHECKS = 'cadf.checks.v1';
  const STORE_THEME = 'cadf.theme.v1';
  const MERMAID_LOCAL = './vendor/mermaid.esm.min.mjs';
  const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  const ROLES = ['Product owner', 'Design', 'Development', 'Data Science'];

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function inline(s) {
    s = esc(s);
    s = s.replace(/\\\*/g, '&#42;');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) =>
      `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);
    return s;
  }
  const plain = (s) => String(s).replace(/\*\*/g, '').replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`/g, '').replace(/\\\*/g, '*').trim();
  const slugify = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const stripNum = (s) => s.replace(/^\d+\.\s*/, '').trim();
  const roleOf = (t) => { const p = plain(t); return ROLES.find(r => r.toLowerCase() === p.toLowerCase()) || null; };
  const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ------------------------------------------------------------------
     Split the markdown
     ------------------------------------------------------------------ */
  const lines = MD.replace(/\r\n/g, '\n').split('\n');
  const docTitle = (lines.find(l => l.startsWith('# ')) || '# Conversational AI Design Framework').slice(2).trim();
  const version = (docTitle.match(/v[\d.]+/) || [''])[0];
  const docName = docTitle.replace(/\s*v[\d.]+$/, '');
  const byline = (lines.slice(1, 6).find(l => l.includes('·')) || '').trim();

  const preamble = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = /^## (.+)$/.exec(line);
    if (m) { cur = { name: stripNum(m[1]), raw: m[1].trim(), lines: [] }; sections.push(cur); continue; }
    (cur ? cur.lines : preamble).push(line);
  }
  const oneSentence = (() => {
    const l = preamble.find(x => /^>\s*\*\*In one sentence:?\*\*/i.test(x));
    return l ? plain(l.replace(/^>\s*\*\*In one sentence:?\*\*\s*:?\s*/i, '')) : '';
  })();

  /* ------------------------------------------------------------------
     Chapter map. Phases are found automatically; other H2s are matched
     by name. Anything unmatched lands in "About this version".
     ------------------------------------------------------------------ */
  const DEF = [
    { slug: 'start', group: 'Foundations', title: 'Start here', match: [/^How to use/i, /^Principles/i],
      summary: 'How to use the framework, and the six principles that settle trade-offs.' },
    { slug: 'lifecycle', group: 'Foundations', title: 'The lifecycle', match: [/lifecycle/i],
      summary: 'Seven phases, two loops, and the key question each phase answers.' },
    { slug: 'roles', group: 'Foundations', title: 'The four roles', match: [/roles/i],
      summary: 'Product owner, Design, Development and Data Science: who owns which question.' },
    { slug: 'rules', group: 'Foundations', title: 'Rules and extra checks', match: [/^Rules/i, /^Risk tiers/i, /^What each tier/i],
      summary: 'Four rules every product follows, plus three questions that add checks only where needed.' },
    { slug: 'phases' },
    { slug: 'templates', group: 'Running it', title: 'Templates', match: [/^Templates/i],
      summary: 'The AI Use Case Canvas, the evaluation sheet and design critique questions.' },
    { slug: 'adoption', group: 'Running it', title: 'Adoption', match: [/^Adoption/i],
      summary: 'Align, pilot, review, refine, scale, and how we judge the framework itself.' },
    { slug: 'about', group: 'Running it', title: 'About this version', match: [/^Open questions/i, /^What changed/i, /^Sources/i],
      summary: 'Open questions for the team, what changed in this version, and sources.' },
  ];
  const CHAPTERS = [];
  const used = new Set();
  const phaseRe = /^Phase\s+(\d)\s*[·:\-–]\s*(.+)$/i;
  for (const d of DEF) {
    if (d.slug === 'phases') {
      for (const s of sections) {
        const m = phaseRe.exec(s.name);
        if (!m) continue;
        used.add(s);
        CHAPTERS.push({ slug: slugify(m[2]), group: 'The seven phases', title: m[2].trim(), phase: +m[1], secs: [s] });
      }
      continue;
    }
    const secs = sections.filter(s => !used.has(s) && d.match.some(re => re.test(s.name)));
    secs.forEach(s => used.add(s));
    if (secs.length) CHAPTERS.push({ ...d, secs });
  }
  const leftovers = sections.filter(s => !used.has(s));
  if (leftovers.length) {
    let about = CHAPTERS.find(c => c.slug === 'about');
    if (!about) { about = { ...DEF.find(d => d.slug === 'about'), secs: [] }; CHAPTERS.push(about); }
    about.secs.push(...leftovers);
  }
  let n = 0;
  CHAPTERS.forEach((c, i) => { c.index = i; c.num = c.phase ? 'P' + c.phase : String(++n).padStart(2, '0'); });
  const bySlug = Object.fromEntries(CHAPTERS.map(c => [c.slug, c]));
  const phaseByNum = Object.fromEntries(CHAPTERS.filter(c => c.phase).map(c => [c.phase, c]));
  // Full-width pages that aren't chapters (e.g. TL;DR), registered by other scripts.
  const VIEWS = {};

  /* ------------------------------------------------------------------
     Icons (lucide-style outlines)
     ------------------------------------------------------------------ */
  const svg = (body, size = 16, sw = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const arrow = svg('<path d="M5 12h14M13 6l6 6-6 6"/>');
  const checkIcon = svg('<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>', 18);
  const tick = svg('<path d="M20 6 9 17l-5-5"/>', 20, 2.4);
  const chevron = svg('<path d="m9 18 6-6-6-6"/>', 14);
  const ICONS = {
    start: '<path d="M12 3 6 13h12z"/><rect x="3" y="15" width="7" height="6" rx="1"/><circle cx="17.5" cy="18" r="3"/>',
    lifecycle: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    roles: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 2 4.5 5"/>',
    rules: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    templates: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    adoption: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  };
  const icon = (slug) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[slug] || ICONS.about}</svg>`;
  const ROLE_ICONS = {
    'Product owner': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',
    'Design': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    'Development': '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    'Data Science': '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  };

  /* ------------------------------------------------------------------
     Tables
     ------------------------------------------------------------------ */
  function splitRow(line) {
    let t = line.trim();
    if (t.startsWith('|')) t = t.slice(1);
    if (t.endsWith('|')) t = t.slice(0, -1);
    return t.split('|').map(c => c.trim());
  }
  function parseTable(rows) {
    const head = splitRow(rows[0]);
    const align = rows[1] ? splitRow(rows[1]).map(c => /^:-+:$/.test(c) ? 'c' : '') : [];
    return { head, align, body: rows.slice(2).map(splitRow) };
  }
  const SYMBOLS = { '●': ['lead', 'Leads'], '◐': ['contrib', 'Contributes'], '○': ['review', 'Reviews'] };
  function cellHtml(c) {
    const t = c.trim();
    if (SYMBOLS[t]) return `<span class="rl rl--${SYMBOLS[t][0]}" title="${SYMBOLS[t][1]}" aria-label="${SYMBOLS[t][1]}">${t}</span>`;
    if (t === 'Required') return '<span class="tag tag--neutral">Required</span>';
    return inline(t);
  }
  function tableHtml({ head, align = [], body }) {
    const colRole = head.map(roleOf);
    const rowRoles = body.map(r => roleOf(r[0] || ''));
    const hasRows = rowRoles.some(Boolean);
    let h = `<div class="table-wrap"><table${hasRows ? ' class="has-role-rows"' : ''}><thead><tr>`;
    head.forEach((c, i) => { h += `<th scope="col"${align[i] ? ` class="${align[i]}"` : ''}${colRole[i] ? ` data-col-role="${colRole[i]}"` : ''}>${inline(c)}</th>`; });
    h += '</tr></thead><tbody>';
    body.forEach((r, ri) => {
      h += `<tr${rowRoles[ri] ? ` data-row-role="${rowRoles[ri]}"` : ''}>`;
      head.forEach((_, i) => { h += `<td${align[i] ? ` class="${align[i]}"` : ''}${colRole[i] ? ` data-col-role="${colRole[i]}"` : ''}>${cellHtml(r[i] || '')}</td>`; });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }
  function tablesIn(src) {
    const out = [];
    for (let i = 0; i < src.length; i++) {
      if (src[i].trim().startsWith('|')) {
        const rows = [];
        while (i < src.length && src[i].trim().startsWith('|')) rows.push(src[i++]);
        out.push(parseTable(rows));
      }
    }
    return out;
  }

  /* ------------------------------------------------------------------
     Markdown → HTML
     ------------------------------------------------------------------ */
  const DIAGRAMS = [];
  function listHtml(items, chapterSlug, checks) {
    const ordered = /^\d+\./.test(items[0].marker);
    const isTask = items.every(it => /^\[[ xX]\]\s/.test(it.text));
    const tag = !isTask && ordered ? 'ol' : 'ul';
    let h = `<${tag}${isTask ? ' class="tasks"' : ''}>`;
    for (const it of items) {
      let body;
      if (isTask) {
        const text = it.text.replace(/^\[[ xX]\]\s+/, '');
        const key = chapterSlug + ':' + hash(plain(text));
        checks.push(key);
        body = `<label class="check"><input type="checkbox" data-check="${key}"><span>${inline(text)}</span></label>`;
      } else body = inline(it.text);
      if (it.children.length) body += listHtml(it.children, chapterSlug, checks);
      h += `<li>${body}</li>`;
    }
    return h + `</${tag}>`;
  }

  // Templates whose static table or list is replaced by an interactive tool (portal/workspace.js).
  const TOOLS = [[/^AI Use Case Canvas/i, 'canvas'], [/^Evaluation sheet/i, 'eval'], [/^Review questions/i, 'critique']];
  function render(mdLines, chapterSlug, opts = {}) {
    const out = [], checks = [], toc = [], ids = {};
    let goal = null, openCallout = false, depth = 2, tool = null;
    const uid = (s) => { let id = slugify(s); if (ids[id]) id += '-' + (++ids[id]); else ids[id] = 1; return id; };
    const close = () => { if (openCallout) { out.push('</div>'); openCallout = false; } };
    const heading = (level, text, inToc = true) => {
      if (level <= 3) close();
      const t = plain(text).replace(/:$/, '');
      if (level <= 3) tool = chapterSlug === 'templates' && level === 3 ? ((TOOLS.find(([re]) => re.test(t)) || [])[1] || null) : null;
      const id = uid(t);
      let kind = null;
      if (level === 3 && /^(Example\b|Running example$)/i.test(t)) kind = 'example';
      else if (level === 3 && /^Exit gate/i.test(t)) kind = 'gate';
      const label = kind === 'example' ? (t.replace(/^(Running )?Example:?\s*/i, '') || 'KPI investigation assistant') : t;
      if (inToc) toc.push({ id, text: kind === 'example' ? 'Example' : t, level });
      if (kind) {
        out.push(`<div class="callout callout--${kind}">`);
        openCallout = true;
        out.push(`<h${level} id="${id}">${kind === 'gate' ? checkIcon : ''}${esc(label)}</h${level}>`);
        if (kind === 'gate') out.push('<div class="gate-progress"><div class="progress"><span></span></div><span class="gate-count"></span><button type="button" class="btn btn--ghost btn--sm" data-reset-gate>Reset</button></div>');
      } else {
        out.push(`<h${level} id="${id}">${inline(text.replace(/:$/, ''))}</h${level}>`);
      }
      depth = level;
    };

    let i = 0;
    while (i < mdLines.length) {
      const line = mdLines[i];
      if (!line.trim() || /^-{3,}\s*$/.test(line)) { i++; continue; }

      if (line.startsWith('```')) {
        const lang = line.slice(3).trim();
        const code = [];
        i++;
        while (i < mdLines.length && !mdLines[i].startsWith('```')) code.push(mdLines[i++]);
        i++;
        const txt = code.join('\n');
        if (lang === 'mermaid') {
          const idx = DIAGRAMS.push(txt) - 1;
          out.push(`<figure class="diagram is-loading" data-diagram="${idx}" role="img" aria-label="Diagram">Loading diagram…</figure>`);
        } else out.push(`<pre><code>${esc(txt)}</code></pre>`);
        continue;
      }
      let m;
      if ((m = /^## (.+)$/.exec(line))) { if (!opts.skipH2) heading(2, stripNum(m[1])); i++; continue; }
      if ((m = /^### (.+)$/.exec(line))) { heading(3, m[1]); i++; continue; }
      if ((m = /^#### (.+)$/.exec(line))) { heading(4, m[1], false); i++; continue; }
      if ((m = /^\*\*([^*]+)\*\*\s*$/.exec(line))) {
        const lvl = depth >= 3 || openCallout ? 4 : 3;
        heading(lvl, m[1], lvl === 3); i++; continue;
      }

      if (line.startsWith('>')) {
        const q = [];
        while (i < mdLines.length && mdLines[i].startsWith('>')) q.push(mdLines[i++].replace(/^>\s?/, ''));
        const text = q.join(' ');
        if (!/^\*\*About the diagrams/i.test(text)) out.push(`<div class="note"><p>${inline(text)}</p></div>`);
        continue;
      }

      if (line.trim().startsWith('|')) {
        const rows = [];
        while (i < mdLines.length && mdLines[i].trim().startsWith('|')) rows.push(mdLines[i++]);
        if (tool) { out.push(`<div class="tool" data-tool="${tool}"></div>`); tool = null; continue; }
        out.push(tableHtml(parseTable(rows)));
        continue;
      }

      if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
        const items = [];
        while (i < mdLines.length) {
          const lm = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(mdLines[i]);
          if (!lm) break;
          const item = { marker: lm[2], text: lm[3], children: [] };
          if (lm[1].length >= 2 && items.length) items[items.length - 1].children.push(item);
          else items.push(item);
          i++;
        }
        if (tool) { out.push(`<div class="tool" data-tool="${tool}"></div>`); tool = null; continue; }
        out.push(listHtml(items, chapterSlug, checks));
        continue;
      }

      // Paragraph. A new line that starts with "**Label**" begins its own paragraph.
      const para = [];
      while (i < mdLines.length && mdLines[i].trim() && !/^(#{2,4} |\||```|>|\s*([-*]|\d+\.)\s|-{3,}\s*$)/.test(mdLines[i]) && !/^\*\*[^*]+\*\*\s*$/.test(mdLines[i])) {
        para.push(mdLines[i++].trim());
        if (/^\*\*[^*]+\*\*/.test(mdLines[i] || '')) break;
      }
      if (!para.length) para.push(mdLines[i++].trim());
      const text = para.join(' ');
      if (/^\*\*Goal:\*\*/.test(text)) {
        const g = ucfirst(text.replace(/^\*\*Goal:\*\*\s*/, ''));
        if (opts.extractGoal) goal = g; else out.push(`<p class="goal">${inline(g)}</p>`);
      } else if (/^\*\*Running example:\*\*/.test(text)) {
        close();
        out.push(`<div class="callout callout--example"><h3>KPI investigation assistant</h3><p>${inline(text.replace(/^\*\*Running example:\*\*\s*/, ''))}</p></div>`);
      } else out.push(`<p>${inline(text)}</p>`);
    }
    close();
    return { html: out.join('\n'), checks, toc, goal };
  }

  /* ------------------------------------------------------------------
     Data from tables
     ------------------------------------------------------------------ */
  const lifeSec = bySlug.lifecycle && bySlug.lifecycle.secs[0];
  const lifeTable = lifeSec && tablesIn(lifeSec.lines).find(t => /phase/i.test(t.head[0]));
  const phaseFacts = {};
  if (lifeTable) for (const r of lifeTable.body) {
    const m = /^(\d)\./.exec(r[0]);
    if (m) phaseFacts[m[1]] = lifeTable.head.slice(1).map((h, i) => ({ label: plain(h), value: r[i + 1] || '' }));
  }
  const rolesSec = bySlug.roles && bySlug.roles.secs[0];
  const rolesTables = rolesSec ? tablesIn(rolesSec.lines) : [];
  const leadTable = rolesTables.find(t => /phase/i.test(t.head[0]) && t.head.some(roleOf));
  const phaseLeads = {};
  if (leadTable) for (const r of leadTable.body) {
    const m = /^(\d)\./.exec(r[0]);
    if (m) phaseLeads[m[1]] = Object.fromEntries(leadTable.head.map((h, i) => [roleOf(h), r[i]]).filter(([k]) => k));
  }
  const profileTable = rolesTables.find(t => t.head.slice(1).some(roleOf) && !/phase/i.test(t.head[0]));
  const roleProfile = {};
  if (profileTable) profileTable.head.forEach((h, i) => {
    const r = roleOf(h);
    if (r) roleProfile[r] = Object.fromEntries(profileTable.body.map(row => [plain(row[0]), row[i] || '']));
  });

  for (const c of CHAPTERS) {
    const multi = c.secs.length > 1;
    const src = [];
    for (const s of c.secs) { if (multi) src.push('## ' + s.raw); src.push(...s.lines, ''); }
    Object.assign(c, render(src, c.slug, { skipH2: !multi, extractGoal: !!c.phase }));
    if (c.phase) {
      c.facts = phaseFacts[c.phase] || [];
      c.question = (c.facts.find(f => /question/i.test(f.label)) || {}).value || '';
      c.lead = (c.facts.find(f => /lead/i.test(f.label)) || {}).value || '';
      c.summary = c.goal ? plain(c.goal) : c.question;
      const who = tablesIn(c.secs[0].lines).find(t => /^role$/i.test(plain(t.head[0])));
      c.who = {};
      if (who) for (const r of who.body) {
        const ro = roleOf(r[0]);
        if (ro) c.who[ro] = Object.fromEntries(who.head.slice(1).map((h, i) => [plain(h), r[i + 1] || '']));
      }
    }
  }

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  let checked = store.get(STORE_CHECKS, {});
  const progressOf = (c) => {
    const total = c.checks.length, done = c.checks.filter(k => checked[k]).length;
    return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
  };

  /* ------------------------------------------------------------------
     Views
     ------------------------------------------------------------------ */
  const $main = document.getElementById('main');
  const $sidebar = document.getElementById('sidebar');

  function card(c) {
    return `<a class="card" href="#/${c.slug}">
      <span>${c.phase ? `<span class="tag">Phase ${c.phase}</span>`
        : c.group === 'Running it' ? '<span class="tag">In progress</span>'
        : `<span class="tag tag--neutral">${esc(c.group)}</span>`}</span>
      <h3>${esc(c.title)}</h3>
      <p>${c.phase ? inline(c.question) : esc(c.summary)}</p>
      ${c.phase && c.lead ? `<p class="card__lead">Lead: <b>${esc(plain(c.lead))}</b></p>` : ''}
    </a>`;
  }

  function roleCards() {
    return ROLES.filter(r => roleProfile[r]).map(r => {
      const p = roleProfile[r];
      return `<div class="card role-card">
        <span class="role-mark">${svg(ROLE_ICONS[r], 18)}</span>
        <h3>${esc(r)}</h3>
        <p class="q">${inline(p['Question they own'] || '')}</p>
        <p class="owns">${inline(p['Owns'] || '')}</p>
      </div>`;
    }).join('');
  }

  function howToItems() {
    const s = bySlug.start && bySlug.start.secs.find(x => /^How to use/i.test(x.name));
    if (!s) return [];
    return s.lines.map(l => /^(?:-|\d+\.)\s+\*\*([^*]+)\*\*\s*(.*)$/.exec(l)).filter(Boolean)
      .map(m => ({ title: m[1].replace(/\.$/, ''), text: m[2] }));
  }

  const DEMO = [
    { label: 'Ambiguous', user: 'How are we doing?', ai: 'Which do you want to look at: active users, conversion or revenue?', note: 'Recovery: offer two or three clear options' },
    { label: 'Not sure', user: 'Show retention', ai: 'I read this as 30-day retention for the mobile app, last quarter. Is that right?', note: 'Recovery: say what it understood and ask to confirm' },
    { label: 'Out of scope', user: "Show me the competitor's numbers", ai: 'I only have our internal KPIs. I can compare your product with internal benchmarks instead.', note: 'Recovery: explain the limit, offer an alternative' },
    { label: 'Passing answer', user: 'Why did conversion drop in March?', ai: 'Conversion fell from 4.1% to 3.4% in March. The likely driver is the checkout change on 6 March: the drop starts that day and only affects mobile.', note: 'Source: KPI data source, 1–31 March. Cause called “likely”, with evidence. (Illustrative numbers)' },
  ];
  const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

  function renderHome() {
    document.title = docTitle;
    const items = howToItems();
    const startLines = bySlug.start ? bySlug.start.secs[0].lines : [];
    const lede = oneSentence || plain(startLines.find(l => l.trim() && !/^[-\d>]/.test(l)) || '');
    const exampleLine = plain(startLines.find(l => /running example/i.test(l)) || '')
      .replace(/^A running example follows one (product|case) through every phase:\s*(a\s+)?/i, '');
    const found = CHAPTERS.filter(c => c.group === 'Foundations');
    const hasRoles = Object.keys(roleProfile).length > 0;

    $main.innerHTML = `
      <section class="home-hero">
        <div class="wrap">
          <div>
            <span class="tag">Guidebook ${esc(version)}</span>
            <h1>${esc(docName.replace(/ Design Framework$/, ''))}<br>Design Framework.</h1>
            <p class="lede">${esc(ucfirst(lede))}</p>
            <div class="btn-row">
              <a class="btn btn--primary" href="#/start">Start reading ${arrow}</a>
              ${hasRoles ? '<a class="btn btn--outline" href="#/roles">Meet the four roles</a>' : '<a class="btn btn--outline" href="#/lifecycle">See the lifecycle</a>'}
            </div>
            <p class="meta">${inline(byline)}</p>
          </div>
          ${items.length ? `<div class="card panel">
            <span class="tag tag--neutral">How to use it</span>
            <h2>${NUMBER_WORDS[items.length] || items.length} rules shape the work.</h2>
            <ul class="ticks">${items.map(r => `<li>${tick}<div><b>${inline(r.title)}.</b> <span>${inline(r.text)}</span></div></li>`).join('')}</ul>
          </div>` : ''}
        </div>
      </section>

      <section class="band" aria-labelledby="g-found">
        <div class="wrap">
          <h2 id="g-found">Foundations.</h2>
          <p class="sub">Read these first. They explain the lifecycle, who owns what, and the rules every product follows.</p>
          <div class="joined joined--${found.length}">
            ${found.map(c => `<a href="#/${c.slug}">${icon(c.slug)}<h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><span class="link-arrow">Explore ${arrow}</span></a>`).join('')}
          </div>
        </div>
      </section>

      ${hasRoles ? `
      <section class="home-section" aria-labelledby="g-roles">
        <div class="wrap">
          <div class="section-head"><div><h2 id="g-roles">Four roles, one product.</h2>
            <p>Each role owns a different question. Every phase shows who leads, who contributes and who reviews.</p></div>
            <a class="btn btn--outline" href="#/roles">How roles work together</a></div>
          <div class="grid grid--4">${roleCards()}</div>
        </div>
      </section>` : ''}

      <section class="home-section home-section--alt" aria-labelledby="g-phases">
        <div class="wrap">
          <div class="section-head"><div><h2 id="g-phases">The seven phases.</h2>
            <p>Each phase answers one key question and ends with an exit gate. Tick the checks as your team passes them; progress is saved in this browser.</p></div>
            <a class="btn btn--outline" href="#/lifecycle">See the lifecycle</a></div>
          <div class="grid grid--4">
            ${CHAPTERS.filter(c => c.phase).map(card).join('')}
            ${bySlug.templates ? `<a class="card" href="#/templates">
              <span><span class="tag tag--neutral">Template</span></span>
              <h3>AI Use Case Canvas</h3>
              <p>The team's single working document. Each phase fills its own rows.</p>
            </a>` : ''}
          </div>
        </div>
      </section>

      <section class="home-section example" aria-labelledby="ex-h">
        <div class="wrap"><div class="card">
          <div><span class="tag">Running example</span><h2 id="ex-h">KPI investigation assistant.</h2>
            <p>${esc(ucfirst(exampleLine.replace(/^KPI investigation assistant that /i, 'an assistant that ')) || 'One product follows you through every phase.')}</p>
            <a class="link-arrow" href="#/${bySlug.model ? 'model' : 'start'}">See how it's modeled ${arrow}</a></div>
          <div class="chat-demo" aria-live="polite">
            <div class="chat-demo__tabs" role="group" aria-label="Example situations">${DEMO.map((d, i) => `<button type="button" class="chip" data-demo="${i}" aria-pressed="${i === 0}">${d.label}</button>`).join('')}</div>
            <div data-demo-body></div>
          </div>
        </div></div>
      </section>

      <section class="home-section" style="padding-top:0" aria-labelledby="g-run">
        <div class="wrap">
          <div class="section-head"><div><h2 id="g-run">Running it.</h2>
            <p>Copy-ready templates, the pilot plan, open questions and the change log.</p></div></div>
          <div class="grid grid--3">${CHAPTERS.filter(c => c.group === 'Running it').map(card).join('')}</div>
        </div>
      </section>`;

    const body = $main.querySelector('[data-demo-body]');
    const show = (i) => {
      const d = DEMO[i];
      body.innerHTML = `<div style="display:grid;gap:12px"><div class="bubble bubble--user">${esc(d.user)}</div><div class="bubble bubble--ai">${esc(d.ai)}<small>${esc(d.note)}</small></div></div>`;
      $main.querySelectorAll('[data-demo]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.demo === i)));
    };
    $main.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => show(+b.dataset.demo)));
    show(0);
    document.dispatchEvent(new CustomEvent('cadf:render', { detail: { chapter: null } }));
  }

  function rolePanel(c) {
    const leads = phaseLeads[c.phase];
    if (!leads && !Object.keys(c.who || {}).length) return '';
    const strip = ROLES.map(r => {
      const sym = leads && leads[r];
      return `<div><b>${esc(r)}</b><small>${sym ? `${cellHtml(sym)} ${SYMBOLS[sym] ? SYMBOLS[sym][1] : ''}` : '&nbsp;'}</small></div>`;
    }).join('');
    return `<section class="card role-panel" aria-label="Roles in this phase">
      <div class="role-panel__head"><h3>Who does what in this phase</h3></div>
      <div class="role-strip">${strip}</div></section>`;
  }

  function renderChapter(c, sectionId) {
    document.title = `${c.title} · ${docTitle}`;
    const lede = c.phase ? inline(c.goal || '') : esc(c.summary || '');
    const facts = c.phase && c.facts.length
      ? `<div class="hero-facts">${c.facts.map(f => `<div class="card hero-fact"><b>${esc(f.label)}</b><span>${inline(f.value)}</span></div>`).join('')}</div>` : '';
    const prev = CHAPTERS[c.index - 1], next = CHAPTERS[c.index + 1];
    const phaseCount = CHAPTERS.filter(x => x.phase).length;

    $main.innerHTML = `
      <section class="chapter-hero">
        <div class="chapter-hero__inner">
          <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">Chapters</a>${chevron}<span>${esc(c.group)}</span>${chevron}<span aria-current="page">${esc(c.title)}</span></nav>
          <span class="tag">${c.phase ? `Phase ${c.phase} of ${phaseCount}` : esc(c.group)}</span>
          <h1>${esc(c.title)}.</h1>
          <p class="lede">${lede}</p>
          ${facts}
        </div>
      </section>
      <article class="article">
        ${c.phase ? rolePanel(c) : ''}
        ${c.html}
      </article>
      <nav class="pager" aria-label="Chapter navigation">
        ${prev ? `<a class="prev" href="#/${prev.slug}"><small>Previous</small><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}
        ${next ? `<a class="next" href="#/${next.slug}"><small>Next</small><strong>${esc(next.title)}</strong></a>` : ''}
      </nav>`;

    document.dispatchEvent(new CustomEvent('cadf:render', { detail: { chapter: c } }));
    wireChecks();
    renderSidebar(c);
    renderDiagrams();
    watchScroll();
    if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) { requestAnimationFrame(() => el.scrollIntoView()); return; }
    }
    window.scrollTo(0, 0);
  }

  function renderSidebar(current) {
    const groups = [...new Set(CHAPTERS.map(c => c.group))];
    const here = currentRoute().slug;
    const views = Object.entries(VIEWS);
    $sidebar.innerHTML = (views.length ? `
      <div class="sidebar__group"><p class="sidebar__group-title">Overview</p><ol>
        ${views.map(([slug, v]) => `<li class="${here === slug ? 'is-current' : ''}"><a href="#/${slug}"${here === slug ? ' aria-current="page"' : ''}><span class="num">•</span><span>${esc(v.title)}</span></a></li>`).join('')}
      </ol></div>` : '') + groups.map(g => `
      <div class="sidebar__group"><p class="sidebar__group-title">${esc(g)}</p><ol>
        ${CHAPTERS.filter(c => c.group === g).map(c => {
          const p = progressOf(c);
          const isCur = current && c.slug === current.slug;
          const toc = isCur && c.toc.length ? `<ul class="toc">${c.toc.map(t => `<li><a href="#/${c.slug}/${t.id}" data-toc="${t.id}"${t.level === 3 && c.secs.length > 1 ? ' style="padding-left:18px"' : ''}>${esc(t.text)}</a></li>`).join('')}</ul>` : '';
          const done = p.total && p.done === p.total ? `<span class="done" title="All checks done">${svg('<path d="M20 6 9 17l-5-5"/>', 14)}</span>` : '';
          return `<li class="${isCur ? 'is-current' : ''}"><a href="#/${c.slug}"${isCur ? ' aria-current="page"' : ''}><span class="num">${c.num}</span><span>${esc(c.title)}</span>${done}</a>${toc}</li>`;
        }).join('')}
      </ol></div>`).join('');
  }

  let observer = null;
  function watchScroll() {
    if (observer) observer.disconnect();
    const heads = [...$main.querySelectorAll('.article h2[id], .article h3[id]')];
    if (!heads.length || !('IntersectionObserver' in window)) return;
    const setActive = (id) => $sidebar.querySelectorAll('[data-toc]').forEach(a => a.classList.toggle('is-active', a.dataset.toc === id));
    observer = new IntersectionObserver(() => {
      let active = heads[0].id;
      for (const h of heads) { if (h.getBoundingClientRect().top - 120 <= 0) active = h.id; else break; }
      setActive(active);
    }, { rootMargin: '0px 0px -60% 0px', threshold: [0, 1] });
    heads.forEach(h => observer.observe(h));
    setActive(heads[0].id);
  }

  /* Gate checklists */
  function refreshAfterCheck() {
    updateGates();
    const c = bySlug[currentRoute().slug];
    if (c) { renderSidebar(c); watchScroll(); }
  }
  function wireChecks() {
    $main.querySelectorAll('input[data-check]').forEach(inp => {
      inp.checked = !!checked[inp.dataset.check];
      inp.addEventListener('change', () => {
        if (inp.checked) checked[inp.dataset.check] = true; else delete checked[inp.dataset.check];
        store.set(STORE_CHECKS, checked);
        refreshAfterCheck();
      });
    });
    $main.querySelectorAll('[data-reset-gate]').forEach(btn => btn.addEventListener('click', () => {
      btn.closest('.callout').querySelectorAll('input[data-check]').forEach(i => { i.checked = false; delete checked[i.dataset.check]; });
      store.set(STORE_CHECKS, checked);
      refreshAfterCheck();
    }));
    $main.querySelectorAll('.callout--gate').forEach(g => {
      if (!g.querySelector('.gate-done')) g.insertAdjacentHTML('beforeend', `<div class="gate-done" role="status">${svg('<path d="M20 6 9 17l-5-5"/>')}Gate passed. Move on to the next phase.</div>`);
    });
    updateGates();
  }
  function updateGates() {
    $main.querySelectorAll('.callout--gate').forEach(g => {
      const boxes = [...g.querySelectorAll('input[data-check]')];
      const done = boxes.filter(b => b.checked).length;
      const count = g.querySelector('.gate-count');
      if (count) count.textContent = `${done} of ${boxes.length} checks`;
      const bar = g.querySelector('.progress > span');
      if (bar) bar.style.width = (boxes.length ? done / boxes.length * 100 : 0) + '%';
      g.classList.toggle('is-complete', boxes.length > 0 && done === boxes.length);
    });
  }

  /* ------------------------------------------------------------------
     Diagrams (Mermaid, themed to xDS, re-rendered on theme change)
     ------------------------------------------------------------------ */
  let mermaidPromise = null;
  const loadMermaid = () => (mermaidPromise ||= import(MERMAID_LOCAL).catch(() => import(MERMAID_CDN)).then(m => m.default || m));
  const isDark = () => document.documentElement.classList.contains('dark');
  function mermaidConfig() {
    const font = getComputedStyle(document.body).fontFamily;
    const common = { fontFamily: font, fontSize: '16px' };
    const vars = isDark() ? {
      darkMode: true, background: '#161616', primaryColor: '#242424', primaryTextColor: '#fafafa', primaryBorderColor: '#4f4f4f',
      secondaryColor: '#303030', tertiaryColor: '#1b1b1b', lineColor: '#949494', textColor: '#fafafa', mainBkg: '#242424', nodeBorder: '#4f4f4f',
      clusterBkg: '#1b1b1b', clusterBorder: '#3d3d3d', edgeLabelBackground: '#161616', titleColor: '#fafafa',
      actorBkg: '#242424', actorBorder: '#4f4f4f', actorTextColor: '#fafafa', actorLineColor: '#4f4f4f', signalColor: '#bdbdbd', signalTextColor: '#fafafa',
      labelBoxBkgColor: '#242424', labelBoxBorderColor: '#4f4f4f', labelTextColor: '#fafafa', noteBkgColor: '#303030', noteBorderColor: '#4f4f4f', noteTextColor: '#fafafa',
    } : {
      background: '#ffffff', primaryColor: '#ffffff', primaryTextColor: '#161616', primaryBorderColor: '#cfcfcf',
      secondaryColor: '#f5f5f5', tertiaryColor: '#fafafa', lineColor: '#949494', textColor: '#161616', mainBkg: '#ffffff', nodeBorder: '#cfcfcf',
      clusterBkg: '#fafafa', clusterBorder: '#e5e5e5', edgeLabelBackground: '#ffffff', titleColor: '#161616',
      actorBkg: '#ffffff', actorBorder: '#cfcfcf', actorTextColor: '#161616', actorLineColor: '#cfcfcf', signalColor: '#4f4f4f', signalTextColor: '#161616',
      labelBoxBkgColor: '#ffffff', labelBoxBorderColor: '#cfcfcf', labelTextColor: '#161616', noteBkgColor: '#f5f5f5', noteBorderColor: '#e5e5e5', noteTextColor: '#161616',
    };
    return {
      startOnLoad: false, securityLevel: 'strict', theme: 'base', fontFamily: font,
      flowchart: { htmlLabels: true, curve: 'basis', padding: 14, nodeSpacing: 36, rankSpacing: 44, useMaxWidth: true },
      sequence: { useMaxWidth: true, mirrorActors: false },
      themeVariables: { ...common, ...vars },
    };
  }
  let renderSeq = 0;
  async function renderDiagrams() {
    const figs = [...$main.querySelectorAll('[data-diagram]')];
    if (!figs.length) return;
    const seq = ++renderSeq;
    let mermaid;
    try { mermaid = await loadMermaid(); } catch (e) {
      mermaidPromise = null;
      figs.forEach(f => {
        f.classList.remove('is-loading');
        f.innerHTML = `<pre><code>${esc(DIAGRAMS[+f.dataset.diagram])}</code></pre><p class="diagram__note">This diagram needs the Mermaid library. Add <code>vendor/mermaid.esm.min.mjs</code> to the portal, or open it with internet access.</p>`;
      });
      return;
    }
    mermaid.initialize(mermaidConfig());
    for (const f of figs) {
      if (seq !== renderSeq || !f.isConnected) return;
      const src = DIAGRAMS[+f.dataset.diagram];
      try {
        const { svg: out } = await mermaid.render(`mmd-${seq}-${f.dataset.diagram}`, src);
        if (seq !== renderSeq || !f.isConnected) return;
        f.classList.remove('is-loading');
        f.innerHTML = out;
        fitDiagram(f);
        f.setAttribute('aria-label', 'Diagram: ' + src.replace(/<[^>]+>/g, ' ').replace(/[^\w\s·?,.'/-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240));
        linkPhaseNodes(f);
      } catch (e) {
        f.classList.remove('is-loading');
        f.innerHTML = `<pre><code>${esc(src)}</code></pre><p class="diagram__note">This diagram couldn't be drawn.</p>`;
      }
    }
  }
  // Wide diagrams would shrink to unreadable text; keep at least 75% of
  // natural size and let the frame scroll sideways instead.
  function fitDiagram(fig) {
    const s = fig.querySelector('svg');
    const vb = s && s.viewBox && s.viewBox.baseVal;
    if (!vb || !vb.width) return;
    const avail = fig.clientWidth - 32;
    const minW = vb.width * 0.75;
    if (minW > avail) {
      s.style.maxWidth = 'none';
      s.style.maxHeight = 'none';
      s.style.width = Math.round(minW) + 'px';
      fig.classList.add('is-wide');
    }
  }
  function linkPhaseNodes(fig) {
    fig.querySelectorAll('g.node').forEach(g => {
      const text = (g.textContent || '').trim();
      const m = /^(\d)\s*·\s*/.exec(text);
      const c = m && phaseByNum[m[1]];
      if (!c || !text.slice(m[0].length).toLowerCase().startsWith(c.title.toLowerCase())) return;
      g.classList.add('is-link');
      g.setAttribute('role', 'link');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', `Go to phase ${c.phase}: ${c.title}`);
      const go = () => { location.hash = '#/' + c.slug; };
      g.addEventListener('click', go);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  /* Theme toggle */
  const $theme = document.querySelector('.theme-toggle');
  function syncThemeButton() {
    const d = isDark();
    $theme.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode');
    $theme.querySelector('.i-moon').style.display = d ? 'none' : '';
    $theme.querySelector('.i-sun').style.display = d ? '' : 'none';
  }
  $theme.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    store.set(STORE_THEME, isDark() ? 'dark' : 'light');
    syncThemeButton();
    $main.querySelectorAll('[data-diagram]').forEach(f => { f.classList.add('is-loading'); f.textContent = 'Loading diagram…'; });
    renderDiagrams();
  });
  syncThemeButton();

  /* ------------------------------------------------------------------
     Search
     ------------------------------------------------------------------ */
  const index = [];
  (function buildIndex() {
    const tmp = document.createElement('div');
    for (const c of CHAPTERS) {
      tmp.innerHTML = c.html.replace(/<div class="gate-progress">[\s\S]*?<\/button><\/div>/g, '').replace(/<\/(td|th|li|p|h3|h4|label)>/g, ' </$1>');
      let sec = { chapter: c, id: null, title: c.title, text: c.goal ? plain(c.goal) : (c.summary || '') };
      index.push(sec);
      const walk = (node) => {
        for (const el of node.children) {
          if (/^H[23]$/.test(el.tagName) && el.id) { sec = { chapter: c, id: el.id, title: el.textContent.trim(), text: '' }; index.push(sec); }
          else if (el.classList.contains('callout')) walk(el);
          else if (!el.classList.contains('diagram')) sec.text += ' ' + el.textContent;
        }
      };
      walk(tmp);
    }
    index.forEach(s => { s.text = s.text.replace(/\s+/g, ' ').trim(); s.hay = (s.title + ' ' + s.text).toLowerCase(); });
  })();

  const $search = document.getElementById('search-input');
  const $results = document.querySelector('.search__results');
  let activeResult = -1;
  function snippet(text, q) {
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text.slice(0, 110)) + (text.length > 110 ? '…' : '');
    const start = Math.max(0, i - 40);
    const s = text.slice(start, i + q.length + 70), j = i - start;
    return (start ? '…' : '') + esc(s.slice(0, j)) + '<mark>' + esc(s.slice(j, j + q.length)) + '</mark>' + esc(s.slice(j + q.length)) + '…';
  }
  function doSearch() {
    const q = $search.value.trim().toLowerCase();
    if (q.length < 2) { $results.hidden = true; return; }
    const terms = q.split(/\s+/);
    const hits = index
      .map(s => ({ s, score: terms.every(t => s.hay.includes(t)) ? (s.title.toLowerCase().includes(q) ? 10 : 0) + terms.reduce((a, t) => a + s.hay.split(t).length - 1, 0) : 0 }))
      .filter(h => h.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
    activeResult = -1;
    $results.innerHTML = hits.length
      ? hits.map(({ s }) => `<a role="option" href="#/${s.chapter.slug}${s.id ? '/' + s.id : ''}"><span class="r-chapter">${esc(s.chapter.title)}</span><span class="r-title">${esc(s.title)}</span><span class="r-snippet">${snippet(s.text || s.title, terms[0])}</span></a>`).join('')
      : `<div class="search__empty">No results for “${esc($search.value)}”.</div>`;
    $results.hidden = false;
  }
  $search.addEventListener('input', doSearch);
  $search.addEventListener('focus', doSearch);
  $search.addEventListener('keydown', (e) => {
    const items = [...$results.querySelectorAll('a')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      activeResult = (activeResult + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((a, i) => a.classList.toggle('is-active', i === activeResult));
    } else if (e.key === 'Enter' && items.length) (items[activeResult] || items[0]).click();
    else if (e.key === 'Escape') { $results.hidden = true; $search.blur(); }
  });
  $results.addEventListener('click', (e) => { if (e.target.closest('a')) { $results.hidden = true; $search.value = ''; $search.blur(); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) $results.hidden = true; });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== $search && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $search.focus(); }
  });

  /* Mobile nav */
  const $toggle = document.querySelector('.nav-toggle');
  $toggle.addEventListener('click', () => {
    const open = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', open);
    $toggle.setAttribute('aria-expanded', String(open));
    if (open && document.body.classList.contains('is-home')) renderSidebar(null);
  });
  $sidebar.addEventListener('click', (e) => {
    if (e.target.closest('a')) { document.body.classList.remove('nav-open'); $toggle.setAttribute('aria-expanded', 'false'); }
  });

  /* Back to top */
  const $top = document.querySelector('.to-top');
  window.addEventListener('scroll', () => $top.classList.toggle('is-visible', window.scrollY > 600), { passive: true });
  $top.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); $main.focus({ preventScroll: true }); });

  /* Footer */
  document.getElementById('footer').innerHTML = `
    <span>${esc(docTitle)} · ${inline(byline)}</span>
    <span>Styled with the xDS design system.${bySlug.about ? ' <a href="#/about">What changed</a>' : ''}</span>`;

  /* ------------------------------------------------------------------
     Routing
     ------------------------------------------------------------------ */
  function currentRoute() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    return { slug: parts[0] || '', section: parts[1] || '' };
  }
  let lastSlug = null;
  function route() {
    const { slug, section } = currentRoute();
    const view = VIEWS[slug];
    const c = view ? null : bySlug[slug];
    document.body.classList.toggle('is-home', !c);
    document.querySelectorAll('.top-nav a').forEach(a => a.classList.toggle('is-active', a.dataset.nav === (view || c ? slug : 'home')));
    if (view) {
      if (lastSlug === slug && section) {
        const el = document.getElementById(section);
        if (el) { el.scrollIntoView(); return; }
      }
      lastSlug = slug;
      document.title = `${view.title} · ${docTitle}`;
      if (observer) observer.disconnect();
      view.render($main, section);
      document.dispatchEvent(new CustomEvent('cadf:render', { detail: { chapter: null, view: slug } }));
      const el = section && document.getElementById(section);
      if (el) el.scrollIntoView(); else window.scrollTo(0, 0);
      $main.focus({ preventScroll: true });
      return;
    }
    if (!c) { lastSlug = null; renderHome(); window.scrollTo(0, 0); return; }
    if (lastSlug === slug && section) {
      const el = document.getElementById(section);
      if (el) { el.scrollIntoView(); return; }
    }
    lastSlug = slug;
    renderChapter(c, section);
    $main.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);

  window.CADF = {
    esc, inline, plain, slugify, svg, store, tablesIn, roleOf, bySlug, CHAPTERS, ROLES, docTitle, version,
    sections, oneSentence, phaseByNum, ROLE_ICONS,
    current: () => bySlug[currentRoute().slug] || null,
    registerView(slug, view) {
      VIEWS[slug] = view;
      if (currentRoute().slug === slug) { lastSlug = null; route(); }
    },
  };
  route();
})();
