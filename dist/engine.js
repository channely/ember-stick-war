import * as content from './content.js';
import { RULESET_VERSION, FIXED_STEP, WORLD, POPULATION_CAP, QUEUE_CAP, DIFFICULTY, UNITS, population, upgradeLevel, emptyManual, idleAction } from './rules.js';
import { clamp, distance, separateUnits } from './sim/geometry.js';
import { definition, homeX, baseX, isAlive } from './sim/unit-utils.js';
import { economyMethods } from './sim/economy.js';
import { aiMethods } from './sim/ai.js';
import { combatMethods } from './sim/combat.js';
export { LEVELS } from './content.js';
export { UNITS, WORLD, population } from './rules.js';

const clone = value => JSON.parse(JSON.stringify(value));
const validNumber = (n, min = -Infinity, max = Infinity) => Number.isFinite(n) && n >= min && n <= max;

/** Deterministic simulation; rendering and wall-clock time never drive combat. */
export class Battle {
  constructor({ level=0, levelId, difficulty='normal', upgrades={}, loadout={}, survival=false, seed=24, assisted=false, practice=null }={}) {
    if (levelId) { const found=content.LEVELS.findIndex(l=>l.id===levelId); if(found>=0)level=found; }
    this.schema=3; this.rulesetVersion=RULESET_VERSION; this.campaignId=content.CAMPAIGN_ID || 'classic-v3';
    this.level=clamp(Math.floor(level)||0,0,content.LEVELS.length-1); this.levelId=content.LEVELS[this.level].id;
    this.difficulty=DIFFICULTY[difficulty]?difficulty:'normal'; this.factor=DIFFICULTY[this.difficulty];
    this.upgrades={...upgrades}; this.loadout={...loadout}; this.survival=!!survival; this.assisted=!!assisted;
    this.practice=UNITS[practice]?practice:(practice?'sword':null); this.seed=seed>>>0; this.accumulator=0;
    this.config=clone(content.LEVELS[this.level]);
    if(survival)this.config={...this.config,goal:'defend',duration:0,waves:[],bossFinal:false,modifier:'night'};
    this.allowedTypes=this.practice||survival?Object.keys(UNITS):[...(this.config.playerTypes||Object.keys(UNITS))];
    this.time=0; this.status='ready'; this.order='defend'; this.enemyOrder='defend';
    this.gold=this.practice?0:(this.config.startGold??600); this.enemyGold=this.config.enemyGold??350;
    this.baseMax=1500+400*upgradeLevel(this.upgrades,'statue','health'); this.baseHP=this.baseMax;
    this.enemyMax=Math.round((this.config.hp||1000)*this.factor); this.enemyHP=this.enemyMax;
    this.units=[]; this.queue=[]; this.enemyQueue=[]; this.projectiles=[]; this.effects=[]; this.events=[];
    this.nextId=1; this.selected=null; this.manual=emptyManual(); this.previousAttack=false; this.pendingActions=[]; this.manualHealTimer=0;
    this.wave=0; this.waveIndex=0; this.nextWave=survival?45:(this.config.waves[0]?.at??Infinity);
    this.nextHazard=8; this.enemyTimer=0; this.aiTimer=0; this.enemyEnabled=!this.practice;
    this.rage=0; this.spearRage=0; this.rageCooldown=0; this.healCooldown=0; this.towerCooldown=0;
    this.enemyTowerCooldown=0; this.miningBoost=0; this.itemCooldown=0; this.lossReason='';
    this.stats={kills:0,trained:0,goldMined:0,enemyGoldMined:0,goldSpent:0,enemyGoldSpent:0,goldRefunded:0,enemyGoldRefunded:0,passiveGold:0,enemyPassiveGold:0,lost:0,items:0,bosses:0,scriptedEnemies:0,practiceActions:0};
    this.practiceProgress={done:0,total:this.practice==='miner'?1:3,label:this.practice==='miner'?'采掘黄金并运回营地':'完成 3 次有效攻击或专属动作'};
    this.bossSpawned=false; this.bossDefeated=false; this.bossPhase=false;
    this.convoy=this.config.goal==='escort'?{id:-1,type:'cart',team:0,x:360,lane:35,hp:900,maxHP:900,hurt:0,stopped:false}:null;
    this.mines=this.makeMines();
    if(this.practice){
      // Exercise gear is local to this Battle and never grants skin ownership.
      this.spawn(this.practice,0,this.practice==='miner'?390:650,{lane:15,...(this.practice==='giant'?{skin:'leaf'}:{})});
      this.selected=this.units[0].id;
      for(let i=0;i<3;i++)this.spawn('sword',1,820+i*55,{lane:-15+i*32,dummy:true});
      this.enemyGold=0; this.nextWave=Infinity;
    } else {
      const allies=this.config.startingAllies||['miner','miner','sword'];
      const enemies=this.config.startingEnemies||['miner','miner','sword'];
      allies.forEach((type,i)=>this.spawnScripted(type,0,UNITS[type.replace('!','')]?.role==='经济'?350+i*35:530+i*12,i));
      enemies.forEach((type,i)=>this.spawnScripted(type,1,2320-i*35,i));
    }
  }

