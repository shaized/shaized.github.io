'use strict';
((scope)=>{
 const normalize=value=>String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
 const safeBackTarget=(referrer,current,fallback='index.html')=>{
  try{const ref=new URL(referrer),here=new URL(current);const file=ref.pathname.split('/').pop()||'index.html';const own=here.pathname.split('/').pop()||'index.html';
   if(ref.origin!==here.origin||file===own||!/^[a-z0-9-]+\.html$/.test(file)||ref.pathname.split('/').slice(0,-1).join('/')!==here.pathname.split('/').slice(0,-1).join('/'))return fallback;
   return file;
  }catch{return fallback;}
 };
 const filterPages=(pages,query)=>{const terms=normalize(query).trim().slice(0,120).split(/\s+/).filter(Boolean);return pages.map((page,i)=>{const title=normalize(page.title),category=normalize(page.category),body=normalize(page.description+' '+page.keywords);const matches=terms.every(t=>(title+' '+category+' '+body).includes(t));const score=terms.reduce((n,t)=>n+(title.includes(t)?12:0)+(category.includes(t)?5:0)+(body.includes(t)?1:0),0);return{page,matches,score,i};}).filter(x=>x.matches).sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.page);};
 // Closest pages to a mistyped path, by edit distance on the file name and shared words.
 const distance=(a,b)=>{const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const keep=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=keep;}}return row[b.length];};
 const suggestPages=(path,pages,limit=3)=>{
  let slug='';try{slug=decodeURIComponent(String(path||''));}catch{slug=String(path||'');}
  slug=normalize(slug).split(/[?#]/)[0].split('/').filter(Boolean).pop()||'';slug=slug.replace(/\.(html?|php|aspx?)$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
  if(slug.length<2)return[];
  const words=slug.split('-').filter(w=>w.length>2);
  return pages.map((page,i)=>{const name=page.url.replace(/\.html$/,''),title=normalize(page.title);const closeness=1-distance(slug,name)/Math.max(slug.length,name.length);const shared=words.filter(w=>name.split('-').some(part=>part===w||(w.length>3&&(part.startsWith(w)||w.startsWith(part)&&part.length>3)))||title.split(/[^a-z0-9]+/).includes(w)).length;const contains=name.includes(slug)||slug.includes(name)&&name.length>3?.25:0;return{page,score:closeness+shared*.35+contains,i};}).filter(x=>x.score>=.6).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).map(x=>x.page);
 };
 const api={safeBackTarget,filterPages,suggestPages};if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.SZNavigation=api;
})(globalThis);
