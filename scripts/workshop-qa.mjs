import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
const root=resolve('dist');
const server=createServer((request,response)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep))throw new Error('Invalid path');if(statSync(path).isDirectory())path=resolve(path,'index.html');response.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'}[extname(path)]||'application/octet-stream'});response.end(readFileSync(path));}catch{response.writeHead(404);response.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const baseURL='http://127.0.0.1:'+server.address().port;
const fallback='/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE||(existsSync(fallback)?fallback:'playwright'));
const browser=await chromium.launch({headless:true,...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox']});
const errors=[];let checks=0;
function check(value,message){assert.ok(value,message);checks++;}
try {
 const page=await browser.newPage({viewport:{width:840,height:900}});page.on('pageerror',error=>errors.push(error.message));
 const open=async name=>page.goto(baseURL+'/learn/examples/'+name);
 const click=async(id,times=1)=>page.evaluate(({id,times})=>{for(let i=0;i<times;i++)document.getElementById(id).click();},{id,times});
 const state=()=>page.evaluate(()=>window.workshopState());
 await open('13-gold-journey.html');await click('step',7);let s=await state();
 check(s.ore===11&&s.bag===1&&s.bank===0,'gold is carried before it is banked');
 await click('return');check((await state()).bag===1,'manual return preserves cargo');await click('step',7);s=await state();
 check(s.bag===0&&s.bank===1,'one delivery deposits cargo exactly once');
 await click('step',500);s=await state();check(s.phase==='done'&&s.ore===0&&s.bag===0&&s.bank===12,'finite mine completes without lost or invented gold');
 const originalSteps=s.steps;await page.selectOption('#capacity','6');await click('step',500);s=await state();check(s.bank===12&&s.steps<originalSteps,'larger capacity reduces travel for the same resource');
 await open('14-action-clock.html');await click('attack');check((await state()).hp===40,'attack input alone does not damage');await click('step',5);check((await state()).hp===40,'windup does not damage');await click('step');s=await state();check(s.hp===30&&s.hits===1,'contact stage causes one hit');await click('attack');await click('step',20);s=await state();check(s.hp===30&&s.hits===1&&s.state==='idle','repeated action during recovery cannot double-hit');
 await click('attack');await click('move');await click('step',20);s=await state();check(s.hp===30&&s.hits===1,'moving out before contact causes a miss');
 await click('reset');await click('auto');await page.waitForTimeout(220);await click('auto');const frozen=await state();await page.waitForTimeout(220);check(JSON.stringify(await state())===JSON.stringify(frozen),'pausing demonstration freezes the action clock');
 await open('15-teamwork.html');await click('step',30);const shieldFirst=await state();await click('swap');await click('step',30);const archerFirst=await state();
 console.log('Formation comparison:',JSON.stringify({shieldFirst:{result:shieldFirst.result,round:shieldFirst.round},archerFirst:{result:archerFirst.result,round:archerFirst.round}}));
 check(shieldFirst.result==='蓝方获胜','shield in front protects the archer enough to win');check(archerFirst.round>shieldFirst.round,'exposing the same archer requires more rounds under identical rules');check(archerFirst.units.find(u=>u.team===0&&u.type==='archer').hp===0,'the exposed archer falls before the protected archer');check(archerFirst.history.length===2,'comparison history retains both trials');
 await click('clear');await page.locator('[data-add="sword"]').click({clickCount:3});s=await state();check(s.lineup.length===3,'six-gold budget recruits three swords');check(await page.locator('[data-add="sword"]').isDisabled(),'budget prevents a fourth recruit');
 const manifest=JSON.parse(readFileSync('dist/learn/examples/manifest.json','utf8'));check(manifest.length===15,'all fifteen standalone lessons are indexed');
 for(const item of manifest){await open(item.file);check(await page.locator('h1').count()===1,'standalone lesson opens: '+item.file);}
 await page.setViewportSize({width:390,height:844});for(const name of ['13-gold-journey.html','14-action-clock.html','15-teamwork.html']){await open(name);check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile lesson has no horizontal overflow: '+name);}
 check(errors.length===0,'lessons have no script errors: '+errors.join('; '));console.log(`${checks} workshop checks passed.`);
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
