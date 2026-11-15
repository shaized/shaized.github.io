// Film stage: reads one diagram straight from blueprints.html so the film can never drift from the page.
(async()=>{
 const key=new URLSearchParams(location.search).get('k');
 const page=new DOMParser().parseFromString(await (await fetch('../../blueprints.html')).text(),'text/html');
 const section=page.querySelector('#blueprint-'+key);if(!section){document.title='missing diagram';return;}
 const title=section.querySelector('h2').textContent,steps=[...section.querySelectorAll('[data-bp-caption]')].map(li=>[li.querySelector('strong').textContent,li.querySelector('span').textContent]);
 document.querySelector('#eyebrow').textContent=section.querySelector('.eyebrow').textContent;document.querySelector('#title').textContent=title;
 document.querySelector('#total').textContent=String(steps.length).padStart(2,'0');
 const stage=document.querySelector('#stage');stage.append(document.importNode(section.querySelector('.bp-svg'),true));
 const parts=[...stage.querySelectorAll('[data-step]')],dots=document.querySelector('#dots'),cap=document.querySelector('.cap');
 steps.forEach(()=>dots.append(document.createElement('b')));
 const caption=(heading,text)=>{document.querySelector('#cap-title').textContent=heading;document.querySelector('#cap-text').textContent=text;cap.classList.remove('swap');void cap.offsetWidth;cap.classList.add('swap');};
 const show=step=>{
  parts.forEach(p=>{const n=Number(p.dataset.step);p.classList.toggle('is-active',n===step||n===0||step===99);p.classList.toggle('is-done',n!==0&&n<step);});
  [...dots.children].forEach((b,i)=>b.classList.toggle('on',i<step));
  if(step>=1&&step<=steps.length){document.querySelector('#num').textContent=String(step).padStart(2,'0');caption(...steps[step-1]);}
  if(step===99)caption(title,'Step through the interactive diagram at shaized.github.io/blueprints.html');
 };
 document.querySelector('#cap-title').textContent=title;document.querySelector('#cap-text').textContent=`A ${steps.length}-step walkthrough.`;
 show(0);await document.fonts.ready;window.__ready=true;
 window.__run=async stepMs=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(1300);for(let i=1;i<=steps.length;i++){show(i);await wait(stepMs);}show(99);await wait(2200);return true;};
})();
