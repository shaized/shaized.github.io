'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'site-index.json'),'utf8'));
const source=fs.readFileSync(path.join(__dirname,'navigation.js'),'utf8');
const helpers=require('./navigation-core.js');
class Element{
 constructor(){this.listeners={};this.children=[];this.attributes={};this.value='';this.open=false;this.textContent='';}
 setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k]||null;}
 addEventListener(k,fn){this.listeners[k]=fn;}append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}
 showModal(){this.open=true;}close(){this.open=false;this.listeners.close?.();}focus(){this.focused=true;}click(){this.listeners.click?.();}
}
async function setup(response=data){
 const ids=new Map();for(const id of ['site-search-dialog','site-search-toggle','close-site-search','site-search-input','site-search-results','site-search-status'])ids.set('#'+id,new Element());
 const calls=[],keys={};const opener=ids.get('#site-search-toggle');const script={src:'https://shaized.github.io/navigation.js?v=6'};
 const document={referrer:'https://elsewhere.example/',activeElement:opener,querySelector:s=>s.startsWith('script[')?script:ids.get(s)||null,createElement:()=>new Element(),body:{classList:{add(){},remove(){}}},addEventListener:(k,f)=>keys[k]=f};
 vm.runInNewContext(source,{document,location:{href:'https://shaized.github.io/nested/missing'},SZNavigation:helpers,URL,AbortController,setTimeout,clearTimeout,fetch:async(url,opts)=>{calls.push({url:String(url),opts});if(response instanceof Error)throw response;return{ok:true,json:async()=>response};}});
 opener.click();for(let i=0;i<5;i++)await new Promise(setImmediate);
 return{ids,calls,keys};
}
(async()=>{
 const live=await setup();const get=id=>live.ids.get('#'+id);assert(get('site-search-dialog').open);assert(get('site-search-input').focused);assert.equal(get('site-search-results').children.length,27);assert.equal(live.calls[0].url,'https://shaized.github.io/site-index.json');assert.equal(live.calls[0].opts.credentials,'omit');
 get('site-search-input').value='threat hunting';get('site-search-input').listeners.input();assert.equal(get('site-search-results').children[0].href,'https://shaized.github.io/agent-threat-hunting.html');assert.equal(live.calls.length,1);
 get('site-search-input').value='no-match-zzzz';get('site-search-input').listeners.input();assert.equal(get('site-search-results').children.length,0);assert.match(get('site-search-status').textContent,/No pages found/);
 get('close-site-search').click();assert(!get('site-search-dialog').open);assert(get('site-search-toggle').focused);
 let prevented=false;live.keys.keydown({metaKey:true,ctrlKey:false,key:'k',preventDefault(){prevented=true;}});assert(prevented);assert(get('site-search-dialog').open);
 for(const response of [new Error('offline'),[{url:'https://evil.example/',title:'Unsafe',description:'',category:'',keywords:''}]]){const failed=await setup(response);assert.match(failed.ids.get('#site-search-status').textContent,/unavailable/);assert.equal(failed.ids.get('#site-search-results').children.length,0);}
 console.log('PASS: dialog opening, focus return, keyboard shortcut, browser-local filtering, nested-URL assets/results, unavailable and unsafe-index fallbacks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
