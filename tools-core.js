'use strict';
// Pure logic for the Analyst Toolkit. No DOM, no network: tested by test_tools.cjs.
((scope)=>{
 const MAX_INPUT=200000;
 const FILE_ENDINGS=new Set(['exe','dll','sys','bin','dat','tmp','log','txt','csv','json','xml','yml','yaml','conf','cfg','ini','pdf','doc','docx','xls','xlsx','ppt','pptx','rtf','png','jpg','jpeg','gif','svg','webp','ico','js','ts','css','html','htm','php','asp','aspx','jsp','py','rb','go','ps1','psm1','bat','cmd','vbs','lnk','iso','img','rar','7z','gz','tar','tgz','jar','msi','apk','pcap','evtx']);
 const unique=list=>[...new Set(list)];

 // Undo the common "defanged" notations so indicators can be recognised.
 const refang=text=>String(text||'').slice(0,MAX_INPUT)
  .replace(/h(xx|XX)p(s?)/g,(m,x,s)=>'http'+s).replace(/H(XX|xx)P(S?)/g,(m,x,s)=>'HTTP'+s)
  .replace(/\[:\/\/\]/g,'://').replace(/\[:\]/g,':')
  .replace(/\s?[\[\(\{]\s?(?:\.|dot|DOT)\s?[\]\)\}]\s?/g,'.')
  .replace(/\s?[\[\(\{]\s?(?:@|at|AT)\s?[\]\)\}]\s?/g,'@');

 // Make an indicator safe to paste into a ticket or chat without becoming a live link.
 const defang=text=>String(text||'').slice(0,MAX_INPUT)
  .replace(/http(s?):\/\//gi,(m,s)=>'hxxp'+s+'[://]')
  .replace(/@/g,'[@]')
  .replace(/\.(?=[a-z0-9-]+)/gi,'[.]');

 const validIPv4=value=>{const parts=value.split('.');return parts.length===4&&parts.every(p=>/^\d{1,3}$/.test(p)&&Number(p)<=255&&(p==='0'||!p.startsWith('0')));};

 function extractIndicators(input){
  const text=refang(input);
  const urls=unique((text.match(/\bhttps?:\/\/[^\s<>"'`\])}]+/gi)||[]).map(u=>u.replace(/[.,;:!?]+$/,'')));
  const emails=unique((text.match(/\b[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)+[a-z]{2,24}\b/gi)||[]).map(e=>e.toLowerCase()));
  const ipv4=unique((text.match(/(?<![\d.])\d{1,3}(?:\.\d{1,3}){3}(?![\d.]*\d)/g)||[]).filter(validIPv4));
  const sha256=unique((text.match(/\b[a-f0-9]{64}\b/gi)||[]).map(h=>h.toLowerCase()));
  const sha1=unique((text.match(/\b[a-f0-9]{40}\b/gi)||[]).map(h=>h.toLowerCase()));
  const md5=unique((text.match(/\b[a-f0-9]{32}\b/gi)||[]).map(h=>h.toLowerCase()));
  const cves=unique((text.match(/\bCVE-\d{4}-\d{4,7}\b/gi)||[]).map(c=>c.toUpperCase()));
  const emailHosts=new Set(emails.map(e=>e.split('@')[1]));
  const domains=unique((text.replace(/\b[a-z0-9._%+-]+@/gi,' @').match(/(?<![@\w.-])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi)||[])
   .map(d=>d.toLowerCase()).filter(d=>!FILE_ENDINGS.has(d.split('.').pop())&&!/^\d+(\.\d+)*$/.test(d))).filter(d=>!emailHosts.has(d)||urls.some(u=>u.toLowerCase().includes('//'+d)));
  return{urls,domains,ipv4,emails,sha256,sha1,md5,cves};
 }

 // CVSS v3.1 base score, following the FIRST specification (section 7 and Appendix A).
 const WEIGHTS={AV:{N:.85,A:.62,L:.55,P:.2},AC:{L:.77,H:.44},UI:{N:.85,R:.62},C:{H:.56,L:.22,N:0},I:{H:.56,L:.22,N:0},A:{H:.56,L:.22,N:0}};
 const PRIVILEGES={U:{N:.85,L:.62,H:.27},C:{N:.85,L:.68,H:.5}};
 const METRICS=['AV','AC','PR','UI','S','C','I','A'];
 const roundUp=value=>{const scaled=Math.round(value*100000);return scaled%10000===0?scaled/100000:(Math.floor(scaled/10000)+1)/10;};
 const severity=score=>score===0?'None':score<4?'Low':score<7?'Medium':score<9?'High':'Critical';

 function parseVector(vector){
  const parts=String(vector||'').trim().toUpperCase().replace(/^CVSS:3\.[01]\//,'').split('/').filter(Boolean);
  const metrics={};
  for(const part of parts){const[key,value]=part.split(':');if(!METRICS.includes(key)||value===undefined||key in metrics)return null;metrics[key]=value;}
  if(!METRICS.every(key=>key in metrics))return null;
  if(!['U','C'].includes(metrics.S)||!(metrics.PR in PRIVILEGES.U))return null;
  for(const key of['AV','AC','UI','C','I','A'])if(!(metrics[key]in WEIGHTS[key]))return null;
  return metrics;
 }
 function cvss31(input){
  const metrics=typeof input==='string'?parseVector(input):input&&parseVector(METRICS.map(k=>k+':'+input[k]).join('/'));
  if(!metrics)return null;
  const changed=metrics.S==='C';
  const iss=1-(1-WEIGHTS.C[metrics.C])*(1-WEIGHTS.I[metrics.I])*(1-WEIGHTS.A[metrics.A]);
  const impact=changed?7.52*(iss-.029)-3.25*Math.pow(iss-.02,15):6.42*iss;
  const exploitability=8.22*WEIGHTS.AV[metrics.AV]*WEIGHTS.AC[metrics.AC]*PRIVILEGES[metrics.S][metrics.PR]*WEIGHTS.UI[metrics.UI];
  const score=impact<=0?0:roundUp(Math.min(changed?1.08*(impact+exploitability):impact+exploitability,10));
  return{score,severity:severity(score),vector:'CVSS:3.1/'+METRICS.map(k=>k+':'+metrics[k]).join('/'),impact:Math.max(0,Math.round(impact*10)/10),exploitability:Math.round(exploitability*10)/10,metrics};
 }

 // Epoch values by magnitude, or a date string. Strings without a zone are read as UTC.
 function parseTime(input){
  const raw=String(input||'').trim();if(!raw||raw.length>60)return null;
  let ms,unit;
  if(/^-?\d+(\.\d+)?$/.test(raw)){
   const n=Number(raw),digits=raw.replace(/^-/,'').split('.')[0].length;
   if(digits<=11){ms=n*1000;unit='seconds';}else if(digits<=14){ms=n;unit='milliseconds';}else if(digits<=17){ms=n/1000;unit='microseconds';}else{ms=n/1e6;unit='nanoseconds';}
  }else{
   const hasZone=/(z|[+-]\d{2}:?\d{2}|\b(?:utc|gmt)\b)\s*$/i.test(raw);
   const normalised=/^\d{4}-\d{2}-\d{2}[ t]\d{2}:\d{2}/i.test(raw)?raw.replace(' ','T'):raw;
   ms=Date.parse(hasZone?normalised:(/^\d{4}-\d{2}-\d{2}$/.test(normalised)?normalised+'T00:00:00Z':normalised+(/^\d{4}-\d{2}-\d{2}T/.test(normalised)?'Z':' UTC')));unit=hasZone?'date with zone':'date read as UTC';
  }
  if(!Number.isFinite(ms)||Math.abs(ms)>8.64e15)return null;
  const date=new Date(ms);
  return{ms:Math.round(ms),seconds:Math.floor(ms/1000),iso:date.toISOString(),unit};
 }
 function relativeTime(ms,now){
  const diff=ms-now,abs=Math.abs(diff);
  const steps=[[31557600000,'year'],[2629800000,'month'],[86400000,'day'],[3600000,'hour'],[60000,'minute'],[1000,'second']];
  for(const[size,name]of steps)if(abs>=size){const n=Math.floor(abs/size);return(diff<0?'':'in ')+n+' '+name+(n===1?'':'s')+(diff<0?' ago':'');}
  return'now';
 }

 // Compare CVE IDs with a KEV catalog object.
 function matchKev(cves,catalog){
  const index=new Map((catalog&&Array.isArray(catalog.vulnerabilities)?catalog.vulnerabilities:[]).map(v=>[v.cveID,v]));
  const listed=[],absent=[];
  unique(cves.map(c=>String(c).toUpperCase())).forEach(id=>{const hit=index.get(id);if(hit)listed.push(hit);else absent.push(id);});
  listed.sort((a,b)=>b.dateAdded.localeCompare(a.dateAdded)||a.cveID.localeCompare(b.cveID));
  return{listed,absent};
 }


 // ---- Decoding helpers ----
 const bytesToText=bytes=>{
  let wide=bytes.length>=4&&bytes.length%2===0;
  if(wide){let zeros=0;for(let i=1;i<bytes.length;i+=2)if(bytes[i]===0)zeros++;wide=zeros/(bytes.length/2)>.8;}
  let text;try{text=new TextDecoder(wide?'utf-16le':'utf-8',{fatal:true}).decode(bytes);}catch{return null;}
  const chars=[...text];if(!chars.length)return null;
  const printable=chars.filter(ch=>/[\x20-\x7e\t\r\n -￿]/u.test(ch)).length;
  return printable/chars.length>=.9?{text,encoding:wide?'UTF-16LE':'UTF-8'}:null;
 };
 const base64ToBytes=value=>{
  let s=String(value||'').replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/');
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(s))return null;
  s=s.replace(/=+$/,'');if(s.length%4===1)return null;s+='='.repeat((4-s.length%4)%4);
  try{return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}catch{return null;}
 };
 // Peel URL encoding, hex, and Base64 (UTF-8 or UTF-16LE, as used by PowerShell) one layer at a time.
 function decodeLayers(input){
  let current=String(input||'').slice(0,MAX_INPUT).trim();const steps=[];
  for(let i=0;i<6&&current;i++){
   let next=null,kind=null;
   if(/%[0-9a-f]{2}/i.test(current)){try{const decoded=decodeURIComponent(current);if(decoded!==current){next=decoded;kind='URL encoding';}}catch{}}
   if(next===null){const hex=current.replace(/0x|\\x|[\s:,-]/gi,'');if(/^[0-9a-f]+$/i.test(hex)&&hex.length>=8&&hex.length%2===0){const r=bytesToText(Uint8Array.from(hex.match(/../g),h=>parseInt(h,16)));if(r){next=r.text;kind='Hex ('+r.encoding+')';}}}
   if(next===null){const compact=current.replace(/\s+/g,'');if(compact.length>=8){const bytes=base64ToBytes(compact);if(bytes){const r=bytesToText(bytes);if(r){next=r.text;kind='Base64 ('+r.encoding+')';}}}}
   if(next===null||next.trim()===current)break;
   steps.push({kind,output:next});current=next.trim();
  }
  return steps;
 }

 // Read a JSON Web Token. This decodes only: it never verifies the signature.
 function decodeJwt(token,nowMs){
  const parts=String(token||'').trim().replace(/^Bearer\s+/i,'').split('.');
  if(parts.length!==3)return null;
  const read=part=>{const bytes=base64ToBytes(part);if(!bytes)return null;try{const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}catch{return null;}};
  const header=read(parts[0]),payload=read(parts[1]);if(!header||!payload)return null;
  const now=Number.isFinite(nowMs)?nowMs:Date.now(),times={},notes=[];
  for(const key of['iat','nbf','exp','auth_time'])if(Number.isFinite(payload[key])&&Math.abs(payload[key]*1000)<8.64e15)times[key]=new Date(payload[key]*1000).toISOString();
  const algorithm=typeof header.alg==='string'&&header.alg?header.alg:'not stated';
  if(algorithm==='not stated'||algorithm.toLowerCase()==='none')notes.push('The algorithm is "none" or missing: this token is unsigned.');
  if(!parts[2])notes.push('There is no signature segment.');
  if(/^HS/i.test(algorithm))notes.push('Symmetric signing: anyone who holds the shared secret can create valid tokens.');
  if(!('exp'in payload))notes.push('There is no expiry claim.');else if(times.exp&&payload.exp*1000<now)notes.push('The token has expired.');
  if(times.nbf&&payload.nbf*1000>now)notes.push('The token is not valid yet.');
  return{header,payload,times,notes,algorithm,signaturePresent:Boolean(parts[2])};
 }

 // ---- IPv4 networks ----
 const ipToInt=ip=>validIPv4(ip)?ip.split('.').reduce((n,p)=>n*256+Number(p),0):null;
 const intToIp=n=>[Math.floor(n/16777216)%256,Math.floor(n/65536)%256,Math.floor(n/256)%256,n%256].join('.');
 const RANGES=[['10.0.0.0',8,'Private (RFC 1918)'],['172.16.0.0',12,'Private (RFC 1918)'],['192.168.0.0',16,'Private (RFC 1918)'],['127.0.0.0',8,'Loopback'],['169.254.0.0',16,'Link-local'],['100.64.0.0',10,'Shared address space (carrier-grade NAT)'],['192.0.2.0',24,'Documentation (TEST-NET-1)'],['198.51.100.0',24,'Documentation (TEST-NET-2)'],['203.0.113.0',24,'Documentation (TEST-NET-3)'],['0.0.0.0',8,'"This network"'],['224.0.0.0',4,'Multicast'],['240.0.0.0',4,'Reserved']];
 const scopeOf=value=>{for(const[base,prefix,label]of RANGES){const size=2**(32-prefix),start=ipToInt(base);if(value>=start&&value<start+size)return label;}return'Public (globally routable)';};
 function cidrInfo(input){
  const m=String(input||'').trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\s*\/\s*(\d{1,2}))?$/);if(!m)return null;
  const ip=ipToInt(m[1]),prefix=m[2]===undefined?32:Number(m[2]);if(ip===null||prefix>32)return null;
  const total=2**(32-prefix),network=Math.floor(ip/total)*total,broadcast=network+total-1,small=prefix>=31;
  return{address:m[1],prefix,network:intToIp(network),broadcast:intToIp(broadcast),first:intToIp(small?network:network+1),last:intToIp(small?broadcast:broadcast-1),mask:intToIp(2**32-total),wildcard:intToIp(total-1),total,usable:small?total:total-2,scope:scopeOf(ip),start:network,end:broadcast};
 }
 const cidrContains=(cidr,ip)=>{const info=cidrInfo(cidr),value=ipToInt(String(ip||'').trim());return info&&value!==null?value>=info.start&&value<=info.end:null;};

 // ---- Email headers ----
 function parseEmailHeaders(raw){
  const text=String(raw||'').slice(0,MAX_INPUT).replace(/\r\n?/g,'\n').replace(/^\s+/,'');
  const unfolded=text.split(/\n\n/)[0].replace(/\n[ \t]+/g,' '),headers=[];
  for(const line of unfolded.split('\n')){const m=line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);if(m)headers.push([m[1].toLowerCase(),m[2].trim()]);}
  if(headers.length<2)return null;
  const first=name=>(headers.find(h=>h[0]===name)||[])[1]||'',all=name=>headers.filter(h=>h[0]===name).map(h=>h[1]);
  const address=value=>{const m=value.match(/<([^<>\s]+@[^<>\s]+)>/)||value.match(/([^\s<>"]+@[^\s<>"]+)/);return m?m[1].toLowerCase():'';};
  const domain=value=>address(value).split('@')[1]||'';
  const related=(a,b)=>a===b||a.endsWith('.'+b)||b.endsWith('.'+a);
  const results=all('authentication-results').join(' ; '),auth={};
  for(const mechanism of['spf','dkim','dmarc']){const m=results.match(new RegExp('\\b'+mechanism+'=([a-z]+)','i'));auth[mechanism]=m?m[1].toLowerCase():'not stated';}
  if(auth.spf==='not stated'){const m=first('received-spf').match(/^([a-z]+)/i);if(m)auth.spf=m[1].toLowerCase();}
  const hops=all('received').reverse().map(value=>{
   const from=(value.match(/\bfrom\s+([^\s;()]+)/i)||[])[1]||'',by=(value.match(/\bby\s+([^\s;()]+)/i)||[])[1]||'';
   const ip=(value.match(/[\[(](\d{1,3}(?:\.\d{1,3}){3})[\])]/)||[])[1]||'',stamp=Date.parse(value.slice(value.lastIndexOf(';')+1).replace(/\([^)]*\)/g,'').trim());
   return{from,by,ip:validIPv4(ip)?ip:'',time:Number.isFinite(stamp)?new Date(stamp).toISOString():''};
  });
  hops.forEach((hop,i)=>{const previous=hops[i-1];hop.delaySeconds=i&&hop.time&&previous.time?Math.round((Date.parse(hop.time)-Date.parse(previous.time))/1000):null;});
  const fromDomain=domain(first('from')),replyDomain=domain(first('reply-to')),returnDomain=domain(first('return-path')),flags=[];
  if(replyDomain&&fromDomain&&!related(replyDomain,fromDomain))flags.push(`Reply-To domain (${replyDomain}) differs from the From domain (${fromDomain}).`);
  if(returnDomain&&fromDomain&&!related(returnDomain,fromDomain))flags.push(`Return-Path domain (${returnDomain}) differs from the From domain (${fromDomain}). This is common for bulk mail services and worth checking for direct mail.`);
  for(const mechanism of['spf','dkim','dmarc'])if(['fail','softfail','permerror','temperror','none'].includes(auth[mechanism]))flags.push(`${mechanism.toUpperCase()} result is "${auth[mechanism]}".`);
  if(!results)flags.push('No Authentication-Results header was found, so SPF, DKIM, and DMARC outcomes are unknown.');
  return{from:first('from'),fromAddress:address(first('from')),replyTo:first('reply-to'),returnPath:first('return-path'),subject:first('subject'),date:first('date'),messageId:first('message-id'),auth,hops,flags};
 }

 const api={refang,defang,extractIndicators,cvss31,parseVector,parseTime,relativeTime,matchKev,METRICS,decodeLayers,decodeJwt,cidrInfo,cidrContains,parseEmailHeaders};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.SZTools=api;
})(globalThis);
