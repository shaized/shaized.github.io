'use strict';
// Page recovery: suggest the closest pages to a mistyped address. Runs only on the 404 page.
(()=>{
 const status=document.querySelector('#recover-status'),list=document.querySelector('#recover-list');
 if(!status||!list||typeof SZNavigation==='undefined')return;
 const base=document.querySelector('script[src*="recover.js"]').src;
 (async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(new URL('site-index.json',base),{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error();
   const pages=await response.json();
   if(!Array.isArray(pages)||pages.length>200||!pages.every(p=>p&&/^[a-z0-9-]+\.html$/.test(p.url)&&typeof p.title==='string'&&typeof p.description==='string'))throw Error();
   const matches=SZNavigation.suggestPages(location.pathname,pages);
   if(!matches.length){status.textContent='No close match for that address. Try the search in the navigation, or one of the pages below.';return;}
   status.textContent=matches.length===1?'Did you mean this page?':'Did you mean one of these pages?';
   matches.forEach(page=>{const a=document.createElement('a');a.href=new URL(page.url,base).href;const category=document.createElement('span');category.className='search-category';category.textContent=page.category||'Page';const title=document.createElement('strong');title.textContent=page.title;const desc=document.createElement('p');desc.textContent=page.description;a.append(category,title,desc);list.append(a);});
  }catch{status.textContent='Suggestions are unavailable right now. Use the links below.';}
  finally{clearTimeout(timer);}
 })();
})();