  random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
  emit(type,data={}){this.events.push({type,...data});if(this.events.length>512)this.events.shift();}
  effect(type,x,lane,life,extra={}){this.effects.push({type,x,lane,life,maxLife:life,...extra});}
  getUnit(id){return this.units.find(u=>u.id===id&&u.hp>0);}
  upgrade(type,branch){return upgradeLevel(this.upgrades,type,branch);}
  skinBonus(unit){const skin=content.SKINS[unit.skin]||content.SKINS.classic;return {...skin?.bonus,...skin?.perUnit?.[unit.type]};}
  makeMines(){
    const spec=this.config.mines||{}, amount=Number(spec.amount)||3400, slots=Number(spec.slots)||2;
    return [
      {x:420,lane:-20,team:0},{x:550,lane:55,team:0},{x:760,lane:-20,team:0},{x:1080,lane:45,team:0},
      {x:1620,lane:45,team:1},{x:1940,lane:-20,team:1},{x:2150,lane:55,team:1},{x:2280,lane:-20,team:1}
    ].map((m,i)=>({id:`mine-${i}`,capacity:amount,remaining:amount,slots,...m}));
  }
  spawnScripted(value,team,x,index=0){
    const boss=value.endsWith('!'), unit=this.spawn(value.replace('!',''),team,x,{lane:-20+(index%4)*28,boss});
    if(boss&&unit){this.bossSpawned=true;this.emit('boss',{unitType:unit.type});} return unit;
  }
  spawn(type,team,x,options={}){
    const d=definition(type);if(!d)return null;
    team=team?1:0;
    const health=team?this.factor:1+.2*this.upgrade(type,'health');
    const damage=team?this.factor:1+.2*this.upgrade(type,'damage');
    const skin=content.SKINS[options.skin]?options.skin:(team?(this.config.enemySkin||'classic'):(content.SKINS[this.loadout[type]]?this.loadout[type]:'classic'));
    const hp=Math.round(d.hp*health*(options.boss?2.4:1));
    const u={id:this.nextId++,type,team,skin,boss:!!options.boss,ownerId:options.ownerId??null,
      summoned:type==='minion',dummy:!!options.dummy,clubman:type==='sword'&&!team&&this.level<3&&!this.upgrade('sword','damage'),x:clamp(x??homeX(team),90,WORLD-90),lane:clamp(options.lane??(-25+this.random()*90),-45,80),
      hp,maxHP:hp,damage:d.damage*damage*(options.boss?1.3:1),facing:team?-1:1,radius:d.radius,
      cooldown:0,cooldowns:{primary:0,secondary:0,special:0},action:'idle',actionState:idleAction(),actionProgress:0,
      phase:this.random()*6.28,swing:0,hurt:0,hidden:false,stun:0,freezeImmunity:0,hasSpear:type==='spear',rearm:0,
      cargo:0,cargoCapacity:50+(team?0:this.upgrade('miner','bag')*10),mineTime:0,mineId:null,slow:0,slowFactor:.7,burn:0,burnTick:0,burnTeam:0,blocking:false};
    this.units.push(u);return u;
  }
  trainingInfo(type,team=0){
    const d=UNITS[type];if(!d)return null;
    const leaf=(team?this.config.enemySkin:this.loadout[type])==='leaf';
    return {cost:this.practice&&!team?0:Math.ceil(d.cost*(leaf?.9:1)),train:d.train*(leaf?.5:1),pop:d.pop,unlocked:team||this.allowedTypes.includes(type)};
  }
  dispatch(command={}){
    const type=command.type;
    if(type==='train')return this.train(command.unitType??command.unit);
    if(type==='cancel'||type==='cancel-training')return {ok:this.cancelTraining(command.index)};
    if(type==='order'||type==='command')return this.command(command.order);
    if(type==='item')return this.useItem(command.item??command.itemType);
    if(type==='start'){this.start();return {ok:this.status==='playing'};}
    if(type==='pause'){if(this.status==='playing')this.status='paused';this.resetInput();return {ok:true};}
    if(type==='resume'){if(this.status==='paused')this.status='playing';this.resetInput();return {ok:true};}
    if(type==='reset-input'){this.resetInput();return {ok:true};}
    if(type==='release'){this.selected=null;this.resetInput();return {ok:true};}
    if(type==='select'){
      const unit=this.getUnit(command.id);if(!unit||unit.team||unit.hidden||unit.type==='minion')return {ok:false,message:'请选择在场的己方士兵'};
      this.selected=unit.id;this.resetInput();return {ok:true};
    }
    if(type==='move'){this.manual.x=clamp(Number(command.x)||0,-1,1);this.manual.y=clamp(Number(command.y)||0,-1,1);return {ok:true};}
    if(type==='aim'){if(Number.isFinite(command.x))this.manual.aimX=command.x;if(Number.isFinite(command.lane))this.manual.aimLane=command.lane;return {ok:true};}
    if(type==='manual'){
      for(const key of ['x','y'])if(key in command)this.manual[key]=clamp(Number(command[key])||0,-1,1);
      for(const key of ['attack','secondary','special'])if(key in command)this.setManualButton(key,!!command[key]);
      for(const key of ['aimX','aimLane'])if(key in command)this.manual[key]=Number.isFinite(command[key])?command[key]:null;
      return {ok:true};
    }
    if(type==='action'){
      const key={primary:'attack',secondary:'secondary',special:'special'}[command.action];
      if(!key)return {ok:false,message:'未知动作'};
      if(command.pressed!==undefined){this.setManualButton(key,!!command.pressed);return {ok:true};}
      const unit=this.getUnit(this.selected);if(!unit||this.status!=='playing')return {ok:false,message:'请先接管一个单位'};
      return {ok:this.requestAction(unit,command.action,true)};
    }
    return {ok:false,message:'未知指令'};
  }
  setManualButton(key,pressed){
    const previous=!!this.manual[key],unit=this.getUnit(this.selected);this.manual[key]=pressed;
    if(!unit||pressed===previous||this.status!=='playing')return;
    const action=key==='attack'?'primary':key;
    const isHeldBlock=key==='secondary'&&['sword','spear'].includes(unit.type);
    const isMinerWork=key==='attack'&&unit.type==='miner';
    const isArrow=key==='attack'&&unit.type==='archer';
    if(!isHeldBlock&&!isMinerWork&&((isArrow&&!pressed)||(!isArrow&&pressed))){
      this.pendingActions.push({id:unit.id,action,expires:this.time+.22});
      this.pendingActions=this.pendingActions.slice(-4);
    }
  }
  resetInput(){this.manual=emptyManual();this.previousAttack=false;this.pendingActions=[];const unit=this.getUnit(this.selected);if(unit){unit.blocking=false;if(unit.actionState.kind==='aim'||unit.actionState.kind==='block')unit.actionState=idleAction();}}
  start(){if(this.status==='ready'){this.status='playing';this.emit('start');}}
  train(type,team=0){
    if(!UNITS[type])return {ok:false,message:'未知兵种'};
    if(['won','lost'].includes(this.status)||(!team&&this.status==='paused'&&!this.assisted))return {ok:false,message:'请先继续战斗'};
    const info=this.trainingInfo(type,team),queue=team?this.enemyQueue:this.queue,key=team?'enemyGold':'gold';
    if(!info.unlocked)return {ok:false,message:'该兵种尚未在经典战役解锁'};
    if(queue.length>=QUEUE_CAP)return {ok:false,message:'训练队列已满（5 个）'};
    if(population(this.units,queue,team)+info.pop>POPULATION_CAP)return {ok:false,message:'已达到 50 人口上限'};
    if(this[key]<info.cost)return {ok:false,message:`还需要 ${Math.ceil(info.cost-this[key])} 黄金`};
    this[key]-=info.cost;this.stats[team?'enemyGoldSpent':'goldSpent']+=info.cost;
    queue.push({type,remaining:info.train,total:info.train,paid:info.cost});
    if(!team)this.emit('train',{unitType:type});return {ok:true};
  }
  cancelTraining(index=this.queue.length-1){
    if(['won','lost'].includes(this.status)||!this.queue[index])return false;
    const [q]=this.queue.splice(index,1);this.gold+=q.paid;this.stats.goldRefunded+=q.paid;return true;
  }
  command(order){
    if(!['garrison','defend','attack'].includes(order))return {ok:false,message:'未知军团指令'};
    if(this.status==='paused'&&!this.assisted)return {ok:false,message:'暂停时可先观察，继续后下令'};
    this.order=order;this.selected=null;this.resetInput();this.emit('order',{order});return {ok:true};
  }
  skill(){return {ok:false,message:'全军增益已改为背包道具'};}
  useItem(type){
    if(!content.ITEMS[type])return {ok:false,message:'道具不存在'};
    if(this.status!=='playing')return {ok:false,message:'开始战斗后使用道具'};
    if(this.practice)return {ok:false,message:'练习不消耗背包道具'};
    if(this.itemCooldown>0)return {ok:false,message:`道具准备中，还需 ${Math.ceil(this.itemCooldown)} 秒`};
    const allies=this.units.filter(u=>!u.team&&u.hp>0),enemies=this.units.filter(u=>u.team&&isAlive(u));
    if(type==='reinforcements'&&population(this.units,this.queue)>47)return {ok:false,message:'援军需要 3 个空闲人口'};
    if(type==='reinforcements'&&!this.allowedTypes.includes('archer'))return {ok:false,message:'需要先解锁弓手科技'};
    if(type==='arrows'&&!enemies.length)return {ok:false,message:'当前没有可命中的敌人'};
    if(type==='heal'&&!allies.some(u=>u.hp<u.maxHP))return {ok:false,message:'部队状态完好'};
    if(type==='mining'&&!allies.some(u=>u.type==='miner'))return {ok:false,message:'需要在场矿工'};
    if(type==='rage'&&!allies.some(u=>u.type==='sword'))return {ok:false,message:'需要在场剑士'};
    if(type==='spear'&&!allies.some(u=>u.type==='spear'))return {ok:false,message:'需要在场盾矛兵'};
    if(type==='mining')this.miningBoost=30;
    if(type==='rage')this.rage=12;
    if(type==='spear')this.spearRage=12;
    if(type==='arrows'){for(const u of enemies)this.hit(u,100,null,false);this.effect('arrowrain',1350,0,1.3);}
    if(type==='heal')for(const u of allies){u.hp=Math.min(u.maxHP,u.hp+u.maxHP*.45);this.effect('heal',u.x,u.lane,1);}
    if(type==='reinforcements'){this.spawn('sword',0,205,{lane:-20});this.spawn('sword',0,185,{lane:25});this.spawn('archer',0,155,{lane:65});this.stats.trained+=3;}
    this.itemCooldown=8;this.stats.items++;this.emit('item',{item:type});return {ok:true};
  }

