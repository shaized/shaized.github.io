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
 const api={safeBackTarget,filterPages};if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.SZNavigation=api;
})(globalThis);
