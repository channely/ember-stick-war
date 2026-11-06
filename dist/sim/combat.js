import { definition, baseX, isAlive } from './unit-utils.js';
import { WORLD, idleAction } from '../rules.js';
import { clamp, distance, moveToward, segmentCircleHit } from './geometry.js';

export const combatMethods = {
  move(unit,target,dt,speedFactor=1){
    const d=definition(unit.type);if(!d||unit.hidden||unit.stun>0)return;
    if(typeof target==='number')target={x:target,lane:unit.lane};
    const oldX=unit.x,oldLane=unit.lane;
    const leaf=unit.skin==='leaf'&&unit.id===this.selected?1.15:1;
    const slow=unit.slow>0?unit.slowFactor:1;
    const boost=unit.type==='miner'&&!unit.team&&this.miningBoost>0?1.25:1;
    const moved=moveToward(unit,target,d.speed*speedFactor*leaf*slow*boost,dt);
    unit.vx=(unit.x-oldX)/dt;unit.vlane=(unit.lane-oldLane)/dt;
    if(Math.abs(unit.x-oldX)>.001)unit.facing=Math.sign(unit.x-oldX);
    if(moved>.01){unit.action='walk';if(!this.isBusy(unit)&&!unit.blocking&&unit.actionState.kind!=='aim')unit.actionState=idleAction('walk');}
  },
  isBusy(u){return ['windup','recover'].includes(u.actionState.phase);},
  enemyTargets(unit){return [...this.units,...(this.convoy?[this.convoy]:[])].filter(t=>t.team!==unit.team&&isAlive(t));},
  targetFor(unit){
    const targets=this.enemyTargets(unit);targets.sort((a,b)=>distance(unit,a)-distance(unit,b)||a.id-b.id);return targets[0]||null;
  },
  canSiege(unit){return unit.team||(!this.survival&&!this.practice&&['destroy','timed'].includes(this.config.goal));},
  actionRange(unit){return unit.type==='spear'&&!unit.hasSpear?37:definition(unit.type).range;},
  aimFor(unit,target){
    if(unit.id===this.selected&&unit.type==='archer'&&Number.isFinite(this.manual.aimX)&&Number.isFinite(this.manual.aimLane))return {x:clamp(this.manual.aimX,0,WORLD),lane:clamp(this.manual.aimLane,-45,80)};
    if(unit.id===this.selected&&unit.type!=='archer'){
      if(unit.type==='mage'&&target&&(target.x-unit.x)*unit.facing>=0)return {x:target.x,lane:target.lane};
      return {x:unit.x+unit.facing*this.actionRange(unit),lane:unit.lane};
    }
    return target?{x:target.x,lane:target.lane}:{x:unit.x+unit.facing*this.actionRange(unit),lane:unit.lane};
  },
  requestAction(unit,action,explicit=false){
    if(!unit||unit.hp<=0||unit.hidden||unit.stun>0||this.isBusy(unit))return false;
    if(action==='secondary'&&(unit.type==='sword'||unit.type==='spear')){unit.blocking=true;unit.action='block';unit.actionState=idleAction('block');return true;}
    let kind=unit.type==='mage'?'blast':'attack',cooldownKey='primary',target=this.targetFor(unit);
    if(unit.id===this.selected&&unit.type!=='archer')target=this.enemyTargets(unit).filter(t=>(t.x-unit.x)*unit.facing>=-5).sort((a,b)=>distance(unit,a)-distance(unit,b)||a.id-b.id)[0]||null;
    if(action==='secondary'){
      cooldownKey='secondary';
      if(unit.type==='mage'){
        const cap=2+(unit.team?0:this.upgrade('mage','summons'));
        if(this.units.filter(u=>u.ownerId===unit.id&&u.hp>0).length>=cap)return false;
        kind='summon';
      } else if(unit.type==='giant'&&unit.skin!=='classic')kind='earthquake';else return false;
    }
    if(action==='special'){
      cooldownKey='special';
      if(unit.type==='sword')kind='leap';
      else if(unit.type==='spear'&&unit.hasSpear)kind='throw';else return false;
    }
    if((unit.cooldowns[cooldownKey]||0)>0)return false;
    if(unit.type==='miner'&&action==='primary'){
      const mine=this.nearestMine(unit,true);if(mine){unit.mineId=mine.id;unit.action='mine';unit.actionState=idleAction('mine');return true;}
      if(!target||distance(unit,target)>this.actionRange(unit)+15)return false;
    }
    if(kind==='attack'&&unit.type==='archer'&&!explicit&&unit.id===this.selected)return false;
    const base=!target||distance(unit,target)>this.actionRange(unit)+20;
    if(base&&this.canSiege(unit)&&Math.abs(unit.x-baseX(1-unit.team))<this.actionRange(unit)+45)
      return this.beginAction(unit,kind,null,true,cooldownKey);
    return this.beginAction(unit,kind,target,false,cooldownKey);
  },
  beginAction(unit,kind,target=null,base=false,cooldownKey='primary'){
    if(this.isBusy(unit)||unit.stun>0||unit.hidden||(unit.cooldowns[cooldownKey]||0)>0)return false;
    const d=definition(unit.type),aim=this.aimFor(unit,target);
    if(base){aim.x=baseX(1-unit.team);aim.lane=15;}
    if(Math.abs(aim.x-unit.x)>1)unit.facing=Math.sign(aim.x-unit.x);
    const windup={leap:.48,throw:.48,summon:.85,earthquake:1.05}[kind]??d.windup;
    const recovery={leap:.32,throw:.4,summon:.4,earthquake:.7}[kind]??d.recovery;
    unit.blocking=false;unit.action=kind==='blast'?'attack':kind;unit.swing=windup+recovery;
    unit.actionState={kind,phase:'windup',elapsed:0,duration:windup+recovery,windup,progress:0,targetId:target?.id??null,base,aimX:aim.x,aimLane:aim.lane,released:false,controlled:unit.id===this.selected};
    if(kind==='leap'){
      const travel=target?clamp((target.x-unit.x)*unit.facing-20,0,125):125;
      unit.actionState.leapEndX=unit.x+unit.facing*travel;
    }
    const cooldown=kind==='leap'?5:kind==='throw'?1:kind==='summon'?12:kind==='earthquake'?14:d.cooldown;
    unit.cooldowns[cooldownKey]=cooldown;if(cooldownKey==='primary')unit.cooldown=cooldown;
    if(unit.team===0)this.emit('attack',{unit:unit.type,action:kind});return true;
  },
  strike(unit,target,base=false){return this.beginAction(unit,unit.type==='mage'?'blast':'attack',target,base);},
  damageFor(unit,controlled=false){
    let value=unit.damage;
    if(unit.skin==='savage')value*=1.1;
    if(!unit.team&&unit.type==='sword'&&this.rage>0)value*=1.6;
    if(!unit.team&&unit.type==='spear'&&this.spearRage>0)value*=1.5;
    if(unit.type==='spear'&&!unit.hasSpear)value*=.55;
    return value;
  },
  progressPractice(amount=1){
    if(!this.practice)return;
    this.stats.practiceActions+=amount;this.practiceProgress.done=Math.min(this.practiceProgress.total,this.stats.practiceActions);
  },
  resolveAction(unit,state){
    const damage=this.damageFor(unit,state.controlled),source={...unit,controlled:state.controlled};
    if(state.kind==='summon'){
      const cap=2+(unit.team?0:this.upgrade('mage','summons'));
      const existing=this.units.filter(u=>u.ownerId===unit.id&&u.hp>0).length;
      if(existing<cap)this.spawn('minion',unit.team,unit.x+unit.facing*(35+(existing%2)*20),{lane:clamp(unit.lane-24+existing*15,-45,80),ownerId:unit.id,skin:unit.skin});
      this.effect('summon',unit.x,unit.lane,.8);if(state.controlled)this.progressPractice();return;
    }
    if(state.kind==='throw'){
      if(!unit.hasSpear)return;unit.hasSpear=false;unit.rearm=0;
      this.launchProjectile(unit,state,damage*3,'spear');return;
    }
    if(unit.type==='archer'){this.launchProjectile(unit,state,damage,'arrow');return;}
    if(state.kind==='earthquake'){
      this.effect('earthquake',unit.x,unit.lane,1.1,{facing:unit.facing,range:420});
      for(const target of this.enemyTargets(unit).filter(t=>(t.x-unit.x)*unit.facing>=0&&distance(unit,t)<420).slice(0,8)){
        this.hit(target,damage*1.25,source);if(target.hp>0){this.applyStun(target,1.2);target.x=clamp(target.x+unit.facing*40,90,WORLD-90);}
      }return;
    }
    if(state.base){
      if(this.canSiege(unit)&&distance(unit,{x:baseX(1-unit.team),lane:15})<=this.actionRange(unit)+55)this.damageBase(1-unit.team,damage*(unit.type==='giant'?2:1));
      return;
    }
    const target=this.getUnit(state.targetId)||(this.convoy?.id===state.targetId?this.convoy:null);
    if(unit.type==='mage'){
      const center={x:state.aimX,lane:state.aimLane};
      if(distance(unit,center)>this.actionRange(unit)+40)return;
      this.effect('blast',center.x,center.lane,.65,{radius:100});
      for(const victim of this.enemyTargets(unit).filter(t=>distance(t,center)<100).sort((a,b)=>distance(a,center)-distance(b,center)).slice(0,5)){this.hit(victim,damage,source);this.applyStun(victim,1);}
      return;
    }
    if(unit.type==='giant'){
      const center=target&&distance(unit,target)<=this.actionRange(unit)+30?target:{x:unit.x+unit.facing*75,lane:unit.lane};
      this.effect('stomp',center.x,center.lane,.65);
      for(const victim of this.enemyTargets(unit).filter(t=>distance(t,center)<95&&(t.x-unit.x)*unit.facing>-20).slice(0,6)){
        this.hit(victim,damage,source);this.applyStun(victim,.45);victim.x=clamp(victim.x+unit.facing*28,90,WORLD-90);
      }return;
    }
    const range=this.actionRange(unit)+(state.kind==='leap'?35:15);
    const victim=target&&isAlive(target)&&distance(unit,target)<range&&(target.x-unit.x)*unit.facing>=-8?target:this.enemyTargets(unit).find(t=>distance(unit,t)<range&&(t.x-unit.x)*unit.facing>=-8);
    if(victim){this.hit(victim,damage*(state.kind==='leap'?2.5:1),source);if(state.kind==='leap')this.effect('land',unit.x,unit.lane,.5);}
  },
  applyStun(unit,time){if(unit.skin!=='savage'&&unit.hp>0)unit.stun=Math.max(unit.stun||0,time);},
  hit(target,amount,source=null,applySkin=true){
    if(!target||target.hp<=0||target.hidden)return 0;
    let applied=Math.max(0,Number(amount)||0);
    const front=source&&(source.x-target.x)*target.facing>=-2;
    if(target.blocking&&front){
      const reduction=target.type==='spear'?.7+(target.team?0:.05*this.upgrade('spear','block')):.4;
      applied*=1-reduction;this.effect('block',target.x,target.lane,.25,{facing:target.facing,unitType:target.type});
    }
    const actual=Math.min(target.hp,applied);target.hp-=actual;target.hurt=.18;
    this.effect('hit',target.x,target.lane-32,.3,{value:Math.round(actual),team:target.team});
    if(applySkin&&source&&actual>0){
      if(source.skin==='ice'){
        target.slow=Math.max(target.slow||0,2);target.slowFactor=.7;
        if(source.controlled&&!(target.freezeImmunity>0)){this.applyStun(target,1);target.freezeImmunity=3;}
      }
      if(source.skin==='lava'&&source.controlled){
        if(!(target.burn>0))target.burnTick=0;
        target.burn=3;target.burnTeam=source.team;
      }
      if(source.skin==='vamp'){
        const livingSource=this.getUnit(source.id);if(livingSource)livingSource.hp=Math.min(livingSource.maxHP,livingSource.hp+actual*.15);
      }
      if(source.skin==='volt'){
        const next=this.units.filter(u=>u.id!==target.id&&u.team!==source.team&&isAlive(u)&&distance(u,target)<85).sort((a,b)=>distance(a,target)-distance(b,target)||a.id-b.id)[0];
        if(next){this.hit(next,actual*.25,source,false);this.effect('lightning',target.x,target.lane-35,.3,{toX:next.x,toLane:next.lane-35});}
      }
      if(target.skin==='lava'){
        const attacker=this.getUnit(source.id);if(attacker&&attacker.hp>0)this.hit(attacker,actual*.15,target,false);
      }
    }
    if(source?.controlled&&source.team===0&&actual>0&&this.practice!=='miner')this.progressPractice();
    if(target.hp<=0&&target.type!=='cart'){
      this.emit('death',{unit:target.type,team:target.team});this.effect('death',target.x,target.lane,.7,{team:target.team,unitType:target.type,skin:target.skin,facing:target.facing,boss:target.boss});
      if(target.team){this.stats.kills++;if(target.boss){this.stats.bosses++;this.bossDefeated=true;}}
      else if(target.type!=='minion'){this.stats.lost++;if(this.selected===target.id){this.selected=null;this.resetInput();}}
    }
    return actual;
  },
  damageBase(team,damage){
    const key=team?'enemyHP':'baseHP';this[key]=Math.max(0,this[key]-Math.max(0,damage));
    this.effect('hit',baseX(team),-40,.35,{value:Math.round(damage),team});
  },
  launchProjectile(unit,state,damage,type){
    const origin={x:unit.x+unit.facing*14,lane:unit.lane};
    const aim={x:state.aimX,lane:state.aimLane},length=Math.max(10,distance(origin,aim)),speed=type==='spear'?640:740;
    const flight=clamp(length/speed,.08,1.8),gravity=180,z=43;
    this.projectiles.push({id:`p-${unit.id}-${this.time}`,type,team:unit.team,skin:unit.skin,source:unit.id,controlled:state.controlled,damage,
      x:origin.x,lane:origin.lane,z,prevX:origin.x,prevLane:origin.lane,prevZ:z,
      vx:(aim.x-origin.x)/length*speed,vlane:(aim.lane-origin.lane)/length*speed,vz:(24-z+.5*gravity*flight*flight)/flight,
      gravity,age:0,maxAge:2.8,progress:0,fromX:origin.x,toX:aim.x,toLane:aim.lane,base:state.base});
  },
  updateProjectiles(dt){
    for(const p of this.projectiles){
      p.prevX=p.x;p.prevLane=p.lane;p.prevZ=p.z;p.age+=dt;
      p.x+=p.vx*dt;p.lane+=p.vlane*dt;p.z+=p.vz*dt-.5*p.gravity*dt*dt;p.vz-=p.gravity*dt;
      p.progress=Math.min(1,p.age/p.maxAge);
      const from={x:p.prevX,lane:p.prevLane},to={x:p.x,lane:p.lane};let nearest=null,tHit=Infinity,headshot=false;
      for(const u of this.units.filter(u=>u.team!==p.team&&isAlive(u))){
        const t=segmentCircleHit(from,to,u,(u.radius||11)+3);if(t===null)continue;
        const z=p.prevZ+(p.z-p.prevZ)*t,height=u.type==='giant'?105:u.type==='minion'?38:62;
        if(z>=0&&z<=height&&t<tHit){nearest=u;tHit=t;headshot=z>height*.72;}
      }
      const enemyBase={x:baseX(1-p.team),lane:15},baseT=segmentCircleHit(from,to,enemyBase,45);
      const canHitBase=p.team||(!this.survival&&!this.practice&&['destroy','timed'].includes(this.config.goal));
      if(canHitBase&&baseT!==null&&baseT<tHit&&p.z<180){this.damageBase(1-p.team,p.damage);p.done=true;}
      else if(nearest){
        const current=this.getUnit(p.source),source={...(current||{}),id:p.source,type:p.type==='spear'?'spear':'archer',team:p.team,skin:p.skin,x:p.prevX,lane:p.prevLane,controlled:p.controlled};
        this.hit(nearest,p.damage*(headshot?1.5:1),source);
        if(headshot){this.emit('headshot',{targetId:nearest.id,unit:p.type});this.effect('headshot',nearest.x,nearest.lane-55,.6,{value:'要害'});}
        p.done=true;
      }
      if(p.z<0||p.age>=p.maxAge||p.x<20||p.x>WORLD-20||p.lane< -90||p.lane>125)p.done=true;
    }
    this.projectiles=this.projectiles.filter(p=>!p.done);
  }
};
