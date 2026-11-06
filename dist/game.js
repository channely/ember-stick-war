import {Battle, UNITS, LEVELS, WORLD, population} from './engine.js';
import {Renderer, icons, icon, portrait} from './art-v2.js';
import {VERSION, REGIONS, SKINS, ITEMS, GOALS, UPGRADE_BRANCHES, availableTypes, missionText} from './content.js';
import {SAVE_KEY, LEGACY_SAVE_KEY, freshProgress, migrateProgress, canPlay, purchaseSkin, equipSkin, purchaseItem, purchaseUpgrade, upgradeAvailable, recordVictory} from './progress.js';
import {createControls} from './input.js';

const $ = id => document.getElementById(id);
const unitTypes = Object.keys(UNITS);
const fmt = n => Math.floor(Number(n)||0).toLocaleString('zh-CN');
const clock = n => `${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ACTIONS = {
  miner:{primary:'采掘',hint:'走到金矿旁，按住采掘；背满黄金后返回我方营地，自动交矿。'},
  sword:{primary:'挥剑',secondary:'举剑格挡',special:'跳斩',hint:'WASD / 摇杆走位；面向敌人按住格挡，找准时机跳斩。'},
  archer:{primary:'拉弓',hint:'按住空格拉弓，鼠标瞄准，松开发箭。触屏按住拉弓，拖动调整准星，松手射击。'},
  spear:{primary:'刺击',secondary:'举盾',special:'投矛',hint:'举盾抵御正面攻击；投矛后使用短剑，返回营地停留以补充长矛。'},
  mage:{primary:'震击',secondary:'召唤',hint:'震击打断近处敌军；召唤随从保护自己。与敌人保持距离。'},
  giant:{primary:'重砸',secondary:'地震',hint:'重砸有明显前摇。穿戴非经典皮肤可施放地震；注意保护两翼。'}
};
const CHAPTERS = [
  {name:'军团初立',subtitle:'第一章 · 认识经济与兵种',symbol:'Ⅰ'},
  {name:'协作进军',subtitle:'第二章 · 建立混编阵线',symbol:'Ⅱ'},
  {name:'战甲试炼',subtitle:'第三章 · 观察装备与敌人',symbol:'Ⅲ'},
  {name:'侧翼与资源',subtitle:'第四章 · 位置与取舍',symbol:'Ⅳ'},
  {name:'混编进阶',subtitle:'第五章 · 节奏与配合',symbol:'Ⅴ'},
  {name:'终局试炼',subtitle:'第六章 · 运用你的发现',symbol:'Ⅵ'}
];
const COACH = [
  '先预测：多一位矿工，会让下一位战士更早还是更晚到来？试一次再比较。',
  '观察敌人：谁在前排？谁在后排？哪一种战士能保护我们的弓箭手？',
  '按 P 暂停，一起说出下一步，再招募或发出军团指令。准备好后继续。',
  '每次只改变一个选择：矿工数量、出发时机或军团组成。结果有什么不同？',
  '先读目标：这一关需要摧毁雕像，还是守住阵地？同一支军团可以有不同计划。',
  '试着亲手控制一个单位，再交还指挥。哪些工作交给自动规则更合适？'
];
let save=freshProgress(), saveAvailable=true, migrated=false, migrationNotice='';
try {
  const current=localStorage.getItem(SAVE_KEY), legacy=localStorage.getItem(LEGACY_SAVE_KEY);
  const parsed=migrateProgress(JSON.parse(current||legacy||'null'));
  save=parsed.save; migrated=parsed.migrated; migrationNotice=parsed.notice||save.migrationNotice||'';
} catch {saveAvailable=false;}
let battle;
try {battle=Battle.restore(save.checkpoint);} catch {battle=null;}
// A finished practice has no active checkpoint. Refreshing should still keep
// the campaign that was set aside, rather than silently starting it over.
if(!battle&&save.campaignCheckpoint){
  try{const original=Battle.restore(save.campaignCheckpoint);if(original&&!original.practice){battle=original;save.family=!!battle.assisted;save.selectedLevel=battle.level;save.selectedLevelId=LEVELS[battle.level].id;save.campaignCheckpoint=null;}}catch{}
}
if(!battle)battle=new Battle({level:save.selectedLevel,difficulty:save.difficulty,upgrades:save.upgrades,loadout:save.loadout,assisted:save.family});
const renderer=new Renderer($('battlefield'),$('minimap'));
renderer.reduced=save.reduced;
let modalOpen=false, wasPlaying=false, modalReturnFocus=null, speed=battle.assisted?.5:1;
let wardrobeUnit='sword', wardrobeTab='upgrades', campaignChapter=0, coachIndex=0;
let resultHandled=false, messageTimer, toastTimer, uiTime=0, saveTime=0, lastTime=performance.now();
let controls;
class Sound {
  constructor(){this.enabled=save.sound;this.ctx=null;this.lastHit=0;}
  unlock(){if(!this.enabled)return;try{this.ctx||=new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}catch{}}
  tone(frequency,duration=.09,type='triangle',volume=.025,delay=0){if(!this.enabled)return;this.unlock();if(!this.ctx)return;const ctx=this.ctx,o=ctx.createOscillator(),g=ctx.createGain(),at=ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(frequency,at);o.frequency.exponentialRampToValueAtTime(Math.max(30,frequency*.55),at+duration);g.gain.setValueAtTime(volume,at);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+duration+.02);}
  play(type,unit){if(type==='attack'||type==='hit'){if(performance.now()-this.lastHit<100)return;this.lastHit=performance.now();this.tone(({archer:730,mage:360,giant:75,spear:170,miner:240})[unit]||125,.065,'triangle',.02);}else if(type==='trained') {this.tone(440);this.tone(660,.14,'sine',.03,.08);}else if(type==='wave')this.tone(110,.35,'triangle',.04);else if(type==='win')[392,494,587,784].forEach((f,i)=>this.tone(f,.4,'triangle',.03,i*.17));else if(type==='skill')this.tone(554,.25,'sine');else this.tone(420);}
}
const sound=new Sound();
function persist(checkpoint=true){
  if(checkpoint)save.checkpoint=['ready','playing','paused'].includes(battle.status)?battle.snapshot():null;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));saveAvailable=true;}catch{saveAvailable=false;}
  $('save-status').textContent=saveAvailable?'本地自动存档':'存储不可用，请保持页面开启';
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function announce(text){$('battle-message').textContent=text;$('battle-message').classList.add('visible');clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('battle-message').classList.remove('visible'),3300);}
function isClubman(type){return type==='sword'&&!battle.practice&&battle.level<3&&!battle.upgrades.swordBlade;}
function selectedUnit(){return battle.units.find(u=>u.id===battle.selected&&u.hp>0&&!u.hidden);}
function allowed(){return battle.allowedTypes||availableTypes(battle.level);}
function clearInput(){controls?.reset();}
function release(){clearInput();if(battle.dispatch)battle.dispatch({type:'release'});else battle.selected=null;updateUI();}
function renderStatic(){
  $('unit-grid').innerHTML=unitTypes.map((type,index)=>{const base=UNITS[type],d={...base,...(battle.trainingInfo?.(type)||{})};return `<button class="unit-card" data-unit="${type}" title="${d.name} · ${d.cost}黄金 · ${d.pop}人口 · ${d.train}秒" aria-label="招募${d.name}，${d.cost}黄金，快捷键${index+1}"><kbd class="unit-key">${index+1}</kbd><span class="unit-count"></span><div class="unit-portrait">${portrait(type,battle.loadout[type],{clubman:isClubman(type)})}</div><div class="unit-meta"><span class="unit-name">${isClubman(type)?'棍棒兵':d.name}</span><span class="unit-price">${icon('coins')}${d.cost}<span class="unit-lock"></span></span></div><span class="train-progress"></span></button>`;}).join('');
  $('item-grid').innerHTML=Object.entries(ITEMS).map(([id,d])=>`<button class="item-button" data-use-item="${id}" title="${d.name}：${d.desc}" aria-label="${d.name}：${d.desc}"><span class="item-icon" style="--item-color:${d.color}">${icon(d.icon)}</span><span class="item-copy"><b>${d.name}</b></span><span class="item-stock" id="stock-${id}">0</span></button>`).join('');
  renderLevel();icons();
}
function renderLevel(){
  const l=battle.config,r=REGIONS.find(region=>region.id===l.biome)||REGIONS[0];
  document.body.dataset.biome=l.biome||r.id;document.body.classList.toggle('assisted-mode',!!battle.assisted);document.body.classList.toggle('practice-mode',!!battle.practice);
  $('level-index').textContent=battle.practice?'练':String(battle.level+1).padStart(2,'0');
  $('level-title').textContent=battle.practice?`${UNITS[battle.practice]?.name||'兵种'}练习场`:l.title;
  $('level-subtitle').textContent=battle.practice?'大胆尝试，随时重来':l.text;
  $('battle-caption').textContent=battle.practice?'训练营':l.region||r.name;$('weather-caption').textContent=r.weather;
  $('difficulty-label').textContent=({easy:'休闲',normal:'标准',hard:'困难'})[battle.difficulty]+'难度';
  $('mode-label').textContent=battle.practice?'练习 · 不计战役成绩':battle.assisted?'亲子辅助 · 单独成绩':'标准战役';
  $('ready-title').textContent=battle.practice?'从一个动作开始，发现一条规则':'指挥官，你的军团已就绪';
  $('ready-copy').textContent=battle.practice?(ACTIONS[battle.practice]?.hint+(battle.practice==='giant'?' 本次练习借用林叶装备。':'')):missionText(l);
  $('family-button').classList.toggle('active',!!battle.assisted);$('family-button').setAttribute('aria-pressed',String(!!battle.assisted));
  $('family-coach').classList.toggle('hidden',!battle.assisted);$('coach-copy').textContent=COACH[coachIndex];
  $('speed-button').textContent=`${speed}×`;$('return-campaign-button').classList.toggle('hidden',!battle.practice||!save.campaignCheckpoint);
}
function updateUI(){
  $('gold').textContent=fmt(battle.gold);$('population').textContent=population(battle.units,battle.queue);$('population-cap').textContent=battle.populationCap||50;$('gems').textContent=save.gems;$('timer').textContent=clock(battle.time);
  $('ally-health').style.width=`${Math.max(0,battle.baseHP/battle.baseMax*100)}%`;$('enemy-health').style.width=`${Math.max(0,battle.enemyHP/battle.enemyMax*100)}%`;
  $('ally-hp').textContent=fmt(battle.baseHP);$('enemy-hp').textContent=battle.practice?'练习':fmt(battle.enemyHP);
  const progress=battle.practiceProgress;
  $('mission-live').textContent=battle.practice?`${progress?.label||'完成兵种练习'} ${progress?.done||0}/${progress?.total||1}`:missionText(battle.config,battle);
  const next=Number(battle.nextWave);$('wave-live').textContent=battle.practice?'随时重来':Number.isFinite(next)&&next>battle.time?`援军 ${Math.ceil(next-battle.time)}秒`:'观察敌军动向';
  $('item-cd').textContent=battle.itemCooldown>0?`准备 ${Math.ceil(battle.itemCooldown)}秒`:'消耗库存';
  for(const id of Object.keys(ITEMS)){$('stock-'+id).textContent=save.inventory[id]||0;const button=document.querySelector(`[data-use-item="${id}"]`);button.classList.toggle('empty',!save.inventory[id]);button.disabled=!!battle.practice;}
  $('ready-card').classList.toggle('hidden',battle.status!=='ready');$('pause-cover').classList.toggle('hidden',battle.status!=='paused'||modalOpen);
  $('pause-cover').classList.toggle('planning',!!battle.assisted);$('pause-copy').textContent=battle.assisted?'时间已停止。可以招募与下令，一起决定下一步。':'准备好后继续战斗。亲子辅助支持暂停下令。';
  $('pause-button').innerHTML=icon(battle.status==='paused'?'play':'pause');$('pause-button').setAttribute('aria-label',battle.status==='paused'?'继续战斗':'暂停游戏');
  $('order-status').textContent=battle.selected?'单兵控制':`军团${({garrison:'驻守',defend:'防守',attack:'进攻'})[battle.order]||'待命'}`;
  document.querySelectorAll('[data-command]').forEach(el=>{el.classList.toggle('active',el.dataset.command===battle.order);el.setAttribute('aria-pressed',String(el.dataset.command===battle.order));});
  $('queue-indicator').innerHTML=`队列 <b>${battle.queue.length} / 5</b>`;
  for(const el of document.querySelectorAll('[data-unit]')){
    const type=el.dataset.unit,d={...UNITS[type],...(battle.trainingInfo?.(type)||{})},locked=!allowed().includes(type)&&!battle.practice;
    const queued=battle.queue.filter(q=>q.type===type).length;el.disabled=locked;el.classList.toggle('locked',locked);el.classList.toggle('unaffordable',battle.gold<d.cost&&!battle.practice);
    el.title=locked?`${UNITS[type].name} · 第${LEVELS.findIndex(level=>(level.playerTypes||[]).includes(type))+1}关解锁`:`${UNITS[type].name} · ${d.cost}黄金 · ${d.pop}人口 · ${d.train}秒`;el.querySelector('.unit-lock').textContent=locked?'未解锁':'';el.querySelector('.unit-count').textContent=queued;el.querySelector('.unit-count').style.display=queued?'flex':'none';
    const first=battle.queue[0];el.querySelector('.train-progress').style.width=first?.type===type?`${100*(1-first.remaining/first.total)}%`:'0%';
  }
  $('sound-button').innerHTML=icon(sound.enabled?'volume':'volume-off');$('sound-button').setAttribute('aria-label',sound.enabled?'关闭音效':'开启音效');
  const unit=selectedUnit();$('selected-unit').classList.toggle('hidden',!unit);$('touch-controls').classList.toggle('hidden',!unit);document.body.classList.toggle('controlling-unit',!!unit);
  if(unit){
    const d=ACTIONS[unit.type]||ACTIONS.sword;$('selected-name').textContent=unit.clubman?'棍棒兵':UNITS[unit.type]?.name||'随从';$('selected-health').textContent=`${fmt(unit.hp)} / ${fmt(unit.maxHP)}`;
    $('selected-state').textContent=unit.type==='miner'?`背包 ${fmt(unit.cargo)}`:unit.type==='spear'&&unit.hasSpear===false?'短剑 · 回营补矛':unit.stun>0?'眩晕中':battle.practice==='giant'&&unit.type==='giant'&&unit.skin==='leaf'?'练习借用林叶装备':'';
    $('selected-hint').textContent=d.hint+' 手控每5秒恢复10生命。';$('selected-health').title='手动控制期间，每5秒恢复10生命';
    for(const [id,key] of [['primary-action','primary'],['secondary-action','secondary'],['special-action','special']]){
      const button=$(id);const active=!!d[key]&&!(unit.type==='giant'&&key==='secondary'&&unit.skin==='classic');button.classList.toggle('hidden',!active);button.querySelector('b').textContent=d[key]||'';
      const cd=unit.cooldowns?.[key]||0;button.classList.toggle('cooling',cd>0);button.querySelector('small').textContent=cd>0?`${Math.ceil(cd)}秒`:unit.type==='archer'&&key==='primary'?'按住 · 拖放':key==='primary'||['sword','spear'].includes(unit.type)&&key==='secondary'?'按住':'点击';
      button.setAttribute('aria-label',`${d[key]||''}${cd>0?'，冷却'+Math.ceil(cd)+'秒':''}`);
    }
  }
}
function showModal(html){
  if(!modalOpen){modalReturnFocus=document.activeElement;wasPlaying=battle.status==='playing';if(wasPlaying)battle.status='paused';}
  clearInput();modalOpen=true;$('modal-content').innerHTML=html;$('modal-backdrop').classList.remove('hidden');icons($('modal-backdrop'));document.querySelector('.modal').focus();updateUI();
}
function closeModal(resume=true){
  modalOpen=false;$('modal-backdrop').classList.add('hidden');if(resume&&wasPlaying&&battle.status==='paused')battle.status='playing';wasPlaying=false;
  if(modalReturnFocus?.isConnected)modalReturnFocus.focus({preventScroll:true});updateUI();
}
function modalHeader(kicker,title,intro){return `<div class="modal-eyebrow">${kicker}</div><h2 id="modal-title">${title}</h2><p class="modal-intro">${intro}</p>`;}
function campaign(chapter=campaignChapter){
  campaignChapter=Math.max(0,Math.min(5,Number(chapter)||0));const region={...REGIONS[campaignChapter],...CHAPTERS[campaignChapter]},scores=save.family?save.assistedCleared:save.cleared;
  const chapters=CHAPTERS.map((r,i)=>`<button class="chapter-button ${i===campaignChapter?'active':''}" data-chapter="${i}"><span>${r.symbol}</span><b>${r.name}</b><small>${LEVELS.slice(i*5,i*5+5).filter(l=>scores[l.id]).length}/5</small></button>`).join('');
  const nodes=[[9,66],[29,34],[50,62],[70,29],[91,55]],levels=LEVELS.slice(campaignChapter*5,campaignChapter*5+5);
  const map=`<div class="campaign-route" data-region="campaign" style="--region:${region.color}"><div class="map-heading"><small>${region.subtitle}</small><b>${region.name}</b></div><svg class="route-path" viewBox="0 0 800 180" preserveAspectRatio="none" aria-hidden="true"><path d="M72 119C120 150 150 30 232 61S340 150 400 112 510 20 560 52 650 150 728 99"/></svg>${levels.map((l,i)=>`<button class="route-node ${canPlay(save,campaignChapter*5+i)?'unlocked':'locked'} ${scores[l.id]?'completed':''}" style="left:${nodes[i][0]}%;top:${nodes[i][1]}%" data-select-level="${campaignChapter*5+i}" aria-label="${l.title}"><span>${scores[l.id]?'✓':canPlay(save,campaignChapter*5+i)?campaignChapter*5+i+1:icon('lock')}</span><small>${l.title}</small></button>`).join('')}</div>`;
  const cards=levels.map((l,n)=>{const index=campaignChapter*5+n,stars=scores[l.id]||0,locked=!canPlay(save,index);return `<button class="encounter-card ${n===4?'boss-card':''}" data-select-level="${index}"><span class="encounter-number">${String(index+1).padStart(2,'0')}</span><div><b>${l.title}</b><small>${l.region} · ${GOALS[l.goal]}${l.unlockText?' · '+l.unlockText:''}</small></div><span class="encounter-stars">${locked?icon('lock'):stars?'★'.repeat(stars)+'☆'.repeat(3-stars):`◇ ${l.reward}`}</span>${icon('chevron-right')}</button>`;}).join('');
  showModal(modalHeader('CLASSIC CAMPAIGN · 30 BATTLES','王国征途','从采矿到混编军团，在不同地形中练习新的战略。')+`<div class="campaign-mode"><span>当前：${save.family?'亲子辅助成绩':'标准战役成绩'}</span><button data-action="campaign-mode">切换为${save.family?'标准战役':'亲子辅助'}</button><button data-action="history">旧版纪念册</button></div><div class="chapter-nav">${chapters}</div>${map}<div class="encounter-grid">${cards}</div><p class="upgrade-note">已完成 ${Object.keys(scores).length}/30 关。每关首次完成可获 2 升级点，两个模式共享首次奖励；宝石用于皮肤与法术。两种模式分别记录星级与解锁。</p>`);
}
function levelBrief(index){
  const l=LEVELS[index];if(!l)return;const playable=canPlay(save,index);
  const waves=(l.waves||[]).map(w=>`<p class="wave-brief"><b>${clock(w.at)}</b><span>${w.label||w.units.map(t=>(UNITS[t.replace('!','')]?.name||t)+(t.endsWith('!')?'统领':'')).join(' · ')}</span></p>`).join('');
  showModal(modalHeader(`CHAPTER ${l.chapter+1} · MISSION ${index+1}`,l.title,l.text)+`<div class="mission-brief-goal">${icon(l.goal==='defend'?'shield':'swords')}<span><small>胜利条件</small><b>${missionText(l)}</b></span></div><div class="brief-columns"><div><h3>战前准备</h3><p>初始黄金 <b>${l.startGold}</b> · 首通宝石 <b>${l.reward} ◇</b></p><p>可招募：${(l.playerTypes||availableTypes(index)).map(t=>UNITS[t]?.name).join('、')}</p><p>${l.unlockText||''}</p></div><div><h3>敌军情报</h3><p>${l.types.map(t=>UNITS[t]?.name).join('、')}</p>${waves||'<p>敌军会采矿、训练并集结进攻。观察矿工、阵型和进军时机。</p>'}</div></div><div class="tactic-note">${icon('sparkles')}<p>${l.tactics||l.tip}</p></div><p class="upgrade-note">${playable?'开始新战斗会替换当前战场。兵器升级与换装在新战斗生效。':'完成前一关即可解锁。'}</p><div class="result-actions"><button class="secondary-button" data-action="campaign">返回地图</button><button class="primary-button" data-new-level="${index}" ${playable?'':'disabled'}>${playable?'出征':'尚未解锁'} ${icon(playable?'arrow-right':'lock')}</button></div>`);
}
function armory(tab=wardrobeTab){
  wardrobeTab=tab;
  const tabs=`<div class="modal-tabs"><button class="modal-tab ${tab==='upgrades'?'active':''}" data-armory-tab="upgrades">兵器升级</button><button class="modal-tab ${tab==='skins'?'active':''}" data-armory-tab="skins">兵种皮肤</button><button class="modal-tab ${tab==='supplies'?'active':''}" data-armory-tab="supplies">法术补给</button></div>`;
  const header=modalHeader('CAMP · PREPARE YOUR LEGION','军团营地','先看清下一场的敌人，再决定把资源用在哪里。')+`<div class="armory-balance">${icon('gem')}宝石 <b>${save.gems}</b><span class="upgrade-balance">升级点 <b id="upgrade-points">${save.upgradePoints}</b></span><span>通关获得，无付费购买</span></div>`+tabs;
  if(tab==='supplies'){
    showModal(header+`<div class="supply-catalog">${Object.entries(ITEMS).map(([id,d])=>`<article class="supply-card"><span class="large-item-icon" style="color:${d.color}">${icon(d.icon)}</span><div><h3>${d.name}</h3><p>${d.desc}</p><small>库存 ${save.inventory[id]||0}</small></div><button class="upgrade-button" data-buy-item="${id}" ${save.gems<d.cost||save.inventory[id]>=99?'disabled':''}>${d.cost} ◇ 兑换</button></article>`).join('')}</div><p class="upgrade-note">法术成功施放后才消耗库存。战斗中的行囊显示库存与共享冷却；练习场关闭背包法术，不消耗库存。</p>`);return;
  }
  if(tab==='upgrades'){
    showModal(header+`<div class="upgrade-list">${Object.entries(UPGRADE_BRANCHES).map(([id,d])=>{const rank=save.upgrades[id]||0,locked=!upgradeAvailable(save,id);return `<article class="upgrade-card"><div class="mini-portrait">${d.type==='statue'?icon('shield'):portrait(d.type,save.loadout[d.type])}</div><div><b>${d.name}</b><p>${d.description}</p><span class="upgrade-dots">${Array.from({length:d.max},(_,i)=>`<i class="${i<rank?'on':''}"></i>`).join('')}</span></div><button class="upgrade-button" data-upgrade="${id}" ${locked||rank>=d.max||save.upgradePoints<d.cost?'disabled':''}>${locked?'随战役解锁':rank>=d.max?'已满级':`${d.cost} 点升级`}</button></article>`;}).join('')}</div><p class="upgrade-note">兵器分支独立成长，在重新开始或进入新关卡时生效。每关第一次完成获得 2 升级点，重复挑战不重复领取升级点。</p>`);return;
  }
  const unitTabs=`<div class="wardrobe-units">${unitTypes.map(type=>`<button class="${type===wardrobeUnit?'active':''}" data-wardrobe-unit="${type}">${portrait(type,save.loadout[type])}<span>${UNITS[type].name}</span></button>`).join('')}</div>`;
  const skins=Object.entries(SKINS).map(([id,s])=>{const owned=(save.ownedSkins[wardrobeUnit]||[]).includes(id),equipped=save.loadout[wardrobeUnit]===id,detail=s.perUnit?.[wardrobeUnit];return `<article class="skin-card ${equipped?'equipped':''}" style="--skin:${s.accent}"><div class="skin-preview">${portrait(wardrobeUnit,id)}<span>${s.en}</span>${equipped?'<i>已装备</i>':''}</div><div class="skin-info"><h3>${s.name}</h3><b>${detail?.perk||s.perk}</b><p>${detail?.detail||s.detail}</p><button class="skin-equip" ${equipped?'disabled':owned?`data-equip-skin="${id}"`:`data-buy-skin="${id}" ${save.gems<s.cost?'disabled':''}`}>${equipped?'当前装备':owned?'装备':`${s.cost} ◇ 解锁${UNITS[wardrobeUnit].name}`}</button></div></article>`;}).join('');
  showModal(header+unitTabs+`<div class="skin-grid">${skins}</div><p class="upgrade-note">皮肤按兵种解锁。准备阶段换装立即生效，战斗中更换将在下一场生效。旧版已拥有皮肤已赠予全部六兵种。</p>`);
}
function applyReadyLoadout(){
  if(battle.status!=='ready')return;
  const borrowed=battle.practice==='giant'?battle.units.find(u=>u.team===0&&u.type==='giant')?.id:null;
  battle.loadout={...save.loadout};
  for(const unit of battle.units)if(!unit.team&&unit.id!==borrowed)unit.skin=save.loadout[unit.type]||'classic';
  renderStatic();
}
function practice(){
  const returnPanel=save.campaignCheckpoint?`<div class="practice-return"><p>原战局已暂停保留。切换练习或刷新页面后，仍可返回继续。</p><button class="secondary-button" data-action="return-campaign">返回原战局 →</button></div>`:!battle.practice&&['ready','playing','paused'].includes(battle.status)?'<p class="upgrade-note">开始练习时会保留当前战局。练习结束后可返回原战局，从暂停继续。</p>':'';
  showModal(modalHeader('TRAINING GROUND · TRY ONE RULE','六兵种练习场','没有失败成本。亲手完成一个动作，再把发现带回战役。')+returnPanel+`<div class="practice-grid">${unitTypes.map(type=>`<article class="practice-card"><div>${portrait(type,save.loadout[type])}</div><h3>${UNITS[type].name}${save.practiceCompleted?.includes(type)?' ✓':''}</h3><p>${ACTIONS[type].hint}${type==='giant'?' 本次练习借用林叶装备。':''}</p><button class="primary-button" data-practice="${type}">开始练习 ${icon('arrow-right')}</button></article>`).join('')}</div><p class="upgrade-note">练习采用独立战场，招募不扣战役资源、关闭背包法术，不授予战役宝石或升级点。可随时重新开始。</p>`);
}
function family(){
  const nextFamily=!battle.assisted,limit=nextFamily?save.assistedUnlocked:save.unlocked,target=Math.min(battle.level,limit);
  const destination=battle.practice?'切换后重新开始当前兵种练习；原战局继续保留。':`切换后从${nextFamily?'亲子辅助':'标准战役'}第 ${target+1} 关「${LEVELS[target].title}」重新开始。${target!==battle.level?'该模式尚未解锁当前关卡。':''}`;
  showModal(modalHeader('PLAY TOGETHER','把思考的时间留给孩子','亲子辅助提供半速、暂停下令和简短提示。标准成绩与辅助成绩分别保存。')+`<div class="help-grid"><article class="help-step"><h3>慢一点，看清规则</h3><p>从 0.5× 开始，也可切回 1×。矿工的每次往返、弓箭的飞行都能仔细观察。</p></article><article class="help-step"><h3>先预测，再试验</h3><p>暂停时可以招募和下令，时间不会流动。一起说出计划，再继续战斗。</p></article></div><p class="upgrade-note">${destination}两种模式的关卡解锁与星级独立，升级和库存共用。</p><div class="result-actions"><button class="secondary-button" data-action="close-modal">继续当前战斗</button><button class="primary-button" data-action="${battle.assisted?'disable-family':'enable-family'}">${battle.assisted?'以标准模式重新开始':'开启亲子辅助'}</button></div>`);
}
function history(){
  const h=save.legacyHistory;showModal(modalHeader('YOUR EARLIER JOURNEY','旧版纪念册','以前完成的冒险仍有纪念意义；新战役从第一面旗帜重新开始。')+`<div class="help-step"><h3>${h?'旧版存档已保留':'尚无旧版纪念记录'}</h3><p>${h?'原通关记录已存入纪念册。旧宝石保留，原升级与旧道具按原购买成本折回宝石；旧皮肤已授予全部六兵种。':'新旧战役采用不同规则与关卡，旧版星级不会当作新版通关成绩。'}</p><p>浏览器中的旧存档原文未被覆盖。0.3.0 使用独立存档位置，旧战斗不会误恢复到新规则。</p></div>${h?`<details class="history-details"><summary>查看历史记录</summary><pre>${esc(JSON.stringify(h,null,2))}</pre></details>`:''}`);
}
function codex(){
  showModal(modalHeader('KNOW YOUR LEGION','兵种与操作','每位战士都有自己的工作；让他们互相保护。')+`<div class="codex-grid">${unitTypes.map(type=>{const d=UNITS[type];return `<article class="codex-card"><div class="codex-art">${portrait(type,save.loadout[type])}</div><div><h3>${d.name}</h3><p>${d.desc}</p><p>${ACTIONS[type].hint}</p><div class="codex-stats"><span>♥ ${d.hp}</span><span>⚔ ${d.damage}</span><span>人口 ${d.pop}</span></div><button class="text-button" data-practice="${type}">进入练习 →</button></div></article>`;}).join('')}</div>`);
}
function help(){
  showModal(modalHeader('COMMANDER’S HANDBOOK','操作与规则','先建立经济，再保护矿工、组建军团，最后把握进攻时机。')+`<div class="help-grid"><article class="help-step"><h3>电脑操控</h3><p>点击我方单位接管；WASD 在战场上下左右移动。空格攻击，Q 副动作，E 特殊动作；R 切换我方单位，Esc 交还指挥。弓手按住空格，用鼠标瞄准后松开发箭。</p></article><article class="help-step"><h3>触屏操控</h3><p>轻点角色接管；左侧摇杆移动，右侧按钮执行动作。弓手按住「拉弓」，拖动调整战场准星，松手射击。摇杆和动作可以同时使用；拖动空白战场移动视野。</p></article><article class="help-step"><h3>统率军团</h3><p>1–6 招募，Z 驻守、X 防守、C 进攻。驻守让军队撤回营地；防守保护基地前方；进攻推进敌营。点击训练队列可取消等待，返还黄金。</p></article><article class="help-step"><h3>观察与计划</h3><p>方向键、拖动或小地图查看远方，P 暂停。亲子辅助可半速游玩，并在暂停时招募与下令。法术消耗行囊库存，兵种专属动作使用自身冷却。</p></article></div><div class="keyboard-guide"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动　<kbd>Space</kbd> 主动作　<kbd>Q</kbd> 副动作　<kbd>E</kbd> 特殊动作<br><kbd>1</kbd>–<kbd>6</kbd> 招募　<kbd>Z</kbd><kbd>X</kbd><kbd>C</kbd> 军团命令　<kbd>R</kbd> 切换角色　<kbd>P</kbd> 暂停</div><div class="result-actions"><button class="secondary-button" data-action="codex">兵种动作图鉴</button><button class="primary-button" data-action="practice">亲手练一练 →</button></div>`);
}
function settings(){
  showModal(modalHeader('YOUR BATTLEFIELD','游戏设置','调整操作与显示，再继续你的征途。')+`<div class="settings-row"><div><h3>战斗难度</h3><p>下一场战斗生效</p></div><select id="difficulty-select" aria-label="战斗难度">${Object.entries({easy:'休闲',normal:'标准',hard:'困难'}).map(([value,label])=>`<option value="${value}" ${save.difficulty===value?'selected':''}>${label}</option>`).join('')}</select></div><div class="settings-row"><div><h3>战斗音效</h3><p>招募、武器和战局提示</p></div><button class="toggle ${sound.enabled?'on':''}" data-action="settings-sound" role="switch" aria-checked="${sound.enabled}" aria-label="战斗音效"></button></div><div class="settings-row"><div><h3>减少动态效果</h3><p>保留命中提示，减少环境摆动</p></div><button class="toggle ${save.reduced?'on':''}" data-action="reduced" role="switch" aria-checked="${save.reduced}" aria-label="减少动态效果"></button></div><div class="settings-row"><div><h3>进度与存档</h3><p>${saveAvailable?'自动保存在此浏览器，返回时战斗暂停':'存储暂不可用，请保持页面开启'}</p></div><button class="text-button" data-action="history">旧版纪念册</button></div><div class="settings-actions"><button class="text-button" data-action="restart-confirm">重新开始本关</button><button class="text-button" data-action="help">操作指南</button><button class="primary-button" data-action="close-modal">返回战场</button></div>`);
}
function queue(){showModal(modalHeader('TRAINING QUEUE','训练队列','取消训练返还黄金；新兵从营地依次出发。')+(battle.queue.length?`<div class="queue-list">${battle.queue.map((q,i)=>`<div class="queue-row"><b>${i+1}. ${UNITS[q.type].name}</b><small>${i===0?`剩余 ${q.remaining.toFixed(1)} 秒`:'等待训练'}</small><button data-cancel-training="${i}">取消 · 返还 ${q.paid??UNITS[q.type].cost}</button></div>`).join('')}</div>`:'<p class="modal-intro">队列为空，点击战场下方兵种卡片招募。</p>'));}
function newBattle(level,practiceType=null){
  clearInput();
  if(practiceType&&!battle.practice&&['ready','playing','paused'].includes(battle.status))save.campaignCheckpoint=battle.snapshot();
  else if(!practiceType)save.campaignCheckpoint=null;
  battle=new Battle({level,difficulty:save.difficulty,upgrades:save.upgrades,loadout:save.loadout,assisted:save.family,practice:practiceType,seed:Date.now()>>>0});
  resultHandled=false;speed=battle.assisted?.5:1;campaignChapter=Math.floor(level/5);
  if(!practiceType){save.selectedLevel=level;save.selectedLevelId=LEVELS[level].id;}
  renderer.setCamera(0,true);closeModal(false);renderStatic();
  if(practiceType){const unit=battle.units.find(u=>u.team===0&&u.type===practiceType);if(unit)controls.choose(unit);}
  updateUI();persist();
}
function returnToCampaign(){
  clearInput();let restored=null;
  try{restored=Battle.restore(save.campaignCheckpoint);}catch{}
  save.campaignCheckpoint=null;
  if(!restored||restored.practice){persist();renderLevel();campaign();toast('原战局无法恢复，请在地图选择关卡');return;}
  battle=restored;battle.status='paused';resultHandled=false;save.family=!!battle.assisted;speed=battle.assisted?.5:1;
  save.selectedLevel=battle.level;save.selectedLevelId=LEVELS[battle.level].id;campaignChapter=Math.floor(battle.level/5);
  renderer.setCamera(0,true);closeModal(false);renderStatic();updateUI();persist();toast('已返回原战局，点击继续战斗');
}
function endBattle(win){
  if(resultHandled)return;resultHandled=true;clearInput();if(!battle.practice)save.family=!!battle.assisted;let result={stars:0,reward:0,upgradeReward:0};
  if(win)result=recordVictory(save,battle);save.checkpoint=null;persist(false);sound.play(win?'win':'wave');
  const practiceMode=!!battle.practice;
  showModal(`<div class="result-view"><div class="result-emblem">${icon(win?'trophy':'shield')}</div><div class="modal-eyebrow">${practiceMode?'PRACTICE · DISCOVER A RULE':battle.assisted?'FAMILY CAMPAIGN · PLAY TOGETHER':'CLASSIC CAMPAIGN'}</div><h2 id="modal-title">${win?(practiceMode?'练习完成':'胜利属于你'):'重整旗鼓'}</h2><p class="modal-intro">${win?(practiceMode?'你亲手验证了一条规则。下一次试试不同的位置与时机。':'你的军团完成了本关目标。回营升级兵器，为下一战作准备。'):`${battle.lossReason||'我方雕像已倒下'}。${battle.config.tip||'试着保护矿工，积蓄一支混编军团。'}`}</p>${win&&!practiceMode?`<div class="result-stars">${'★'.repeat(result.stars)}${'☆'.repeat(3-result.stars)}</div>`:''}<div class="result-stats"><div><b>${clock(battle.time)}</b><span>战斗时间</span></div><div><b>${battle.stats.kills||0}</b><span>击败敌军</span></div><div><b>${fmt(battle.stats.goldMined)}</b><span>采集黄金</span></div></div><div class="result-reward">${practiceMode?'练习记录已保存，不计入战役奖励':win?`获得 ${result.reward} 宝石 ◇${result.upgradeReward?` · ${result.upgradeReward} 升级点`:''} · ${battle.assisted?'辅助':'标准'}成绩已保存`:'保留已有进度，再试一个新计划'}</div><div class="result-actions">${practiceMode&&save.campaignCheckpoint?'<button class="secondary-button" data-action="return-campaign">返回原战局</button>':''}<button class="secondary-button" data-action="${practiceMode?'practice':'campaign'}">${practiceMode?'选择练习':'战役地图'}</button>${win&&!practiceMode&&battle.level<29?`<button class="primary-button" data-new-level="${battle.level+1}">下一关 →</button>`:`<button class="primary-button" data-action="restart">再试一次 →</button>`}</div></div>`);
}
function train(type){sound.unlock();const result=battle.train(type);if(!result?.ok)toast(result?.message||'暂时无法招募');else if(battle.status==='ready')toast('已加入队列，开始战斗后进行训练');updateUI();}
function command(order){if(['won','lost'].includes(battle.status))return;clearInput();const result=battle.command(order);if(result?.ok===false)toast(result.message);else sound.play('click');updateUI();}
function useItem(id){
  if(!battle.practice&&(save.inventory[id]||0)<=0){toast('库存不足，在营地的法术补给中兑换');return;}
  const result=battle.useItem(id);if(!result.ok){toast(result.message);return;}
  if(!battle.practice)save.inventory[id]--;persist();updateUI();sound.play('skill');announce(`${ITEMS[id].name} · ${ITEMS[id].short||'已施放'}`);
}
function pause(){if(modalOpen)return;if(battle.status==='ready'){toast('先点击开始战斗');return;}clearInput();if(battle.status==='playing')battle.status='paused';else if(battle.status==='paused')battle.status='playing';updateUI();persist();}
function toggleSound(){sound.enabled=!sound.enabled;save.sound=sound.enabled;if(sound.enabled){sound.unlock();sound.play('trained');}persist();updateUI();}
async function action(name,value){
  sound.unlock();
  if(name==='train')train(unitTypes[value]);else if(name==='command')command(value);
  else if(name==='escape'){if(modalOpen)closeModal();else if(battle.selected)release();else pause();}
  else if(name==='start'){battle.start();announce(battle.practice?'亲手尝试，观察动作与结果。':'先发展经济，再组织进攻。');updateUI();}
  else if(name==='campaign')campaign();else if(name==='campaign-mode'){save.family=!save.family;persist();campaign();}
  else if(name==='armory')armory();else if(name==='supplies')armory('supplies');else if(name==='practice')practice();else if(name==='family')family();
  else if(name==='enable-family'||name==='disable-family'){save.family=name==='enable-family';const limit=save.family?save.assistedUnlocked:save.unlocked;newBattle(Math.min(battle.level,limit),battle.practice);}
  else if(name==='return-campaign')returnToCampaign();else if(name==='codex')codex();else if(name==='help')help();else if(name==='settings')settings();else if(name==='history')history();else if(name==='queue')queue();
  else if(name==='close-modal')closeModal();else if(name==='pause')pause();else if(name==='release')release();else if(name==='camera-home')renderer.setCamera(0);
  else if(name==='sound')toggleSound();else if(name==='settings-sound'){toggleSound();settings();}else if(name==='reduced'){save.reduced=!save.reduced;renderer.reduced=save.reduced;persist();settings();}
  else if(name==='coach-next'){coachIndex=(coachIndex+1)%COACH.length;$('coach-copy').textContent=COACH[coachIndex];}
  else if(name==='speed'){if(!battle.assisted&&!battle.practice){toast('标准战役保持 1×；亲子辅助可切换半速');return;}speed=speed===1?.5:1;$('speed-button').textContent=speed+'×';}
  else if(name==='restart'){save.family=!!battle.assisted;newBattle(battle.level,battle.practice);}
  else if(name==='restart-confirm')showModal(modalHeader('TRY ANOTHER PLAN','重新开始本关','本场战斗从头开始，已获得的进度、兵器与装备保留。')+`<div class="result-actions"><button class="secondary-button" data-action="settings">返回设置</button><button class="primary-button" data-action="restart">重新开始 →</button></div>`);
  else if(name==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('可旋转屏幕获得更宽视野');}catch{toast('此浏览器不支持全屏，可旋转屏幕游玩');}}
}
controls=createControls({canvas:$('battlefield'),minimap:$('minimap'),viewport:$('battle-viewport'),renderer,getBattle:()=>battle,isModalOpen:()=>modalOpen,onAction:action,onUnlock:()=>sound.unlock(),onSelect:unit=>{if(battle.dispatch)battle.dispatch(unit?{type:'select',id:unit.id}:{type:'release'});else battle.selected=unit?.id??null;},onChange:updateUI});
document.addEventListener('click',event=>{
  const el=event.target.closest('button');if(!el||el.disabled)return;const d=el.dataset;
  if(d.action)action(d.action);else if(d.unit)train(d.unit);else if(d.command)command(d.command);else if(d.useItem)useItem(d.useItem);
  else if(d.chapter!==undefined)campaign(Number(d.chapter));else if(d.selectLevel!==undefined)levelBrief(Number(d.selectLevel));
  else if(d.newLevel!==undefined){const index=Number(d.newLevel);if(canPlay(save,index))newBattle(index);}
  else if(d.practice)newBattle(0,d.practice);else if(d.armoryTab)armory(d.armoryTab);
  else if(d.wardrobeUnit){wardrobeUnit=d.wardrobeUnit;armory('skins');}
  else if(d.buySkin){if(purchaseSkin(save,wardrobeUnit,d.buySkin)){equipSkin(save,wardrobeUnit,d.buySkin);applyReadyLoadout();persist();armory('skins');toast('已为所选兵种解锁并装备皮肤');}}
  else if(d.equipSkin){if(equipSkin(save,wardrobeUnit,d.equipSkin)){applyReadyLoadout();persist();armory('skins');toast(battle.status==='ready'?'已换装':'将在下一场战斗换装');}}
  else if(d.buyItem){if(purchaseItem(save,d.buyItem)){persist();armory('supplies');updateUI();}}
  else if(d.upgrade){if(purchaseUpgrade(save,d.upgrade)){persist();armory('upgrades');toast('兵器升级完成，重新开始或进入新关卡时生效');}}
  else if(d.cancelTraining!==undefined){battle.cancelTraining(Number(d.cancelTraining));persist();queue();updateUI();}
});
document.addEventListener('change',event=>{if(event.target.id==='difficulty-select'){save.difficulty=event.target.value;persist();toast('难度将在下一场战斗生效');}});
$('modal-backdrop').addEventListener('click',event=>{if(event.target===$('modal-backdrop'))closeModal();});
document.addEventListener('keydown',event=>{
  if(!modalOpen||event.key!=='Tab')return;
  const els=[...document.querySelector('.modal').querySelectorAll('button:not(:disabled),select,input,a,summary')].filter(el=>el.offsetParent!==null),first=els[0],last=els.at(-1);
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===document.querySelector('.modal'))){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
});
new ResizeObserver(()=>renderer.resize()).observe($('battle-viewport'));
function suspend(){clearInput();if(battle.status==='playing'){battle.status='paused';wasPlaying=false;}persist();updateUI();}
window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('pagehide',()=>persist());
function frame(now){
  const dt=Math.min(.1,(now-lastTime)/1000);lastTime=now;controls.tick(dt);
  if(!modalOpen)battle.update(dt*speed);
  for(const event of battle.events.splice(0)){
    if(['train','trained','attack','hit','wave','skill'].includes(event.type))sound.play(event.type,event.unit||event.unitType);
    if(event.type==='wave')announce('敌方援军抵达，观察阵型再出手。');
    if(event.type==='boss')announce('敌方统领现身！保护后排，准备迎战。');
    if(event.type==='end')endBattle(event.win);
  }
  renderer.draw(battle,now,dt);uiTime+=dt;saveTime+=dt;
  if(uiTime>.1){updateUI();uiTime=0;}if(saveTime>5){persist();saveTime=0;}requestAnimationFrame(frame);
}
renderStatic();updateUI();persist();requestAnimationFrame(frame);
if(migrated){showModal(modalHeader('WELCOME TO 0.3.0','新的战役，保留旧的旅程',migrationNotice||'旧版进度已归档，宝石与已拥有皮肤已保留；原升级和旧道具按成本折回宝石。')+`<div class="help-step"><h3>经典战役从第一关开始</h3><p>0.3.0 重做了三十关、兵种动作与经济规则。旧战斗不会继续运行，旧星级收录在纪念册中。</p><p>原始旧存档仍留在此浏览器，新存档独立保存。</p></div><div class="result-actions"><button class="secondary-button" data-action="history">查看纪念册</button><button class="primary-button" data-action="close-modal">开始新旅程 →</button></div>`);}
else if(battle.status==='paused')toast('已恢复上次战斗，点击继续即可接着玩');
if(!saveAvailable)toast('浏览器存储暂不可用，游戏仍可游玩，请保持页面开启');
