/** Browser ruleset. Costs/population are Legacy reference values; combat timings
 * and damage are explicit, local calibration values rather than claimed originals. */
export const RULESET_VERSION = 'legacy-web-0.3.0';
export const FIXED_STEP = 1 / 60;
export const WORLD = 2700;
export const POPULATION_CAP = 50;
export const QUEUE_CAP = 5;
export const DEPTH = Object.freeze({ min: -45, max: 80 });
export const DIFFICULTY = Object.freeze({ easy: .78, normal: 1, hard: 1.23 });
export const UNITS = {
  miner: { name:'矿工', en:'MINER', cost:150, hp:90, damage:6, range:32, speed:82, cooldown:1.3, train:10, pop:1, radius:10, windup:.28, recovery:.28, role:'经济', desc:'从有限金矿采掘，装袋后运回己方营地。接管时按住攻击采矿，回营自动交付。' },
  sword: { name:'剑士', en:'SWORDWRATH', cost:125, hp:150, damage:26, range:40, speed:92, cooldown:1.05, train:5, pop:1, radius:11, windup:.22, recovery:.25, role:'突击', desc:'快速近战。格挡正面攻击，跳斩突破前线；跳斩冷却 5 秒。' },
  archer: { name:'弓箭手', en:'ARCHIDON', cost:300, hp:95, damage:30, range:385, speed:67, cooldown:1.6, train:10, pop:1, radius:10, windup:.45, recovery:.3, role:'远程', desc:'射出可被躲避、被前排拦截的箭。接管时按住攻击瞄准，松开发射。' },
  spear: { name:'盾矛兵', en:'SPEARTON', cost:500, hp:480, damage:42, range:66, speed:55, cooldown:1.45, train:12, pop:2, radius:13, windup:.34, recovery:.35, role:'重甲', desc:'盾牌格挡正面伤害，长矛可手动投掷一次；投出后改用短剑近战。' },
  mage: { name:'法师', en:'MAGIKILL', cost:1200, hp:180, damage:82, range:215, speed:49, cooldown:3.2, train:20, pop:5, radius:12, windup:.8, recovery:.45, role:'召唤', desc:'震击近处敌军并短暂眩晕。基础召唤上限 2 名，法师帽每级增加 1 名；主人倒下后小兵继续作战。', calibration:'训练时间及震击数值待目标版本实机校准' },
  giant: { name:'巨人', en:'GIANT', cost:1500, hp:1500, damage:120, range:92, speed:36, cooldown:2.5, train:25, pop:4, radius:20, windup:.8, recovery:.65, role:'破阵', desc:'缓慢抡棒后范围砸击、击退敌军。经典皮肤只有基础砸击，其他皮肤可施放地震。', calibration:'训练时间及伤害数值待目标版本实机校准' }
};

export function population(units, queue = [], team = 0) {
  return units.filter(u => u.team === team && u.hp > 0 && !u.ownerId)
    .reduce((total, u) => total + (UNITS[u.type]?.pop || 0), 0)
    + queue.reduce((total, q) => total + (UNITS[q.type]?.pop || 0), 0);
}

export function upgradeLevel(upgrades, type, branch) {
  const names = {
    'miner.pick':'minerPick', 'miner.bag':'minerBag', 'sword.damage':'swordBlade',
    'sword.health':'swordHelmet', 'archer.damage':'archerBow', 'spear.damage':'spearSpear',
    'spear.health':'spearHelmet', 'spear.block':'spearShield', 'mage.damage':'mageStaff',
    'mage.summons':'mageHat', 'giant.damage':'giantClub', 'statue.health':'statueHealth',
    'statue.archers':'castleArchers'
  };
  const nested = upgrades?.[type];
  const raw = upgrades?.[names[`${type}.${branch}`]] ?? upgrades?.[`${type}.${branch}`] ?? upgrades?.[`${type}_${branch}`]
    ?? (typeof nested === 'object' ? nested?.[branch] : nested);
  return Math.max(0, Math.min(3, Number.isFinite(Number(raw)) ? Number(raw) : 0));
}

export function emptyManual() {
  return { x:0, y:0, attack:false, secondary:false, special:false, aimX:null, aimLane:null };
}

export function idleAction(kind = 'idle') {
  return { kind, phase:kind === 'idle' ? 'idle' : 'hold', elapsed:0, duration:0, windup:0, progress:0 };
}
