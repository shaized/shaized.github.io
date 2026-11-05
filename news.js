'use strict';
(() => {
 const $=id=>document.getElementById(id);
 if(!$('kev-results'))return;
 const SOURCE='https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json';
 const PAGE_SIZE=12;
 let catalog=null,currentPage=1,loading=false;
 const dateText=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'Not supplied':new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(d);};
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v));
 function validate(raw){
  if(!raw||!Array.isArray(raw.vulnerabilities)||!raw.vulnerabilities.length||raw.vulnerabilities.length>15000||raw.count!==raw.vulnerabilities.length||!Number.isFinite(Date.parse(raw.dateReleased)))throw Error('Unexpected catalog structure');
  const ids=new Set();
  for(const v of raw.vulnerabilities){
   if(!v||typeof v.cveID!=='string'||!/^CVE-\d{4}-\d{4,}$/.test(v.cveID)||ids.has(v.cveID)||!validDate(v.dateAdded)||!validDate(v.dueDate)||!['vendorProject','product','vulnerabilityName','shortDescription','requiredAction','knownRansomwareCampaignUse'].every(k=>typeof v[k]==='string'))throw Error('Unexpected catalog record');
   ids.add(v.cveID);
  }return raw;
 }
 async function fetchCatalog(url){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-cache'});if(!response.ok)throw Error('Catalog unavailable');return validate(await response.json());}finally{clearTimeout(timer);}
 }
 function applyCatalog(data,live){
  // A later network response must not replace a newer bundled release with older data.
  if(catalog&&Date.parse(data.dateReleased)<Date.parse(catalog.dateReleased)){ $('feed-state').textContent='Using the newer bundled snapshot';$('feed-detail').textContent='The remote mirror returned an older release. Bundled catalog released '+dateText(catalog.dateReleased)+'.';return;}
  catalog=data;
  const oldVendor=$('vendor-filter').value;
  const options=[node('option','All vendors')];options[0].value='';
  [...new Set(data.vulnerabilities.map(v=>v.vendorProject))].sort((a,b)=>a.localeCompare(b)).forEach(v=>{const o=node('option',v);o.value=v;options.push(o);});
  $('vendor-filter').replaceChildren(...options);if(options.some(o=>o.value===oldVendor))$('vendor-filter').value=oldVendor;
  $('catalog-count').textContent=data.vulnerabilities.length.toLocaleString();
  $('ransomware-count').textContent=data.vulnerabilities.filter(v=>v.knownRansomwareCampaignUse==='Known').length.toLocaleString();
  const latest=data.vulnerabilities.reduce((max,v)=>v.dateAdded>max?v.dateAdded:max,'');$('latest-date').textContent=dateText(latest);
  $('feed-state').textContent=live?'Official feed retrieved':'Bundled snapshot available';
  $('feed-detail').textContent='Catalog release: '+dateText(data.dateReleased)+' · Version '+String(data.catalogVersion||'not supplied')+(live?' · Checked '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'.':' · Attempting the official mirror…');
  currentPage=1;render();
 }
 function linksFromNotes(text){
  const urls=(String(text||'').match(/https:\/\/[^\s<>";]+/g)||[]);const seen=new Set(),out=[];
  for(const raw of urls){try{const u=new URL(raw.replace(/[),.]+$/,''));if(u.protocol!=='https:'||u.username||u.password||seen.has(u.href))continue;seen.add(u.href);out.push(u);}catch{}}
  return out.slice(0,16);
 }
 function renderCard(v){
  const card=node('article',undefined,'kev-card'),top=node('div',undefined,'kev-top');
  top.append(node('span',v.cveID,'cve-label'),node('span','Added '+dateText(v.dateAdded),'kev-date'));
  const title=node('h2',v.vulnerabilityName),description=node('p',v.shortDescription),tags=node('div',undefined,'kev-tags');
  tags.append(node('span',v.vendorProject,'tag'),node('span',v.product,'tag'));
  if(v.knownRansomwareCampaignUse==='Known')tags.append(node('span','Known ransomware use','tag ransomware'));
  const details=node('details'),summary=node('summary','Actions, dates & source references');details.append(summary);
  details.append(node('h3','CISA required action'),node('p',v.requiredAction));
  details.append(node('h3','CISA due date'),node('p',dateText(v.dueDate)+' — source-listed date; applicability depends on your obligations and environment.'));
  details.append(node('h3','Ransomware campaign use'),node('p',v.knownRansomwareCampaignUse==='Known'?'Known, according to CISA.':'Unknown in CISA’s catalog. This is not evidence of no ransomware use.'));
  if(typeof v.forensicTriage==='string')details.append(node('h3','CISA forensic triage field'),node('p',v.forensicTriage));
  const refs=linksFromNotes(v.notes);if(refs.length){details.append(node('h3','References supplied by CISA'));const list=node('ul');refs.forEach(u=>{const li=node('li'),link=node('a',u.hostname);link.href=u.href;link.rel='noopener noreferrer';li.append(link);list.append(li);});details.append(list);}
  const nvd=node('a','View CVE at NVD ↗','source-link');nvd.href='https://nvd.nist.gov/vuln/detail/'+encodeURIComponent(v.cveID);nvd.rel='noopener noreferrer';
  card.append(top,title,description,tags,details,nvd);return card;
 }
 function filtered(){
  const term=$('kev-search').value.trim().toLowerCase(),vendor=$('vendor-filter').value,days=$('date-filter').value,onlyRansomware=$('ransomware-filter').checked;
  const now=new Date();const today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());const cutoff=days==='all'?null:today-(Number(days)-1)*86400000;
  const list=catalog.vulnerabilities.filter(v=>(!term||[v.cveID,v.vendorProject,v.product,v.vulnerabilityName,v.shortDescription].join(' ').toLowerCase().includes(term))&&(!vendor||v.vendorProject===vendor)&&(!onlyRansomware||v.knownRansomwareCampaignUse==='Known')&&(cutoff===null||Date.parse(v.dateAdded)>=cutoff));
  const sort=$('sort-filter').value;list.sort((a,b)=>sort==='vendor'?a.vendorProject.localeCompare(b.vendorProject)||b.dateAdded.localeCompare(a.dateAdded):sort==='old'?a.dateAdded.localeCompare(b.dateAdded)||a.cveID.localeCompare(b.cveID):b.dateAdded.localeCompare(a.dateAdded)||a.cveID.localeCompare(b.cveID));return list;
 }
 function render(){
  if(!catalog)return;const list=filtered(),pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));currentPage=Math.min(currentPage,pages);
  const start=(currentPage-1)*PAGE_SIZE,end=Math.min(start+PAGE_SIZE,list.length);$('kev-results').replaceChildren(...list.slice(start,end).map(renderCard));
  if(!list.length){const empty=node('div',undefined,'empty-state');empty.append(node('h2','No matches in this catalog.'),node('p','Try another keyword, expand the date range, or clear the filters.'));$('kev-results').append(empty);}
  $('catalog-results').textContent=list.length?`${list.length.toLocaleString()} matching ${list.length===1?'entry':'entries'} · Showing ${start+1}–${end}`:'0 matching entries';
  $('page-status').textContent=`Page ${currentPage} of ${pages}`;$('kev-prev').disabled=currentPage<=1;$('kev-next').disabled=currentPage>=pages;
 }
 function go(delta){currentPage+=delta;render();$('catalog-results').tabIndex=-1;$('catalog-results').focus({preventScroll:true});$('catalog-results').scrollIntoView({block:'start',behavior:document.documentElement.dataset.motion==='off'?'instant':'smooth'});}
 let searchTimer;
 $('kev-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{currentPage=1;render();},180);});
 ['vendor-filter','date-filter','sort-filter','ransomware-filter'].forEach(id=>$(id).addEventListener('change',()=>{currentPage=1;render();}));
 $('clear-filters').addEventListener('click',()=>{$('kev-search').value='';$('vendor-filter').value='';$('date-filter').value='all';$('sort-filter').value='new';$('ransomware-filter').checked=false;currentPage=1;render();});
 $('kev-prev').addEventListener('click',()=>go(-1));$('kev-next').addEventListener('click',()=>go(1));
 async function refresh(){
  if(loading)return;loading=true;$('refresh-feed').disabled=true;$('feed-state').textContent='Checking the official feed…';
  try{applyCatalog(await fetchCatalog(SOURCE),true);}catch{
   if(catalog){$('feed-state').textContent='Live feed unavailable · snapshot shown';$('feed-detail').textContent='Catalog release: '+dateText(catalog.dateReleased)+'. Check the official source for newer updates.';}
   else{$('feed-state').textContent='Catalog could not be loaded';$('feed-detail').textContent='Try Refresh or use the official CISA catalog link below.';$('catalog-results').textContent='No data loaded. The catalog may be temporarily unavailable.';}
  }finally{loading=false;$('refresh-feed').disabled=false;}
 }
 $('refresh-feed').addEventListener('click',refresh);
 (async()=>{try{applyCatalog(await fetchCatalog('kev-catalog.json'),false);}catch{}await refresh();})();
})();
