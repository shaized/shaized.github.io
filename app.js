'use strict';
(() => {
 const root=document.documentElement;
 const safeRead=(k)=>{try{return localStorage.getItem(k);}catch{return null;}};
 const save=(k,v)=>{try{localStorage.setItem(k,v);}catch{/* Settings work for this page even if storage is unavailable. */}};
 const systemLight=matchMedia('(prefers-color-scheme: light)'),systemReduce=matchMedia('(prefers-reduced-motion: reduce)');
 let theme=['dark','light'].includes(safeRead('sz-theme'))?safeRead('sz-theme'):null;
 const defaults={size:'100',contrast:false,motion:false,links:false,spacing:false};
 let prefs={...defaults};
 try{const p=JSON.parse(safeRead('sz-access')||'{}');prefs={size:['100','115','130'].includes(p.size)?p.size:'100',contrast:p.contrast===true,motion:p.motion===true,links:p.links===true,spacing:p.spacing===true};}catch{}
 const themeButton=document.querySelector('#theme-toggle');
 const applyTheme=()=>{const t=theme||(systemLight.matches?'light':'dark');root.dataset.theme=t;themeButton?.setAttribute('aria-label',`Switch to ${t==='dark'?'light':'dark'} theme`);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',t==='dark'?'#080c14':'#f5f7fb');};
 themeButton?.addEventListener('click',()=>{theme=root.dataset.theme==='dark'?'light':'dark';save('sz-theme',theme);applyTheme();});
 systemLight.addEventListener('change',()=>{if(!theme)applyTheme();});applyTheme();
 const controls={size:document.querySelector('#text-size'),contrast:document.querySelector('#high-contrast'),motion:document.querySelector('#reduce-motion'),links:document.querySelector('#underline-links'),spacing:document.querySelector('#reading-space')};
 const applyPrefs=()=>{
  root.dataset.size=prefs.size;root.dataset.contrast=prefs.contrast?'high':'normal';root.dataset.motion=(prefs.motion||systemReduce.matches)?'off':'on';root.dataset.links=prefs.links?'underlined':'normal';root.dataset.spacing=prefs.spacing?'wide':'normal';
  for(const [key,input]of Object.entries(controls)){if(!input)continue;if(key==='size')input.value=prefs.size;else input.checked=prefs[key];}
  const note=document.querySelector('#motion-note');if(note)note.textContent=systemReduce.matches?'Your system requests reduced motion. It remains enabled regardless of this switch.':'System reduced-motion preferences are always respected.';
  if(root.dataset.motion==='off')document.querySelectorAll('video').forEach(v=>v.pause());
 };
 for(const[key,input]of Object.entries(controls))input?.addEventListener('change',()=>{prefs[key]=key==='size'?input.value:input.checked;save('sz-access',JSON.stringify(prefs));applyPrefs();});
 document.querySelector('#reset-access')?.addEventListener('click',()=>{prefs={...defaults};save('sz-access',JSON.stringify(prefs));theme=null;try{localStorage.removeItem('sz-theme');}catch{}applyPrefs();applyTheme();});
 systemReduce.addEventListener('change',applyPrefs);applyPrefs();
 const menu=document.querySelector('#menu-toggle'),nav=document.querySelector('#navigation');
 const closeMenu=()=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Open navigation');};
 menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
 nav?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'&&!document.querySelector('.nav-explore')?.open){closeMenu();menu.focus();}});
 const panel=document.querySelector('#access-panel'),opener=document.querySelector('#access-toggle');
 opener?.addEventListener('click',()=>{panel.showModal();document.body.classList.add('modal-open');});
 panel?.querySelector('[data-close-dialog]')?.addEventListener('click',()=>panel.close());
 panel?.addEventListener('close',()=>{document.body.classList.remove('modal-open');opener?.focus();});
 document.querySelectorAll('[data-demo]').forEach(demo=>{
  let step=0;const stages=[...demo.querySelectorAll('[data-demo-stage]')],tabs=[...demo.querySelectorAll('[data-demo-go]')],prev=demo.querySelector('[data-demo-prev]'),next=demo.querySelector('[data-demo-next]');
  const render=()=>{stages.forEach((el,i)=>el.hidden=i!==step);tabs.forEach((el,i)=>el.setAttribute('aria-pressed',String(i===step)));prev.disabled=step===0;next.disabled=step===stages.length-1;};
  tabs.forEach((el,i)=>el.addEventListener('click',()=>{step=i;render();}));
  prev?.addEventListener('click',()=>{step=Math.max(0,step-1);render();});next?.addEventListener('click',()=>{step=Math.min(stages.length-1,step+1);render();});
  demo.querySelector('[data-demo-reset]')?.addEventListener('click',()=>{step=0;render();tabs[0].focus();});
 });
})();
// Native details provides keyboard operation; close the navigation disclosure on dismissal.
(()=>{
 const explore=document.querySelector('.nav-explore');
 if(!explore)return;
 document.addEventListener('click',event=>{if(!explore.contains(event.target))explore.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&explore.open){explore.open=false;explore.querySelector('summary').focus();}});
})();
