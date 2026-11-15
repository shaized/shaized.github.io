// Re-record the blueprint films. Run from the repository root:
//   node dev/films/record.mjs [pipeline lifecycle agent access]
// Needs Google Chrome and ffmpeg (set CHROME and FFMPEG to override the defaults). Node 22+.
import {spawn,spawnSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const keys=process.argv.slice(2).length?process.argv.slice(2):['pipeline','lifecycle','agent','access'];
const root=process.cwd(),out=process.env.OUT||root,ffmpeg=process.env.FFMPEG||'ffmpeg';
const chromePath=process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if(!fs.existsSync(path.join(root,'blueprints.html'))){console.error('Run this from the repository root.');process.exit(1);}
if(spawnSync(ffmpeg,['-version']).status!==0){console.error('ffmpeg was not found. Install it or set FFMPEG to its path.');process.exit(1);}
const work=fs.mkdtempSync(path.join(os.tmpdir(),'films-')),webPort=4181,debugPort=9395;
const server=spawn('python3',['-m','http.server',String(webPort),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--user-data-dir='+path.join(work,'profile'),'--no-first-run','--hide-scrollbars','--window-size=1280,720','--force-device-scale-factor=1','--disable-gpu','about:blank'],{stdio:'ignore'});
const stop=code=>{chrome.kill();server.kill();fs.rmSync(work,{recursive:true,force:true});process.exit(code);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let ready=false;for(let i=0;i<80&&!ready;i++){try{await fetch(`http://127.0.0.1:${debugPort}/json/version`);ready=true;}catch{await sleep(250);}}
 if(!ready)throw Error('Chrome did not start.');
 const page=(await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()).find(t=>t.type==='page');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let id=0,onFrame=null;const pending=new Map();
 ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pending.has(d.id)){pending.get(d.id)(d);pending.delete(d.id);}else if(d.method==='Page.screencastFrame'&&onFrame)onFrame(d.params);};
 const send=(method,params={})=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method,params}));});
 const evaluate=async e=>(await send('Runtime.evaluate',{expression:e,awaitPromise:true,returnByValue:true})).result?.result?.value;
 await send('Page.enable');await send('Runtime.enable');
 // The screencast records the window surface, so size the window until the page itself is exactly 1280x720.
 const {result:{windowId}}=await send('Browser.getWindowForTarget');
 for(let attempt=0,width=1280,height=720;attempt<4;attempt++){
  await send('Browser.setWindowBounds',{windowId,bounds:{width,height}});await sleep(300);
  const [w,h]=await evaluate('[innerWidth,innerHeight]');if(w===1280&&h===720)break;
  if(attempt===3)throw Error(`Could not size the page to 1280x720 (got ${w}x${h}).`);
  width+=1280-w;height+=720-h;
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});
 for(const key of keys){
  const dir=path.join(work,key);fs.mkdirSync(dir);
  await send('Page.navigate',{url:`http://127.0.0.1:${webPort}/dev/films/film.html?k=${key}`});
  let loaded=false;for(let i=0;i<50&&!loaded;i++){loaded=await evaluate('window.__ready===true');if(!loaded)await sleep(200);}
  if(!loaded)throw Error(`The stage for "${key}" did not load.`);
  await sleep(600);
  const frames=[];let start=null;
  onFrame=p=>{if(start===null){start=p.metadata.timestamp;if(process.env.DEBUG)console.log('frame metadata',JSON.stringify(p.metadata));}const file=String(frames.length).padStart(5,'0')+'.jpg';fs.writeFileSync(path.join(dir,file),Buffer.from(p.data,'base64'));frames.push({t:p.metadata.timestamp-start,file});send('Page.screencastFrameAck',{sessionId:p.sessionId});};
  await send('Page.startScreencast',{format:'jpeg',quality:94,maxWidth:1280,maxHeight:720,everyNthFrame:1});
  await evaluate(`window.__run(${Number(process.env.STEP_MS)||2900})`);
  await sleep(200);await send('Page.stopScreencast');onFrame=null;
  if(frames.length<30)throw Error(`Only ${frames.length} frames were captured for "${key}".`);
  const poster=await send('Page.captureScreenshot',{format:'webp',quality:84});fs.writeFileSync(path.join(out,`film-${key}.webp`),Buffer.from(poster.result.data,'base64'));
  const list=frames.map((f,i)=>`file '${f.file}'\nduration ${Math.max((frames[i+1]?.t??f.t+.4)-f.t,.001).toFixed(4)}`).join('\n')+`\nfile '${frames.at(-1).file}'\n`;
  fs.writeFileSync(path.join(dir,'list.txt'),list);
  const encode=spawnSync(ffmpeg,['-y','-loglevel','error','-f','concat','-safe','0','-i',path.join(dir,'list.txt'),'-vf','fps=30,scale=in_range=pc:out_range=tv,format=yuv420p','-color_range','tv','-c:v','libx264','-preset','slow','-crf','26','-profile:v','high','-level','4.0','-movflags','+faststart','-an',path.join(out,`film-${key}.mp4`)],{stdio:'inherit'});
  if(encode.status!==0)throw Error(`ffmpeg failed for "${key}".`);
  console.log(`${key}: ${frames.length} frames, ${frames.at(-1).t.toFixed(1)} s, ${(fs.statSync(path.join(out,`film-${key}.mp4`)).size/1024).toFixed(0)} KB`);
 }
 ws.close();stop(0);
}catch(error){console.error(error.message);stop(1);}
