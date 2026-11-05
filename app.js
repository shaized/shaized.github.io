"use strict";
(() => {
 const root = document.documentElement;
 const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
 const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Preferences remain usable without storage. */ } };
 const systemTheme = matchMedia('(prefers-color-scheme: light)');
 const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
 const themeButton = document.getElementById('theme-toggle');
 const motionButton = document.getElementById('motion-toggle');
 const setTheme = theme => {
  root.dataset.theme = theme;
  const next = theme === 'dark' ? 'light' : 'dark';
  if (themeButton) { themeButton.setAttribute('aria-label', `Switch to ${next} theme`); themeButton.title = `Switch to ${next} theme`; }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#11151c' : '#f4f3ed');
 };
 setTheme(read('sz-theme') || (systemTheme.matches ? 'light' : 'dark'));
 themeButton?.addEventListener('click', () => { const theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; write('sz-theme', theme); setTheme(theme); });
 systemTheme.addEventListener('change', event => { if (!read('sz-theme')) setTheme(event.matches ? 'light' : 'dark'); });
 const setMotion = () => {
  const reduced = systemMotion.matches || read('sz-motion') === 'off';
  root.dataset.motion = reduced ? 'off' : 'on';
  if (motionButton) { motionButton.textContent = systemMotion.matches ? 'Motion: reduced by system' : `Motion: ${reduced ? 'off' : 'on'}`; motionButton.setAttribute('aria-pressed', String(reduced)); motionButton.disabled = systemMotion.matches; }
 };
 setMotion();
 motionButton?.addEventListener('click', () => { write('sz-motion', root.dataset.motion === 'off' ? 'on' : 'off'); setMotion(); });
 systemMotion.addEventListener('change', setMotion);
 const menuButton = document.getElementById('menu-toggle');
 const nav = document.getElementById('main-nav');
 const closeMenu = () => { nav?.classList.remove('open'); menuButton?.setAttribute('aria-expanded','false'); };
 menuButton?.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
 nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
 document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });
 const agents = {"hodor": {"name": "HodorAI", "role": "Alert triage", "intro": "Turns alerts into a structured investigation starting point.", "sections": [["The input", "Security alerts and relevant supporting telemetry."], ["The output", "An evidence-backed assessment, uncertainty, and recommended next steps."], ["Why it matters", "Helps analysts understand why an alert matters and what still needs checking."], ["The boundary", "The analyst retains responsibility for the response decision."]]}, "davos": {"name": "Davos", "role": "Threat intelligence", "intro": "Connects outside-world advisories to internal relevance.", "sections": [["The input", "Threat reporting, advisories, indicators, and authorized environment context."], ["The output", "A relevance assessment and an intelligence brief with supporting references."], ["Why it matters", "Moves the question from \u201cwhat happened?\u201d to \u201ccould it affect us?\u201d"], ["The boundary", "Relevance is an assessment; missing evidence must remain visible."]]}, "varys": {"name": "VarysAI", "role": "Indicator enrichment", "intro": "Brings reputation and observed activity into one investigation view.", "sections": [["The input", "Indicators such as IP addresses, domains, URLs, hashes, and email addresses."], ["The output", "A consolidated view of reputation findings and available telemetry context."], ["Why it matters", "Reduces repetitive lookups while keeping the evidence behind each result."], ["The boundary", "A reputation match alone is not proof of compromise."]]}, "arya": {"name": "AryaAI", "role": "Threat hunting", "intro": "Looks beyond alert queues for behaviors worth investigating.", "sections": [["The input", "Hunt hypotheses, behavioral baselines, and security telemetry."], ["The output", "Candidate findings with context and evidence for analyst review."], ["Why it matters", "Helps explore blind spots and relationships that individual rules can miss."], ["The boundary", "Hunt findings are leads to validate, not automatic incident declarations."]]}, "cora": {"name": "Cora-Tuning", "role": "Detection engineering", "intro": "Examines whether detection rules are useful, noisy, silent, or incomplete.", "sections": [["The input", "Detection definitions, source coverage, and triggering history."], ["The output", "Rule assessments and specific, evidence-based tuning recommendations."], ["Why it matters", "Makes detection quality an ongoing engineering discipline."], ["The boundary", "Recommendations are reviewed before any production rule changes."]]}, "severity": {"name": "Threat Severity", "role": "Risk prioritization", "intro": "Translates a published threat into an environment-specific priority.", "sections": [["The input", "Exploitation evidence, exposure, asset importance, and verified controls."], ["The output", "A contextual severity and remediation priority using deterministic scoring."], ["Why it matters", "Separates evidence collection from the logic that makes the scoring decision."], ["The boundary", "Unknowns are explicit; claimed mitigations need evidence."]]}, "reporter": {"name": "Incident Reporter", "role": "Incident documentation", "intro": "Turns the incident conversation into a structured record.", "sections": [["The input", "An incident\u2019s discussion, timeline, actions, and available evidence."], ["The output", "A draft incident report for human review."], ["Why it matters", "Preserves the story and decisions so teams can learn after response ends."], ["The boundary", "Drafts need review for accuracy, completeness, and sensitive information."]]}, "ops": {"name": "SOC-OPS", "role": "Telemetry health", "intro": "Checks whether the security data needed for detection is arriving.", "sections": [["The input", "Log-source activity and expected telemetry availability."], ["The output", "Signals that a source may be silent or a collection path needs attention."], ["Why it matters", "A quiet alert queue is only meaningful when visibility is healthy."], ["The boundary", "Data health and threat verdicts are separate questions."]]}};
 const dialog = document.getElementById('project-dialog'); let opener = null;
 document.querySelectorAll('[data-agent]').forEach(button => button.addEventListener('click', () => {
  const agent = agents[button.dataset.agent]; if (!agent || !dialog) return; opener = button;
  document.getElementById('dialog-title').textContent = agent.name;
  document.getElementById('dialog-role').textContent = 'SOC AI / ' + agent.role.toUpperCase();
  document.getElementById('dialog-intro').textContent = agent.intro;
  const body = document.getElementById('dialog-body'); body.replaceChildren();
  agent.sections.forEach(([heading,text]) => { const h=document.createElement('h3'); h.textContent=heading; const p=document.createElement('p'); p.textContent=text; body.append(h,p); });
  dialog.showModal(); document.body.classList.add('modal-open'); dialog.scrollTop=0;
 }));
 document.getElementById('close-dialog')?.addEventListener('click', () => dialog.close());
 dialog?.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus(); });
 dialog?.addEventListener('click', event => { if (event.target===dialog) { const b=dialog.getBoundingClientRect(); if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom) dialog.close(); }});
 let category='all'; const search=document.getElementById('news-search');
 const filterNews=()=> { const term=(search?.value||'').trim().toLowerCase(); let count=0;
  document.querySelectorAll('[data-news-category]').forEach(card => { const show=(category==='all'||card.dataset.newsCategory===category)&&card.dataset.search.toLowerCase().includes(term); card.hidden=!show; if(show)count++; });
  const status=document.getElementById('news-status'); if(status)status.textContent=count+' '+(count===1?'story':'stories')+' shown.';
  const empty=document.getElementById('news-empty'); if(empty)empty.hidden=count>0;
 };
 document.querySelectorAll('[data-news-filter]').forEach(button=>button.addEventListener('click',()=>{ category=button.dataset.newsFilter; document.querySelectorAll('[data-news-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); filterNews(); }));
 search?.addEventListener('input',filterNews);
 const steps=[['Start with a signal. Check the visibility.','An alert, a new advisory, or a hunting hypothesis opens the question. Telemetry health helps establish whether the available evidence is complete enough to investigate.'],['Build context around the observation.','Triage, enrichment, and hunting contribute different perspectives. Keep the source evidence attached, distinguish observations from assumptions, and identify what is still missing.'],['Translate evidence into a defensible priority.','Threat context, affected assets, and exposure shape the recommendation. Detection review identifies coverage gaps; contextual scoring helps explain why a response has a particular priority.'],['A person decides. The team learns.','The analyst reviews the evidence and authorizes the response. Structured documentation preserves the timeline and decisions; lessons can inform the next hunt or detection improvement.']];
 document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{ const step=steps[Number(button.dataset.step)]; document.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); document.getElementById('step-title').textContent=step[0]; document.getElementById('step-body').textContent=step[1]; }));
})();
