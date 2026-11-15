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

 const api={refang,defang,extractIndicators,cvss31,parseVector,parseTime,relativeTime,matchKev,METRICS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.SZTools=api;
})(globalThis);
