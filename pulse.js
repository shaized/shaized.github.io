'use strict';
// Homepage "exploitation pulse": a small, validated summary of the bundled CISA KEV snapshot.
(()=>{
 const section=document.querySelector('#kev-pulse');if(!section)return;
 const root=document.documentElement;
 const motionOn=()=>root.dataset.motion!=='off';
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const dateText=(value,options)=>{const d=new Date(value);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...options}).format(d);};
 const status=section.querySelector('#pulse-status');
 const valid=d=>d&&Number.isInteger(d.count)&&d.count>0&&d.count<100000&&Number.isFinite(Date.parse(d.dateReleased))&&['ransomware','added30','added90','vendorCount'].every(k=>Number.isInteger(d[k])&&d[k]>=0&&d[k]<=d.count)
  &&Array.isArray(d.vendors)&&d.vendors.length<=8&&d.vendors.every(v=>v&&typeof v.name==='string'&&v.name.length<80&&Number.isInteger(v.count))
  &&Array.isArray(d.months)&&d.months.length===12&&d.months.every(m=>m&&/^\d{4}-\d{2}$/.test(m.month)&&Number.isInteger(m.count))
  &&Array.isArray(d.latest)&&d.latest.length<=6&&d.latest.every(v=>v&&/^CVE-\d{4}-\d{4,}$/.test(v.cveID)&&/^\d{4}-\d{2}-\d{2}$/.test(v.dateAdded)&&['vendor','product','name'].every(k=>typeof v[k]==='string'&&v[k].length<300));
 const countUp=(el,target)=>{
  if(!motionOn()){el.textContent=target.toLocaleString('en-GB');return;}
  const start=performance.now(),duration=1300;
  const step=now=>{const t=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-t,4);el.textContent=Math.round(target*eased).toLocaleString('en-GB');if(t<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
 };
 const render=data=>{
  const stats=[['count',data.count],['added30',data.added30],['ransomware',data.ransomware],['vendorCount',data.vendorCount]];
  stats.forEach(([key,value])=>{const el=section.querySelector(`[data-pulse="${key}"]`);if(el){el.textContent='0';el.dataset.target=String(value);}});
  const vendorList=section.querySelector('#pulse-vendors'),maxVendor=Math.max(1,...data.vendors.map(v=>v.count));
  vendorList.replaceChildren();
  data.vendors.forEach((v,i)=>{const item=node('li'),bar=node('span',undefined,'pulse-bar');item.style.setProperty('--i',String(i));bar.style.setProperty('--w',(v.count/maxVendor*100).toFixed(1)+'%');item.append(node('span',v.name,'pulse-name'),bar,node('span',v.count.toLocaleString('en-GB'),'pulse-value'));vendorList.append(item);});
  const monthList=section.querySelector('#pulse-months'),maxMonth=Math.max(1,...data.months.map(m=>m.count));
  monthList.replaceChildren();
  data.months.forEach((m,i)=>{const item=node('li'),bar=node('span',undefined,'pulse-column');item.style.setProperty('--i',String(i));bar.style.setProperty('--h',Math.max(2,m.count/maxMonth*100).toFixed(1)+'%');const label=dateText(m.month+'-01',{month:'short'});item.append(node('span',String(m.count),'pulse-value'),bar,node('span',label,'pulse-month'));item.setAttribute('aria-label',`${dateText(m.month+'-01',{month:'long',year:'numeric'})}: ${m.count} added`);monthList.append(item);});
  const note=section.querySelector('#pulse-month-note');if(note)note.textContent=`The final month is partial: it ends at the snapshot release on ${dateText(data.dateReleased,{day:'numeric',month:'long',year:'numeric'})}.`;
  const latest=section.querySelector('#pulse-latest');latest.replaceChildren();
  data.latest.slice(0,5).forEach((v,i)=>{const item=node('li');item.style.setProperty('--i',String(i));const link=node('a');link.href='news.html';const meta=node('span',undefined,'pulse-latest-meta');meta.append(node('span',v.cveID,'cve-label'),node('span',dateText(v.dateAdded,{day:'2-digit',month:'short',year:'numeric'}),'kev-date'));if(v.ransomware)meta.append(node('span','Known ransomware use','tag ransomware'));link.append(meta,node('strong',v.name));item.append(link);latest.append(item);});
  status.textContent=`Counts from the bundled CISA KEV snapshot, catalog version ${data.catalogVersion||'not supplied'}, released ${dateText(data.dateReleased,{day:'2-digit',month:'long',year:'numeric'})}.`;
  section.classList.add('is-loaded');
  const go=()=>{section.classList.add('is-live');stats.forEach(([key,value])=>{const el=section.querySelector(`[data-pulse="${key}"]`);if(el)countUp(el,value);});};
  if(motionOn()&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();go();}},{rootMargin:'0px 0px -12% 0px'});observer.observe(section.querySelector('.pulse-grid'));}else go();
 };
 (async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const response=await fetch(new URL('kev-summary.json',document.querySelector('script[src*="pulse.js"]').src),{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error();const data=await response.json();if(!valid(data))throw Error();render(data);}
  catch{status.textContent='The catalog summary is unavailable right now. The full catalog is on the Cyber News page.';}
  finally{clearTimeout(timer);}
 })();
})();
