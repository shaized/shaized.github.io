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

 // ---- Shared row renderer ----
 const renderRows=(container,rows,status)=>{container.replaceChildren();rows.forEach(([label,value])=>{const row=node('div',undefined,'time-row'),dd=node('dd'),button=node('button','Copy','text-button');button.type='button';button.setAttribute('aria-label','Copy '+label);button.addEventListener('click',()=>copy(String(value),status,label));dd.append(node('code',String(value)),button);row.append(node('dt',label),dd);container.append(row);});stagger(container);};

 // ---- Layered decoder ----
 const decodeInput=$('decode-input'),decodeOut=$('decode-results'),decodeStatus=$('decode-status');
 $('decode-run').addEventListener('click',()=>{
  decodeOut.replaceChildren();const steps=SZTools.decodeLayers(decodeInput.value);
  if(!steps.length){decodeStatus.textContent=decodeInput.value.trim()?'No URL, hex, or Base64 layer was recognised in that text.':'Paste an encoded string first.';return;}
  decodeStatus.textContent=`${steps.length} ${steps.length===1?'layer':'layers'} decoded.`;
  steps.forEach((step,i)=>{const item=node('li',undefined,'decode-step'),head=node('div',undefined,'ioc-group-head'),button=node('button','Copy','text-button');button.type='button';button.setAttribute('aria-label','Copy layer '+(i+1));button.addEventListener('click',()=>copy(step.output,decodeStatus,'Layer '+(i+1)));head.append(node('span',String(i+1).padStart(2,'0'),'ioc-count'),node('h3',step.kind),button);item.append(head,node('pre',step.output.slice(0,6000)+(step.output.length>6000?'\n… (truncated on screen; Copy includes everything)':'')));decodeOut.append(item);});
  const final=steps[steps.length-1].output,found=SZTools.extractIndicators(final);
  if(GROUPS.some(([key])=>found[key].length)){const send=node('button','Send the result to the indicator extractor','button ghost');send.type='button';send.addEventListener('click',()=>{iocInput.value=final;$('ioc-run').click();$('ioc-extractor').scrollIntoView({behavior:motionOn()?'smooth':'auto'});});const wrap=node('li',undefined,'decode-next');wrap.append(send);decodeOut.append(wrap);}
  stagger(decodeOut);
 });
 $('decode-sample').addEventListener('click',()=>{decodeInput.value='cG93ZXJzaGVsbCAtbm9wIC1jICJJRVgoTmV3LU9iamVjdCBOZXQuV2ViQ2xpZW50KS5Eb3dubG9hZFN0cmluZygnaHR0cDovL3VwZGF0ZXMubm9ydGhzdGFyLWNkbi5leGFtcGxlL2EnKSI=';$('decode-run').click();});
 $('decode-clear').addEventListener('click',()=>{decodeInput.value='';decodeOut.replaceChildren();decodeStatus.textContent='Cleared.';decodeInput.focus();});

 // ---- JWT reader ----
 const jwtInput=$('jwt-input'),jwtOut=$('jwt-results'),jwtStatus=$('jwt-status');
 const renderJwt=()=>{
  jwtOut.replaceChildren();const raw=jwtInput.value.trim();
  if(!raw){jwtStatus.textContent='Paste a token to read its claims.';return;}
  const result=SZTools.decodeJwt(raw);
  if(!result){jwtStatus.textContent='That does not look like a three-part JSON Web Token.';return;}
  jwtStatus.textContent=`Decoded, not verified. Algorithm: ${result.algorithm}.`;
  const block=(title,value)=>{const box=node('div',undefined,'ioc-group');box.append(node('h3',title),node('pre',JSON.stringify(value,null,2).slice(0,8000)));return box;};
  jwtOut.append(block('Header',result.header),block('Payload',result.payload));
  const labels={iat:'Issued at',nbf:'Not before',exp:'Expires',auth_time:'Authenticated at'},times=Object.entries(result.times);
  if(times.length){const box=node('div',undefined,'ioc-group'),list=node('dl',undefined,'time-output');box.append(node('h3','Times (UTC)'),list);jwtOut.append(box);renderRows(list,times.map(([key,value])=>[labels[key],value+' · '+SZTools.relativeTime(Date.parse(value),Date.now())]),jwtStatus);}
  if(result.notes.length){const box=node('div',undefined,'ioc-group tool-flags'),list=node('ul');result.notes.forEach(note=>list.append(node('li',note)));box.append(node('h3','Worth noticing'),list);jwtOut.append(box);}
  stagger(jwtOut);
 };
 jwtInput.addEventListener('input',renderJwt);
 $('jwt-clear').addEventListener('click',()=>{jwtInput.value='';renderJwt();jwtInput.focus();});

 // ---- CIDR calculator ----
 const cidrInput=$('cidr-input'),cidrIp=$('cidr-ip'),cidrOut=$('cidr-output'),cidrStatus=$('cidr-status');
 const renderCidr=()=>{
  cidrOut.replaceChildren();const raw=cidrInput.value.trim();
  if(!raw){cidrStatus.textContent='Enter a network such as 10.20.30.0/22.';return;}
  const info=SZTools.cidrInfo(raw);
  if(!info){cidrStatus.textContent='That is not a valid IPv4 address or CIDR block.';return;}
  const inside=cidrIp.value.trim()?SZTools.cidrContains(raw,cidrIp.value):undefined;
  cidrStatus.textContent=inside===undefined?`${info.scope}.`:inside===null?'The second value is not a valid IPv4 address.':`${cidrIp.value.trim()} is ${inside?'inside':'outside'} ${info.network}/${info.prefix}.`;
  renderRows(cidrOut,[['Network',info.network+'/'+info.prefix],['Range',info.first+' – '+info.last],['Broadcast',info.broadcast],['Subnet mask',info.mask],['Wildcard mask',info.wildcard],['Addresses',info.total.toLocaleString('en-GB')+' total, '+info.usable.toLocaleString('en-GB')+' usable'],['Address type',info.scope]],cidrStatus);
 };
 cidrInput.addEventListener('input',renderCidr);cidrIp.addEventListener('input',renderCidr);

 // ---- Hash calculator ----
 const hashText=$('hash-text'),hashFile=$('hash-file'),hashOut=$('hash-output'),hashStatus=$('hash-status');
 const hex=buffer=>[...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,'0')).join('');
 const digestAll=async(bytes,label)=>{
  if(!globalThis.crypto||!crypto.subtle){hashStatus.textContent='Hashing is not available in this browser context.';return;}
  hashStatus.textContent='Calculating…';
  try{const[sha256,sha1,sha512]=await Promise.all(['SHA-256','SHA-1','SHA-512'].map(name=>crypto.subtle.digest(name,bytes)));renderRows(hashOut,[['SHA-256',hex(sha256)],['SHA-1',hex(sha1)],['SHA-512',hex(sha512)]],hashStatus);hashStatus.textContent=`Hashed ${label} (${bytes.byteLength.toLocaleString('en-GB')} bytes). Nothing left this page.`;}
  catch{hashStatus.textContent='The hash could not be calculated.';}
 };
 $('hash-run').addEventListener('click',()=>{if(!hashText.value){hashStatus.textContent='Type or paste some text first, or choose a file.';return;}digestAll(new TextEncoder().encode(hashText.value),'the text as UTF-8');});
 hashFile.addEventListener('change',async()=>{const file=hashFile.files&&hashFile.files[0];if(!file)return;if(file.size>268435456){hashStatus.textContent='That file is larger than 256 MB. Use a command-line tool for large files.';return;}hashOut.replaceChildren();try{await digestAll(await file.arrayBuffer(),'the selected file');}catch{hashStatus.textContent='The file could not be read.';}});
 $('hash-clear').addEventListener('click',()=>{hashText.value='';hashFile.value='';hashOut.replaceChildren();hashStatus.textContent='Cleared.';hashText.focus();});

 // ---- Email header analyzer ----
 const mailInput=$('mail-input'),mailOut=$('mail-results'),mailStatus=$('mail-status');
 $('mail-run').addEventListener('click',()=>{
  mailOut.replaceChildren();const result=SZTools.parseEmailHeaders(mailInput.value);
  if(!result){mailStatus.textContent=mailInput.value.trim()?'No message headers were recognised. Paste the raw headers, starting at the first header line.':'Paste raw message headers first.';return;}
  mailStatus.textContent=`${result.hops.length} relay ${result.hops.length===1?'hop':'hops'} and ${result.flags.length} ${result.flags.length===1?'point':'points'} worth checking.`;
  const auth=node('div',undefined,'ioc-group'),badges=node('div',undefined,'auth-badges');
  ['spf','dkim','dmarc'].forEach(key=>{const value=result.auth[key],badge=node('span',undefined,'auth-badge');badge.dataset.result=value==='pass'?'pass':value==='not stated'?'unknown':'fail';badge.append(node('strong',key.toUpperCase()),node('span',value));badges.append(badge);});
  auth.append(node('h3','Authentication results, as recorded by the receiving server'),badges);mailOut.append(auth);
  if(result.flags.length){const box=node('div',undefined,'ioc-group tool-flags'),list=node('ul');result.flags.forEach(flag=>list.append(node('li',flag)));box.append(node('h3','Worth checking'),list);mailOut.append(box);}
  const summary=node('div',undefined,'ioc-group'),list=node('dl',undefined,'time-output');summary.append(node('h3','Message'),list);mailOut.append(summary);
  renderRows(list,[['From',result.from],['Reply-To',result.replyTo],['Return-Path',result.returnPath],['Subject',result.subject],['Date',result.date],['Message-ID',result.messageId]].filter(row=>row[1]),mailStatus);
  if(result.hops.length){const box=node('div',undefined,'ioc-group'),trail=node('ol',undefined,'hop-trail');result.hops.forEach((hop,i)=>{const item=node('li');item.style.setProperty('--i',String(Math.min(i,10)));item.append(node('strong',(hop.from||'unknown sender')+' → '+(hop.by||'unknown receiver')));const meta=[];if(hop.ip)meta.push(SZTools.defang(hop.ip));if(hop.time)meta.push(hop.time);if(hop.delaySeconds!==null)meta.push((hop.delaySeconds>=0?'+':'')+hop.delaySeconds+' s after the previous hop');item.append(node('span',meta.join(' · ')||'No address or time recorded'));trail.append(item);});box.append(node('h3','Relay path, oldest hop first'),trail);mailOut.append(box);}
  stagger(mailOut);
 });
 $('mail-sample').addEventListener('click',()=>{mailInput.value='Return-Path: <bounce@mailer.northstar-bulk.example>\nReceived: from mx.recipient.example (mx.recipient.example [198.51.100.20])\n\tby inbox.recipient.example with ESMTPS id 2; Tue, 14 Nov 2023 22:13:31 +0000\nReceived: from relay.northstar-bulk.example (relay.northstar-bulk.example [203.0.113.24])\n\tby mx.recipient.example with ESMTP id 1; Tue, 14 Nov 2023 22:13:20 +0000\nAuthentication-Results: mx.recipient.example; spf=pass smtp.mailfrom=mailer.northstar-bulk.example;\n\tdkim=fail header.d=northstar.example; dmarc=fail header.from=northstar.example\nFrom: "Accounts Team" <accounts@northstar.example>\nReply-To: payments@northstar-billing.example\nSubject: Updated bank details (fictional sample)\nDate: Tue, 14 Nov 2023 22:13:18 +0000\nMessage-ID: <sample-1@northstar.example>';$('mail-run').click();});
 $('mail-clear').addEventListener('click',()=>{mailInput.value='';mailOut.replaceChildren();mailStatus.textContent='Cleared.';mailInput.focus();});
})();
