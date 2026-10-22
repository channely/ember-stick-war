import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle,UNITS} from '../dist/engine.js';
import {freshProgress,purchaseSkin,equipSkin,purchaseItem,recordVictory} from '../dist/progress.js';
// Deterministic commander profiles. Every recruit spends real earned gold;
// upgrades, gear and consumables are paid for by the same persistent campaign wallet.
const plans=[{m:6,s:1,a:8,z:1,t:65,g:1},{m:6,s:1,a:6,z:1,t:60,g:2},{m:5,s:1,a:6,z:2,t:45,g:1},{m:6,s:2,a:8,z:0,t:50,g:0},{m:7,s:1,a:10,z:1,t:75,g:2},{m:5,s:0,a:8,z:2,t:60,g:3},{m:4,s:1,a:6,z:1,t:35},{m:5,s:2,a:5,z:2,t:45}];
const selections=[3,3,7,3,3,3,7,3,3,7,3,3,7,7,3,3,3,2,2,2,4,2,0,1,1,1,2,5,0,5];
test('all 30 standard campaign stages can be completed in sequence with earned resources',async t=>{
 const save=freshProgress();
 for(let level=0;level<30;level++)await t.test(`stage ${level+1}`,()=>{
  const upgradeLevel=Math.min(3,Math.floor(level/7));
  for(const type of [...Object.keys(UNITS),'statue'])while((save.upgrades[type]||0)<upgradeLevel){const cost=(save.upgrades[type]||0)+1;assert.ok(save.gems>=cost);save.gems-=cost;save.upgrades[type]=cost;}
  if(level===10){assert.ok(purchaseSkin(save,'vamp'));for(const type of Object.keys(UNITS))if(type!=='miner')assert.ok(equipSkin(save,type,'vamp'));}
  const items=[22,28].includes(level)?['gold','mining','gold','reinforcements','frost','arrows','repair']:[];
  for(const type of new Set(items)){const needed=items.filter(x=>x===type).length;while(save.inventory[type]<needed)assert.ok(purchaseItem(save,type));}
  const b=new Battle({level,upgrades:save.upgrades,loadout:save.loadout}),p=plans[selections[level]];b.start();let next=0;
  for(let tick=0;tick<6500&&b.status==='playing';tick++){
   if(b.time>=next){next+=1;
    if(items.length&&b.itemCooldown===0&&b.useItem(items[0]).ok){assert.ok(save.inventory[items[0]]>0);save.inventory[items.shift()]--;}
    const count=type=>b.units.filter(u=>!u.team&&u.type===type).length+b.queue.filter(q=>q.type===type).length;
    if(count('miner')<p.m&&b.time<45)b.train('miner');
    else if(count('giant')<(p.g||0))b.train('giant');
    else if(count('spear')<p.s)b.train('spear');
    else if(count('archer')<p.a)b.train('archer');
    else if(count('mage')<p.z)b.train('mage');else b.train('sword');
    if(b.time>p.t&&b.config.goal!=='defend')b.command('attack');
    if(b.units.some(u=>!u.team&&u.type!=='miner'&&u.hp<u.maxHP*.55)&&b.healCooldown===0)b.skill('heal');
    if(b.units.some(u=>!u.team&&u.action==='attack')&&b.rageCooldown===0)b.skill('rage');
   }
   b.update(.1);b.events=[];
  }
  assert.equal(b.status,'won',`${b.config.title}: ${b.lossReason}`);assert.ok(b.gold>=0);assert.ok(save.gems>=0);recordVictory(save,b);
 });
 assert.equal(Object.keys(save.cleared).length,30);assert.equal(save.unlocked,29);
});
