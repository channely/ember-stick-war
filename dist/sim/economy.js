import { homeX, isAlive } from './unit-utils.js';
import { clamp, distance } from './geometry.js';
import { idleAction } from '../rules.js';

export const economyMethods = {
  nearestMine(unit,withinReach=false){
    const occupied=mine=>this.units.filter(u=>u.hp>0&&u.id!==unit.id&&u.mineId===mine.id&&u.cargo<(u.cargoCapacity||50)&&!u.hidden).length;
    return this.mines.filter(m=>m.remaining>0&&(!withinReach||distance(unit,m)<48)&&(withinReach||unit.mineId===m.id||occupied(m)<m.slots))
      .sort((a,b)=>distance(unit,a)-distance(unit,b)||a.id.localeCompare(b.id))[0]||null;
  },
  deposit(unit){
    if(unit.cargo<=0||Math.abs(unit.x-homeX(unit.team))>48)return false;
    const amount=unit.cargo;this[unit.team?'enemyGold':'gold']+=amount;this.stats[unit.team?'enemyGoldMined':'goldMined']+=amount;
    unit.cargo=0;unit.mineTime=0;unit.mineId=null;
    this.effect('gold',unit.x,unit.lane-40,1.2,{value:amount});
    if(this.practice==='miner'&&!unit.team)this.progressPractice();return true;
  },
  mine(unit,mine,dt,manual=false){
    const capacity=unit.cargoCapacity||50;
    if(!mine||mine.remaining<=0||unit.cargo>=capacity)return;
    unit.action='mine';unit.actionState=idleAction('mine');unit.mineId=mine.id;
    const duration=3.4*(1-(unit.team?0:this.upgrade('miner','pick'))*.15);
    unit.mineTime+=dt*(manual?1.5:1)*(!unit.team&&this.miningBoost>0?2:1);
    unit.actionState.elapsed=unit.mineTime;unit.actionState.duration=duration;unit.actionState.progress=Math.min(1,unit.mineTime/duration);
    if(unit.mineTime+1e-9>=duration){
      const amount=Math.min(capacity-unit.cargo,mine.remaining);mine.remaining-=amount;unit.cargo+=amount;unit.mineTime=0;
      this.effect('gold',mine.x,mine.lane,.5,{value:amount});
    }
  },
  updateMiner(unit,dt,manual=false){
    this.deposit(unit);
    if(manual){
      if(this.manual.attack){const mine=this.nearestMine(unit,true);if(mine)this.mine(unit,mine,dt,true);else if(unit.cooldowns.primary<=0)this.requestAction(unit,'primary',true);}
      else if(unit.actionState.kind==='mine')unit.actionState=idleAction();return;
    }
    const threat=this.enemyTargets(unit).find(t=>t.type!=='miner'&&distance(unit,t)<150);
    if(threat){this.move(unit,{x:homeX(unit.team),lane:unit.lane},dt,1.1);if(Math.abs(unit.x-homeX(unit.team))<35)unit.hidden=true;return;}
    const capacity=unit.cargoCapacity||50;
    if(unit.cargo>=capacity||unit.cargo>0&&!this.mines.some(m=>m.remaining>0)){
      unit.mineId=null;this.move(unit,{x:homeX(unit.team),lane:unit.lane},dt);this.deposit(unit);return;
    }
    let mine=this.mines.find(m=>m.id===unit.mineId&&m.remaining>0);
    if(!mine)mine=this.nearestMine(unit);
    if(!mine){if(unit.cargo>0){this.move(unit,{x:homeX(unit.team),lane:unit.lane},dt);this.deposit(unit);}else unit.action='idle';return;}
    unit.mineId=mine.id;
    const partners=this.units.filter(u=>u.hp>0&&u.mineId===mine.id&&u.cargo<(u.cargoCapacity||50)).sort((a,b)=>a.id-b.id),slot=Math.max(0,partners.findIndex(u=>u.id===unit.id));
    const target={x:mine.x+(unit.team?14:-14),lane:clamp(mine.lane+(slot%2?15:-15),-45,80)};
    if(distance(unit,target)>9)this.move(unit,target,dt);else this.mine(unit,mine,dt);
  },
  updateQueue(queue,team,dt){
    let remaining=dt;
    while(queue.length&&remaining>0){
      const q=queue[0],spent=Math.min(q.remaining,remaining);q.remaining-=spent;remaining-=spent;
      if(q.remaining>1e-8)break;
      queue.shift();this.spawn(q.type,team,homeX(team),{lane:-20+(this.nextId%4)*28});
      if(!team){this.stats.trained++;this.emit('trained',{unitType:q.type});}
    }
  },
};
