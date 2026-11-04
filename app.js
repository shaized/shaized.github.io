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
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111310' : '#f5f4ed');
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
 document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  document.querySelectorAll('[data-category]').forEach(card => { const visible = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter; card.hidden = !visible; if (visible) count++; });
  document.getElementById('filter-status').textContent = `${count} ${count === 1 ? 'project' : 'projects'} shown.`;
 }));
 const projects = {
  agents: { title:'AI SOC agents, built for production.', intro:'I designed and shipped eight AI SOC agents for triage, enrichment, threat hunting, and detection tuning, unified in a central SOC Agent Hub.', sections:[['What I built','A fleet of production agents supporting security operations across the investigation lifecycle. The enrichment agent runs 12 parallel intelligence checks in about eight seconds.'],['Validation & risk','I benchmarked the triage agent against the 24/7 MSSP on live incidents and ran a CSA AICM / CBRA AI risk assessment before production.'],['Focus','Agentic SOC design, useful enrichment, and evidence-driven evaluation.']] },
  intel: { title:'From intelligence to enforcement.', intro:'I built an IOC pipeline drawing from more than 15 threat intelligence feeds, including abuse.ch, CISA AIS, and FS-ISAC.', sections:[['What I built','The pipeline connects intelligence collection to automated blocking in Cortex XDR and Prisma Access through Torq playbooks.'],['Connected capabilities','Threat intelligence feeds, IOC pipelines, external dynamic lists, and automated response workflows.'],['Focus','Turning threat information into operational protection across endpoint and network controls.']] },
  soc: { title:'A foundation for detection and response.', intro:'I built the detection and response stack for an MDR SOC serving a regulated bank.', sections:[['The stack','Coralogix SIEM, Cortex XDR, Torq SOAR, Prisma Access, Okta, and AWS, managed as Terraform infrastructure as code.'],['Coverage & operations','I audited 427 SIEM alerts for SOAR routing gaps and automated the fix. I also authored the SOC incident response operational guide, covering the SANS lifecycle, severity model, RACI, and escalation.'],['Focus','Connecting detection content, response routing, infrastructure, and operational ownership.']] },
  response: { title:'Investigate. Learn. Improve the defense.', intro:'I led response to npm supply-chain compromises and tested an AWS attack chain through purple teaming.', sections:[['Supply-chain response','Investigations combined XQL and Lucene hunts with fleet-wide forensic scripts executed through Cortex XDR.'],['Purple team exercise','The AWS exercise covered JIT abuse, IAM escalation, and S3 exfiltration. I turned the evidence into production detections.'],['Focus','Connecting real investigative evidence and adversary simulation to stronger detection coverage.']] }
 };
 const dialog = document.getElementById('project-dialog');
 let opener = null;
 document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[button.dataset.project]; if (!project || !dialog) return;
  opener = button;
  document.getElementById('dialog-title').textContent = project.title;
  document.getElementById('dialog-intro').textContent = project.intro;
  const body = document.getElementById('dialog-body'); body.replaceChildren();
  project.sections.forEach(([heading, text]) => { const h = document.createElement('h3'); h.textContent = heading; const paragraph = document.createElement('p'); paragraph.textContent = text; body.append(h, paragraph); });
  dialog.showModal(); document.body.classList.add('modal-open'); dialog.scrollTop = 0;
 }));
 document.getElementById('close-dialog')?.addEventListener('click', () => dialog.close());
 dialog?.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus(); });
 dialog?.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
 document.getElementById('print-resume')?.addEventListener('click', () => window.print());
})();
