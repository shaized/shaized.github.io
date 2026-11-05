'use strict';
(()=>{
 const panels=[...document.querySelectorAll('[data-playbook-panel]')];
 const choices=[...document.querySelectorAll('[data-playbook-choice]')];
 const showPlaybook=slug=>{if(!panels.some(p=>p.dataset.playbookPanel===slug))return;panels.forEach(p=>p.hidden=p.dataset.playbookPanel!==slug);choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.playbookChoice===slug)));};
 const chooseFromHash=()=>{const id=location.hash.slice(1);const match=panels.find(p=>p.id===id);showPlaybook(match?match.dataset.playbookPanel:panels[0]?.dataset.playbookPanel);};
 if(panels.length){chooseFromHash();window.addEventListener('hashchange',chooseFromHash);}
 choices.forEach(b=>b.addEventListener('click',()=>{showPlaybook(b.dataset.playbookChoice);history.replaceState(null,'','#playbook-'+b.dataset.playbookChoice);}));
 panels.forEach(panel=>{const checks=[...panel.querySelectorAll('[data-playbook-check]')],status=panel.querySelector('[data-playbook-progress]');const update=()=>{status.textContent=`${checks.filter(c=>c.checked).length} of ${checks.length} review steps checked`;};checks.forEach(c=>c.addEventListener('change',update));panel.querySelector('[data-playbook-reset]').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);update();});});
 const terms=[...document.querySelectorAll('[data-term-category]')],filters=[...document.querySelectorAll('[data-glossary-filter]')],search=document.querySelector('#glossary-search');
 let category='all';
 const filterTerms=()=>{const term=(search?.value||'').trim().toLowerCase();let shown=0;terms.forEach(card=>{const match=(category==='all'||card.dataset.termCategory===category)&&card.dataset.termSearch.toLowerCase().includes(term);card.hidden=!match;if(match)shown++;});const status=document.querySelector('#glossary-status');if(status)status.textContent=`${shown} ${shown===1?'term':'terms'} shown`;const empty=document.querySelector('#glossary-empty');if(empty)empty.hidden=shown!==0;};
 filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.glossaryFilter;filters.forEach(f=>f.setAttribute('aria-pressed',String(f===b)));filterTerms();}));
 search?.addEventListener('input',filterTerms);
 document.querySelector('#reset-glossary')?.addEventListener('click',()=>{category='all';search.value='';filters.forEach(f=>f.setAttribute('aria-pressed',String(f.dataset.glossaryFilter==='all')));filterTerms();search.focus();});
})();
