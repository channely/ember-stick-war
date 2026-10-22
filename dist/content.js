// All numbers below are game rules, not hidden magic. The family workshop explains how to change them.
export const VERSION = '0.2.0';
export const REGIONS = [
  { id:'grass', name:'秩序平原', subtitle:'第一卷 · 旗帜初升', color:'#7caa48', sky:['#8bcce8','#e6efd5'], mountain:['#aac7a0','#7b9d68','#50794c'], ground:['#8eae59','#b5bc72'], weather:'晴空', symbol:'☀' },
  { id:'desert', name:'长弓沙海', subtitle:'第二卷 · 越过箭雨', color:'#d5a653', sky:['#e9c688','#f4e3b2'], mountain:['#d8b47c','#ba8d50','#9c7745'], ground:['#c6a166','#e1bb77'], weather:'流沙', symbol:'◈' },
  { id:'snow', name:'铁矛雪境', subtitle:'第三卷 · 北境誓言', color:'#83b8d2', sky:['#9fbfd4','#e5edf0'], mountain:['#c7d7de','#9bb7c6','#7f9cab'], ground:['#d9e5e5','#b4cdd6'], weather:'落雪', symbol:'❄' },
  { id:'forest', name:'秘法幽林', subtitle:'第四卷 · 林间低语', color:'#76987b', sky:['#6d9b96','#bdd2ad'], mountain:['#91ad92','#658e75','#416e58'], ground:['#789461','#a3ad72'], weather:'薄雾', symbol:'♧' },
  { id:'volcano', name:'熔火山脊', subtitle:'第五卷 · 巨人苏醒', color:'#cd7855', sky:['#706d79','#d39a71'], mountain:['#9b8580','#766263','#514e55'], ground:['#71685c','#9a8569'], weather:'余烬', symbol:'♨' },
  { id:'night', name:'混沌王庭', subtitle:'第六卷 · 黎明将至', color:'#998bb7', sky:['#272f50','#687993'], mountain:['#586880','#424f69','#303e53'], ground:['#4f6456','#6e795d'], weather:'星夜', symbol:'☾' }
];
export const SKINS = {
  classic:{name:'经典战甲',en:'CLASSIC',cost:0,accent:'#bca647',metal:'#c9cfcd',trim:'#efd773',cloth:'#315a9c',aura:'#e5ca60',perk:'原初军团 · 均衡装备',detail:'熟悉的金色头盔、钢铁武器与蓝色披风。没有额外属性加成。',bonus:{}},
  leaf:{name:'林叶行装',en:'LEAF',cost:2,accent:'#77aa49',metal:'#c1d298',trim:'#d9e6a1',cloth:'#3d7138',aura:'#bad783',perk:'轻装疾行 · 移速 +15%',detail:'树叶护甲与藤蔓武器。移动速度提高 15%，矿工往返更迅速。',bonus:{speed:1.15}},
  ice:{name:'寒冰战甲',en:'ICE',cost:3,accent:'#76bfd9',metal:'#d6f5ff',trim:'#c1edf5',cloth:'#4c7cb9',aura:'#9bdeff',perk:'寒霜打击 · 减速敌人',detail:'水晶长刃与冰冠。命中敌人后，使其移动和攻击速度降低 30%，持续 2 秒。',bonus:{slow:2}},
  lava:{name:'熔岩战甲',en:'LAVA',cost:4,accent:'#d57635',metal:'#edbb5d',trim:'#ffda86',cloth:'#9c3e28',aura:'#ff9c47',perk:'灼烧打击 · 持续伤害',detail:'黑曜石甲与熔火裂纹。命中后造成每秒 6 点伤害，持续 3 秒；相同灼烧刷新时间，不叠加。',bonus:{burn:3}},
  savage:{name:'蛮荒战甲',en:'SAVAGE',cost:3,accent:'#a18a64',metal:'#e1d7ba',trim:'#f0e6c9',cloth:'#725b41',aura:'#d7b982',perk:'狂野力量 · 伤害 +15%',detail:'兽骨面甲与锯齿武器。直接伤害提高 15%。',bonus:{damage:1.15}},
  vamp:{name:'暗夜战甲',en:'VAMP',cost:5,accent:'#956baf',metal:'#c3b6d2',trim:'#e3c6ec',cloth:'#582f65',aura:'#ca87d6',perk:'生命汲取 · 吸血 15%',detail:'暗紫披风与月刃。对敌方单位造成直接伤害后，恢复实际伤害的 15% 生命。',bonus:{leech:.15}},
  volt:{name:'雷霆战甲',en:'VOLTAIC',cost:6,accent:'#d4c146',metal:'#fff0a1',trim:'#fff7c8',cloth:'#3b565a',aura:'#fff18b',perk:'连锁电弧 · 邻敌溅射',detail:'雷纹护甲与闪电刃。命中后，对 85 距离内另一名敌人造成 25% 额外伤害。',bonus:{chain:.25}}
};
export const ITEMS = {
  gold:{name:'黄金补给',icon:'coins',cost:1,color:'#d5b451',short:'+350 黄金',desc:'立即获得 350 黄金。可用于补充矿工或训练援军。'},
  mining:{name:'矿工药剂',icon:'pickaxe',cost:1,color:'#8fb65a',short:'采矿加速 30 秒',desc:'30 秒内，矿工采掘时间减半，移动速度提高 25%。'},
  reinforcements:{name:'援军号角',icon:'horn',cost:2,color:'#b79360',short:'2 剑士 + 1 弓手',desc:'在基地召集两名剑士和一名弓箭手。需要至少 3 个空闲人口。'},
  arrows:{name:'漫天箭雨',icon:'arrows',cost:2,color:'#d58a61',short:'全场敌军 -100 生命',desc:'向当前战场发射箭雨，对所有在场敌方单位各造成 100 伤害，不伤及雕像。'},
  repair:{name:'石像修复',icon:'shield',cost:1,color:'#91ada2',short:'雕像恢复 35%',desc:'恢复我方雕像最大生命值的 35%。雕像完好时不会消耗。'},
  frost:{name:'寒霜卷轴',icon:'snow',cost:2,color:'#90c7df',short:'敌军减速 8 秒',desc:'让当前在场敌军移动与攻击速度降低 65%，持续 8 秒。'}
};
export const GOALS={destroy:'摧毁敌方雕像',defend:'守住阵地',timed:'限时突破',escort:'护送矿车'};
// Each encounter is authored: goal, economy, enemy composition, tactical modifier and timed waves.
const encounters = [
  ['第一面旗帜','destroy',900,8,['sword'],'normal',0,'训练矿工与剑士，亲手发出第一次进攻命令。','先补充 2 名矿工，再用剑士保护他们。',600,[[48,'sword sword'],[100,'sword archer']]],
  ['矿山哨站','defend',1000,10,['sword'],'rich',105,'守住矿山 105 秒，保证新的军团有充足的黄金。','驻守能回血，但矿工也会停止工作。',550,[[26,'sword sword'],[58,'sword sword archer'],[87,'sword spear']]],
  ['归途护卫','escort',1100,11,['sword','archer'],'normal',0,'护送矿车抵达敌方边境。矿车会等待前方护卫，遇敌时停下。','保持近战单位在矿车前方，弓手在后方支援。',650,[[30,'sword sword'],[65,'archer sword'],[110,'sword spear']]],
  ['日落突围','timed',1100,12,['sword','archer'],'sunset',190,'在日落前摧毁敌方雕像。集结过久也会错过时机。','先积蓄经济，准备好 6 名战士就开始推进。',650,[[35,'sword archer'],[80,'spear sword'],[130,'archer archer']]],
  ['余烬平原','destroy',1500,14,['sword','archer','spear'],'boss',0,'击退叛军统领，夺回秩序平原。','重甲卫士扛住前线，狂怒留给统领现身时。',650,[[35,'sword sword archer'],[82,'spear spear'],[125,'giant! sword']]],
  ['长弓峡口','destroy',1500,14,['archer','sword'],'normal',0,'射手占据峡口。盾牌与速度是突破箭雨的关键。','用长矛卫士掩护剑士，不要单独派出弓手。',700,[[38,'archer archer sword'],[90,'archer spear']]],
  ['风沙哨塔','defend',1600,16,['archer','sword'],'sandstorm',125,'在沙暴中坚守 125 秒。风沙让远程射程降低 20%。','射程缩短，近战军团更容易接近敌方射手。',700,[[28,'archer sword'],[60,'archer archer spear'],[96,'spear sword archer']]],
  ['绿洲商队','escort',1700,16,['sword','archer','spear'],'rich',0,'矿车装载着珍贵补给，护送它穿过绿洲。','丰富矿脉带来更多黄金，利用它尽早建立混编军团。',750,[[28,'sword archer'],[62,'spear archer'],[108,'archer archer sword']]],
  ['沙海奔袭','timed',1800,17,['archer','spear'],'sandstorm',210,'在 210 秒内突破沙海阵地。','雷霆皮肤可惩罚密集队形；箭雨适合清理远程群。',800,[[32,'archer archer'],[75,'spear archer'],[128,'archer archer spear']]],
  ['百步穿杨','destroy',2000,18,['archer','spear','sword'],'boss',0,'长弓统领率精锐把守古老城门。','治疗放在接战之后；先手使用会浪费恢复量。',850,[[30,'archer archer spear'],[78,'sword spear'],[115,'archer! archer archer']]],
  ['雪线前哨','destroy',1900,18,['spear','sword'],'snow',0,'北境寒风让所有部队行军变慢。','林叶行装能帮助重甲单位更快抵达前线。',800,[[38,'spear sword'],[88,'spear archer sword']]],
  ['冻土守卫','defend',2100,20,['spear','archer'],'snow',145,'在暴雪里守住雕像 145 秒。','驻守恢复和石像修复能为下一次反击争取时间。',850,[[30,'spear sword'],[66,'spear archer archer'],[110,'spear spear sword']]],
  ['冰川运输','escort',2100,19,['spear','archer','sword'],'snow',0,'矿车沿冰川缓慢前行，保护它穿过三轮伏击。','护送关中，矿车生命耗尽同样会失败。',900,[[30,'spear sword'],[70,'archer archer spear'],[118,'spear sword sword']]],
  ['寒夜破阵','timed',2200,21,['spear','archer'],'snow',230,'在 230 秒内打穿盾墙。','巫师范围法术适合对付紧密站位的重甲军团。',950,[[35,'spear spear'],[80,'archer mage'],[135,'spear spear archer']]],
  ['铁矛誓约','destroy',2600,22,['spear','archer','sword'],'boss',0,'铁矛统领在冰封的雕像前接受最后的挑战。','组建卫士、弓手与巫师，再集中力量推进。',1000,[[32,'spear sword archer'],[76,'spear spear'],[120,'spear! spear archer']]],
  ['迷雾入口','destroy',2300,22,['mage','sword','archer'],'fog',0,'秘林的雾气让远程视野降低 20%。','控制剑士突进巫师阵地，避免被连续施法。',950,[[32,'sword mage'],[82,'mage spear archer']]],
  ['符文之环','defend',2500,23,['mage','spear'],'fog',150,'守住符文阵地 150 秒，化解议会的三轮进攻。','寒霜卷轴能打断敌方推进节奏。',1000,[[26,'sword mage'],[65,'spear mage archer'],[112,'mage mage spear']]],
  ['林中密道','escort',2500,23,['mage','archer','sword'],'rich',0,'矿车携带着秘法晶石，必须平安穿越密林。','巫师的范围伤害会波及矿车，优先处理敌方法师。',1000,[[30,'sword mage'],[70,'archer spear mage'],[116,'mage sword sword']]],
  ['法阵倒计时','timed',2700,24,['mage','spear','archer'],'fog',240,'在法阵闭合前击碎秘法雕像。','巨人对雕像造成双倍伤害，能大幅缩短攻城时间。',1100,[[32,'spear mage'],[78,'archer mage'],[135,'spear mage mage']]],
  ['暮色议会','destroy',3000,25,['mage','spear','archer'],'boss',0,'秘法议长将与他的守卫一起迎战。','议长生命与伤害更高，使用箭雨与狂怒快速削减护卫。',1100,[[28,'sword spear mage'],[72,'mage archer archer'],[116,'mage! spear mage']]],
  ['碎石之径','destroy',2700,25,['giant','sword','archer'],'normal',0,'沉重的脚步正在山谷回响，军团首次面对成群巨人。','巨人挥击缓慢，弓手可以持续输出。',1500,[[35,'sword giant'],[88,'archer spear giant']]],
  ['熔岩壁垒','defend',2900,26,['giant','spear'],'embers',160,'守住壁垒 160 秒。余烬地带每 8 秒喷发一次。','红色地缝在喷发前会发亮，避免让部队长时间驻足中央。',1200,[[30,'spear giant'],[70,'archer giant sword'],[122,'giant spear mage']]],
  ['火山矿道','escort',3000,25,['giant','sword','mage'],'embers',0,'护送矿车穿过火山矿道，清除挡路的巨人。','护送矿车不受地缝喷发伤害，但仍会被敌军攻击。',1600,[[28,'sword giant'],[74,'mage spear'],[122,'giant archer sword']]],
  ['山脊冲锋','timed',3100,27,['giant','spear','archer'],'embers',250,'在 250 秒内摧毁山脊雕像。','用矿工药剂快速发展，用巨人和巫师处理重型守军。',1300,[[30,'giant sword'],[80,'spear mage'],[136,'giant spear archer']]],
  ['山岭之王','destroy',3500,28,['giant','spear','mage'],'boss',0,'巨人之王挡在王庭的最后一条山路上。','王者生命很高。优先击败护卫，再用远程军团集中攻击。',1350,[[32,'giant archer'],[76,'spear mage'],[120,'giant! spear sword']]],
  ['暗夜城门','destroy',3200,28,['sword','archer','mage','spear'],'night',0,'混沌军团集结于星夜下的城门。','合理分配金币，单一兵种很难应对混编敌军。',1300,[[28,'sword spear archer'],[72,'mage spear'],[126,'giant archer']]],
  ['黎明防线','defend',3400,29,['giant','mage','spear'],'night',175,'在黎明之前坚守 175 秒。','先以防守消耗对手，危险时撤回雕像附近回血。',1400,[[25,'spear mage'],[62,'giant archer spear'],[105,'mage mage sword'],[145,'giant spear mage']]],
  ['最后的补给','escort',3500,28,['spear','mage','archer','giant'],'night',0,'将最后一车补给送到王庭，军团的命运系于这次护送。','为矿车保持一条安全通路；援军号角能立刻补充损失。',1400,[[25,'spear archer'],[68,'giant mage'],[110,'mage spear archer'],[155,'giant sword']]],
  ['破晓之战','timed',3700,26,['giant','mage','spear','archer'],'night',270,'在 270 秒内突破王庭外墙。','三种道具配合混编军团，可以创造短暂但决定性的优势。',1800,[[28,'spear mage archer'],[70,'giant spear'],[116,'mage mage archer'],[170,'giant spear mage']]],
  ['最后的王座','destroy',4200,32,['giant','mage','spear','archer','sword'],'boss',0,'王庭召回全部精锐。摧毁最后的雕像，让自由成为每个人的信仰。','保护矿工，保持补给。王庭统领出现时，集中技能与火力。',1600,[[28,'spear sword archer'],[68,'mage giant'],[112,'spear! mage archer'],[165,'giant! spear mage']]]
];
export const LEVELS = encounters.map((row,i)=>{const [title,goal,hp,income,types,modifier,duration,text,tip,startGold,waves]=row,region=REGIONS[Math.floor(i/5)];return {id:`campaign-${String(i+1).padStart(2,'0')}`,title,subtitle:text,region:region.name,biome:region.id,chapter:Math.floor(i/5),stage:i%5+1,goal,hp,income,types,modifier,duration,text,tip,startGold,color:region.color,reward:i%5===4?4:2,interval:Math.max(8,16-Math.floor(i/4)),enemy:['叛军军团','长弓部族','铁矛军团','秘法议会','山岭巨人','混沌王庭'][Math.floor(i/5)],waves:waves.map(([at,units])=>({at,units:units.split(' ')}))};});
export function skinFor(type,loadout={}) { return SKINS[loadout[type]]||SKINS.classic; }
export function missionText(config, battle) {
  if(battle?.survival)return `无尽坚守 · 已迎战 ${battle.wave} 波`;
  if(config.goal==='defend')return `守住雕像 ${config.duration} 秒${battle?` · 剩余 ${Math.max(0,Math.ceil(config.duration-battle.time))} 秒`:''}`;
  if(config.goal==='timed')return `${config.duration} 秒内摧毁敌方雕像${battle?` · 剩余 ${Math.max(0,Math.ceil(config.duration-battle.time))} 秒`:''}`;
  if(config.goal==='escort')return `护送矿车抵达终点${battle?.convoy?` · 路程 ${Math.min(100,Math.round((battle.convoy.x-360)/2020*100))}%`:''}`;
  return '守护我方雕像，摧毁敌方雕像';
}
