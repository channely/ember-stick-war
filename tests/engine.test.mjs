import test from 'node:test';
import assert from 'node:assert/strict';
import { Battle, UNITS, WORLD, LEVELS, population } from '../dist/engine.js';

function advance(battle, seconds, eachSecond) {
  for(let i=0;i<seconds*30 && battle.status==='playing';i++){
    if(i%30===0)eachSecond?.(battle);
    battle.update(1/30);
  }
}

test('miners complete trips and deliver gold rather than crediting it immediately',()=>{
  const b=new Battle();b.start();advance(b,2);assert.equal(b.stats.goldMined,0);
  advance(b,23);assert.ok(b.stats.goldMined>=140);assert.ok(b.gold>=640);
});

test('recruitment spends gold, trains in order, and refunds cancellations',()=>{
  const b=new Battle();assert.ok(b.train('sword').ok);assert.ok(b.train('archer').ok);
  assert.equal(b.gold,LEVELS[0].startGold-375);assert.equal(b.queue.length,2);assert.equal(population(b.units,b.queue),5);
  assert.ok(b.cancelTraining(1));assert.equal(b.gold,LEVELS[0].startGold-125);b.start();advance(b,5);
  assert.equal(b.queue.length,0);assert.equal(b.stats.trained,1);assert.equal(b.units.filter(u=>u.team===0&&u.type==='sword').length,2);
});

test('insufficient funds, full queues, and population caps reject recruitment without spending',()=>{
  const b=new Battle();assert.equal(b.train('giant').ok,false);assert.equal(b.gold,LEVELS[0].startGold);
  b.gold=10000;for(let i=0;i<5;i++)assert.ok(b.train('miner').ok);
  const balance=b.gold;assert.equal(b.train('sword').ok,false);assert.equal(b.gold,balance);
  b.queue=[];for(let i=0;i<9;i++)b.spawn('giant',0);
  assert.equal(population(b.units),39);assert.equal(b.train('spear').ok,false);assert.ok(b.train('miner').ok);
  assert.equal(population(b.units,b.queue),40);assert.equal(b.train('sword').ok,false);
});

test('pause freezes combat, economy, training, and cooldowns',()=>{
  const b=new Battle();b.train('sword');b.start();b.skill('rage');b.status='paused';
  const before=b.snapshot();for(let i=0;i<50;i++)b.update(.1);assert.deepEqual(b.snapshot(),before);
  assert.equal(b.train('miner').ok,false);
});

test('skills restore health, buff attacks, and cannot bypass cooldowns',()=>{
  const b=new Battle();assert.equal(b.skill('rage').ok,false);b.start();const soldier=b.units.find(u=>u.type==='sword');soldier.hp=20;
  assert.ok(b.skill('heal').ok);assert.equal(soldier.hp,101);assert.equal(b.skill('heal').ok,false);
  const target=b.spawn('spear',1,600);assert.ok(b.skill('rage').ok);b.strike(soldier,target);assert.equal(target.maxHP-target.hp,40);
  assert.equal(b.skill('rage').ok,false);advance(b,12.1);assert.equal(b.rage,0);assert.ok(b.rageCooldown>0);
});

test('arrows travel before impact and magic damages multiple enemy units',()=>{
  const b=new Battle();b.units=[];b.start();b.enemyTimer=1000;b.nextWave=1000;
  const archer=b.spawn('archer',0,900),target=b.spawn('sword',1,1100);archer.cooldown=100;target.cooldown=100;
  b.strike(archer,target);assert.equal(target.hp,target.maxHP);assert.equal(b.projectiles.length,1);advance(b,.5);assert.ok(target.hp<target.maxHP);
  b.units=[];b.projectiles=[];const mage=b.spawn('mage',0,900),t1=b.spawn('spear',1,1100),t2=b.spawn('spear',1,1130);mage.cooldown=t1.cooldown=t2.cooldown=100;
  b.strike(mage,t1);advance(b,.5);assert.ok(t1.hp<t1.maxHP);assert.ok(t2.hp<t2.maxHP);
});

test('garrison retreats troops and heals them at home',()=>{
  const b=new Battle();const soldier=b.units.find(u=>u.type==='sword');soldier.hp=60;soldier.x=500;b.command('garrison');b.start();advance(b,6);
  assert.ok(soldier.x<260);assert.ok(soldier.hp>60);assert.equal(b.stats.goldMined,0);
});

test('campaign has an achievable victory using only starting resources and earned gold',()=>{
  const b=new Battle();b.start();advance(b,300,b=>{
    const count=t=>b.units.filter(u=>u.team===0&&u.type===t).length+b.queue.filter(q=>q.type===t).length;
    if(count('miner')<4&&b.time<35)b.train('miner');
    else if(count('spear')<2&&b.gold>=375)b.train('spear');
    else if(count('archer')<3&&b.gold>=250)b.train('archer');
    else if(b.gold>=125)b.train('sword');
    if(b.time>100)b.command('attack');if(b.time>120&&b.rageCooldown===0)b.skill('rage');
  });
  assert.equal(b.status,'won');assert.equal(b.enemyHP,0);assert.ok(b.baseHP>0);assert.ok(b.stats.goldMined>1000);
  const events=b.events.filter(e=>e.type==='end');assert.equal(events.length,1);b.update(.1);assert.equal(b.events.filter(e=>e.type==='end').length,1);
});

test('enemy waves can defeat an undefended base and stop the simulation',()=>{
  const b=new Battle();b.start();advance(b,250);assert.equal(b.status,'lost');assert.equal(b.baseHP,0);
  const time=b.time;b.update(.1);assert.equal(b.time,time);assert.equal(b.events.filter(e=>e.type==='end').length,1);
});

test('all six chapters provide increasing opposition and all unit types can be trained',()=>{
  let previous=0;for(let level=4;level<30;level+=5){const b=new Battle({level});assert.ok(b.enemyMax>previous);previous=b.enemyMax;}
  for(const type of Object.keys(UNITS)){const b=new Battle();b.gold=UNITS[type].cost;assert.ok(b.train(type).ok);b.start();advance(b,UNITS[type].train+.2);assert.equal(b.stats.trained,1);assert.ok(b.units.some(u=>u.team===0&&u.type===type));}
});

test('saved battles restore economy, units, training, and pause safely',()=>{
  const b=new Battle({upgrades:{miner:2,sword:1}});b.train('spear');b.start();advance(b,4);const restored=Battle.restore(b.snapshot());
  assert.equal(restored.status,'paused');assert.equal(restored.gold,b.gold);assert.deepEqual(restored.units,b.units);assert.deepEqual(restored.queue,b.queue);
  assert.equal(restored.time,b.time);assert.equal(restored.selected,null);assert.equal(Battle.restore(null),null);
  restored.status='playing';advance(restored,5);assert.equal(restored.stats.trained,1);
});

test('survival waves unlock stronger enemies and preserve their state after restoring',()=>{
  const b=new Battle({survival:true});b.baseHP=1e8;b.baseMax=1e8;b.start();advance(b,140);
  assert.ok(b.wave>=4);assert.ok(b.config.types.includes('spear'));assert.equal(b.enemyHP,b.enemyMax);
  const restored=Battle.restore(b.snapshot());assert.ok(restored.survival);assert.deepEqual(restored.config.types,b.config.types);assert.equal(restored.wave,b.wave);
  const soldier=b.spawn('giant',0,WORLD-175);b.command('attack');b.enemyHP=1;advance(b,.2);assert.equal(b.enemyHP,1);assert.notEqual(b.status,'won');
});
