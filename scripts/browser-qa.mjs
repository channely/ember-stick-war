/** Browser acceptance for v0.3.0.
 * Real pointer/keyboard/CDP touch drives every interaction. Engine snapshots only
 * arrange isolated starting scenarios; they do not substitute for campaign tests.
 */
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const bundled='/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||(existsSync(bundled)?bundled:'playwright'));
const {Battle}=await import('../dist/engine.js');
const {freshProgress,SAVE_KEY,LEGACY_SAVE_KEY}=await import('../dist/progress.js');
const {LEVELS,SKINS}=await import('../dist/content.js');
const base=(process.env.BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const shots=resolve(process.env.QA_ARTIFACTS||'artifacts/browser-v03');mkdirSync(shots,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
const scenarioFilter=process.env.QA_FILTER?new RegExp(process.env.QA_FILTER):null;
const checks=[],scenarioErrors=[],pageErrors=[],failedRequests=[],contexts=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
function watch(page){page.on('pageerror',e=>pageErrors.push({url:page.url(),message:e.message}));page.on('response',r=>{if(r.status()>=400)failedRequests.push(`${r.status()} ${r.url()}`);});}
async function createPage({width=1440,height=900,touch=false,save=null,legacy=null}={}){
 const entries=[];if(save)entries.push({name:SAVE_KEY,value:JSON.stringify(save)});if(legacy)entries.push({name:LEGACY_SAVE_KEY,value:JSON.stringify(legacy)});
 const context=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,storageState:{cookies:[],origins:entries.length?[{origin:base,localStorage:entries}]:[]}});contexts.push(context);context.setDefaultTimeout(7000);
 const page=await context.newPage();watch(page);await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.locator('[data-unit="miner"]').waitFor();return {context,page};
}
async function run(name,fn){
 if(scenarioFilter&&!scenarioFilter.test(name))return;
 const initial=contexts.length;
 try{await fn();}catch(e){
  scenarioErrors.push({scenario:name,error:e.stack||e.message});console.error(`${name}: ${e.message}`);
  const page=contexts.at(-1)?.pages().at(-1);if(page)await page.screenshot({path:`${shots}/failure-${name.replace(/[^a-z0-9]+/gi,'-')}.png`}).catch(()=>{});
 }finally{for(const context of contexts.slice(initial))await context.close();}
}
async function snap(page){return page.evaluate(key=>{window.dispatchEvent(new Event('pagehide'));return JSON.parse(localStorage.getItem(key));},SAVE_KEY);}
async function untilSnapshot(page,predicate,timeout=6000){
 const deadline=Date.now()+timeout;let value;do{value=await snap(page);if(predicate(value))return value;await page.waitForTimeout(80);}while(Date.now()<deadline);return value;
}
async function closeModal(page){const close=page.locator('.modal-close');if(await close.isVisible())await close.click();}
async function resume(page){const button=page.locator('#pause-cover [data-action="pause"]');if(await button.isVisible())await button.click();else if(await page.locator('[data-action="start"]').isVisible())await page.locator('[data-action="start"]').click();}
async function practice(page,type){await closeModal(page);await page.locator('[data-action="practice"]').first().click();await page.locator(`[data-practice="${type}"]`).click();await resume(page);}
function fixture(type,{skin='classic',assisted=false,cargo=0}={}){
 const save=freshProgress();save.unlocked=29;save.assistedUnlocked=29;save.family=assisted;
 const b=new Battle({level:11,practice:type,assisted,seed:31,loadout:{[type]:skin}});
 // Fixtures use normal constructor/spawn/snapshot APIs. No fixture declares victory.
 const u=b.units.find(u=>u.team===0&&u.type===type);if(u){u.cargo=cargo;u.skin=skin;}
 b.start();save.selectedLevel=11;save.selectedLevelId=LEVELS[11].id;save.checkpoint=b.snapshot();return save;
}
async function clickUnit(page,type,{head=false}={}){
 const saved=await snap(page),u=saved.checkpoint.units.find(u=>u.team===0&&u.type===type&&!u.hidden&&u.hp>0);assert.ok(u,`fixture contains ${type}`);
 const box=await page.locator('#battlefield').boundingBox();const scale=Math.max(.33,Math.min(1.08,box.width<640?.72:box.width/1050,box.height/290));
 const camera=saved.checkpoint.selected?Math.max(0,Math.min(Math.max(0,2700-box.width/scale),u.x-(box.width/scale)*.45)):0;
 const size=(u.type==='giant'?1.65:1)*(u.boss?1.22:1);const x=box.x+(u.x-camera)*scale,y=box.y+box.height*.72+(u.lane-(head?63:39)*size)*scale;
 await page.mouse.click(x,y);await page.waitForTimeout(100);return u.id;
}
async function visibleOnScreen(page,selectors,label){
 const boxes=await page.evaluate(list=>list.map(selector=>{const e=document.querySelector(selector),r=e?.getBoundingClientRect();return {selector,ok:!!r&&r.width>0&&r.height>0&&r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};}),selectors);
 check(`${label}: battle and controls share viewport`,boxes.every(x=>x.ok));
 check(`${label}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
}
async function holdKey(page,key,ms=350){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);}
async function touchMove(context,page,{attack=false}={}){
 const cd=await context.newCDPSession(page),stick=await page.locator('#move-stick').boundingBox();assert.ok(stick,'visible movement stick');
 const center={x:stick.x+stick.width/2,y:stick.y+stick.height/2,id:1};
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[center]});
 const moving={...center,x:center.x+stick.width*.3};await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[moving]});
 if(attack){const box=await page.locator('#primary-action').boundingBox();const button={x:box.x+box.width/2,y:box.y+box.height/2,id:2};await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[moving,button]});}
 await page.waitForTimeout(850);const during=await snap(page);await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cd.detach();return during;
}
try{
 await run('desktop first battle, army commands, training and save',async()=>{
  const {page}=await createPage();check('six recruit cards',await page.locator('[data-unit]').count()===6);check('six spell slots',await page.locator('[data-use-item]').count()===6);
  await page.screenshot({path:`${shots}/desktop-ready.png`,fullPage:true});
  await resume(page);await page.locator('[data-unit="sword"]').click();const s=await snap(page);check('recruitment enters actual training queue',s.checkpoint.queue.some(q=>q.type==='sword'));
  await page.locator('#queue-indicator').click();check('training queue opens',await page.locator('.queue-row').count()>=1);await page.locator('[data-cancel-training]').last().click();await closeModal(page);check('cancel removes real queued recruit',(await snap(page)).checkpoint.queue.length===0);
  for(const order of ['attack','garrison','defend']){await page.locator(`[data-command="${order}"]`).click();check(`${order} command changes engine order`,(await snap(page)).checkpoint.order===order);}
  await page.locator('[data-use-item="mining"]').click();const after=await snap(page);check('spell consumes exactly one inventory item',after.inventory.mining===freshProgress().inventory.mining-1);await page.locator('[data-use-item="mining"]').click();check('shared cooldown prevents duplicate spell consumption',(await snap(page)).inventory.mining===after.inventory.mining);
  await page.locator('#pause-button').click();const time=(await snap(page)).checkpoint.time;await page.waitForTimeout(250);check('pause freezes simulation',(await snap(page)).checkpoint.time===time);
  await page.reload({waitUntil:'networkidle'});check('saved battle restores paused',await page.locator('#pause-cover').isVisible());check('saved spell inventory persists',(await snap(page)).inventory.mining===after.inventory.mining);
  await page.locator('[data-action="fullscreen"]').click();check('fullscreen enters',await page.evaluate(()=>!!document.fullscreenElement));await page.locator('[data-action="help"]').first().click();check('help dialog works in fullscreen',await page.locator('.modal').isVisible());await closeModal(page);await page.evaluate(()=>document.exitFullscreen());
 });
 await run('camp, skins, upgrades and campaign map',async()=>{
  const save=freshProgress();save.gems=20;save.upgradePoints=4;save.unlocked=9;const {page}=await createPage({save});
  await page.locator('[data-action="armory"]').first().click();await page.locator('[data-armory-tab="skins"]').click();await page.locator('[data-wardrobe-unit="miner"]').click();check('seven skin families',await page.locator('.skin-card').count()===7);
  await page.locator('[data-buy-skin="leaf"]').click();const geared=await snap(page);check('skin purchase belongs to selected type',geared.ownedSkins.miner.includes('leaf')&&!geared.ownedSkins.sword.includes('leaf'));check('skin purchase equips miner',geared.loadout.miner==='leaf');check('skin purchase spends gems',geared.gems===20-SKINS.leaf.cost);
  await page.screenshot({path:`${shots}/camp-wardrobe.png`});
  const tabs=page.locator('[data-armory-tab="upgrades"]');if(await tabs.count())await tabs.click();await page.locator('[data-upgrade="minerPick"]').click();const upgraded=await snap(page);check('upgrade uses independent points',upgraded.upgradePoints===3&&upgraded.gems===geared.gems&&upgraded.upgrades.minerPick===1);await closeModal(page);
  await page.locator('[data-action="campaign"]').first().click();check('six campaign groups',await page.locator('.chapter-button').count()===6);check('five stages per group',await page.locator('.encounter-card').count()===5);await page.locator('[data-chapter="5"]').click();await page.locator('.encounter-card[data-select-level="29"]').click();check('final stage remains locked for this save',await page.locator('[data-new-level="29"]').isDisabled());await page.screenshot({path:`${shots}/campaign.png`});
 });
 await run('manual sword movement, block, leap and interruption',async()=>{
  const {page}=await createPage({save:fixture('sword')});await page.keyboard.press('r');await resume(page);const id=await clickUnit(page,'sword');check('canvas click takes control',await page.locator('#selected-unit').isVisible());
  const before=(await snap(page)).checkpoint.units.find(u=>u.id===id);await holdKey(page,'d');let state=(await snap(page)).checkpoint,u=state.units.find(u=>u.id===id);check('D moves selected unit right',u.x>before.x+5);const lane=u.lane;await holdKey(page,'w',250);u=(await snap(page)).checkpoint.units.find(u=>u.id===id);check('W moves through battle depth',u.lane<lane-2);
  await page.keyboard.down('q');await page.waitForTimeout(120);u=(await snap(page)).checkpoint.units.find(u=>u.id===id);check('Q enters sword block',u.blocking||u.action==='block'||u.actionState?.kind==='block');await page.keyboard.up('q');
  await page.keyboard.press('e');await page.waitForTimeout(150);u=(await snap(page)).checkpoint.units.find(u=>u.id===id);check('E triggers a leap action or cooldown',u.actionState?.kind==='leap'||u.cooldowns?.special>0);
  await page.waitForTimeout(1000);await page.keyboard.down('d');await page.waitForTimeout(100);await page.locator('#pause-button').click();await page.keyboard.up('d');await resume(page);const frozen=(await snap(page)).checkpoint.units.find(u=>u.id===id).x;await page.waitForTimeout(200);const stopped=(await snap(page)).checkpoint.units.find(u=>u.id===id).x;check('pause clears held manual input',Math.abs(stopped-frozen)<1);
  await page.keyboard.down('d');await page.waitForTimeout(100);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.up('d');const afterBlur=(await snap(page)).checkpoint.units.find(u=>u.id===id).x;await page.waitForTimeout(180);check('blur clears held input',Math.abs((await snap(page)).checkpoint.units.find(u=>u.id===id).x-afterBlur)<1);
  await page.screenshot({path:`${shots}/manual-sword.png`});await page.keyboard.press('Escape');check('Escape releases unit',!(await snap(page)).checkpoint.selected);
 });
 await run('manual melee respects facing until player turns',async()=>{
  const save=fixture('sword'),b=save.checkpoint,unit=b.units.find(u=>!u.team),target=b.units.find(u=>u.team===1);
  unit.x=650;unit.lane=15;unit.facing=1;target.x=610;target.lane=15;target.hp=target.maxHP=2000;b.units=b.units.filter(u=>!u.team||u.id===target.id);
  const {page}=await createPage({save});await page.keyboard.press('r');await resume(page);await clickUnit(page,'sword');await holdKey(page,'Space',120);await page.waitForTimeout(700);
  const front=(await snap(page)).checkpoint;check('manual sword does not turn automatically toward enemy behind',front.units.find(u=>u.id===unit.id).facing===1);check('forward strike cannot damage enemy behind',front.units.find(u=>u.id===target.id).hp===2000);
  await untilSnapshot(page,s=>s.checkpoint?.units.find(u=>u.id===unit.id)?.cooldowns.primary===0);await holdKey(page,'a',100);await holdKey(page,'Space',120);
  const turned=await untilSnapshot(page,s=>s.checkpoint?.units.find(u=>u.id===target.id)?.hp<2000);
  check('moving left explicitly turns manual sword',turned.checkpoint.units.find(u=>u.id===unit.id).facing===-1);check('facing the target allows a real melee hit',turned.checkpoint.units.find(u=>u.id===target.id).hp<2000);
 });
 await run('six practice routes and differentiated controls',async()=>{
  const {page}=await createPage();
  for(const type of ['miner','sword','archer','spear','mage','giant']){
   await practice(page,type);const saved=await snap(page);check(`${type} practice opens`,saved.checkpoint.practice===type);check(`${type} practice spawns role`,saved.checkpoint.units.some(u=>u.team===0&&u.type===type));
   await page.keyboard.press('r');check(`${type} has a control description`,(await page.locator('#selected-name').innerText()).length>0);
  }
 });
 await run('manual miner digging and delivery',async()=>{
  const {page}=await createPage({save:fixture('miner')});await page.keyboard.press('r');await resume(page);await clickUnit(page,'miner');
  await holdKey(page,'d',360);await holdKey(page,'w',330);await holdKey(page,'Space',3200);
  const mined=(await snap(page)).checkpoint;const miner=mined.units.find(u=>u.team===0&&u.type==='miner');check('manual miner can actually dig gold',miner.cargo>0);const gold=mined.gold;
  await holdKey(page,'a',2700);await page.waitForTimeout(150);const delivered=await snap(page);
  check('manual miner delivers or finishes its delivery practice',delivered.checkpoint?delivered.checkpoint.gold>gold:await page.locator('#modal-title').innerText()==='练习完成');
  check('practice cannot award campaign gems',delivered.gems===freshProgress().gems);await page.screenshot({path:`${shots}/miner-delivery.png`});
 });
 await run('giant visible head selection and skin earthquake',async()=>{
  const {page}=await createPage({save:fixture('giant',{skin:'volt'})});await page.keyboard.press('r');await resume(page);const id=await clickUnit(page,'giant',{head:true});check('giant upper body is selectable',(await snap(page)).checkpoint.selected===id);
  await page.keyboard.press('q');await page.waitForTimeout(180);const u=(await snap(page)).checkpoint.units.find(u=>u.id===id);check('equipped giant earthquake input works',u.actionState?.kind==='earthquake'||u.cooldowns?.secondary>0);await page.screenshot({path:`${shots}/giant-earthquake.png`});
 });
 await run('manual mage summon and spear throw',async()=>{
  const {page}=await createPage({save:fixture('mage')});await page.keyboard.press('r');await resume(page);const mage=await clickUnit(page,'mage');await page.keyboard.press('q');await page.waitForTimeout(1200);const m=(await snap(page)).checkpoint;check('mage Q summons owned minion',m.units.some(u=>u.ownerId===mage&&u.type==='minion'));
  await practice(page,'spear');await page.keyboard.press('r');await page.keyboard.press('e');await page.waitForTimeout(1100);const spear=(await snap(page)).checkpoint.units.find(u=>u.team===0&&u.type==='spear');check('spear E consumes carried spear',spear.hasSpear===false);await page.screenshot({path:`${shots}/spear-after-throw.png`});
 });
 await run('archer aiming via actual pointer drag and release',async()=>{
  const {page}=await createPage({save:fixture('archer')});await page.keyboard.press('r');await resume(page);await clickUnit(page,'archer');const c=await page.locator('#battlefield').boundingBox();const before=(await snap(page)).checkpoint;
  await page.mouse.move(c.x+c.width*.65,c.y+c.height*.6);await page.keyboard.down('Space');await page.mouse.move(c.x+c.width*.73,c.y+c.height*.64,{steps:8});await page.waitForTimeout(150);await page.keyboard.up('Space');await page.waitForTimeout(100);
  const after=(await snap(page)).checkpoint;check('archer release launches actual arrow',after.projectiles.some(p=>p.team===0)||(after.units.find(u=>u.team===0&&u.type==='archer')?.cooldowns?.primary||0)>0);await page.screenshot({path:`${shots}/archer-aim.png`});
 });
 await run('touch archer small drag hits and deliberately offset aim misses',async()=>{
  const save=fixture('archer'),b=save.checkpoint;const target=b.units.find(u=>u.team===1);target.x=950;target.lane=15;target.hp=target.maxHP=2000;b.units=b.units.filter(u=>!u.team||u.id===target.id);
  const {context,page}=await createPage({width:844,height:390,touch:true,save});await page.keyboard.press('r');await resume(page);
  const cd=await context.newCDPSession(page),button=await page.locator('#primary-action').boundingBox();const point={x:button.x+button.width/2,y:button.y+button.height/2,id:4};
  async function shoot(dx,dy){
   await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await page.waitForTimeout(160);
   await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,x:point.x+dx,y:point.y+dy}]});await page.waitForTimeout(120);
   await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  const initial=(await snap(page)).checkpoint.units.find(u=>u.id===target.id).hp;await shoot(12,0);
  const hit=await untilSnapshot(page,s=>s.checkpoint?.units.find(u=>u.id===target.id)?.hp<initial);
  check('touch archer small relative drag causes a real hit',hit.checkpoint.units.find(u=>u.id===target.id).hp<initial);
  await untilSnapshot(page,s=>s.checkpoint?.units.find(u=>!u.team&&u.type==='archer')?.cooldowns.primary===0);
  const hp=(await snap(page)).checkpoint.units.find(u=>u.id===target.id).hp;await shoot(0,-110);
  const released=await untilSnapshot(page,s=>s.checkpoint?.projectiles.some(p=>!p.team));check('offset touch aim launches a real projectile',released.checkpoint.projectiles.some(p=>!p.team));
  const initialTime=released.checkpoint.time;const missed=await untilSnapshot(page,s=>s.checkpoint?.time>=initialTime+3);
  check('offset touch aim can genuinely miss without target-id damage',missed.checkpoint.units.find(u=>u.id===target.id).hp===hp);
  await page.screenshot({path:`${shots}/touch-archer-aim.png`});await cd.detach();
 });
 await run('optional family mode and paused recruitment',async()=>{
  const {page}=await createPage();await page.locator('#family-button').click();await page.locator('[data-action="enable-family"]').click();await resume(page);const enabled=await snap(page);check('family assistance explicitly enabled',enabled.family&&enabled.checkpoint.assisted);await page.locator('#pause-button').click();const time=(await snap(page)).checkpoint.time;await page.locator('[data-unit="sword"]').click();await page.locator('[data-command="attack"]').click();const planned=(await snap(page)).checkpoint;check('family mode accepts paused orders',planned.order==='attack');check('family mode accepts paused recruitment',planned.queue.some(q=>q.type==='sword'));check('paused planning does not advance time',planned.time===time);await page.screenshot({path:`${shots}/family-pause-plan.png`});
 });
 await run('practice preserves campaign through reload and borrowed equipment',async()=>{
  const {page}=await createPage();await resume(page);await page.locator('[data-unit="miner"]').click();await page.locator('[data-unit="sword"]').click();await page.locator('[data-command="attack"]').click();await page.locator('#pause-button').click();
  const original=(await snap(page)).checkpoint;
  await page.locator('[data-action="practice"]').first().click();await page.locator('[data-practice="giant"]').click();let saved=await snap(page);
  check('entering practice preserves original campaign checkpoint',saved.campaignCheckpoint?.levelId===original.levelId&&saved.campaignCheckpoint?.time===original.time);
  check('giant practice lends nonclassic equipment',saved.checkpoint.units.find(u=>u.type==='giant'&&!u.team).skin!=='classic');
  await page.locator('[data-action="armory"]').first().click();await page.locator('[data-armory-tab="skins"]').click();await page.locator('[data-wardrobe-unit="miner"]').click();await page.locator('[data-buy-skin="leaf"]').click();await closeModal(page);
  saved=await snap(page);check('ready-stage wardrobe update preserves borrowed giant equipment',saved.checkpoint.units.find(u=>u.type==='giant'&&!u.team).skin!=='classic');
  await resume(page);await page.reload({waitUntil:'networkidle'});check('practice checkpoint restores after reload',(await snap(page)).checkpoint.practice==='giant');
  await page.locator('[data-action="return-campaign"]').first().click();const restored=await snap(page);
  check('return from practice restores original paused battle',restored.checkpoint.status==='paused'&&!restored.checkpoint.practice&&restored.checkpoint.levelId===original.levelId);
  check('return from practice preserves gold, time, order and queue',restored.checkpoint.gold===original.gold&&restored.checkpoint.time===original.time&&restored.checkpoint.order===original.order&&JSON.stringify(restored.checkpoint.queue)===JSON.stringify(original.queue));
  check('returned campaign clears temporary checkpoint',restored.campaignCheckpoint===null);
 });
 await run('old save migration and repeat reload safety',async()=>{
  const old={version:2,gems:8,cleared:{0:3,1:2},upgrades:{miner:2,sword:1},unlocked:2,selectedLevel:1,ownedSkins:['classic','leaf'],loadout:{miner:'leaf'},inventory:{gold:2,mining:1,reinforcements:0,arrows:0,repair:0,frost:0},checkpoint:{schema:2,status:'playing'},sound:false};
  const {page}=await createPage({legacy:old});const migrated=await snap(page);check('legacy save converts to schema3',migrated.version===3);check('legacy skins preserved for all six types',Object.values(migrated.ownedSkins).every(list=>list.includes('leaf')));check('old progress archived instead of assigned to new levels',!!migrated.legacyHistory&&Object.keys(migrated.cleared).length===0);check('legacy source remains intact',await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).version===2,LEGACY_SAVE_KEY));const gems=migrated.gems;await page.reload({waitUntil:'networkidle'});check('migration refunds happen once',(await snap(page)).gems===gems);await page.screenshot({path:`${shots}/migration.png`});
 });
 for(const [label,width,height] of [['phone-landscape',844,390],['phone-portrait',390,844],['tablet',1024,768]])await run(`${label} real touch and responsive HUD`,async()=>{
  const {context,page}=await createPage({width,height,touch:true,save:fixture('sword')});await page.keyboard.press('r');await resume(page);
  await visibleOnScreen(page,['#battlefield','[data-unit="miner"]','[data-unit="giant"]','[data-command="attack"]','#move-stick','#primary-action'],label);
  const before=(await snap(page)).checkpoint,unit=before.units.find(u=>u.id===before.selected);assert.ok(unit,'touch fixture is selected');const touching=await touchMove(context,page,{attack:true});await page.waitForTimeout(450);const during=touching.checkpoint.units.find(u=>u.id===unit.id),after=(await snap(page)).checkpoint.units.find(u=>u.id===unit.id);check(`${label}: simultaneous joystick moves the unit`,after.x>unit.x+2);check(`${label}: simultaneous action triggers attack`,during.cooldowns.primary>0||during.actionState?.kind==='attack');
  await page.screenshot({path:`${shots}/${label}.png`,fullPage:true});
  const cd=await context.newCDPSession(page),box=await page.locator('#move-stick').boundingBox();await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y:box.y+box.height*.5,id:1}]});await page.setViewportSize({width:height,height:width});await cd.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.waitForTimeout(100);const rotated=(await snap(page)).checkpoint.units.find(u=>u.id===unit.id).x;await page.waitForTimeout(650);check(`${label}: rotate and cancellation clear motion`,Math.abs((await snap(page)).checkpoint.units.find(u=>u.id===unit.id).x-rotated)<1);await cd.detach();
  await page.locator('[data-action="settings"]').first().tap();check(`${label}: menu remains usable`,await page.locator('.modal').isVisible());await closeModal(page);
 });
 await run('workshop, editor isolation and v03 downloads',async()=>{
  const {page}=await createPage();await page.goto(base+'/learn/',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.getElementById('source')?.value.includes('let gold=4'));
  check('original twelve lessons retained',await page.locator('[data-done]').count()>=12);const preview=page.frameLocator('#preview');await preview.locator('#next').click();check('paper rules earn before purchase',await preview.locator('#gold').innerText()==='5');
  await page.locator('#example-select').selectOption('2');await preview.locator('#mine').waitFor();await preview.locator('#mine').click();check('child variable experiment responds',await preview.locator('#gold').innerText()==='5');await page.locator('summary').first().click();await page.locator('#source').fill((await page.locator('#source').inputValue()).replace('gold=gold+1','gold=gold+2'));await page.locator('#run-code').click();await page.waitForFunction(()=>document.getElementById('preview').srcdoc.includes('gold=gold+2'));await preview.locator('#mine').click();check('edited code executes in sandbox',await preview.locator('#gold').innerText()==='6');
  const pending=page.waitForEvent('download');await page.locator('#save-code').click();check('family project HTML downloads',(await pending).suggestedFilename().endsWith('.html'));await page.locator('[data-done="1"]').check();await page.locator('#journal').fill('我预测：先让矿工把黄金带回来，才能训练剑士。');await page.reload({waitUntil:'networkidle'});check('learning journal persists',(await page.locator('#journal').inputValue()).includes('把黄金带回来'));check('lesson completion persists',await page.locator('[data-done="1"]').isChecked());await page.screenshot({path:`${shots}/workshop.png`,fullPage:true});
  for(const [lesson,title] of [[13,'黄金进了背包'],[14,'按下攻击'],[15,'同样六颗金币']]){
   await page.locator('#example-select').selectOption(String(lesson));await preview.locator('h1').filter({hasText:title}).waitFor();
   if(lesson===14)await preview.locator('#attack').click();if(lesson===15)await preview.locator('#mixed').click();
   const frame=await (await page.locator('#preview').elementHandle()).contentFrame();const before=await frame.evaluate(()=>JSON.stringify(window.workshopState()));await preview.locator('#step').click();
   check(`advanced experiment ${lesson} works in workshop sandbox`,await frame.evaluate(()=>JSON.stringify(window.workshopState()))!==before);
  }
  await page.setViewportSize({width:390,height:844});check('workshop with new experiments fits phone',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  for(const file of ['parent-child-guide-0.3.0.pdf','parent-child-guide-0.3.0.md','designer-cards-0.3.0.pdf','ember-family-kit-0.3.0.zip']){const response=await page.request.get(base+'/learn/downloads/'+file);check(`download ${file}`,response.ok()&&(await response.body()).length>1000);}
 });
 check('no browser JavaScript exceptions',pageErrors.length===0);check('no failed asset requests',failedRequests.length===0);
}finally{
 const report={version:'0.3.0',passed:checks.length,checks,scenarioErrors,pageErrors,failedRequests,fixturePolicy:'Saved Battle snapshots arrange isolated scenes only. Keyboard, pointer, and CDP multi-touch drive all interactions. Full resource-backed campaign acceptance lives in Node tests.',screenshots:shots};
 writeFileSync(`${shots}/report.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();
}
assert.deepEqual(scenarioErrors,[],'all browser acceptance scenarios pass');
