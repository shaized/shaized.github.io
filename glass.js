'use strict';
// Liquid Glass motion layer: pointer light, tilt, staggered reveals, header state, theme reveal.
// Every effect is decorative and stops when motion is paused or the system requests reduced motion.
(()=>{
 const root=document.documentElement;
 const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
 const motionOn=()=>root.dataset.motion!=='off';
 const SHEEN='.directory-card,.capability-card,.resource-card,.glossary-card,.kev-card,.contact-card,.security-card,.playbook-tab,.defense-model,.site-search-results>a';
 const TILT='.directory-card,.capability-card,.resource-card,.glossary-card,.contact-card,.security-card,.defense-model';

 // Staggered reveals: order within the same parent, released once the entrance finishes.
 const counts=new Map();
 document.querySelectorAll('[data-reveal]').forEach(el=>{const n=counts.get(el.parentElement)||0;counts.set(el.parentElement,n+1);el.style.setProperty('--i',String(n%6));});
 document.addEventListener('transitionend',event=>{const el=event.target;if(event.propertyName==='opacity'&&el instanceof Element&&el.matches('[data-reveal].is-visible'))el.classList.add('is-settled');});

 // Pointer light and tilt.
 let glow=null,frame=0,lastEvent=null,tilted=null;
 const clearTilt=()=>{if(tilted){tilted.style.removeProperty('--rx');tilted.style.removeProperty('--ry');tilted=null;}};
 const applyPointer=()=>{
  frame=0;const event=lastEvent;if(!event)return;
  const target=event.target instanceof Element?event.target.closest(SHEEN):null;
  if(target){
   const box=target.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
   target.style.setProperty('--mx',x.toFixed(1)+'px');target.style.setProperty('--my',y.toFixed(1)+'px');
   if(motionOn()&&target.matches(TILT)&&box.width&&box.height){
    const limit=box.width>480?2.2:4.5;
    if(tilted&&tilted!==target)clearTilt();tilted=target;
    target.style.setProperty('--ry',((x/box.width-.5)*2*limit).toFixed(2)+'deg');target.style.setProperty('--rx',((.5-y/box.height)*2*limit).toFixed(2)+'deg');
   }else clearTilt();
  }else clearTilt();
  if(glow&&motionOn()){glow.style.transform=`translate3d(${event.clientX}px,${event.clientY}px,0)`;glow.classList.add('is-on');}
 };
 if(finePointer.matches){
  glow=document.createElement('div');glow.className='cursor-glow';glow.setAttribute('aria-hidden','true');document.body.append(glow);
  document.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;lastEvent=event;if(!frame)frame=requestAnimationFrame(applyPointer);},{passive:true});
  root.addEventListener('pointerleave',()=>{glow.classList.remove('is-on');clearTilt();});
 }

 // Header state.
 let scrollPending=false;
 const updateScroll=()=>{root.classList.toggle('is-scrolled',scrollY>96);scrollPending=false;};
 addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});updateScroll();

 // Replay the short entrance when the investigation model text changes.
 ['#model-word','#model-detail'].forEach(selector=>{const el=document.querySelector(selector);if(!el)return;new MutationObserver(()=>{el.classList.remove('is-swapped');void el.offsetWidth;el.classList.add('is-swapped');}).observe(el,{childList:true,characterData:true,subtree:true});});

 // Theme change expands from the toggle. The original handler still performs the change.
 const themeButton=document.querySelector('#theme-toggle');let replaying=false;
 if(themeButton&&typeof document.startViewTransition==='function'){
  document.addEventListener('click',event=>{
   if(replaying||!motionOn()||!(event.target instanceof Element)||!themeButton.contains(event.target))return;
   event.stopPropagation();
   const box=themeButton.getBoundingClientRect(),x=box.left+box.width/2,y=box.top+box.height/2;
   root.style.setProperty('--vt-x',x+'px');root.style.setProperty('--vt-y',y+'px');root.style.setProperty('--vt-r',Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))+'px');
   root.classList.add('theme-vt');
   const done=()=>root.classList.remove('theme-vt');
   try{document.startViewTransition(()=>{replaying=true;try{themeButton.click();}finally{replaying=false;}}).finished.then(done,done);}
   catch{done();replaying=true;try{themeButton.click();}finally{replaying=false;}}
  },true);
 }
})();
