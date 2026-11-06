import { homeX, isAlive } from './unit-utils.js';
import { UNITS, WORLD, POPULATION_CAP, population } from '../rules.js';

export const aiMethods = {
  updateEnemyAI(dt){
    if(!this.enemyEnabled)return;
    this.aiTimer-=dt;if(this.aiTimer>0)return;this.aiTimer=.5;
    const ai=this.config.ai||{},active=this.units.filter(u=>u.team&&u.hp>0&&u.type!=='miner'&&u.type!=='minion');
    const strength=active.reduce((n,u)=>n+u.hp,0),max=active.reduce((n,u)=>n+u.maxHP,0);
    const playerStrength=this.units.filter(u=>!u.team&&isAlive(u)&&u.type!=='miner').reduce((n,u)=>n+u.hp,0);
    const invaders=this.units.some(u=>!u.team&&isAlive(u)&&u.type!=='miner'&&u.x>1950);
    const retreatThreshold=ai.retreatAt??.28;
    if(ai.strategy==='tutorial')this.enemyOrder='defend';
    else if(this.enemyOrder==='garrison'){
      if(this.time>(this.enemyRetreatUntil||0)||strength>max*.8){this.enemyOrder=invaders?'defend':'attack';this.enemyRetreatCooldown=this.time+20;}
    } else if(active.length&&strength<max*retreatThreshold&&this.time>(this.enemyRetreatCooldown||0)&&!invaders){
      this.enemyOrder='garrison';this.enemyRetreatUntil=this.time+15;
    } else if(invaders)this.enemyOrder='defend';
    else if(this.time>=(ai.attackAt??55)||(ai.strategy==='pressure'&&this.time>=(ai.attackAt??55)*.75&&active.length>=4&&strength>playerStrength*1.4))this.enemyOrder='attack';
    else this.enemyOrder='defend';
    if(this.enemyQueue.length>=2)return;
    const count=type=>this.units.filter(u=>u.team&&u.hp>0&&u.type===type).length+this.enemyQueue.filter(q=>q.type===type).length;
    const desiredMiners=Math.max(0,(ai.minerTarget??4)-(ai.strategy==='pressure'&&this.time<90?1:0));
    if(count('miner')<desiredMiners&&this.mines.some(m=>m.remaining>0)){this.train('miner',1);return;}
    const combatCount=this.units.filter(u=>u.team&&u.hp>0&&u.type!=='miner'&&u.type!=='minion').length+this.enemyQueue.filter(q=>q.type!=='miner').length;
    if(Number.isFinite(ai.combatCap)&&combatCount>=ai.combatCap)return;
    const types=(this.config.types||['sword','archer']).filter(type=>UNITS[type]&&type!=='miner');
    const composition=ai.composition||{};
    const weighted=types.map((type,index)=>{
      let weight=Array.isArray(composition)?Math.max(.5,1-index*.1):(Number(composition[type])||1);
      if(ai.strategy==='pressure'&&type==='sword')weight*=1.5;
      if(ai.strategy==='fortify'&&['archer','mage','spear'].includes(type))weight*=1.35;
      return {type,score:weight/(1+count(type)),index};
    }).sort((a,b)=>b.score-a.score||a.index-b.index);
    // Save for the missing role instead of spending every small delivery on the
    // cheapest soldier: otherwise an apparent mixed army becomes sword spam.
    if(weighted.length)this.train(weighted[0].type,1);
  },
  nextEnemyWave(){
    if(!this.enemyEnabled)return;
    if(this.survival){
      // Survival escalates an explicitly recorded supply budget, then still uses
      // the same paid training queue. Campaign never receives this supply.
      this.wave++;const supply=250+this.wave*80;this.enemyGold+=supply;
      this.stats.survivalSupply=(this.stats.survivalSupply||0)+supply;
      this.config.types=['sword','archer','spear','mage','giant'].slice(0,Math.min(5,2+Math.floor(this.wave/3)));
      this.nextWave=this.time+45;this.emit('wave',{wave:this.wave,label:'生存敌军补给'});return;
    }
    const wave=this.config.waves[this.waveIndex];
    if(!wave){this.nextWave=Infinity;return;}
    this.wave++;this.waveIndex++;
    for(let i=0;i<wave.units.length;i++){
      const value=wave.units[i],d=UNITS[value.replace('!','')];if(!d)continue;
      if(population(this.units,this.enemyQueue,1)+d.pop>POPULATION_CAP)continue;
      if(this.spawnScripted(value,1,WORLD-230-i*20,i))this.stats.scriptedEnemies++;
    }
    this.nextWave=this.config.waves[this.waveIndex]?.at??Infinity;
    this.emit('wave',{wave:this.wave,label:wave.label||'关卡伏兵'});
  },
};
