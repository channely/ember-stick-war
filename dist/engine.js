import { LEVELS, SKINS, ITEMS } from './content.js';
export { LEVELS } from './content.js';
export const WORLD = 2700;
export const UNITS = {
  miner:{name:'矿工',en:'MINER',cost:100,hp:85,damage:5,range:32,speed:82,cooldown:1.4,train:3.5,pop:1,role:'经济',desc:'自动采矿、装袋、运回基地。每趟带回 35 黄金，先建设经济再扩充军队。'},
  sword:{name:'剑士',en:'SWORDWRATH',cost:125,hp:180,damage:25,range:40,speed:92,cooldown:1.05,train:4.5,pop:1,role:'近战',desc:'敏捷的前排战士。适合快速推进、追击射手和保护矿工。'},
  archer:{name:'弓箭手',en:'ARCHIDON',cost:250,hp:105,damage:28,range:340,speed:67,cooldown:1.65,train:6,pop:1,role:'远程',desc:'射出有飞行时间的箭矢。射程远，生命较低，需要近战保护。'},
  spear:{name:'长矛卫士',en:'SPEARTON',cost:375,hp:480,damage:40,range:66,speed:55,cooldown:1.45,train:8,pop:2,role:'重甲',desc:'头盔、圆盾与长矛组成坚实防线。高生命值，适合吸收前排伤害。'},
  mage:{name:'巫师',en:'MAGIKILL',cost:650,hp:150,damage:65,range:280,speed:49,cooldown:3,train:11,pop:2,role:'法术',desc:'释放奥术爆破，对目标周围 100 距离内的敌军造成范围伤害。'},
  giant:{name:'巨人',en:'GIANT',cost:1000,hp:1400,damage:95,range:95,speed:36,cooldown:2.3,train:15,pop:4,role:'攻城',desc:'挥动石棒打击并击退前方敌人，对雕像造成双倍伤害。体型巨大，行军缓慢。'}
};
const DIFFICULTY={easy:.72,normal:1,hard:1.3};
export function population(units,queue=[]){return units.filter(u=>u.team===0&&u.hp>0).reduce((n,u)=>n+(UNITS[u.type]?.pop||0),0)+queue.reduce((n,q)=>n+(UNITS[q.type]?.pop||0),0);}
function survivalConfig(){return {...LEVELS[0],hp:999999,income:19,interval:12,types:['sword','archer'],waves:[],goal:'defend',modifier:'night'};}
export class Battle {
  constructor({level=0,difficulty='normal',upgrades={},loadout={},survival=false,seed=24}={}){
    this.schema=2;this.level=Math.max(0,Math.min(LEVELS.length-1,Math.floor(level)||0));this.difficulty=DIFFICULTY[difficulty]?difficulty:'normal';this.factor=DIFFICULTY[this.difficulty];
    this.upgrades={...upgrades};this.loadout={...loadout};this.survival=survival;this.seed=seed>>>0;this.config=survival?survivalConfig():LEVELS[this.level];
    this.time=0;this.status='ready';this.order='defend';this.gold=survival?700:this.config.startGold;this.enemyGold=150;
    this.baseMax=1500+(upgrades.statue||0)*400;this.baseHP=this.baseMax;this.enemyMax=Math.round(this.config.hp*this.factor);this.enemyHP=this.enemyMax;
    this.units=[];this.queue=[];this.projectiles=[];this.effects=[];this.events=[];this.nextId=1;this.selected=null;
    this.enemyTimer=18;this.wave=0;this.waveIndex=0;this.nextWave=survival?28:(this.config.waves[0]?.at||40);this.nextHazard=8;
    this.rage=0;this.rageCooldown=0;this.healCooldown=0;this.towerCooldown=0;this.miningBoost=0;this.itemCooldown=0;
    this.lossReason='';this.stats={kills:0,trained:0,goldMined:0,lost:0,items:0,bosses:0};this.manual={left:false,right:false,attack:false};
    this.convoy=this.config.goal==='escort'?{id:-1,type:'cart',team:0,x:360,lane:33,hp:700+this.config.chapter*140,maxHP:700+this.config.chapter*140,hurt:0,stopped:false}:null;
    this.spawn('miner',0,345);this.spawn('miner',0,415);this.spawn('sword',0,555);this.spawn('sword',1,2370);if(this.level>0)this.spawn(this.config.types[0],1,2300);
  }
  random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
  emit(type,data={}){this.events.push({type,...data});}
  spawn(type,team,x,options={}){
    if(!UNITS[type])return null;const d=UNITS[type],chapter=this.config.chapter||0;
    const factor=team?this.factor*(1+chapter*.08+(this.level%5)*.02+(this.survival?this.wave*.04:0)):1+(this.upgrades[type]||0)*.16;
    const enemySkins=['classic','leaf','ice','leaf','lava','vamp'],skin=SKINS[options.skin]?options.skin:(team?enemySkins[chapter]:(SKINS[this.loadout[type]]?this.loadout[type]:'classic'));
    const boss=!!options.boss,hp=Math.round(d.hp*factor*(boss?2.6:1));
    const u={id:this.nextId++,type,team,skin,boss,x:x??(team?WORLD-200:205),lane:this.random()*48-7,hp,maxHP:hp,damage:d.damage*factor*(boss?1.22:1),cooldown:this.random()*.8,phase:this.random()*6.28,action:'idle',cargo:0,mineTime:0,hurt:0,swing:0,facing:team?-1:1,slow:0,slowFactor:.7,burn:0,burnTick:0,burnTeam:0};this.units.push(u);return u;
  }
  start(){if(this.status==='ready'){this.status='playing';this.emit('start');}}
  train(type){
    if(!UNITS[type]||['won','lost'].includes(this.status))return {ok:false,message:'这场战斗已经结束'};
    if(this.status==='paused')return {ok:false,message:'请先继续战斗'};const d=UNITS[type];
    if(this.queue.length>=5)return {ok:false,message:'训练队列已满，最多排队 5 个单位'};
    if(population(this.units,this.queue)+d.pop>40)return {ok:false,message:'已达到 40 人口上限'};
    if(this.gold<d.cost)return {ok:false,message:`黄金不足，还需要 ${Math.ceil(d.cost-this.gold)} 黄金`};
    this.gold-=d.cost;this.queue.push({type,remaining:d.train,total:d.train});this.emit('train',{unitType:type});return {ok:true};
  }
  cancelTraining(index=this.queue.length-1){if(['won','lost'].includes(this.status)||!this.queue[index])return false;this.gold+=UNITS[this.queue[index].type].cost;this.queue.splice(index,1);return true;}
  command(order){if(!['garrison','defend','attack'].includes(order))return;this.order=order;this.selected=null;this.emit('order',{order});}
  skill(type){
    if(this.status!=='playing')return {ok:false,message:'开始战斗后可施放技能'};
    if(type==='rage'&&this.rageCooldown<=0){this.rage=12;this.rageCooldown=55;this.emit('skill',{skill:type});return {ok:true};}
    if(type==='heal'&&this.healCooldown<=0){this.healCooldown=65;for(const u of this.units.filter(u=>u.team===0&&u.hp>0)){u.hp=Math.min(u.maxHP,u.hp+u.maxHP*.45);this.effect('heal',u.x,u.lane,1.2);}this.emit('skill',{skill:type});return {ok:true};}
    return {ok:false,message:'技能正在冷却'};
  }
  useItem(type){
    if(!ITEMS[type])return {ok:false,message:'道具不存在'};if(this.status!=='playing')return {ok:false,message:'开始战斗后可使用道具'};
    if(this.itemCooldown>0)return {ok:false,message:`道具准备中，剩余 ${Math.ceil(this.itemCooldown)} 秒`};
    if(type==='reinforcements'&&population(this.units,this.queue)>37)return {ok:false,message:'援军需要 3 个空闲人口'};
    if(type==='repair'&&this.baseHP>=this.baseMax)return {ok:false,message:'雕像完好，无需修复'};
    if(['arrows','frost'].includes(type)&&!this.units.some(u=>u.team===1&&u.hp>0))return {ok:false,message:'当前没有可以命中的敌军'};
    if(type==='gold'){this.gold+=350;this.effect('gold',220,-80,1.7,{value:350});}
    if(type==='mining')this.miningBoost=30;
    if(type==='reinforcements'){this.spawn('sword',0,210);this.spawn('sword',0,180);this.spawn('archer',0,150);this.stats.trained+=3;}
    if(type==='arrows'){for(const u of [...this.units].filter(u=>u.team===1&&u.hp>0))this.hit(u,100);this.effect('arrowrain',1350,-20,1.8);}
    if(type==='repair'){this.baseHP=Math.min(this.baseMax,this.baseHP+this.baseMax*.35);this.effect('heal',175,-60,1.6);}
    if(type==='frost'){for(const u of this.units.filter(u=>u.team===1&&u.hp>0)){u.slow=8;u.slowFactor=.35;}this.effect('frost',1350,-20,1.8);}
    this.itemCooldown=8;this.stats.items++;this.emit('item',{item:type});return {ok:true};
  }
  effect(type,x,lane,life,extra={}){this.effects.push({type,x,lane,life,maxLife:life,...extra});}
  hit(target,amount,source,applySkin=true){
    if(!target||target.hp<=0)return;const actual=Math.min(target.hp,Math.max(0,amount));target.hp=Math.max(0,target.hp-actual);target.hurt=.16;this.effect('hit',target.x,target.lane-32,.3,{value:Math.round(actual),team:target.team});
    if(source&&applySkin){const bonus=(SKINS[source.skin]||SKINS.classic).bonus;
      if(bonus.slow&&target.type!=='cart'){target.slow=Math.max(target.slow||0,bonus.slow);target.slowFactor=Math.min(target.slowFactor||.7,.7);}
      if(bonus.burn&&target.type!=='cart'){target.burn=bonus.burn;target.burnTeam=source.team;}
      if(bonus.leech&&source.hp>0)source.hp=Math.min(source.maxHP,source.hp+actual*bonus.leech);
      if(bonus.chain){const next=this.units.find(u=>u.id!==target.id&&u.team!==source.team&&u.hp>0&&Math.abs(u.x-target.x)<85);if(next){this.hit(next,actual*bonus.chain,source,false);this.effect('lightning',target.x,target.lane-40,.3,{toX:next.x,toLane:next.lane-40});}}
    }
    if(target.hp<=0&&target.type!=='cart'){this.emit('death',{unit:target.type,team:target.team});this.effect('death',target.x,target.lane,.7,{team:target.team});if(target.team){this.stats.kills++;if(target.boss)this.stats.bosses++;this.gold+=18+UNITS[target.type].pop*7;}else{this.stats.lost++;if(this.selected===target.id)this.selected=null;}}
    if(source?.type==='giant'&&target.hp>0&&target.type!=='cart')target.x=Math.max(80,Math.min(WORLD-80,target.x+(source.team?-18:18)));
  }
  strike(u,target,base=false){
    const d=UNITS[u.type],skin=SKINS[u.skin]||SKINS.classic;u.cooldown=d.cooldown;u.swing=.4;u.action='attack';let damage=u.damage*(skin.bonus.damage||1)*(u.team===0&&this.rage>0?1.6:1);if(u.id===this.selected&&this.manual.attack)damage*=1.35;
    if(base){if(u.type==='giant')damage*=2;if(u.team)this.baseHP=Math.max(0,this.baseHP-damage);else this.enemyHP=Math.max(0,this.enemyHP-damage);this.effect('hit',u.team?175:WORLD-175,-50,.4,{value:Math.round(damage)});}
    else if(u.type==='archer'||u.type==='mage'){this.projectiles.push({x:u.x,fromX:u.x,target:target.id,toX:target.x,lane:u.lane-43,toLane:target.lane-35,progress:0,speed:u.type==='mage'?550:820,type:u.type,team:u.team,skin:u.skin,source:u.id,damage});}
    else if(u.type==='giant'){for(const t of [...this.units,...(this.convoy?[this.convoy]:[])].filter(t=>t.team!==u.team&&t.hp>0&&Math.abs(t.x-target.x)<90))this.hit(t,damage,u);this.effect('stomp',target.x,target.lane,.5);}
    else this.hit(target,damage,u);if(u.team===0)this.emit('attack',{unit:u.type});
  }
  move(u,targetX,dt,speedFactor=1){
    const delta=targetX-u.x,skin=SKINS[u.skin]||SKINS.classic,weather=this.config.modifier==='snow'?.86:1,slow=u.slow>0?u.slowFactor:1,boost=u.type==='miner'&&this.miningBoost>0&&!u.team?1.25:1;
    if(Math.abs(delta)>3){u.facing=Math.sign(delta);u.x+=Math.sign(delta)*Math.min(Math.abs(delta),UNITS[u.type].speed*dt*speedFactor*(skin.bonus.speed||1)*weather*slow*boost);u.action='walk';}else u.action='idle';
  }
  nextEnemyWave(){
    this.wave++;let troops;if(this.survival){this.config.types=['sword','archer','spear','mage','giant'].slice(0,Math.min(5,2+Math.floor(this.wave/3)));troops=Array.from({length:Math.min(9,2+this.wave)},()=>this.config.types[Math.floor(this.random()*this.config.types.length)]);this.nextWave+=36;}
    else if(this.waveIndex<this.config.waves.length){troops=this.config.waves[this.waveIndex].units;this.waveIndex++;this.nextWave=this.config.waves[this.waveIndex]?.at??this.time+55;}
    else{troops=[this.config.types[this.wave%this.config.types.length],this.config.types[0]];this.nextWave+=55;}
    const room=40-this.units.filter(u=>u.team===1&&u.hp>0).length;troops.slice(0,Math.max(0,room)).forEach((value,i)=>{const boss=value.endsWith('!'),type=value.replace('!','');this.spawn(type,1,WORLD-220-i*33,{boss});if(boss)this.emit('boss',{unitType:type});});this.emit('wave',{wave:this.wave});
  }
  update(dt){
    if(this.status!=='playing')return;dt=Math.min(.1,Math.max(0,dt));this.time+=dt;for(const key of ['rage','rageCooldown','healCooldown','miningBoost','itemCooldown'])this[key]=Math.max(0,this[key]-dt);
    this.gold+=dt*1.5;this.enemyGold+=dt*this.config.income*this.factor;for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
    if(this.queue.length){this.queue[0].remaining-=dt;if(this.queue[0].remaining<=0){const q=this.queue.shift();this.spawn(q.type,0);this.stats.trained++;this.emit('trained',{unitType:q.type});}}
    this.enemyTimer-=dt;if(this.enemyTimer<=0&&this.units.filter(u=>u.team===1).length<28){const type=this.config.types[Math.floor(this.random()*this.config.types.length)];if(this.enemyGold>=UNITS[type].cost*.85){this.enemyGold-=UNITS[type].cost*.85;this.spawn(type,1);}this.enemyTimer=this.config.interval/(this.factor*(this.survival?1+this.wave*.07:1));}
    if(this.time>=this.nextWave)this.nextEnemyWave();
    if(this.config.modifier==='embers'&&this.time>=this.nextHazard){this.nextHazard+=8;for(const u of this.units.filter(u=>Math.abs(u.x-1350)<165&&u.hp>0))this.hit(u,18);this.effect('eruption',1350,0,1.3);}
    const alive=this.units.filter(u=>u.hp>0),targets=this.convoy?[...alive,this.convoy]:alive;
    for(const u of alive){
      const slow=u.slow>0?u.slowFactor:1;u.cooldown-=dt*slow;u.hurt=Math.max(0,u.hurt-dt);u.swing=Math.max(0,u.swing-dt);u.phase+=dt*(u.action==='walk'?9:2)*slow;u.slow=Math.max(0,u.slow-dt);if(u.slow===0)u.slowFactor=.7;
      if(u.burn>0){u.burn-=dt;u.burnTick+=dt;if(u.burnTick>=1){u.burnTick-=1;this.hit(u,6,null,false);}}else u.burnTick=0;
      if(u.hp<=0)continue;const def=UNITS[u.type];
      if(u.id===this.selected&&(this.manual.left||this.manual.right)){this.move(u,u.x+(this.manual.right?80:-80),dt,1.2);u.x=Math.max(100,Math.min(WORLD-100,u.x));continue;}
      if(!u.team&&this.order==='garrison'&&u.id!==this.selected){this.move(u,170+(u.id%4)*19,dt,1.2);if(u.x<260)u.hp=Math.min(u.maxHP,u.hp+dt*u.maxHP*.035);continue;}
      if(u.type==='miner'&&u.id!==this.selected){const mineX=400+u.id%3*48,home=220;if(u.cargo>0){this.move(u,home,dt);if(Math.abs(u.x-home)<8){this.gold+=u.cargo;this.stats.goldMined+=u.cargo;this.effect('gold',u.x,u.lane-50,1.5,{value:u.cargo});u.cargo=0;}}else{this.move(u,mineX,dt);if(Math.abs(u.x-mineX)<8){u.action='mine';u.mineTime+=dt*(this.miningBoost>0?2:1);if(u.mineTime>=3.4/(1+(this.upgrades.miner||0)*.2)){u.cargo=Math.round((35+(this.upgrades.miner||0)*8)*(this.config.modifier==='rich'?1.3:1));u.mineTime=0;}}}continue;}
      let target=null,distance=Infinity;for(const t of targets)if(t.team!==u.team&&t.hp>0){const d=Math.abs(t.x-u.x);if(d<distance){distance=d;target=t;}}
      const range=def.range*(def.range>100&&['fog','sandstorm'].includes(this.config.modifier)?.8:1),baseX=u.team?175:WORLD-175,baseDistance=Math.abs(u.x-baseX),isManual=u.id===this.selected,mayAttack=!isManual||this.manual.attack,canSiege=u.team||(!this.survival&&['destroy','timed'].includes(this.config.goal));
      if(distance<=range+12&&mayAttack){u.action='attack';u.facing=Math.sign(target.x-u.x)||u.facing;if(u.cooldown<=0)this.strike(u,target);}
      else if(baseDistance<=range+40&&mayAttack&&(u.team||this.order==='attack'||isManual)&&canSiege){u.action='attack';u.facing=u.team?-1:1;if(u.cooldown<=0)this.strike(u,null,true);}
      else if(!isManual){let dest;if(u.team)dest=this.wave>0?(target?target.x:190):WORLD-520-(u.id%5)*24;else if(this.order==='attack')dest=target?target.x:WORLD-180;else dest=target&&target.x<860?target.x:620-(u.id%5)*28-(def.range>100?120:0);if(target&&Math.abs(dest-target.x)<2)dest-=(target.x>u.x?1:-1)*(range-5);this.move(u,dest,dt,this.rage>0&&!u.team?1.2:1);}else u.action='idle';
    }
    for(const p of this.projectiles){p.progress+=dt*p.speed/Math.max(70,Math.abs(p.toX-p.fromX));p.x=p.fromX+(p.toX-p.fromX)*Math.min(1,p.progress);if(p.progress>=1){const source=this.units.find(u=>u.id===p.source)||{skin:p.skin,team:p.team,type:p.type};if(p.type==='mage'){this.effect('magic',p.toX,p.toLane,.6);for(const t of targets.filter(u=>u.team!==p.team&&u.hp>0&&Math.abs(u.x-p.toX)<100))this.hit(t,p.damage,source);}else this.hit(targets.find(u=>u.id===p.target),p.damage,source);}}
    this.projectiles=this.projectiles.filter(p=>p.progress<1);this.towerCooldown-=dt;if(this.towerCooldown<=0){const invader=this.units.find(u=>u.team===1&&u.hp>0&&u.x<380);if(invader){this.hit(invader,20);this.towerCooldown=1.7;this.effect('tower',invader.x,invader.lane,.3);}}
    if(this.convoy){const blocked=this.units.some(u=>u.team===1&&u.hp>0&&Math.abs(u.x-this.convoy.x)<190),escort=this.units.some(u=>u.team===0&&u.type!=='miner'&&u.hp>0&&u.x>=this.convoy.x+90&&u.x<this.convoy.x+650);this.convoy.stopped=blocked||(!escort&&this.convoy.x<2290);this.convoy.waiting=!blocked&&!escort;if(!this.convoy.stopped)this.convoy.x=Math.min(2380,this.convoy.x+16*dt);this.convoy.hurt=Math.max(0,this.convoy.hurt-dt);}
    this.units=this.units.filter(u=>u.hp>0);
    if(this.baseHP<=0)this.finish(false,'秩序雕像已被摧毁');else if(this.convoy?.hp<=0)this.finish(false,'矿车被敌军摧毁，护送失败');else if(!this.survival){if(this.config.goal==='defend'&&this.time>=this.config.duration)this.finish(true);else if(this.config.goal==='escort'&&this.convoy.x>=2380)this.finish(true);else if(['destroy','timed'].includes(this.config.goal)&&this.enemyHP<=0)this.finish(true);else if(this.config.goal==='timed'&&this.time>=this.config.duration)this.finish(false,'突破时限已到，敌方雕像仍然屹立');}
  }
  finish(win,reason=''){if(this.status!=='playing')return;this.status=win?'won':'lost';this.lossReason=reason;this.emit('end',{win,reason});}
  snapshot(){const {events,effects,manual,...data}=this;return JSON.parse(JSON.stringify(data));}
  static restore(data){
    if(!data||data.schema!==2||!['ready','playing','paused'].includes(data.status)||!Array.isArray(data.units)||!Array.isArray(data.queue)||!Number.isFinite(data.gold)||!Number.isFinite(data.time)||data.units.some(u=>!UNITS[u.type]||!Number.isFinite(u.x)||!Number.isFinite(u.hp))||data.queue.some(q=>!UNITS[q.type]||!Number.isFinite(q.remaining)))return null;
    const battle=new Battle(data);Object.assign(battle,data);battle.level=Math.max(0,Math.min(LEVELS.length-1,battle.level));battle.config=battle.survival?survivalConfig():LEVELS[battle.level];if(battle.survival)battle.config.types=['sword','archer','spear','mage','giant'].slice(0,Math.min(5,2+Math.floor(battle.wave/3)));
    battle.events=[];battle.effects=[];battle.manual={left:false,right:false,attack:false};battle.selected=null;if(battle.status==='playing')battle.status='paused';return battle;
  }
}
