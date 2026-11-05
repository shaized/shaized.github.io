'use strict';
(()=>{
 const root=document.documentElement;
 const buttons=[...document.querySelectorAll('[data-motion-control],#motion-toggle')];
 const sync=()=>{const paused=root.dataset.motion==='off';buttons.forEach(b=>{b.setAttribute('aria-pressed',String(paused));b.setAttribute('aria-label',paused?'Resume motion':'Pause motion');b.title=paused?'Resume motion':'Pause motion';if(b.hasAttribute('data-motion-control'))b.textContent=paused?'Resume animation':'Pause animation';});};
 buttons.forEach(b=>b.addEventListener('click',()=>{const input=document.querySelector('#reduce-motion');if(!input)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelector('#access-toggle')?.click();return;}input.checked=root.dataset.motion!=='off';input.dispatchEvent(new Event('change',{bubbles:true}));}));
 new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion']});sync();
 const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}});},{threshold:.08}):null;
 if(observer){document.querySelectorAll('[data-reveal],.page-hero,.capability-card,.resource-card,.learning-track,.principle').forEach(el=>{el.setAttribute('data-reveal','');observer.observe(el);});root.classList.add('motion-ready');}
 const progress=document.querySelector('#reading-progress');let pending=false;
 const updateProgress=()=>{const length=document.documentElement.scrollHeight-innerHeight;const ratio=length>0?Math.min(1,Math.max(0,scrollY/length)):0;if(progress)progress.style.transform=`scaleX(${ratio})`;pending=false;};
 window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateProgress);}},{passive:true});window.addEventListener('resize',updateProgress);updateProgress();
 const steps=[...document.querySelectorAll('[data-model-step]')];
 const content=[['SIGNAL','Start with an observation. Preserve its source, time, and uncertainty.'],['CONTEXT','Connect the affected asset, identity, and surrounding activity. Keep the source visible.'],['REVIEW','Test alternative explanations. Separate supporting evidence from assumptions and coverage gaps.'],['DECISION','Record the rationale, owner, and next step. Verify the result after an approved action.']];
 steps.forEach((button,i)=>button.addEventListener('click',()=>{steps.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));document.querySelector('#model-word').textContent=content[i][0];document.querySelector('#model-detail').textContent=content[i][1];}));
})();
