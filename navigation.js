'use strict';
(()=>{
 const back=document.querySelector('[data-site-back]');
 if(back){back.href=SZNavigation.safeBackTarget(document.referrer,location.href,back.getAttribute('href'));back.setAttribute('aria-label','Back to the previous page or parent section');}
 const dialog=document.querySelector('#site-search-dialog'),open=document.querySelector('#site-search-toggle'),close=document.querySelector('#close-site-search'),input=document.querySelector('#site-search-input'),results=document.querySelector('#site-search-results'),status=document.querySelector('#site-search-status');
 if(!dialog||!open)return;
 const assetBase=document.querySelector('script[src*="navigation.js"]').src;
 let pages=null,loading=null,returnFocus=null;
 const render=()=>{
  if(!pages)return;const matches=SZNavigation.filterPages(pages,input.value);results.replaceChildren();status.textContent=matches.length?`${matches.length} ${matches.length===1?'page':'pages'} found`:'No pages found. Try a shorter term, or browse the directory below.';
  matches.forEach(page=>{const a=document.createElement('a');a.href=new URL(page.url,assetBase).href;const category=document.createElement('span');category.className='search-category';category.textContent=page.category;const title=document.createElement('strong');title.textContent=page.title;const desc=document.createElement('p');desc.textContent=page.description;a.append(category,title,desc);results.append(a);});
 };
 const load=async()=>{
  if(pages){render();return;}if(loading)return loading;
  status.textContent='Loading the page index…';
  loading=(async()=>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);try{const response=await fetch(new URL('site-index.json',assetBase),{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data)||data.length>200||!data.every(p=>p&&/^[a-z0-9-]+\.html$/.test(p.url)&&['title','description','category','keywords'].every(k=>typeof p[k]==='string'&&p[k].length<5000)))throw Error();pages=data;render();}catch{status.textContent='Search is unavailable. Use the complete page directory below.';}finally{clearTimeout(timeout);loading=null;}})();return loading;
 };
 const show=()=>{if(document.querySelector('#access-panel')?.open)return;returnFocus=document.activeElement;document.querySelector('.nav-explore')?.removeAttribute('open');const menu=document.querySelector('#menu-toggle');if(menu?.getAttribute('aria-expanded')==='true')menu.click();dialog.showModal();document.body.classList.add('modal-open');input.focus();load();};
 open.addEventListener('click',show);close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');(returnFocus||open).focus();});input.addEventListener('input',render);
 document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!dialog.open)show();else input.focus();}});
})();
