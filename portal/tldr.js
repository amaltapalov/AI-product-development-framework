/* TL;DR view: the framework as five one-screen slides.
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

  const S = {
    principles: findSec(/^Principles/i),
    lifecycle: findSec(/lifecycle/i),
    roles: findSec(/roles/i),
    p: [1, 2, 3, 4, 5, 6, 7].map(phaseSec),
  };
  const canvas = table(findSec(/^Templates/i), /^Phase \| Field \| Prompt \| Owner/i);
  const canvasRow = (re) => canvas && canvas.body.find(r => re.test(plain(r[1] || '')));

  const lifeTbl = table(S.lifecycle, /^Phase \| Key question \| Lead role/i);
  const phases = lifeTbl
    ? lifeTbl.body.map(r => {
      const m = /^(\d+)\.?\s*(.+)$/.exec(plain(r[0])) || [];
      const n = +m[1];
      return { n, name: (m[2] || r[0]).trim(), q: r[1] || '', lead: r[2] || '', slug: C.phaseByNum[n] ? C.phaseByNum[n].slug : null };
    })
    : C.CHAPTERS.filter(c => c.phase).map(c => ({ n: c.phase, name: c.title, q: '', lead: '', slug: c.slug }));
  const phaseSlug = (n) => C.phaseByNum[n] ? C.phaseByNum[n].slug : '';

  /* ---------- Building blocks ---------- */
  const I = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
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
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  };
  // Illustrative KPI-assistant exchanges for the "goes wrong" cases, matched by situation text.
  const WRONG_EXAMPLES = [
    [/missing/i, 'Show me the drop.', 'Which product should I look at?'],
    [/ambiguous/i, 'How are we doing?', 'Which do you want to look at: active users, conversion or revenue?'],
    [/sure what/i, 'Show retention.', 'I read this as 30-day retention for the mobile app, last quarter. Is that right?'],
    [/nothing/i, 'Show trial upgrades for March.', 'I searched March KPI data and found no “trial upgrades” metric. Try “conversion” instead?'],
    [/^only part/i, 'Compare revenue for all regions.', 'Here are EU and US. APAC data for March is missing.'],
    [/scope/i, 'Show me the competitor’s numbers.', 'I only have our internal KPIs. I can compare with internal benchmarks instead.'],
    [/system fails/i, 'Why did signups fall?', 'I couldn’t reach the KPI data source. Nothing has changed. Please try again in a minute.'],
    [/multi-step/i, 'Update all three reports.', 'Two of three reports were updated; the third failed. Retry, undo, or ask an analyst?'],
    [/person/i, 'Can someone check this properly?', 'I’ll pass this to the KPI analyst team with our conversation so far.'],
  ];
  const arrow = svg(I.arrow, 14);
  const tile = (body) => `<span class="tldr-icon">${svg(body, 20, 1.8)}</span>`;
  const label = (step, text) => `<p class="sl-label">${step ? `<span>${step}</span>` : ''}${text}</p>`;
  const chapterLink = (slug) => C.bySlug[slug] ? `<a href="#/${slug}">${esc(C.bySlug[slug].title)} ${arrow}</a>` : '';

  /* ---------- The five slides ---------- */
  const SLIDES = [
    { id: 'big-idea', short: 'The big idea', kicker: 'Why this framework exists', title: 'The big idea',
      takeaway: 'Start from a real human problem, and put correct, safe answers before fluent ones.',
      deeper: ['start', 'rules'], body: bigIdea },
    { id: 'journey', short: 'The journey', kicker: 'Seven phases, four roles', title: 'The journey',
      takeaway: 'Seven phases, each with one key question and an exit gate. Four roles, each owning one question.',
      deeper: ['lifecycle', 'roles'], body: journey },
    { id: 'shape', short: 'Shape it', kicker: 'Phases 1–2 · Discover and Define', title: 'Shape it',
      takeaway: 'Check that conversation is the right answer, then fence exactly what the AI can do.',
      deeper: [phaseSlug(1), phaseSlug(2)], body: shape },
    { id: 'conversation', short: 'Design the conversation', kicker: 'Phases 3–4 · Model and Design', title: 'Design the conversation',
      takeaway: 'Design a loop, not a set of screens, and plan for every way it can go wrong.',
      deeper: [phaseSlug(3), phaseSlug(4)], body: conversation },
    { id: 'prove', short: 'Prove it and learn', kicker: 'Phases 5–7 · Validate, Deliver and Learn', title: 'Prove it and keep learning',
      takeaway: 'Test the answers, not just the usability. Then let real use shape the next version.',
      deeper: [phaseSlug(5), phaseSlug(6), phaseSlug(7)], body: prove },
  ];

  /* 1 · The big idea */
  function bigIdea() {
    const principles = table(S.principles, /^# \| Principle \| In practice/i);
    const outcomes = [
      [I.target, 'Solve a real problem', 'Prove the need before anyone designs a chat window.'],
      [I.badge, 'Give correct answers', 'Every claim is right, sourced and honest about uncertainty.'],
      [I.shield, 'Fail safely', 'Every error has a next step; nothing risky happens without an OK.'],
    ];
    return `
      ${C.oneSentence ? `<blockquote class="sl-quote">${esc(ucfirst(C.oneSentence))}</blockquote>` : ''}
      <div class="sl-outcomes">${outcomes.map(([ic, t, d]) => `
        <div class="sl-card">${tile(ic)}<div><b>${t}</b><span>${d}</span></div></div>`).join('')}
      </div>
      ${principles ? `
        ${label('', 'Six principles settle trade-offs, in priority order')}
        <ol class="sl-principles">${principles.body.map(r => `
          <li><span>${esc(plain(r[0]))}</span><b>${esc(plain(r[1]))}</b></li>`).join('')}
        </ol>` : ''}`;
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

    return `
      <div class="sl-timeline" style="--cols:${phases.length}">
        <ol class="sl-timeline__steps">${phases.map(p => `
          <li><a href="${p.slug ? '#/' + p.slug : '#/lifecycle'}" class="sl-phase">
            <span class="sl-phase__dot">${p.n}</span>
            <b>${esc(p.name)}</b>
            <span class="sl-phase__q">${inline(p.q)}</span>
            ${p.lead ? `<span class="sl-phase__lead">${esc(plain(p.lead))}</span>` : ''}
          </a></li>`).join('')}
        </ol>
        ${loops.length ? `<ul class="sl-timeline__loops" aria-label="Feedback loops">${loops.map(l => `
          <li style="grid-column:${l.from} / ${l.to + 1}">${svg(I.loop, 14)}<span><b>${esc(l.label)}</b> ${inline(l.text)}</span></li>`).join('')}
        </ul>` : ''}
      </div>
      <div class="sl-gate">
        <span class="sl-gate__label">${svg(I.flag, 14)} Every phase ends with an exit gate:</span>
        <span class="sl-pill is-ok">${svg(I.check, 13, 2.4)} Pass</span>
        <span class="sl-pill">${svg(I.loop, 13)} Go back</span>
        <span class="sl-pill">${svg(I.x, 13, 2.4)} Stop</span>
      </div>
      ${qRow ? `
        ${label('', 'Four roles, each owning one question')}
        <div class="sl-roles">${C.ROLES.map(role => {
          const i = rolesTbl.head.findIndex(h => C.roleOf(h) === role);
          return `<div class="sl-card">${tile(C.ROLE_ICONS[role] || '')}<div><b>${esc(role)}</b><span>${inline(qRow[i] || '')}</span></div></div>`;
        }).join('')}
        </div>` : ''}`;
  }

  /* 3 · Shape it */
  function shape() {
    const bounds = table(S.p[1], /^Can do \| Must confirm/i);
    const metrics = table(S.p[1], /^Metric \| What it tells you/i);
    const zones = [['ok', I.check, 'Answer, with sources'], ['warn', I.alert, 'Preview, wait for the user’s OK'], ['stop', I.x, 'Explain the limit, offer an alternative']];
    const models = [
      [I.ui, 'Conventional UI', 'Predictable task with known steps'],
      [I.hybrid, 'Hybrid', 'Ask in words, see a chart, table or form'],
      [I.chat, 'Conversational', 'Open-ended: explore, follow up, generate'],
    ];
    const capRow = canvasRow(/^Capabilities$/i);
    const chain = capRow ? plain(capRow[2]) : 'Intent → action → data or tool → result → follow-up';

    return `
      <div class="sl-two">
        <div class="sl-panel">
          ${label('Discover', 'Is conversation the right answer?')}
          <div class="sl-models">${models.map(([ic, t, d]) => `
            <div class="sl-model">${tile(ic)}<b>${t}</b><span>${d}</span></div>`).join('')}
          </div>
          <p class="sl-note">${svg(I.alert, 16)}<span><b>No approved data with an owner?</b> Fix the data first. Stopping here is a good result.</span></p>
        </div>
        <div class="sl-panel">
          ${label('Define', 'What exactly may the AI do?')}
          ${bounds ? `<div class="sl-zones">${bounds.head.map((h, ci) => {
            const [k, ic, does] = zones[ci] || zones[0];
            const ex = bounds.body.map(r => r[ci]).filter(Boolean).slice(0, 2).map(x => plain(x)).join(' · ');
            return `<div class="sl-zone is-${k}"><div class="sl-zone__head">${svg(ic, 16, 2.4)}<b>${inline(h)}</b></div><span class="sl-zone__does">${does}</span><span class="sl-zone__ex">${esc(ex)}</span></div>`;
          }).join('')}
          </div>` : ''}
          <p class="sl-note">${svg(I.target, 16)}<span><b>Map each capability:</b> ${esc(chain)}. <b>Measure</b> 2–4 metrics against today’s baseline.</span>${metrics ? `<button type="button" class="sl-info" aria-describedby="metrics-tip" aria-label="Metrics to choose from">${svg(I.info, 16)}</button><span role="tooltip" id="metrics-tip" class="sl-tip"><b>Pick 2–4 metrics, each with a target:</b><span class="sl-tip__list">${metrics.body.map(r => `<span><b>${esc(plain(r[0]))}</b> · ${esc(plain(r[1] || ''))}</span>`).join('')}</span></span>` : ''}</p>
        </div>
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
    return `<svg class="tldr-loop" viewBox="0 0 600 370" role="img" aria-label="The conversation loop: the user states what they need, the AI interprets it; if it is not clear the AI clarifies or confirms; if clear, the AI gathers context and reasons or acts, shows the result with its source, offers a next step, and the loop repeats until the user is done.">
      <defs><marker id="tldr-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z"/></marker></defs>${s}</svg>`;
  }

  function conversation() {
    const wrong = table(S.p[2], /^When this happens \| The AI should/i);
    const patterns = [['Input', 'prompt, starters'], ['Response', 'text, table, chart'], ['Follow-up', 'refine, feedback'], ['Action', 'preview, confirm, undo']];
    const spec = ['Role', 'Voice', 'Boundaries', 'Response rules', 'Recovery rules'];

    return `
      <div class="sl-two sl-two--loop">
        <div class="sl-stack">
          <figure class="sl-figure">
            ${label('Model', 'The conversation is a loop')}
            ${loopSvg()}
          </figure>
          <div>
            ${label('Design', 'Write the behavior spec: the brief the AI follows')}
            <div class="sl-spec">
              <ol class="sl-spec__parts" aria-label="Ingredients">${spec.map(x => `<li>${x}</li>`).join('')}</ol>
              <span class="sl-spec__arrow" aria-hidden="true">${svg(I.arrow, 16)}</span>
              <span class="sl-spec__out">Behavior spec</span>
            </div>
          </div>
        </div>
        <div class="sl-stack">
          ${wrong ? `<div>
            ${label('Model', `Write a response for every way it can go wrong (${wrong.body.length})`)}
            <ol class="sl-list">${wrong.body.map((r, i) => {
              const ex = WRONG_EXAMPLES.find(e => e[0].test(plain(r[0])));
              const tip = `<b>The AI should:</b> ${inline(r[1] || '')}${ex ? `<span class="sl-tip__ex"><i>User:</i> “${esc(ex[1])}”<br><i>AI:</i> “${esc(ex[2])}”</span>` : ''}`;
              return `<li><span>${esc(plain(r[0]))}</span><button type="button" class="sl-info" aria-describedby="wrong-tip-${i}" aria-label="Example for: ${esc(plain(r[0]))}">${svg(I.info, 16)}</button><span role="tooltip" id="wrong-tip-${i}" class="sl-tip">${tip}</span></li>`;
            }).join('')}</ol>
          </div>` : ''}
          <div>
            ${label('Design', 'Build from reusable patterns')}
            <ol class="sl-flow">${patterns.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
          </div>
        </div>
      </div>`;
  }

  /* 5 · Prove it and keep learning */
  function prove() {
    const checks = table(S.p[4], /^Check \| Passes when/i);
    const passRow = canvasRow(/^Pass rate$/i);
    const passEx = passRow && /(\d+(?:\.\d+)?)%/.exec(plain(passRow[4] || ''));
    const pos = (v) => Math.max(0, Math.min(100, (v - 50) * 2));
    const cycle = ['Handoff', 'Release', 'Real use', 'Review', 'Fix and re-test'];

    return `
      <div class="sl-two">
        <div class="sl-panel">
          ${label('Validate', 'Test two things, not one')}
          <div class="sl-tracks">
            <div class="sl-track"><span>Track A · Design</span><b class="sl-has-tip" tabindex="0" aria-describedby="track-tip-a">Can users say what they need?</b><span role="tooltip" id="track-tip-a" class="sl-tip sl-tip--start">It tests the <b>conversation experience</b>.</span></div>
            ${svg(I.arrow, 18)}
            <div class="sl-track"><span>Track B · Data Science</span><b class="sl-has-tip" tabindex="0" aria-describedby="track-tip-b">Are the answers correct?</b><span role="tooltip" id="track-tip-b" class="sl-tip sl-tip--start">It tests the <b>AI’s output</b>.</span></div>
          </div>
          ${checks ? `<ol class="sl-checks">${checks.body.map(r => `
            <li><b>${esc(plain(r[0]))}</b><span>${inline(r[1] || '')}</span></li>`).join('')}
          </ol>` : ''}
          <div class="sl-runs" role="img" aria-label="Run every case three times: if any run fails, the case fails">
            <span class="sl-run is-pass">${svg(I.check, 14, 2.6)}</span><span class="sl-run is-pass">${svg(I.check, 14, 2.6)}</span><span class="sl-run is-fail">${svg(I.x, 14, 2.6)}</span>
            <span class="sl-runs__text"><b>Run every case 3 times.</b> One failed run fails the case.</span>
          </div>
        </div>
        <div class="sl-panel">
          ${label('Ship gate', 'Ready only when both are true')}
          <div class="tldr-gauge" role="img" aria-label="Pass rate of 90 percent or higher, 95 percent if the AI takes actions or serves patients.${passEx ? ` Example result: ${esc(passEx[1])} percent.` : ''}">
            <div class="tldr-gauge__track">
              <span class="tldr-gauge__zone" style="left:${pos(90)}%"></span>
              ${passEx ? `<span class="tldr-gauge__fill" style="width:${pos(+passEx[1])}%">Example: ${esc(passEx[1])}%</span>` : ''}
              <span class="tldr-gauge__mark is-low" style="left:${pos(90)}%"><span><b>90%</b> pass rate</span></span>
              <span class="tldr-gauge__mark is-high" style="left:${pos(95)}%"><span><b>95%</b> if it acts or serves patients</span></span>
            </div>
          </div>
          <p class="sl-note is-ok">${svg(I.check, 16, 2.4)}<span><b>Zero critical failures:</b> no wrong facts, no unsupported causes, no unconfirmed actions, no leaked data.</span></p>
          ${label('Deliver and Learn', 'Hand over behavior, then keep learning')}
          <ol class="sl-cycle">${cycle.map(c => `<li>${c}</li>`).join('')}</ol>
        </div>
      </div>`;
  }

  /* ---------- Deck ---------- */
  const $main = document.getElementById('main');
  let cur = 0;
  const indexOf = (id) => Math.max(0, SLIDES.findIndex(s => s.id === id));

  function render(main, section) {
    main.innerHTML = `
      <div class="tldr">
        <nav class="tldr-bar" aria-label="TL;DR slides">
          <div class="tldr-bar__inner">
            <span class="tag">TL;DR</span>
            <ol class="tldr-tabs">${SLIDES.map((s, i) => `<li><a href="#/tldr/${s.id}" data-i="${i}"><span>${i + 1}</span>${s.short}</a></li>`).join('')}</ol>
            <div class="tldr-bar__ctrl">
              <span class="tldr-count" aria-live="polite"></span>
              <button type="button" class="btn btn--outline btn--icon" data-step="-1" aria-label="Previous slide">${svg(I.left)}</button>
              <button type="button" class="btn btn--outline btn--icon" data-step="1" aria-label="Next slide">${svg(I.right)}</button>
            </div>
          </div>
        </nav>
        <div class="tldr-stage">${SLIDES.map((s, i) => `
          <section class="tldr-slide" id="${s.id}" aria-roledescription="slide" aria-labelledby="${s.id}-h" hidden>
            <div class="tldr-slide__inner">
              <header class="tldr-slide__head">
                <span class="tldr-slide__num" aria-hidden="true">0${i + 1}</span>
                <div>
                  <p class="tldr-slide__kicker">${s.kicker}</p>
                  <h2 id="${s.id}-h" tabindex="-1">${s.title}.</h2>
                </div>
                <p class="tldr-slide__take">${s.takeaway}</p>
              </header>
              <div class="tldr-slide__body">${s.body()}</div>
              <footer class="tldr-slide__foot"><span>Go deeper:</span>${s.deeper.filter(Boolean).map(chapterLink).join('')}</footer>
            </div>
          </section>`).join('')}
        </div>
      </div>`;
    show(indexOf(section), false);
  }

  function show(i, focus = true) {
    cur = i;
    $main.querySelectorAll('.tldr-slide').forEach((el, j) => { el.hidden = j !== i; });
    $main.querySelectorAll('.tldr-tabs a').forEach((a, j) => {
      a.classList.toggle('is-active', j === i);
      if (j === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
    const count = $main.querySelector('.tldr-count');
    if (count) count.textContent = `${i + 1} / ${SLIDES.length}`;
    $main.querySelectorAll('[data-step]').forEach(b => { b.disabled = (+b.dataset.step < 0 && i === 0) || (+b.dataset.step > 0 && i === SLIDES.length - 1); });
    window.scrollTo(0, 0);
    if (focus) { const h = document.getElementById(SLIDES[i].id + '-h'); if (h) h.focus({ preventScroll: true }); }
  }

  const active = () => !!$main.querySelector('.tldr');
  const goTo = (i) => { if (i >= 0 && i < SLIDES.length && i !== cur) location.hash = '#/tldr/' + SLIDES[i].id; };

  $main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (b && active()) goTo(cur + +b.dataset.step);
  });
  document.addEventListener('keydown', (e) => {
    if (!active() || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = document.activeElement;
    if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
    const next = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }[e.key];
    if (next) { e.preventDefault(); goTo(cur + next); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); goTo(e.key === 'Home' ? 0 : SLIDES.length - 1); }
  });

  C.registerView('tldr', { title: 'TL;DR', render, update: (section) => show(indexOf(section)) });
})();
