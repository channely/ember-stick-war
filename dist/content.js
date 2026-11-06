// Source and calibration notes: /learn/ and docs/规则对齐-0.3.0.md.
export const VERSION = '0.3.0';
export const CAMPAIGN_ID = 'classic-v3';
export const RULESET_VERSION = 'legacy-web-0.3.0';
export const REGIONS = [
  { id:'grass', name:'秩序平原', subtitle:'第一卷 · 旗帜初升', color:'#7caa48', sky:['#8bcce8','#e6efd5'], mountain:['#aac7a0','#7b9d68','#50794c'], ground:['#8eae59','#b5bc72'], weather:'晴空', symbol:'☀' },
  { id:'desert', name:'长弓沙海', subtitle:'第二卷 · 越过箭雨', color:'#d5a653', sky:['#e9c688','#f4e3b2'], mountain:['#d8b47c','#ba8d50','#9c7745'], ground:['#c6a166','#e1bb77'], weather:'流沙', symbol:'◈' },
  { id:'snow', name:'铁矛雪境', subtitle:'第三卷 · 北境誓言', color:'#83b8d2', sky:['#9fbfd4','#e5edf0'], mountain:['#c7d7de','#9bb7c6','#7f9cab'], ground:['#d9e5e5','#b4cdd6'], weather:'落雪', symbol:'❄' },
  { id:'forest', name:'秘法幽林', subtitle:'第四卷 · 林间低语', color:'#76987b', sky:['#6d9b96','#bdd2ad'], mountain:['#91ad92','#658e75','#416e58'], ground:['#789461','#a3ad72'], weather:'薄雾', symbol:'♧' },
  { id:'volcano', name:'熔火山脊', subtitle:'第五卷 · 巨人苏醒', color:'#cd7855', sky:['#706d79','#d39a71'], mountain:['#9b8580','#766263','#514e55'], ground:['#71685c','#9a8569'], weather:'余烬', symbol:'♨' },
  { id:'night', name:'混沌王庭', subtitle:'第六卷 · 黎明将至', color:'#998bb7', sky:['#272f50','#687993'], mountain:['#586880','#424f69','#303e53'], ground:['#4f6456','#6e795d'], weather:'星夜', symbol:'☾' }
];
export const SKINS = {
  classic:{name:'经典战甲',en:'CLASSIC',cost:0,accent:'#bca647',metal:'#c9cfcd',trim:'#efd773',cloth:'#315a9c',aura:'#e5ca60',perk:'原初军团',detail:'无额外加成。以兵种自身的动作与兵器升级迎战。',bonus:{}},
  leaf:{name:'林叶行装',en:'LEAF',cost:2,accent:'#77aa49',metal:'#c1d298',trim:'#d9e6a1',cloth:'#3d7138',aura:'#bad783',perk:'轻装补给',detail:'金币成本降低 10%，训练时间减半；手控移动速度提高 15%。',bonus:{cost:.9,train:.5,manualSpeed:1.15}},
  ice:{name:'寒冰战甲',en:'ICE',cost:3,accent:'#76bfd9',metal:'#d6f5ff',trim:'#c1edf5',cloth:'#4c7cb9',aura:'#9bdeff',perk:'寒霜控制',detail:'命中减速 30%，持续 2 秒；手操命中可冻结敌人 1 秒，每个目标 3 秒内不会再次被冻结。',bonus:{slow:2,freeze:1}},
  lava:{name:'熔岩战甲',en:'LAVA',cost:4,accent:'#d57635',metal:'#edbb5d',trim:'#ffda86',cloth:'#9c3e28',aura:'#ff9c47',perk:'反伤与灼烧',detail:'反弹 15% 直接伤害；手操命中灼烧，每秒 6 点，持续 3 秒，同源刷新不叠加。',bonus:{reflect:.15,burn:3}},
  savage:{name:'蛮荒战甲',en:'SAVAGE',cost:3,accent:'#a18a64',metal:'#e1d7ba',trim:'#f0e6c9',cloth:'#725b41',aura:'#d7b982',perk:'坚韧猛攻',detail:'免疫眩晕，直接伤害提高 10%；冰霜减速仍然生效。',bonus:{damage:1.1,stunImmune:true}},
  vamp:{name:'暗夜战甲',en:'VAMP',cost:5,accent:'#956baf',metal:'#c3b6d2',trim:'#e3c6ec',cloth:'#582f65',aura:'#ca87d6',perk:'生命汲取',detail:'对敌方单位造成直接伤害后，恢复实际伤害的 15% 生命；攻击雕像不吸血。',bonus:{leech:.15}},
  volt:{name:'雷霆战甲',en:'VOLTAIC',cost:6,accent:'#d4c146',metal:'#fff0a1',trim:'#fff7c8',cloth:'#3b565a',aura:'#fff18b',perk:'连锁电弧',detail:'命中后对邻近一名敌人造成 25% 连锁伤害；连锁不会再次触发连锁。',bonus:{chain:.25}}
};
export const ITEMS = {
  mining:{name:'矿工加速',icon:'pickaxe',cost:1,color:'#8fb65a',short:'采掘加速 30 秒',desc:'30 秒内矿工采掘速度翻倍，仍须把黄金送回营地。'},
  rage:{name:'剑士狂怒',icon:'sword',cost:1,color:'#d58a61',short:'剑士伤害 +60%',desc:'我方剑士伤害提高 60%，持续 12 秒。'},
  arrows:{name:'漫天箭雨',icon:'arrows',cost:2,color:'#d5b451',short:'全场敌军 -100',desc:'对当前战场内敌方单位造成 100 伤害，不攻击雕像。'},
  spear:{name:'盾矛狂战',icon:'shield',cost:2,color:'#b79360',short:'盾矛伤害 +50%',desc:'我方盾矛兵伤害提高 50%，持续 12 秒。'},
  heal:{name:'军团治疗',icon:'heart',cost:1,color:'#91ada2',short:'恢复 45% 生命',desc:'恢复当前我方单位 45% 最大生命，不能复活或修复雕像。'},
  reinforcements:{name:'精锐援军',icon:'horn',cost:2,color:'#90c7df',short:'2 剑士 + 1 弓手',desc:'营地召集两名剑士与一名弓手，需要 3 个空闲人口及弓手科技。'}
};
export const UPGRADE_BRANCHES = {
  minerPick:{name:'矿镐',type:'miner',description:'每级采掘用时减少 15%'},
  minerBag:{name:'矿袋',type:'miner',description:'每级黄金容量增加 10'},
  swordBlade:{name:'剑刃',type:'sword',description:'每级攻击伤害增加 20%，第三关后解锁'},
  swordHelmet:{name:'剑士头盔',type:'sword',description:'每级生命增加 20%，第三关后解锁'},
  archerBow:{name:'长弓',type:'archer',description:'每级箭矢伤害增加 20%'},
  spearSpear:{name:'长矛',type:'spear',description:'每级攻击伤害增加 20%'},
  spearShield:{name:'圆盾',type:'spear',description:'每级格挡减伤增加 5 个百分点'},
  spearHelmet:{name:'重甲头盔',type:'spear',description:'每级生命增加 20%'},
  mageStaff:{name:'法杖',type:'mage',description:'每级震击伤害增加 20%'},
  mageHat:{name:'法师帽',type:'mage',description:'每级召唤物上限 +1，基础为 2'},
  giantClub:{name:'巨人石棒',type:'giant',description:'每级攻击伤害增加 20%'},
  statueHealth:{name:'雕像基座',type:'statue',description:'每级雕像生命增加 400'},
  castleArchers:{name:'城堡弓箭',type:'statue',description:'每级驻营守卫箭矢伤害增加 8'}
};
for(const branch of Object.values(UPGRADE_BRANCHES)){branch.max=3;branch.cost=1;}
export const GOALS={destroy:'摧毁敌方雕像',defend:'抵御全部伏击',timed:'限时突破',escort:'护送矿车'};
export function availableTypes(level=0){return ['miner','sword',...(level>=1?['archer']:[]),...(level>=4?['spear']:[]),...(level>=6?['mage']:[]),...(level>=9?['giant']:[])];}
// Each encounter defines the decision to learn, enemy economy and finite reinforcements.
const encounters = [
 {title:'箭雨初临',biome:'grass',types:['archer'],hp:800,startGold:500,enemyGold:150,startingEnemies:['miner','miner','archer'],attackAt:999999,strategy:'tutorial',combatCap:2,minerTarget:2,tactics:'发展经济，掩护近战接近弓手',tip:'先补到 4 名矿工，再用近战推进；接管剑士可沿侧面接近射手。',unlockText:'通关解锁弓箭手',waves:[[95,'archer','长弓增援']]},
 {title:'林边伏击',biome:'grass',goal:'defend',duration:150,types:['sword'],hp:1000,startGold:650,enemyGold:0,startingEnemies:[],strategy:'ambush',attackAt:20,minerTarget:0,tactics:'用驻防与撤退换取时间',tip:'用剑士护住弓手；敌军近身时撤回营地，等待守卫火力。',waves:[[25,'sword sword','第一队伏兵'],[65,'sword sword sword','两翼合围'],[110,'sword sword archer','最后的突袭']]},
 {title:'剑锋之国',biome:'grass',types:['sword','archer'],hp:1150,startGold:600,enemyGold:200,attackAt:100,tactics:'远程压制近战，观察集结时机',tip:'弓手在后排持续射击，近战负责阻挡；不要一有兵就分散出击。',unlockText:'通关开放剑士兵器升级',waves:[[120,'sword sword','剑士反击']]},
 {title:'盾墙之誓',biome:'desert',types:['spear','sword'],hp:1300,startGold:750,enemyGold:200,startingEnemies:['miner','miner','spear'],attackAt:120,tactics:'绕侧与集中火力突破盾牌',tip:'正面举盾可以减伤，但侧后方仍然脆弱；保护你的弓手。',unlockText:'通关解锁盾矛兵',waves:[[140,'spear sword','预备盾队']]},
 {title:'剑士反扑',biome:'desert',types:['sword','archer'],hp:1450,startGold:800,enemyGold:250,attackAt:65,strategy:'pressure',tactics:'盾矛顶住快攻，弓手反击',tip:'早期先保住矿工和盾矛；站稳之后再补经济。',waves:[[48,'sword sword','先锋突袭'],[115,'sword sword archer','第二阵线']]},
 {title:'召唤之环',biome:'forest',types:['mage','sword'],hp:1600,startGold:900,enemyGold:200,startingEnemies:['miner','miner','mage'],attackAt:120,tactics:'绕开召唤物，打断法师阵地',tip:'法师身前震击危险。用远程消耗或沿侧面接近，别让近战挤成一团。',unlockText:'通关解锁法师',waves:[[145,'sword sword','秘法卫队']]},
 {title:'解放东境',biome:'grass',types:['sword','archer','spear'],hp:1700,startGold:950,enemyGold:350,attackAt:115,tactics:'盾、弓、召唤物构成混编阵线',tip:'让法师在前线后方召唤；补充矿工比连续补同一种战士更有用。',waves:[[150,'spear archer','东境守备']]},
 {title:'西风据点',biome:'desert',types:['archer','spear','mage'],hp:1850,startGold:1000,enemyGold:350,attackAt:125,strategy:'fortify',tactics:'进攻敌方经济，避免只撞前排',tip:'敌方矿工也必须交金。小队绕后袭扰，可以延缓对手的后续增兵。',waves:[[170,'archer archer','西风箭队']]},
 {title:'无人之地',biome:'volcano',types:['giant','sword'],hp:2000,startGold:1100,enemyGold:100,startingEnemies:['miner','miner','giant'],attackAt:140,tactics:'利用巨人的恢复时间持续输出',tip:'巨人攻击缓慢但范围大。让弓手拉开距离，盾矛分散承伤。',unlockText:'通关解锁巨人',waves:[[180,'sword sword','山地守卫']]},
 {title:'暮色包围',biome:'forest',goal:'defend',duration:190,types:['sword','archer','spear'],hp:2000,startGold:1300,enemyGold:0,startingEnemies:[],strategy:'ambush',minerTarget:0,attackAt:20,tactics:'用分批撤退承受混合伏击',tip:'不要把所有黄金都投入巨人。先形成能马上作战的混编防线。',waves:[[28,'sword sword archer','前锋'],[75,'spear archer archer','盾弓队'],[125,'mage sword sword','召唤队'],[160,'spear sword','最后一击']]},
 {title:'冰丘阵地',biome:'snow',types:['spear','archer','mage'],hp:2300,startGold:1350,enemyGold:550,startingEnemies:['miner','miner','miner','spear','archer'],attackAt:105,strategy:'fortify',tactics:'稳定经济，逐段推进防守阵地',tip:'雪景不额外降低移速。用盾矛吸引箭矢，再让法师处理密集前排。',waves:[[155,'spear archer','冰丘预备队']]},
 {title:'王座终战',biome:'night',types:['spear','archer','mage','giant'],hp:2400,startGold:1500,enemyGold:600,attackAt:130,bossFinal:true,tactics:'为雕像之后的首领保留军力',tip:'摧毁雕像还不是结束。保住经济和远程部队，迎接最后的巨人。',waves:[[165,'spear mage','王庭近卫']]},
 {title:'林叶军团',biome:'forest',types:['sword','archer'],hp:2000,startGold:1200,enemyGold:400,enemySkin:'leaf',attackAt:85,strategy:'pressure',tactics:'应对低成本快速补兵',tip:'林叶敌军训练快。压制其矿工比只在中场交换单位更有效。',waves:[[145,'sword sword archer','轻装援军']]},
 {title:'寒霜之矛',biome:'snow',types:['spear','archer'],hp:2200,startGold:1250,enemyGold:400,enemySkin:'ice',attackAt:110,tactics:'承伤轮换，避免持续减速',tip:'用新鲜前排接替受伤单位，手操绕侧切断寒冰弓手。',waves:[[155,'spear archer','冰矛支援']]},
 {title:'熔甲壁垒',biome:'volcano',types:['spear','sword'],hp:2350,startGold:1300,enemyGold:400,enemySkin:'lava',attackAt:120,strategy:'fortify',tactics:'管理反伤带来的持续消耗',tip:'反伤会让输出者受损。轮换进攻与驻营恢复，不要只堆近战。',waves:[[170,'spear sword','熔甲卫士']]},
 {title:'蛮荒集结',biome:'desert',types:['sword','giant'],hp:2450,startGold:1350,enemyGold:350,enemySkin:'savage',attackAt:100,tactics:'面对抗晕军团改用伤害与位置',tip:'蛮荒军团不怕眩晕。分散、远程输出与经济优势仍然有效。',waves:[[165,'sword sword sword','蛮荒冲锋']]},
 {title:'暗夜汲取',biome:'night',types:['spear','mage','archer'],hp:2500,startGold:1400,enemyGold:500,enemySkin:'vamp',attackAt:125,tactics:'集中击败目标，减少吸血机会',tip:'分散伤害会给暗夜军团恢复的机会。先集中处理最脆弱的后排。',waves:[[180,'spear archer','暗夜守卫']]},
 {title:'雷霆战线',biome:'snow',types:['archer','spear','giant'],hp:2650,startGold:1450,enemyGold:500,enemySkin:'volt',attackAt:125,tactics:'用空间分散减少连锁伤害',tip:'不要让所有前排站在同一个点。利用纵深移动与多兵种分层。',waves:[[180,'archer archer spear','雷霆援军']]},
 {title:'远矿争夺',biome:'desert',types:['sword','archer','spear'],hp:2300,startGold:1100,enemyGold:400,attackAt:115,mineAmount:1600,tactics:'提前布局矿脉耗尽后的经济',tip:'本关矿脉储量较少。关注剩余量，保护向远处转移的矿工。',waves:[[190,'spear archer','争矿援军']]},
 {title:'穿过后排',biome:'forest',types:['archer','mage'],hp:2300,startGold:1200,enemyGold:500,startingEnemies:['miner','miner','mage','archer'],attackAt:120,strategy:'fortify',tactics:'侧翼近战与正面牵制配合',tip:'接管剑士从上下侧接近法师；正面军团负责吸引敌军。',waves:[[150,'archer archer','远程预备队']]},
 {title:'双盾长弓',biome:'grass',types:['spear','archer','sword'],hp:2400,startGold:1250,enemyGold:500,attackAt:110,tactics:'盾弓协同与投矛时机',tip:'举盾保护弓手；确认击杀窗口后再投矛，否则失去长兵器。',waves:[[160,'spear archer archer','混编支援']]},
 {title:'破除召唤',biome:'forest',types:['mage','sword','spear'],hp:2500,startGold:1400,enemyGold:400,startingEnemies:['miner','miner','mage','spear'],attackAt:130,tactics:'清理召唤物并威胁召唤者',tip:'只清召唤物会拖长战斗。把范围伤害与绕后打击结合起来。',waves:[[180,'mage sword','法师增援']]},
 {title:'巨足回声',biome:'volcano',types:['giant','archer'],hp:2500,startGold:1450,enemyGold:350,startingEnemies:['miner','miner','giant','archer'],attackAt:135,tactics:'远程持续输出与前排轮换',tip:'观察巨人挥击后的恢复阶段；不要在狭窄位置同时交战。',waves:[[190,'spear archer','巨人护卫']]},
 {title:'黎明反击',biome:'night',types:['sword','spear','mage'],hp:2550,startGold:1450,enemyGold:500,attackAt:75,strategy:'pressure',tactics:'先守住压力，再补经济反推',tip:'开局先招可以马上出场的防守单位，第一轮结束再扩张矿工。',waves:[[70,'sword sword','快速进攻'],[160,'spear mage','第二次集结']]},
 {title:'金袋与刀锋',biome:'grass',types:['sword','archer','spear'],hp:2650,startGold:1000,enemyGold:400,attackAt:125,mineAmount:1800,tactics:'在扩张经济和前线兵力之间取舍',tip:'观察敌军集结，决定下一袋黄金招矿工还是补前排。',waves:[[185,'spear archer','矿区争夺']]},
 {title:'冰原侧翼',biome:'snow',types:['spear','mage','archer'],hp:2700,startGold:1500,enemyGold:500,enemySkin:'ice',attackAt:125,strategy:'fortify',tactics:'绕侧突破混编控制阵线',tip:'集中在一个方向会被减速与震击反复阻挡；手操打开侧翼缺口。',waves:[[185,'mage archer','冰原法团']]},
 {title:'长矛的抉择',biome:'desert',types:['giant','archer','spear'],hp:2750,startGold:1550,enemyGold:500,attackAt:130,tactics:'保留盾墙或投矛决胜',tip:'可以用完整盾墙持续推进，也可以投矛解决后排后回营重新装备。',waves:[[190,'spear archer','沙海后备军']]},
 {title:'秘法交锋',biome:'forest',types:['mage','spear','giant'],hp:2800,startGold:1600,enemyGold:450,startingEnemies:['miner','miner','mage','spear'],attackAt:135,tactics:'召唤节奏与范围震击配合',tip:'召唤物达到上限时，保留施法时机；敌军集中后再用震击。',waves:[[190,'mage sword','议会召唤队']]},
 {title:'山岭围城',biome:'volcano',types:['giant','spear','archer'],hp:2900,startGold:1700,enemyGold:450,attackAt:140,strategy:'fortify',tactics:'巨人破阵，远程清理掩护部队',tip:'巨人能拆雕像，但需要护卫。先处理敌方弓手，不要单独送出攻城单位。',waves:[[195,'giant archer','山岭增援']]},
 {title:'秩序新章',biome:'night',types:['sword','archer','spear','mage','giant'],hp:3000,startGold:1800,enemyGold:650,startingEnemies:['miner','miner','miner','spear','archer'],attackAt:140,bossFinal:true,tactics:'综合运用经济、阵型与单兵操控',tip:'先判断敌方阵容，再选择自己的军团。保留后排与补给迎战终局首领。',waves:[[160,'spear mage','第一支近卫'],[240,'giant archer','最后的援军']]}
];
export const LEVELS=encounters.map((e,i)=>{
 const region=REGIONS.find(r=>r.id===e.biome)||REGIONS[0];
 return {id:`classic-${String(i+1).padStart(2,'0')}`,title:e.title,chapter:Math.floor(i/5),stage:i%5+1,
  region:region.name,biome:region.id,color:region.color,goal:e.goal||'destroy',hp:e.hp,startGold:e.startGold,
  duration:e.duration||0,types:e.types,playerTypes:availableTypes(i),enemyGold:e.enemyGold,
  startingAllies:['miner','miner','sword'],startingEnemies:e.startingEnemies||['miner','miner',e.types[0]],
  ai:{strategy:e.strategy||'balanced',attackAt:e.attackAt,retreatAt:.25,minerTarget:e.minerTarget??(i<6?3:i<18?4:5),composition:e.types,combatCap:e.combatCap??24},
  mines:{amount:e.mineAmount||4000,slots:2},modifier:'normal',enemySkin:e.enemySkin||'classic',
  waves:(e.waves||[]).map(([at,units,label])=>({at,units:units.split(' '),label})),
  bossFinal:!!e.bossFinal,tactics:e.tactics,text:e.tactics,subtitle:e.tactics,tip:e.tip,unlockText:e.unlockText||'',
  enemy:i<12?'边境诸军':i<18?'装备试炼军团':'联合守备军',reward:e.bossFinal?4:2,
  interval:12,income:0,sequence:i<12?'经典篇':i<18?'装备篇':'策略篇'
 };
});
export function skinFor(type,loadout={}){return SKINS[loadout[type]]||SKINS.classic;}
export function missionText(config,battle){
 if(battle?.practice)return `兵种练习 · ${battle.practice} · 无消耗，不计战役奖励`;
 if(battle?.survival)return `无尽演练 · 第 ${battle.wave} 波`;
 if(config.goal==='defend')return `抵御伏击${battle?` · 剩余 ${Math.max(0,Math.ceil(config.duration-battle.time))} 秒`:''}`;
 if(config.goal==='timed')return `${config.duration} 秒内摧毁敌方雕像`;
 if(battle?.bossPhase)return '终局首领现身 · 击败首领并守护雕像';
 return config.bossFinal?'摧毁敌方雕像，再击败终局首领':'保护矿工与雕像，摧毁敌方雕像';
}
