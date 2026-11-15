'use strict';
// Step-through architecture diagrams. Without this script every caption is listed below its diagram.
(()=>{
 const root=document.documentElement;
 const motionOn=()=>root.dataset.motion!=='off';
 document.querySelectorAll('[data-blueprint]').forEach(section=>{
  const buttons=[...section.querySelectorAll('[data-bp-step]')],captions=[...section.querySelectorAll('[data-bp-caption]')],parts=[...section.querySelectorAll('.bp-svg [data-step]')],play=section.querySelector('[data-bp-play]');
  if(!buttons.length)return;
  const last=buttons.length;let current=1,timer=0,userPaused=false;
  section.classList.add('is-interactive');
  const show=step=>{
   current=step;
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.bpStep)===step)));
   captions.forEach(c=>c.hidden=Number(c.dataset.bpCaption)!==step);
   parts.forEach(p=>{const n=Number(p.dataset.step);p.classList.toggle('is-active',n===step||n===0);p.classList.toggle('is-done',n!==0&&n<step);});
  };
  const stop=()=>{clearInterval(timer);timer=0;play.setAttribute('aria-pressed','false');play.textContent='Play walkthrough';section.classList.remove('is-playing');};
  const start=()=>{if(timer)return;play.setAttribute('aria-pressed','true');play.textContent='Pause walkthrough';section.classList.add('is-playing');timer=setInterval(()=>show(current>=last?1:current+1),3400);};
  buttons.forEach(b=>b.addEventListener('click',()=>{userPaused=true;stop();show(Number(b.dataset.bpStep));}));
  play.addEventListener('click',()=>{if(timer){userPaused=true;stop();}else{userPaused=false;if(current>=last)show(1);start();}});
  show(1);
  // Play while the diagram is on screen, unless the visitor paused it or motion is off.
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&motionOn()&&!userPaused)start();else if(!entry.isIntersecting)stop();}),{threshold:.45}).observe(section.querySelector('.bp-stage'));
  new MutationObserver(()=>{if(!motionOn())stop();}).observe(root,{attributes:true,attributeFilter:['data-motion']});
 });
})();
