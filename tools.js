'use strict';
// Analyst Toolkit interface. Everything runs in this page; pasted text is never sent anywhere.
(()=>{
 const $=id=>document.getElementById(id);
 if(!$('ioc-input')||typeof SZTools==='undefined')return;
 const root=document.documentElement;
 const motionOn=()=>root.dataset.motion!=='off';
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const dateText=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'Not supplied':new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(d);};
 const copy=async(text,status,label)=>{try{await navigator.clipboard.writeText(text);status.textContent=label+' copied to the clipboard.';}catch{status.textContent='Copying is not available here. Select the text and copy it manually.';}};
 const stagger=container=>[...container.children].forEach((child,i)=>child.style.setProperty('--i',String(Math.min(i,10))));

 // ---- Indicator extractor ----
 const GROUPS=[['urls','URLs'],['domains','Domains'],['ipv4','IPv4 addresses'],['emails','Email addresses'],['sha256','SHA-256'],['sha1','SHA-1'],['md5','MD5'],['cves','CVE IDs']];
 const DEFANGED=new Set(['urls','domains','ipv4','emails']);
 const iocInput=$('ioc-input'),iocResults=$('ioc-results'),iocStatus=$('ioc-status'),iocDefang=$('ioc-defang');
 let lastIndicators=null;
 const shown=(key,value)=>iocDefang.checked&&DEFANGED.has(key)?SZTools.defang(value):value;
 const renderIndicators=()=>{
  iocResults.replaceChildren();if(!lastIndicators)return;
  const total=GROUPS.reduce((n,[key])=>n+lastIndicators[key].length,0);
  if(!total){iocStatus.textContent='No indicators recognised. Paste text that contains addresses, domains, hashes, or CVE IDs.';return;}
  iocStatus.textContent=`${total} unique ${total===1?'indicator':'indicators'} found${iocDefang.checked?', shown defanged':''}.`;
  GROUPS.forEach(([key,label])=>{
   const values=lastIndicators[key];if(!values.length)return;
   const group=node('section',undefined,'ioc-group'),head=node('div',undefined,'ioc-group-head'),title=node('h3',label),count=node('span',String(values.length),'ioc-count'),button=node('button','Copy','text-button');
   button.type='button';button.setAttribute('aria-label','Copy '+label);button.addEventListener('click',()=>copy(values.map(v=>shown(key,v)).join('\n'),iocStatus,label));
   head.append(title,count,button);
   const list=node('ul',undefined,'ioc-list');values.slice(0,400).forEach(v=>list.append(node('li',shown(key,v))));
   if(values.length>400)list.append(node('li',`and ${values.length-400} more (included when copied)`,'ioc-more'));
   group.append(head,list);iocResults.append(group);
  });
  stagger(iocResults);
 };
 $('ioc-run').addEventListener('click',()=>{lastIndicators=SZTools.extractIndicators(iocInput.value);renderIndicators();});
 iocDefang.addEventListener('change',renderIndicators);
 $('ioc-copy-all').addEventListener('click',()=>{if(!lastIndicators){iocStatus.textContent='Extract indicators first.';return;}const lines=GROUPS.flatMap(([key,label])=>lastIndicators[key].map(v=>label+'\t'+shown(key,v)));if(!lines.length){iocStatus.textContent='There is nothing to copy yet.';return;}copy(lines.join('\n'),iocStatus,'All indicators');});
 $('ioc-clear').addEventListener('click',()=>{iocInput.value='';lastIndicators=null;iocResults.replaceChildren();iocStatus.textContent='Cleared.';iocInput.focus();});
 $('ioc-sample').addEventListener('click',()=>{iocInput.value='Fictional example. Beacon to hxxps://updates[.]northstar-cdn[.]example/login, resolving to 203.0.113[.]24.\nSender: billing[@]northstar-mail.example. Attachment SHA256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.\nAdvisory references CVE-2024-3400 and CVE-2023-4966.';$('ioc-run').click();});

 // ---- KEV check ----
 const kevInput=$('kev-input'),kevResults=$('kev-results-list'),kevStatus=$('kev-check-status');
 let catalog=null,catalogLoad=null;
 const loadCatalog=()=>{
  if(catalog)return Promise.resolve(catalog);if(catalogLoad)return catalogLoad;
  catalogLoad=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const response=await fetch(new URL('kev-catalog.json',document.querySelector('script[src*="tools.js"]').src),{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error();const data=await response.json();if(!data||!Array.isArray(data.vulnerabilities)||data.count!==data.vulnerabilities.length||!data.vulnerabilities.every(v=>v&&/^CVE-\d{4}-\d{4,}$/.test(v.cveID)&&typeof v.dateAdded==='string'))throw Error();catalog=data;return data;}finally{clearTimeout(timer);catalogLoad=null;}})();
  return catalogLoad;
 };
 $('kev-run').addEventListener('click',async()=>{
  const ids=SZTools.extractIndicators(kevInput.value).cves;kevResults.replaceChildren();
  if(!ids.length){kevStatus.textContent='No CVE IDs recognised. Use the form CVE-2024-3400.';return;}
  kevStatus.textContent='Loading the bundled catalog…';
  let data;try{data=await loadCatalog();}catch{kevStatus.textContent='The catalog could not be loaded. Try again, or search it on the Cyber News page.';return;}
  const{listed,absent}=SZTools.matchKev(ids,data);
  kevStatus.textContent=`${listed.length} of ${ids.length} ${ids.length===1?'CVE is':'CVEs are'} in the CISA KEV snapshot released ${dateText(data.dateReleased)}.`;
  listed.forEach(v=>{
   const card=node('article',undefined,'kev-hit'),top=node('div',undefined,'kev-top');
   top.append(node('span',v.cveID,'cve-label'),node('span','Added '+dateText(v.dateAdded),'kev-date'));
   const tags=node('div',undefined,'kev-tags');tags.append(node('span',v.vendorProject,'tag'),node('span',v.product,'tag'));
   if(v.knownRansomwareCampaignUse==='Known')tags.append(node('span','Known ransomware use','tag ransomware'));
   tags.append(node('span','CISA due date '+dateText(v.dueDate),'tag'));
   card.append(top,node('h3',v.vulnerabilityName),tags);kevResults.append(card);
  });
  if(absent.length){const box=node('div',undefined,'kev-absent');box.append(node('strong',`Not in this snapshot (${absent.length})`));const list=node('ul',undefined,'ioc-list');absent.forEach(id=>list.append(node('li',id)));box.append(list,node('p','Absence from KEV is not evidence that a vulnerability is safe or unexploited.','small'));kevResults.append(box);}
  stagger(kevResults);
 });
 $('kev-clear').addEventListener('click',()=>{kevInput.value='';kevResults.replaceChildren();kevStatus.textContent='Cleared.';kevInput.focus();});

 // ---- CVSS 3.1 ----
 const state={AV:'N',AC:'L',PR:'N',UI:'N',S:'U',C:'H',I:'H',A:'H'};
 const vectorInput=$('cvss-vector'),scoreEl=$('cvss-score'),severityEl=$('cvss-severity'),arc=$('cvss-arc'),gauge=$('cvss-gauge'),cvssStatus=$('cvss-status'),detail=$('cvss-detail');
 const ARC_LENGTH=2*Math.PI*52;let shownScore=0,tween=0;
 const paintScore=value=>{scoreEl.textContent=value.toFixed(1);};
 const renderCvss=fromVector=>{
  const result=SZTools.cvss31(state);if(!result)return;
  document.querySelectorAll('[data-cvss]').forEach(button=>{const[key,value]=button.dataset.cvss.split(':');button.setAttribute('aria-pressed',String(state[key]===value));});
  if(!fromVector)vectorInput.value=result.vector;
  severityEl.textContent=result.severity;gauge.dataset.severity=result.severity.toLowerCase();
  arc.style.strokeDasharray=`${(result.score/10*ARC_LENGTH).toFixed(1)} ${ARC_LENGTH.toFixed(1)}`;
  detail.textContent=`Impact ${result.impact.toFixed(1)} · Exploitability ${result.exploitability.toFixed(1)}`;
  cvssStatus.textContent=`Base score ${result.score.toFixed(1)}, ${result.severity}.`;
  cancelAnimationFrame(tween);
  if(!motionOn()){shownScore=result.score;paintScore(shownScore);return;}
  const from=shownScore,start=performance.now();
  const step=now=>{const t=Math.min(1,(now-start)/450),eased=1-Math.pow(1-t,3);shownScore=from+(result.score-from)*eased;paintScore(t===1?result.score:shownScore);if(t<1)tween=requestAnimationFrame(step);};
  tween=requestAnimationFrame(step);
 };
 document.querySelectorAll('[data-cvss]').forEach(button=>button.addEventListener('click',()=>{const[key,value]=button.dataset.cvss.split(':');state[key]=value;renderCvss(false);}));
 vectorInput.addEventListener('input',()=>{const parsed=SZTools.parseVector(vectorInput.value);if(!parsed){cvssStatus.textContent='That is not a complete CVSS 3.x base vector yet.';return;}Object.assign(state,parsed);renderCvss(true);});
 $('cvss-copy').addEventListener('click',()=>copy(SZTools.cvss31(state).vector,cvssStatus,'Vector'));
 arc.style.strokeDasharray=`0 ${ARC_LENGTH.toFixed(1)}`;requestAnimationFrame(()=>renderCvss(false));

 // ---- Time converter ----
 const timeInput=$('time-input'),timeStatus=$('time-status'),timeOut=$('time-output');
 const renderTime=()=>{
  const raw=timeInput.value.trim();timeOut.replaceChildren();
  if(!raw){timeStatus.textContent='Enter an epoch value or a date.';return;}
  const result=SZTools.parseTime(raw);
  if(!result){timeStatus.textContent='That value could not be read as a time.';return;}
  timeStatus.textContent='Read as '+result.unit+'.';
  const date=new Date(result.ms);
  const rows=[['UTC (ISO 8601)',result.iso],['Your local time',new Intl.DateTimeFormat(undefined,{dateStyle:'full',timeStyle:'long'}).format(date)],['Epoch seconds',String(result.seconds)],['Epoch milliseconds',String(result.ms)],['Relative to now',SZTools.relativeTime(result.ms,Date.now())]];
  rows.forEach(([label,value])=>{const row=node('div',undefined,'time-row'),dd=node('dd');const code=node('code',value);const button=node('button','Copy','text-button');button.type='button';button.setAttribute('aria-label','Copy '+label);button.addEventListener('click',()=>copy(value,timeStatus,label));dd.append(code,button);row.append(node('dt',label),dd);timeOut.append(row);});
  stagger(timeOut);
 };
 timeInput.addEventListener('input',renderTime);
 $('time-now').addEventListener('click',()=>{timeInput.value=String(Math.floor(Date.now()/1000));renderTime();});
})();
