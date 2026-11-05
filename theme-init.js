'use strict';
// Apply validated preferences before the stylesheet paints a page transition.
(()=>{
 const r=document.documentElement;
 const read=k=>{try{return localStorage.getItem(k);}catch{return null;}};
 const saved=read('sz-theme');
 r.dataset.theme=['dark','light'].includes(saved)?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
 let p={};try{p=JSON.parse(read('sz-access')||'{}')||{};}catch{}
 r.dataset.size=['100','115','130'].includes(p.size)?p.size:'100';
 r.dataset.contrast=p.contrast===true?'high':'normal';
 r.dataset.motion=(p.motion===true||matchMedia('(prefers-reduced-motion: reduce)').matches)?'off':'on';
 r.dataset.links=p.links===true?'underlined':'normal';
 r.dataset.spacing=p.spacing===true?'wide':'normal';
})();