  updateGarrison(unit,dt){
    // Giants retreat to the statue but cannot fit inside the castle.
    if(unit.type==='giant'){
      unit.hidden=false;this.move(unit,{x:homeX(unit.team)+(unit.team?-100:100),lane:15},dt);
      return;
    }
    const target={x:homeX(unit.team),lane:clamp(-20+(unit.id%4)*28,-45,80)};
    if(!unit.hidden){this.move(unit,target,dt,1.1);if(Math.abs(unit.x-target.x)<30){unit.hidden=true;unit.action='garrison';unit.actionState=idleAction('garrison');this.deposit(unit);}}
    if(unit.hidden){
      unit.hp=Math.min(unit.maxHP,unit.hp+dt*unit.maxHP*.035);unit.stun=0;
      if(unit.type==='spear'&&!unit.hasSpear){unit.rearm+=dt;if(unit.rearm>=3){unit.hasSpear=true;unit.rearm=0;this.emit('rearm',{id:unit.id});}}
    }
  }
  updateManual(unit,dt){
    const manual=this.manual,x=clamp(Number(manual.x)||((manual.right?1:0)-(manual.left?1:0)),-1,1),y=clamp(Number(manual.y)||0,-1,1);
    if(this.isBusy(unit))return;
    unit.blocking=!!manual.secondary&&['sword','spear'].includes(unit.type);
    if(unit.blocking){unit.action='block';unit.actionState=idleAction('block');}
    else if(unit.actionState.kind==='block')unit.actionState=idleAction();
    if(unit.type==='archer'){
      if(manual.attack){unit.action='aim';unit.actionState=idleAction('aim');const aim=this.aimFor(unit,this.targetFor(unit));unit.actionState.aimX=aim.x;unit.actionState.aimLane=aim.lane;unit.facing=Math.sign(aim.x-unit.x)||unit.facing;}
      else if(this.previousAttack){unit.actionState=idleAction();if(this.requestAction(unit,'primary',true))return;}
      else if(unit.actionState.kind==='aim')unit.actionState=idleAction();
    } else if(manual.special&&this.requestAction(unit,'special',true))return;
    else if(manual.secondary&&!unit.blocking&&this.requestAction(unit,'secondary',true))return;
    else if(manual.attack&&!unit.blocking&&unit.type!=='miner'&&this.requestAction(unit,'primary',true))return;
    if(x||y){const length=Math.max(1,Math.hypot(x,y));this.move(unit,{x:unit.x+x/length*100,lane:unit.lane+y/length*100},dt,unit.type==='archer'&&manual.attack?.65:1);}
    else if(!unit.blocking&&unit.type!=='miner'&&unit.actionState.kind!=='aim'){unit.action='idle';unit.actionState=idleAction();}
    if(unit.type==='miner')this.updateMiner(unit,dt,true);
  }
  updateSoldierAI(unit,dt){
    if(unit.dummy){unit.action='idle';return;}
    const order=unit.team?this.enemyOrder:this.order,target=this.targetFor(unit),range=this.actionRange(unit),d=target?distance(unit,target):Infinity;
    if(unit.type==='sword'&&target&&d>90&&d<180&&unit.cooldowns.special<=0&&this.random()<.035){
      unit.facing=Math.sign(target.x-unit.x)||unit.facing;
      if(this.requestAction(unit,'special'))return;
    }
    if(unit.type==='spear'&&target&&unit.cooldowns.primary>.25){
      const incoming=this.projectiles.some(p=>p.team!==unit.team&&(p.x-unit.x)*unit.facing>0&&Math.abs(p.x-unit.x)<230);
      unit.blocking=d<range+25||incoming;
      if(unit.blocking){unit.action='block';unit.actionState=idleAction('block');}
    }
    if(unit.type==='mage'&&unit.cooldowns.secondary<=0&&target&&d<650&&this.requestAction(unit,'secondary'))return;
    if(target&&d<=range+9){
      unit.facing=Math.sign(target.x-unit.x)||unit.facing;
      if(unit.cooldowns.primary<=0)this.strike(unit,target);else unit.action='idle';return;
    }
    const statue={x:baseX(1-unit.team),lane:15};
    if(this.canSiege(unit)&&distance(unit,statue)<range+42&&(unit.team||order==='attack')){if(unit.cooldowns.primary<=0)this.strike(unit,null,true);return;}
    let destination;
    const defenseX=unit.team?WORLD-650:650;
    const inDefense=target&&(unit.team?target.x>WORLD-900:target.x<900);
    if(order==='attack'||inDefense){
      if(target){
        const dx=target.x-unit.x,dy=target.lane-unit.lane,length=Math.max(1,Math.hypot(dx,dy)),standOff=Math.max(18,range-5);
        destination={x:target.x-dx/length*standOff,lane:target.lane-dy/length*standOff};
      }else destination={x:statue.x+(unit.team?1:-1)*(range-8),lane:15};
    } else {
      const ranged=['archer','mage'].includes(unit.type),rear=ranged?135:unit.type==='giant'?25:0;
      destination={x:defenseX+(unit.team?1:-1)*rear,lane:-25+(unit.id%4)*30};
    }
    this.move(unit,destination,dt);
  }
  updateUnit(unit,dt){
    if(unit.hp<=0)return;
    for(const key of Object.keys(unit.cooldowns))unit.cooldowns[key]=Math.max(0,unit.cooldowns[key]-dt*(unit.slow>0?unit.slowFactor:1));
    unit.cooldown=unit.cooldowns.primary;unit.hurt=Math.max(0,unit.hurt-dt);unit.swing=Math.max(0,unit.swing-dt);
    unit.freezeImmunity=Math.max(0,unit.freezeImmunity-dt);unit.slow=Math.max(0,unit.slow-dt);if(!unit.slow)unit.slowFactor=.7;
    unit.phase+=dt*(unit.action==='walk'?9:2);unit.vx=0;unit.vlane=0;
    if(unit.burn>0){unit.burn=Math.max(0,unit.burn-dt);unit.burnTick+=dt;if(unit.burnTick>=1){unit.burnTick-=1;this.hit(unit,6,null,false);}}else unit.burnTick=0;
    if(unit.hp<=0)return;
    const order=unit.team?this.enemyOrder:this.order,isManual=unit.id===this.selected;
    if(isManual&&!unit.team){
      this.manualHealTimer+=dt;
      if(this.manualHealTimer+1e-9>=5){this.manualHealTimer=Math.max(0,this.manualHealTimer-5);if(unit.hp<unit.maxHP){unit.hp=Math.min(unit.maxHP,unit.hp+10);this.effect('heal',unit.x,unit.lane,.65);}}
    }
    if(unit.stun>0){unit.stun=Math.max(0,unit.stun-dt);unit.blocking=false;unit.action='stunned';unit.actionState=idleAction('stunned');return;}
    if(order==='garrison'&&!isManual){this.updateGarrison(unit,dt);return;}
    if(unit.hidden){
      const threatened=unit.type==='miner'&&this.enemyTargets(unit).some(t=>t.type!=='miner'&&Math.abs(t.x-homeX(unit.team))<270);
      if(threatened){this.updateGarrison(unit,dt);return;}
      unit.hidden=false;unit.x=homeX(unit.team)+(unit.team?-45:45);unit.actionState=idleAction();
    }
    this.deposit(unit);
    if(this.isBusy(unit)){
      const state=unit.actionState;state.elapsed+=dt;state.progress=Math.min(1,state.elapsed/state.duration);unit.actionProgress=state.progress;
      if(state.kind==='leap'&&state.phase==='windup')this.move(unit,{x:state.leapEndX,lane:unit.lane},dt,2.6);
      if(!state.released&&state.elapsed+1e-9>=state.windup){state.released=true;state.phase='recover';this.resolveAction(unit,state);}
      if(state.elapsed+1e-9>=state.duration){unit.actionState=idleAction();unit.action='idle';unit.actionProgress=0;}
      return;
    }
    if(isManual){this.updateManual(unit,dt);return;}
    unit.blocking=false;
    if(unit.type==='miner'){this.updateMiner(unit,dt);return;}
    this.updateSoldierAI(unit,dt);
  }
  updateTower(team,dt){
    const key=team?'enemyTowerCooldown':'towerCooldown';this[key]-=dt;if(this[key]>0)return;
    if(!this.units.some(u=>u.team===team&&u.hp>0&&u.hidden))return;
    const target=this.units.filter(u=>u.team!==team&&isAlive(u)&&Math.abs(u.x-homeX(team))<370).sort((a,b)=>Math.abs(a.x-homeX(team))-Math.abs(b.x-homeX(team)))[0];
    if(!target)return;
    const source={id:0,type:'archer',team,skin:'classic',x:homeX(team),lane:15,facing:team?-1:1};
    this.launchProjectile(source,{aimX:target.x,aimLane:target.lane,controlled:false},20+(team?0:this.upgrade('statue','archers')*8),'arrow');
    this[key]=1.7;this.effect('tower',homeX(team),15,.25);
  }
  tick(dt){
    this.time+=dt;
    for(const key of ['rage','spearRage','rageCooldown','healCooldown','miningBoost','itemCooldown'])this[key]=Math.max(0,this[key]-dt);
    for(const effect of this.effects)effect.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
    this.updateQueue(this.queue,0,dt);if(this.enemyEnabled)this.updateQueue(this.enemyQueue,1,dt);
    this.updateEnemyAI(dt);if(this.enemyEnabled&&this.time+1e-9>=this.nextWave)this.nextEnemyWave();
    this.pendingActions=this.pendingActions.filter(input=>{
      const unit=this.getUnit(input.id);
      if(!unit||input.id!==this.selected||input.expires<this.time)return false;
      return !this.requestAction(unit,input.action,true);
    });
    for(const unit of [...this.units])this.updateUnit(unit,dt);
    separateUnits(this.units);this.updateProjectiles(dt);this.updateTower(0,dt);if(this.enemyEnabled)this.updateTower(1,dt);
    if(this.convoy){
      const blocked=this.units.some(u=>u.team&&isAlive(u)&&distance(u,this.convoy)<190),escort=this.units.some(u=>!u.team&&isAlive(u)&&u.type!=='miner'&&u.x>=this.convoy.x+75&&u.x<this.convoy.x+650);
      this.convoy.stopped=blocked||(!escort&&this.convoy.x<2290);this.convoy.waiting=!blocked&&!escort;
      if(!this.convoy.stopped)this.convoy.x=Math.min(2380,this.convoy.x+16*dt);
    }
    this.units=this.units.filter(u=>u.hp>0);this.previousAttack=!!this.manual.attack;
    if(this.practice){if(this.practiceProgress.done>=this.practiceProgress.total)this.finish(true);return;}
    if(this.baseHP<=0)this.finish(false,'我方雕像已被摧毁');
    else if(this.convoy&&this.convoy.hp<=0)this.finish(false,'矿车被摧毁');
    else if(!this.survival){
      if(this.config.goal==='defend'&&this.time+1e-9>=this.config.duration)this.finish(true);
      else if(this.config.goal==='escort'&&this.convoy?.x>=2380)this.finish(true);
      else if(['destroy','timed'].includes(this.config.goal)&&this.enemyHP<=0){
        if(!this.config.bossFinal||this.bossDefeated)this.finish(true);
        else if(!this.bossSpawned){this.bossPhase=true;this.spawnScripted('giant!',1,WORLD-330);this.enemyOrder='attack';}
      }else if(this.config.goal==='timed'&&this.time>=this.config.duration)this.finish(false,'突破时限已到');
    }
  }
  update(dt){
    if(this.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    this.accumulator+=Math.min(1,dt);
    while(this.accumulator+1e-10>=FIXED_STEP&&this.status==='playing'){
      this.accumulator=Math.max(0,this.accumulator-FIXED_STEP);this.tick(FIXED_STEP);
    }
  }
  finish(win,reason=''){
    if(this.status!=='playing')return;this.status=win?'won':'lost';this.lossReason=reason;this.resetInput();this.emit('end',{win,reason});
  }
  snapshot(){
    const {events,effects,manual,config,pendingActions,...state}=this;
    return clone({...state,nextWave:Number.isFinite(this.nextWave)?this.nextWave:null,previousAttack:false});
  }
  static restore(data){
    if(!data||data.schema!==3||data.rulesetVersion!==RULESET_VERSION||data.campaignId!==(content.CAMPAIGN_ID||'classic-v3'))return null;
    const level=content.LEVELS.findIndex(l=>l.id===data.levelId);if(level<0||level!==data.level)return null;
    if(!['ready','playing','paused'].includes(data.status)||!validNumber(data.gold,0)||!validNumber(data.enemyGold,0)||!validNumber(data.time,0)||!validNumber(data.accumulator,0,1))return null;
    if(!Array.isArray(data.units)||data.units.length>300||!Array.isArray(data.queue)||!Array.isArray(data.enemyQueue)||!Array.isArray(data.mines)||!Array.isArray(data.projectiles))return null;
    if(data.units.some(u=>!definition(u.type)||!validNumber(u.x,80,WORLD-80)||!validNumber(u.lane,-45,80)||!validNumber(u.hp,0)||!validNumber(u.maxHP,1)||!u.actionState||!u.cooldowns))return null;
    if([...data.queue,...data.enemyQueue].some(q=>!UNITS[q.type]||!validNumber(q.remaining,0)||!validNumber(q.paid,0)))return null;
    if(data.mines.some(m=>!validNumber(m.remaining,0)||!validNumber(m.capacity,0)||m.remaining>m.capacity))return null;
    const battle=new Battle({...data,level});
    // Only fields belonging to a Battle instance are restored, never arbitrary methods.
    for(const key of Object.keys(battle))if(key in data&&!['config','manual','events','effects'].includes(key))battle[key]=clone(data[key]);
    battle.config=clone(content.LEVELS[level]);if(battle.survival)battle.config={...battle.config,goal:'defend',duration:0,waves:[],bossFinal:false,modifier:'night'};
    battle.nextWave=data.nextWave===null?Infinity:data.nextWave;
    battle.events=[];battle.effects=[];battle.selected=null;battle.resetInput();battle.status='paused';return battle;
  }
}

// Systems share one deterministic state; Battle owns lifecycle and scheduling.
Object.assign(Battle.prototype, economyMethods, aiMethods, combatMethods);
