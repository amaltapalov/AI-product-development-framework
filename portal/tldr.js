/* TL;DR view: the framework in five presentable sections.
   Lists and tables are read from the framework markdown via window.CADF; framing copy and
   diagram labels are written here, so check them when the framework changes. */
(function () {
  'use strict';
  const C = window.CADF;
  if (!C || !C.registerView) return;
  const { esc, inline, plain, svg } = C;
  const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Reading the markdown ---------- */
  const findSec = (re) => C.sections.find(s => re.test(s.name)) || null;
  const phaseSec = (n) => findSec(new RegExp('^Phase\\s+' + n + '\\b', 'i'));
  function table(sec, headRe) {
    if (!sec) return null;
    return C.tablesIn(sec.lines).find(t => headRe.test(t.head.map(plain).join(' | '))) || null;
  }
  function bulletsAfter(sec, re) {
    if (!sec) return [];
    const i = sec.lines.findIndex(l => re.test(l.trim()));
    if (i < 0) return [];
    const out = [];
    for (let j = i + 1; j < sec.lines.length; j++) {
      const l = sec.lines[j].trim();
      if (!l) { if (out.length) break; continue; }
      const m = /^[-*]\s+(.+)$/.exec(l);
      if (!m) break;
      out.push(m[1]);
    }
    return out;
  }
  function lineAfter(sec, re) {
    const l = sec && sec.lines.find(x => re.test(x.trim()));
    return l ? l.trim().replace(re, '').trim() : '';
  }
  const splitList = (s) => s.replace(/\.$/, '').split(/,\s*(?:and\s+)?/).map(x => x.trim()).filter(Boolean);
  const firstSentence = (s) => { const m = /^(.+?[.!?])(\s|$)/.exec(s); return m ? m[1] : s; };

  const S = {
    principles: findSec(/^Principles/i),
    lifecycle: findSec(/lifecycle/i),
    roles: findSec(/roles/i),
    rules: findSec(/^Rules/i),
    templates: findSec(/^Templates/i),
    p: [1, 2, 3, 4, 5, 6, 7].map(phaseSec),
  };
  const canvas = table(S.templates, /^Phase \| Field \| Prompt \| Owner/i);
  const canvasRow = (re) => canvas && canvas.body.find(r => re.test(plain(r[1] || '')));

  const lifeTbl = table(S.lifecycle, /^Phase \| Key question \| Lead role/i);
  const phases = lifeTbl
    ? lifeTbl.body.map(r => {
      const m = /^(\d+)\.?\s*(.+)$/.exec(plain(r[0])) || [];
      const n = +m[1];
      return { n, name: (m[2] || r[0]).trim(), q: r[1] || '', lead: r[2] || '', slug: C.phaseByNum[n] ? C.phaseByNum[n].slug : null };
    })
    : C.CHAPTERS.filter(c => c.phase).map(c => ({ n: c.phase, name: c.title, q: '', lead: '', slug: c.slug }));

  /* ---------- Small building blocks ---------- */
  const I = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',
    badge: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    ui: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6M14 16h3"/>',
    hybrid: '<path d="M3 5h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H7l-4 3z"/><path d="M14 21v-3M18 21v-6M22 21v-9"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    loop: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    flag: '<path d="M4 21V4M4 4h12l-2 4 2 4H4"/>',
  };
  const arrow = svg(I.arrow);
  const tile = (body) => `<span class="tldr-icon">${svg(body, 20, 1.8)}</span>`;
  const block = (title, sub, body, cls = '') => `
    <div class="tldr-block ${cls}">
      <div class="tldr-block__head"><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>
      ${body}
    </div>`;
  const chapterLink = (slug) => C.bySlug[slug] ? `<a class="btn btn--outline btn--sm" href="#/${slug}">${esc(C.bySlug[slug].title)} ${arrow}</a>` : '';
  const phaseSlug = (n) => C.phaseByNum[n] ? C.phaseByNum[n].slug : '';
  const SYM = { '●': ['lead', 'Leads'], '◐': ['contrib', 'Contributes'], '○': ['review', 'Reviews'] };

  /* ---------- The five sections ---------- */
  const SECS = [
    { id: 'big-idea', short: 'The big idea', kicker: 'Why this framework exists', title: 'The big idea',
      takeaway: 'Start from a real human problem, and put correct, safe answers before fluent ones.',
      deeper: ['start', 'rules'], body: bigIdea },
    { id: 'journey', short: 'The journey', kicker: 'Seven phases, four roles, one canvas', title: 'The journey',
      takeaway: 'Seven phases, each with one key question and an exit gate. Four roles, each owning one question.',
      deeper: ['lifecycle', 'roles', 'templates'], body: journey },
    { id: 'shape', short: 'Shape it', kicker: 'Phases 1–2 · Discover and Define', title: 'Shape it',
      takeaway: 'Check that conversation is the right answer, then fence exactly what the AI can do, must confirm and can’t do.',
      deeper: [phaseSlug(1), phaseSlug(2)], body: shape },
    { id: 'conversation', short: 'Design the conversation', kicker: 'Phases 3–4 · Model and Design', title: 'Design the conversation',
      takeaway: 'Design a loop, not a set of screens, and write a response for every way it can go wrong.',
      deeper: [phaseSlug(3), phaseSlug(4)], body: conversation },
    { id: 'prove', short: 'Prove it and keep learning', kicker: 'Phases 5–7 · Validate, Deliver and Learn', title: 'Prove it and keep learning',
      takeaway: 'Test the answers, not only the usability: three runs, four checks, zero critical failures. Then learn from real use.',
      deeper: [phaseSlug(5), phaseSlug(6), phaseSlug(7)], body: prove },
  ];

  /* 1 · The big idea */
  function bigIdea() {
    const principles = table(S.principles, /^# \| Principle \| In practice/i);
    const rules = bulletsAfter(S.rules, /^\*\*Always required\*\*/i).map(b => {
      const m = /^\*\*(.+?)\*\*\s*(.*)$/.exec(b);
      return m ? { title: m[1].replace(/[.:]$/, ''), text: ucfirst(firstSentence(m[2])) } : { title: b, text: '' };
    });
    const nPhases = phases.length;
    const stats = [
      [nPhases, 'phases', 'from problem to post-launch learning'],
      [C.ROLES.length, 'roles', 'each owns one question'],
      [principles ? principles.body.length : 0, 'principles', 'settle trade-offs, in priority order'],
      [rules.length, 'rules', 'apply to every product'],
      [1, 'canvas', 'the team’s single working document'],
    ].filter(s => s[0]);

    const outcomes = [
      [I.target, 'Solve a real problem', 'Prove the need and measure today’s baseline before anyone designs a chat window.'],
      [I.badge, 'Give correct answers', 'Every claim is right, sourced and honest about uncertainty, and that is tested before release.'],
      [I.shield, 'Fail safely', 'Every error has a next step. Nothing irreversible happens without the user’s OK.'],
    ];

    return `
      ${C.oneSentence ? `<blockquote class="tldr-quote"><span class="tag tag--neutral">In one sentence</span><p>${esc(ucfirst(C.oneSentence))}</p></blockquote>` : ''}
      <div class="tldr-outcomes">${outcomes.map(([ic, t, d], i) => `
        <div class="card tldr-outcome">${tile(ic)}<span class="tldr-outcome__n">Outcome ${i + 1}</span><h4>${t}</h4><p>${d}</p></div>`).join('')}
      </div>
      <dl class="tldr-stats" aria-label="The framework by the numbers">${stats.map(([n, l, d]) => `
        <div><dt><span class="tldr-stats__n">${n}</span> ${l}</dt><dd>${d}</dd></div>`).join('')}
      </dl>
      <div class="tldr-cols">
        ${principles ? block('Six principles, in priority order', 'When two good options conflict, the higher one wins.', `
          <ol class="tldr-ladder">${principles.body.map((r, i, a) => `
            <li style="--w:${100 - i * (40 / Math.max(a.length - 1, 1))}%">
              <span class="tldr-ladder__n">${esc(plain(r[0]))}</span>
              <div><b>${esc(plain(r[1]))}</b><span>${inline(r[2] || '')}</span></div>
            </li>`).join('')}
          </ol>`) : ''}
        ${rules.length ? block('Always required, for every product', 'Extra checks are added only when the product needs them (see section 3).', `
          <ul class="tldr-rules">${rules.map(r => `
            <li>${svg(I.check, 18, 2.4)}<div><b>${inline(r.title)}</b><span>${inline(r.text)}</span></div></li>`).join('')}
          </ul>`) : ''}
      </div>`;
  }

  /* 2 · The journey */
  function journey() {
    const loops = (S.lifecycle ? S.lifecycle.lines : [])
      .map(l => /^\d+\.\s+\*\*(.+?)\*\*\s*(.+)$/.exec(l.trim()))
      .filter(Boolean)
      .map(m => {
        const nums = m[1].split(/→|->/).map(x => phases.find(p => p.name.toLowerCase() === x.trim().toLowerCase())).filter(Boolean).map(p => p.n);
        return nums.length > 1 ? { from: Math.min(...nums), to: Math.max(...nums), label: m[1], text: m[2] } : null;
      })
      .filter(Boolean);

    const rolesTbl = S.roles && C.tablesIn(S.roles.lines).find(t => !plain(t.head[0]) && t.head.some(h => C.roleOf(h)));
    const qRow = rolesTbl && rolesTbl.body.find(r => /question they own/i.test(plain(r[0])));
    const leadTbl = table(S.roles, /^Phase \| Product owner/i);

    const counts = {};
    const owners = {};
    if (canvas) canvas.body.forEach(r => {
      const ph = plain(r[0]); counts[ph] = (counts[ph] || 0) + 1;
      const o = C.roleOf(r[3] || ''); if (o) owners[o] = (owners[o] || 0) + 1;
    });
    const maxCount = Math.max(1, ...Object.values(counts));
    const totalFields = canvas ? canvas.body.length : 0;

    return `
      ${block('Seven phases, one key question each', 'Each phase ends with an exit gate: pass it, go back, or stop. Stopping early is a good result if a normal screen solves the problem better.', `
        <div class="tldr-timeline" style="--cols:${phases.length}">
          <ol class="tldr-timeline__steps">${phases.map(p => `
            <li>
              <a href="${p.slug ? '#/' + p.slug : '#/lifecycle'}" class="tldr-phase">
                <span class="tldr-phase__dot">${p.n}</span>
                <b>${esc(p.name)}</b>
                <span class="tldr-phase__q">${inline(p.q)}</span>
                ${p.lead ? `<span class="tldr-phase__lead">Lead: ${esc(plain(p.lead))}</span>` : ''}
              </a>
            </li>`).join('')}
          </ol>
          ${loops.length ? `<ul class="tldr-timeline__loops" aria-label="Feedback loops">${loops.map(l => `
            <li style="grid-column:${l.from} / ${l.to + 1}">${svg(I.loop, 16)}<span><b>${esc(l.label)}</b> ${inline(l.text)}</span></li>`).join('')}
          </ul>` : ''}
        </div>
        <div class="tldr-gate" aria-label="Exit gate outcomes">
          <span class="tldr-gate__label">${svg(I.flag, 16)} Exit gate</span>
          <span class="tldr-gate__opt is-pass">${svg(I.check, 14, 2.4)} Pass: next phase</span>
          <span class="tldr-gate__opt">${svg(I.loop, 14)} Go back and fix</span>
          <span class="tldr-gate__opt">${svg(I.x, 14, 2.4)} Stop</span>
        </div>`)}

      ${qRow ? block('Four roles, one product', 'Each role owns a different question. When roles disagree, the owner of that question decides.', `
        <div class="tldr-roles">${C.ROLES.map(role => {
          const i = rolesTbl.head.findIndex(h => C.roleOf(h) === role);
          return `<div class="card tldr-role">
            <span class="tldr-icon">${svg(C.ROLE_ICONS[role] || '', 20, 1.8)}</span>
            <b>${esc(role)}</b>
            <p>${inline(qRow[i] || '')}</p>
          </div>`;
        }).join('')}
        </div>`) : ''}

      <div class="tldr-cols">
        ${leadTbl ? block('Who leads each phase', 'Read across a row to see how a role’s involvement shifts through the lifecycle.', `
          <div class="tldr-heat-wrap">
            <table class="tldr-heat">
              <thead><tr><th scope="col"><span class="visually-hidden">Role</span></th>${leadTbl.body.map(r => {
                const m = /^(\d+)\.?\s*(.+)$/.exec(plain(r[0])) || [];
                return `<th scope="col" title="${esc(plain(r[0]))}"><span class="tldr-heat__n">${esc(m[1] || '')}</span><span class="tldr-heat__name">${esc(m[2] || plain(r[0]))}</span></th>`;
              }).join('')}</tr></thead>
              <tbody>${leadTbl.head.slice(1).map((h, ci) => `
                <tr><th scope="row">${esc(plain(h))}</th>${leadTbl.body.map(r => {
                  const s = SYM[(r[ci + 1] || '').trim()];
                  return `<td>${s ? `<span class="tldr-heat__cell is-${s[0]}" title="${s[1]}"><span class="visually-hidden">${s[1]}</span></span>` : ''}</td>`;
                }).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
          <p class="tldr-legend"><span><i class="tldr-heat__cell is-lead"></i>Leads</span><span><i class="tldr-heat__cell is-contrib"></i>Contributes</span><span><i class="tldr-heat__cell is-review"></i>Reviews</span></p>`) : ''}

        ${canvas ? block('One canvas, filled as you go', `The AI Use Case Canvas has ${totalFields} fields. Each phase fills its own rows, so the canvas becomes the handoff.`, `
          <div class="tldr-bars" role="img" aria-label="Canvas fields per phase: ${phases.map(p => `${esc(p.name)} ${counts[p.name] || 0}`).join(', ')}">
            ${phases.map(p => `<div class="tldr-bars__col">
              <span class="tldr-bars__v">${counts[p.name] || 0}</span>
              <span class="tldr-bars__bar" style="height:${((counts[p.name] || 0) / maxCount) * 100}%"></span>
              <span class="tldr-bars__l">${esc(p.name)}</span>
            </div>`).join('')}
          </div>
          <p class="tldr-mini-h">Who fills it</p>
          <div class="tldr-stack" role="img" aria-label="Canvas fields by owner: ${C.ROLES.map(r => `${esc(r)} ${owners[r] || 0}`).join(', ')}">
            ${C.ROLES.map((r, i) => owners[r] ? `<span class="tldr-stack__seg tldr-c${i + 1}" style="flex:${owners[r]}" title="${esc(r)}: ${owners[r]}">${owners[r]}</span>` : '').join('')}
          </div>
          <p class="tldr-legend">${C.ROLES.map((r, i) => `<span><i class="tldr-swatch tldr-c${i + 1}"></i>${esc(r)}</span>`).join('')}</p>`) : ''}
      </div>`;
  }

  /* 3 · Shape it */
  function shape() {
    const define = S.p[1];
    const capRow = canvasRow(/^Capabilities$/i);
    let chain = [];
    if (capRow) {
      const steps = plain(capRow[2]).split('→').map(s => s.trim());
      const ex = plain(capRow[4]).split('→').map(s => s.trim());
      chain = steps.map((s, i) => ({ step: ucfirst(s), ex: ex.length === steps.length ? ucfirst(ex[i]) : '' }));
    }
    const bounds = table(define, /^Can do \| Must confirm/i);
    const zones = [
      ['ok', I.check, 'Answer, with sources'],
      ['warn', I.alert, 'Show a preview, wait for the user’s OK'],
      ['stop', I.x, 'Explain the limit, offer an alternative'],
    ];
    const metrics = table(define, /^Metric \| What it tells you/i);

    const models = [
      [I.ui, 'Conventional UI', 'Forms, filters, buttons', 'The task is predictable, with known steps and choices.'],
      [I.hybrid, 'Hybrid', 'Ask in words, see a chart, table or form', 'The answer is best shown as structured results.', true],
      [I.chat, 'Conversational AI', 'Explore, follow up, generate, guide', 'The task is open-ended and the answer is mostly words.'],
    ];
    const checks = [
      ['Does the AI take actions?', 'send, submit, change, delete', 'Preview and confirm, undo or cancel, audit log, human handoff'],
      ['Does it touch medicines or patients?', '', 'Adverse-event check with Pharmacovigilance'],
      ['Personal or regulated data, GxP or external users?', '', 'Governance and privacy sign-off, system validation if GxP-relevant, adversarial testing'],
    ];

    return `
      ${block('Is conversation the right answer?', 'Choose the interaction model before anyone designs a chat window, and write down why.', `
        <div class="tldr-precheck">${svg(I.alert, 18)}<p><b>First: is approved data available, with a named owner?</b> If not, fix the data first. AI can’t fix bad data.</p></div>
        <div class="tldr-spectrum">
          <div class="tldr-spectrum__axis" aria-hidden="true"><span>More structured</span><span>More open-ended</span></div>
          <div class="tldr-models">${models.map(([ic, t, how, when, rec]) => `
            <div class="card tldr-model${rec ? ' is-rec' : ''}">
              ${rec ? '<span class="tag">Most enterprise products</span>' : ''}
              ${tile(ic)}<h4>${t}</h4><p class="tldr-model__how">${how}</p><p>${when}</p>
            </div>`).join('')}
          </div>
        </div>`)}

      ${chain.length ? block('Map each capability as a chain', 'If you can’t name the data or tool, the capability isn’t ready. Example: the KPI investigation assistant.', `
        <ol class="tldr-chain">${chain.map(c => `
          <li><b>${esc(c.step)}</b>${c.ex ? `<span>${esc(c.ex)}</span>` : ''}</li>`).join('')}
        </ol>`) : ''}

      ${bounds ? block('Draw three boundaries', 'Every request falls into one of three zones. No open-ended “Ask AI anything”.', `
        <div class="tldr-zones">${bounds.head.map((h, ci) => {
          const [k, ic, does] = zones[ci] || zones[0];
          return `<div class="tldr-zone is-${k}">
            <div class="tldr-zone__head">${svg(ic, 18, 2.2)}<h4>${inline(h)}</h4></div>
            <p class="tldr-zone__does">${does}</p>
            <ul>${bounds.body.map(r => r[ci]).filter(Boolean).map(x => `<li>${inline(x)}</li>`).join('')}</ul>
          </div>`;
        }).join('')}
        </div>`) : ''}

      <div class="tldr-cols">
        ${metrics ? block('Measure success against today', 'Pick two to four metrics, each with a target. Also set a response-time target.', `
          <ul class="tldr-metrics">${metrics.body.map(r => `
            <li><b>${inline(r[0])}</b><span>${inline(r[1] || '')}</span></li>`).join('')}
          </ul>
          <div class="tldr-compare" role="img" aria-label="Example: time to answer drops from about 30 minutes today to under 2 minutes">
            <p class="tldr-mini-h">Example target: time to answer <span class="tag tag--neutral">Illustrative</span></p>
            <div class="tldr-compare__row"><span>Today</span><div><i style="width:100%"></i></div><b>~30 min</b></div>
            <div class="tldr-compare__row is-target"><span>Target</span><div><i style="width:6.7%"></i></div><b>&lt; 2 min</b></div>
          </div>`) : ''}

        ${block('Three questions add extra checks', 'Answer them in Define. Every product gets the base rules; a “yes” adds more.', `
          <ul class="tldr-checks">${checks.map(([q, hint, add]) => `
            <li>
              <div class="tldr-checks__q"><b>${q}</b>${hint ? `<span>${hint}</span>` : ''}</div>
              <div class="tldr-checks__a"><span class="tag tag--neutral">If yes</span><span>${add}</span></div>
            </li>`).join('')}
          </ul>`)}
      </div>`;
  }

  /* 4 · Design the conversation */
  function loopSvg() {
    const cx = 300, cy = 196, r = 140;
    const pt = (a, rr = r) => [cx + rr * Math.cos(a * Math.PI / 180), cy + rr * Math.sin(a * Math.PI / 180)].map(v => +v.toFixed(1));
    const nodes = [['User states', 'what they need'], ['AI interprets', 'the request'], ['Gathers context,', 'reasons or acts'], ['Shows the result', 'and its source'], ['Offers a', 'next step']];
    const ang = [-90, -18, 54, 126, 198];
    let s = `<circle class="ring" cx="${cx}" cy="${cy}" r="${r}"/>`;
    ang.forEach(a => { const [x, y] = pt(a + 36); s += `<path class="chev" d="M-5 -6 L4 0 L-5 6" transform="translate(${x} ${y}) rotate(${a + 126})"/>`; });
    const [lx, ly] = pt(18, r + 22);
    s += `<text class="edge" x="${lx}" y="${ly}">clear</text>`;
    // Recovery detour sits outside the ring, between "interprets" and "user".
    s += `<path class="detour" d="M452 ${pt(-18)[1] - 26} L470 80" marker-end="url(#tldr-arr)"/>`;
    s += `<path class="detour" d="M405 50 L382 52" marker-end="url(#tldr-arr)"/>`;
    s += `<text class="edge" x="512" y="${pt(-18)[1] - 40}">not clear</text>`;
    s += `<g class="node is-recovery"><rect x="405" y="22" width="170" height="56" rx="12"/><text x="490" y="46"><tspan x="490" class="b">Recovery</tspan><tspan x="490" dy="17">clarify or confirm</tspan></text></g>`;
    nodes.forEach(([a, b], i) => {
      const [x, y] = pt(ang[i]);
      s += `<g class="node${i === 0 ? ' is-start' : ''}"><rect x="${x - 78}" y="${y - 27}" width="156" height="54" rx="12"/><text x="${x}" y="${y - 3}"><tspan x="${x}" class="b">${a}</tspan><tspan x="${x}" dy="17">${b}</tspan></text></g>`;
    });
    s += `<text class="center" x="${cx}" y="${cy - 6}">Repeat until</text><text class="center" x="${cx}" y="${cy + 14}">the user is done</text>`;
    return `<svg class="tldr-loop" viewBox="0 0 600 370" role="img" aria-label="The conversation loop: the user states what they need, the AI interprets it; if it is not clear the AI clarifies or confirms and the user restates; if clear, the AI gathers context and reasons or acts, shows the result with its source, offers a next step, and the loop repeats until the user is done.">
      <defs><marker id="tldr-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z"/></marker></defs>${s}</svg>`;
  }

  function conversation() {
    const model = S.p[2], design = S.p[3];
    const wrong = table(model, /^When this happens \| The AI should/i);
    const examples = (model ? model.lines : [])
      .map(l => /^-\s+\*\*(.+?):\*\*\s*(.+?)\s*→\s*(.+)$/.exec(l.trim()))
      .filter(Boolean)
      .map(m => ({ label: plain(m[1]), user: plain(m[2]).replace(/^"|"$/g, ''), ai: plain(m[3]).replace(/^"|"$/g, '') }));
    const required = splitList(lineAfter(design, /^\*\*Every product includes:\*\*/i));
    const actions = splitList(lineAfter(design, /^\*\*If the AI takes actions, add:\*\*/i));
    const proto = lineAfter(design, /^\*\*Prototype with the real model early\.\*\*/i);

    const patterns = [
      ['Input', 'Prompt, starters, attachments, voice'],
      ['Response', 'Text, table, chart, summary, artifact'],
      ['Follow-up', 'Suggestions, refine, regenerate, feedback'],
      ['Action', 'Preview, confirm, run, undo'],
    ];
    const spec = [
      ['Role', 'Who it serves, its job'],
      ['Voice and tone', 'With 2–3 example replies'],
      ['Boundaries', 'From Define', true],
      ['Response rules', 'Length, structure, sources, uncertainty'],
      ['Recovery rules', 'From Model', true],
    ];

    return `
      <div class="tldr-cols tldr-cols--loop">
        ${block('The conversation is a loop, not a sequence of screens', 'Recovery is part of the loop, not an exception. Show on screen what the AI remembers: users assume it remembers more than it does.', `
          <figure class="card tldr-figure">${loopSvg()}</figure>`)}
        ${examples.length ? block('What recovery sounds like', 'From the KPI investigation assistant.', `
          <div class="tldr-bubbles">${examples.map(e => `
            <div class="tldr-bubbles__pair">
              <span class="tag tag--neutral">${esc(e.label)}</span>
              <div class="bubble bubble--user">${esc(e.user)}</div>
              <div class="bubble bubble--ai">${esc(e.ai)}</div>
            </div>`).join('')}
          </div>`) : ''}
      </div>

      ${wrong ? block(`Design every way it can go wrong: ${wrong.body.length} cases`, 'Each one needs a written response before you leave Model. Rule of thumb: no dead ends.', `
        <ol class="tldr-wrong">${wrong.body.map(r => `
          <li class="card"><b>${inline(r[0])}</b><span>${inline(r[1] || '')}</span></li>`).join('')}
        </ol>`) : ''}

      <div class="tldr-cols">
        ${block('Build from reusable patterns', 'Patterns in the order users meet them. Reuse one from the Pattern Catalogue before inventing a new one.', `
          <div class="tldr-patterns">
            <div class="tldr-patterns__band is-trust"><b>Trust</b> · throughout: AI disclosure, sources, uncertainty, limits</div>
            <ol class="tldr-patterns__flow">${patterns.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
            <div class="tldr-patterns__band is-recovery"><b>Recovery</b> · when needed: clarify, no result, out of scope, error, handoff</div>
          </div>
          ${required.length ? `<p class="tldr-mini-h">Every product includes</p><p class="tldr-chips">${required.map(x => `<span class="tag tag--outline">${esc(x)}</span>`).join('')}</p>` : ''}
          ${actions.length ? `<p class="tldr-mini-h">If the AI takes actions, add</p><p class="tldr-chips">${actions.map(x => `<span class="tag tag--outline">${esc(x)}</span>`).join('')}</p>` : ''}`)}

        ${block('Write the behavior spec', 'The brief the AI follows; in practice, the system prompt. Design owns what it says, Data Science turns it into a prompt, Development versions it.', `
          <div class="tldr-spec">
            <ul class="tldr-spec__layers">${spec.map(([t, d, from]) => `<li${from ? ' class="is-from"' : ''}><b>${t}</b><span>${d}</span></li>`).join('')}</ul>
            <div class="tldr-spec__arrow" aria-hidden="true">${svg(I.down, 20)}</div>
            <div class="tldr-spec__out"><b>Behavior spec</b><span>Versioned, next to the code</span></div>
            <div class="tldr-spec__arrow" aria-hidden="true">${svg(I.down, 20)}</div>
            <div class="tldr-spec__out is-final"><b>The AI’s behavior</b></div>
          </div>
          ${proto ? `<div class="tldr-tip">${svg(I.flag, 16)}<p><b>Prototype with the real model early.</b> ${inline(proto)}</p></div>` : ''}`)}
      </div>`;
  }

  /* 5 · Prove it and keep learning */
  function prove() {
    const validate = S.p[4], deliver = S.p[5], learn = S.p[6];
    const checks = table(validate, /^Check \| Passes when/i);
    const types = table(validate, /^Case type \| What it tests/i);
    const critical = bulletsAfter(validate, /^\*\*A critical failure\*\*/i);
    const passRow = canvasRow(/^Pass rate$/i);
    const passEx = passRow && /(\d+(?:\.\d+)?)%/.exec(plain(passRow[4] || ''));
    const triggers = table(learn, /^Trigger \| Action \| Who/i);
    const deliverGoal = lineAfter(deliver, /^\*\*Goal:\*\*/i).replace(/^.+?[.!?]\s+/, '');
    const changeRule = ucfirst(lineAfter(deliver, /^\*\*The change rule:\*\*/i));
    const pos = (v) => Math.max(0, Math.min(100, (v - 50) * 2));
    const handoff = ['Use Case Canvas', 'Conversation flow', 'Patterns and UX copy', 'Behavior spec', 'Working prompt', 'Evaluation set'];

    return `
      ${block('Two tracks, one decision', 'Most teams only test the first track. This framework needs both.', `
        <div class="tldr-tracks">
          <div class="card tldr-track"><span class="tag tag--neutral">Track A · Lead: Design</span><h4>User testing</h4><p>Can users express what they need? Give a goal, not a prompt, and watch.</p></div>
          <div class="tldr-tracks__link">${svg(I.arrow, 18)}<span>Real phrasings become test cases</span></div>
          <div class="card tldr-track"><span class="tag tag--neutral">Track B · Lead: Data Science</span><h4>Answer quality</h4><p>Are the answers correct? Score a fixed test set against four checks.</p></div>
        </div>
        <div class="tldr-decision">
          <b>Product owner: ready to ship?</b>
          <span class="is-yes">${svg(I.check, 14, 2.4)} Yes: Deliver</span>
          <span class="is-no">${svg(I.loop, 14)} No: back to Model or Design</span>
        </div>`)}

      <div class="tldr-cols">
        ${checks ? block('Four checks for every answer', '', `
          <ol class="tldr-four">${checks.body.map((r, i) => `
            <li class="card"><span class="tldr-four__n">${i + 1}</span><b>${esc(plain(r[0]))}</b><span>${inline(r[1] || '')}</span></li>`).join('')}
          </ol>`) : ''}
        ${block('Run each case three times', 'The same question can get different answers, so one good run proves nothing. If any run fails, the case fails.', `
          <div class="tldr-runs" role="img" aria-label="Example: run 1 passes, run 2 passes, run 3 fails, so the case fails">
            <span class="tldr-run is-pass">${svg(I.check, 16, 2.6)}<small>Run 1</small></span>
            <span class="tldr-run is-pass">${svg(I.check, 16, 2.6)}<small>Run 2</small></span>
            <span class="tldr-run is-fail">${svg(I.x, 16, 2.6)}<small>Run 3</small></span>
            <span class="tldr-runs__eq" aria-hidden="true">=</span>
            <span class="tldr-run is-result">Case fails</span>
          </div>
          ${types ? `<p class="tldr-mini-h">${types.body.length} kinds of test case, 5 to 10 cases per capability</p>
          <p class="tldr-chips">${types.body.map(r => `<span class="tag tag--outline" title="${esc(plain(r[1] || ''))}">${esc(plain(r[0]))}</span>`).join('')}</p>` : ''}`)}
      </div>

      ${block('The ship gate', 'Both conditions must be true. The thresholds are starting values, to be adjusted during the pilot.', `
        <div class="tldr-ship">
          <div class="tldr-gauge" role="img" aria-label="Pass rate scale from 50 to 100 percent. Ship at 90 percent or higher, 95 percent if the AI takes actions or serves patients.${passEx ? ` Example result: ${esc(passEx[1])} percent.` : ''}">
            <p class="tldr-mini-h">1 · Pass rate</p>
            <div class="tldr-gauge__track">
              <span class="tldr-gauge__zone" style="left:${pos(90)}%"></span>
              ${passEx ? `<span class="tldr-gauge__fill" style="width:${pos(+passEx[1])}%"><b>Example: ${esc(passEx[1])}%</b></span>` : ''}
              <span class="tldr-gauge__mark is-low" style="left:${pos(90)}%"><span><b>90%</b> standard</span></span>
              <span class="tldr-gauge__mark is-high" style="left:${pos(95)}%"><span><b>95%</b> if it takes actions or serves patients</span></span>
            </div>
            <div class="tldr-gauge__axis" aria-hidden="true"><span>50%</span><span>75%</span><span>100%</span></div>
          </div>
          ${critical.length ? `<div class="tldr-critical">
            <p class="tldr-mini-h">2 · Zero critical failures</p>
            <ul>${critical.map(c => `<li>${svg(I.x, 14, 2.4)}<span>${inline(c)}</span></li>`).join('')}</ul>
          </div>` : ''}
        </div>`)}

      <div class="tldr-cols">
        ${block('Deliver behavior, not just screens', deliverGoal ? inline(ucfirst(deliverGoal)) : '', `
          <div class="tldr-handoff">
            <ul>${handoff.map(h => `<li>${h}</li>`).join('')}</ul>
            <div class="tldr-handoff__arrow" aria-hidden="true">${svg(I.arrow, 20)}</div>
            <div class="tldr-handoff__pkg"><b>Handoff package</b><span>Development builds it, pins the model version and runs the evaluation before every release.</span></div>
          </div>
          ${changeRule ? `<div class="tldr-tip">${svg(I.alert, 16)}<p><b>The change rule.</b> ${inline(changeRule)}</p></div>` : ''}`)}

        ${block('Keep learning after launch', 'Real use feeds the next version: weekly reviews in month one, then monthly.', `
          <ol class="tldr-learn">
            <li><b>Real use</b></li>
            <li><b>Review</b><span>metrics, rephrasing, give-ups, feedback, handoffs</span></li>
            <li><b>Fix</b><span>test cases, behavior spec, patterns</span></li>
            <li><b>Re-run evaluation</b></li>
          </ol>
          ${triggers ? `<p class="tldr-mini-h">Act right away when</p>
          <ul class="tldr-triggers">${triggers.body.map(r => `<li><span>${inline(r[0])}</span>${svg(I.arrow, 14)}<span>${inline(r[1] || '')}</span></li>`).join('')}</ul>` : ''}`)}
      </div>`;
  }

  /* ---------- Page ---------- */
  function render(main) {
    main.innerHTML = `
      <div class="tldr">
        <section class="tldr-hero">
          <div class="wrap">
            <span class="tag">TL;DR · ${esc(C.version || '')}</span>
            <h1>The whole framework,<br>in five parts.</h1>
            <p class="lede">The short version of the ${esc(C.docTitle)}: five sections of about six minutes each, with the main ideas and techniques. Every section links to the full chapters.</p>
            <ol class="tldr-agenda">${SECS.map((s, i) => `
              <li><a class="card" href="#/tldr/${s.id}" data-tldr-go="${i}">
                <span class="tldr-agenda__n">0${i + 1}</span>
                <b>${s.title}</b>
                <span>${s.kicker}</span>
                <small>~6 min</small>
              </a></li>`).join('')}
            </ol>
          </div>
        </section>

        <nav class="tldr-steps" aria-label="TL;DR sections">
          <div class="wrap">
            <ol>${SECS.map((s, i) => `<li><a href="#/tldr/${s.id}" data-tldr-go="${i}"><span>${i + 1}</span>${s.short}</a></li>`).join('')}</ol>
            <span class="tldr-steps__hint" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd> to move</span>
          </div>
        </nav>

        ${SECS.map((s, i) => `
        <section class="tldr-sec${i % 2 ? ' is-alt' : ''}" id="${s.id}" aria-labelledby="${s.id}-h">
          <div class="wrap">
            <header class="tldr-sec__head">
              <span class="tldr-sec__num" aria-hidden="true">0${i + 1}</span>
              <div>
                <p class="tldr-sec__kicker">${s.kicker} <span class="tag tag--neutral">~6 min</span></p>
                <h2 id="${s.id}-h" tabindex="-1">${s.title}.</h2>
                <p class="tldr-takeaway"><b>In one line:</b> ${s.takeaway}</p>
              </div>
            </header>
            ${s.body()}
            <p class="tldr-deeper"><span>Go deeper</span>${s.deeper.filter(Boolean).map(chapterLink).join('')}</p>
          </div>
        </section>`).join('')}
      </div>`;
    sync();
  }

  /* ---------- Section navigation ---------- */
  const $main = document.getElementById('main');
  const active = () => !!$main.querySelector('.tldr');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function currentIndex() {
    const bar = $main.querySelector('.tldr-steps');
    const offset = (bar ? bar.getBoundingClientRect().bottom : 0) + 48;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) return SECS.length - 1;
    let idx = -1;
    SECS.forEach((s, i) => { const el = document.getElementById(s.id); if (el && el.getBoundingClientRect().top - offset <= 0) idx = i; });
    return idx;
  }
  function sync() {
    const idx = currentIndex();
    $main.querySelectorAll('.tldr-steps a').forEach((a, i) => {
      a.classList.toggle('is-active', i === idx);
      if (i === idx) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
  }
  // Smooth scrolling takes a moment; repeated key presses continue from the last target.
  let lastGo = { i: -1, at: 0 };
  function go(i) {
    const s = SECS[i];
    const el = s && document.getElementById(s.id);
    if (!el) return;
    lastGo = { i, at: Date.now() };
    history.replaceState(null, '', '#/tldr/' + s.id);
    el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    const h = document.getElementById(s.id + '-h');
    if (h) h.focus({ preventScroll: true });
  }
  $main.addEventListener('click', (e) => {
    const a = e.target.closest('[data-tldr-go]');
    if (!a || !active()) return;
    e.preventDefault();
    go(+a.dataset.tldrGo);
  });
  document.addEventListener('keydown', (e) => {
    if (!active() || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const t = document.activeElement;
    if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
    e.preventDefault();
    const idx = Date.now() - lastGo.at < 900 ? lastGo.i : currentIndex();
    go(e.key === 'ArrowRight' ? Math.min(idx + 1, SECS.length - 1) : Math.max(idx - 1, 0));
  });
  window.addEventListener('scroll', () => { if (active()) sync(); }, { passive: true });

  C.registerView('tldr', { title: 'TL;DR', render });
})();
