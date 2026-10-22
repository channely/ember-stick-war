export const WORLD = 2700;
export const UNITS = {
  miner: { name: '矿工', en: 'MINER', cost: 100, hp: 85, damage: 5, range: 32, speed: 82, cooldown: 1.4, train: 3.5, pop: 1, role: '经济', desc: '开采黄金，支撑你的每一次远征。每趟带回 35 黄金。' },
  sword: { name: '剑士', en: 'SWORDWRATH', cost: 125, hp: 180, damage: 25, range: 40, speed: 92, cooldown: 1.05, train: 4.5, pop: 1, role: '近战', desc: '快速、可靠的前线战士。低廉的造价适合组建第一支军团。' },
  archer: { name: '弓箭手', en: 'ARCHER', cost: 250, hp: 105, damage: 28, range: 340, speed: 67, cooldown: 1.65, train: 6, pop: 1, role: '远程', desc: '在后方射出精准箭矢。需要近战单位保护，才能发挥最大威力。' },
  spear: { name: '长矛卫士', en: 'SPEAR GUARD', cost: 375, hp: 480, damage: 40, range: 66, speed: 55, cooldown: 1.45, train: 8, pop: 2, role: '重甲', desc: '盾牌与长矛构筑坚实防线。高生命值，能抵挡敌人的持续进攻。' },
  mage: { name: '巫师', en: 'MAGIKILL', cost: 650, hp: 150, damage: 65, range: 280, speed: 49, cooldown: 3, train: 11, pop: 2, role: '法术', desc: '召唤奥术火焰，对目标周围 100 距离内的敌军造成范围伤害。' },
  giant: { name: '巨人', en: 'GIANT', cost: 1000, hp: 1400, damage: 95, range: 95, speed: 36, cooldown: 2.3, train: 15, pop: 4, role: '攻城', desc: '沉重一击撼动整条战线。对雕像造成双倍伤害，同时击退附近敌人。' }
};
export const LEVELS = [
  { title: '余烬平原', subtitle: '在尘土中建立军团，让自由的旗帜再次飘扬。', region: '秩序边境', enemy: '流亡剑士', hp: 1200, income: 13, interval: 14, types: ['sword', 'sword', 'archer'], color: '#bca77c', reward: 2, text: '边境的叛军正在集结。建立经济，率领你的第一支军团夺回平原。' },
  { title: '长弓峡谷', subtitle: '越过箭雨，踏碎峡谷中最后一道防线。', region: '西部峡谷', enemy: '长弓部族', hp: 1600, income: 17, interval: 12, types: ['archer', 'archer', 'sword'], color: '#a8aa85', reward: 2, text: '峡谷是弓箭手的领地。用卫士掩护剑士，拉近距离，突破远程火力。' },
  { title: '铁矛荒原', subtitle: '当长矛林立，勇气便是唯一的道路。', region: '北境荒原', enemy: '铁矛军团', hp: 2100, income: 22, interval: 11, types: ['spear', 'sword', 'archer'], color: '#aaa08f', reward: 3, text: '重甲军团守卫着北境。混编弓箭手与巫师，消耗坚不可摧的盾墙。' },
  { title: '暮色秘林', subtitle: '古老的法术在林间低语，新的秩序终将到来。', region: '暮色森林', enemy: '秘法议会', hp: 2500, income: 28, interval: 10, types: ['mage', 'spear', 'sword', 'archer'], color: '#839b94', reward: 3, text: '秘法议会将以烈焰守护领地。集中火力消灭脆弱的巫师，避免全军暴露在法术之下。' },
  { title: '巨人山脊', subtitle: '大地正在震颤，军团必须继续前行。', region: '远古山脊', enemy: '山岭巨人', hp: 3200, income: 35, interval: 9, types: ['giant', 'spear', 'archer', 'sword'], color: '#9b9590', reward: 4, text: '巨人的脚步震动群山。以坚韧的前排争取时间，让弓箭手持续输出。' },
  { title: '最后的王座', subtitle: '这一战之后，让自由成为每个人的信仰。', region: '王国之心', enemy: '混沌王庭', hp: 4200, income: 43, interval: 8, types: ['spear', 'mage', 'giant', 'archer', 'sword'], color: '#ac8d7c', reward: 5, text: '王庭的全部军团已集结。这是最后一战，用所有学会的战术夺回属于你的王国。' }
];
const DIFFICULTY = { easy: 0.72, normal: 1, hard: 1.35 };
export function population(units, queue = []) { return units.filter(u => u.team === 0 && u.hp > 0).reduce((n, u) => n + UNITS[u.type].pop, 0) + queue.reduce((n, q) => n + UNITS[q.type].pop, 0); }

export class Battle {
  constructor({ level = 0, difficulty = 'normal', upgrades = {}, survival = false, seed = 24 } = {}) {
    this.level = Math.max(0, Math.min(5, level)); this.difficulty = difficulty; this.upgrades = { ...upgrades }; this.survival = survival; this.seed = seed;
    this.config = survival ? { ...LEVELS[0], hp: 999999, income: 18, interval: 12, types: ['sword','archer'] } : LEVELS[this.level]; this.factor = DIFFICULTY[difficulty] || 1;
    this.time = 0; this.status = 'ready'; this.order = 'defend'; this.gold = 500; this.enemyGold = 200;
    this.baseMax = 1500 + (upgrades.statue || 0) * 400; this.baseHP = this.baseMax;
    this.enemyMax = Math.round(this.config.hp * this.factor); this.enemyHP = this.enemyMax;
    this.units = []; this.queue = []; this.projectiles = []; this.effects = []; this.events = []; this.nextId = 1;
    this.enemyTimer = 16; this.wave = 0; this.nextWave = survival ? 28 : 38; this.selected = null;
    this.rage = 0; this.rageCooldown = 0; this.healCooldown = 0; this.towerCooldown = 0;
    this.stats = { kills: 0, trained: 0, goldMined: 0, lost: 0 }; this.manual = { left: false, right: false, attack: false };
    this.spawn('miner', 0, 345); this.spawn('miner', 0, 415); this.spawn('sword', 0, 555);
    this.spawn('sword', 1, 2370); if (level > 0) this.spawn(this.config.types[0], 1, 2300);
  }
  random() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  spawn(type, team, x) {
    const d = UNITS[type], factor = team ? this.factor * (1 + this.level * .055 + (this.survival ? this.wave * .045 : 0)) : 1 + (this.upgrades[type] || 0) * .16;
    const u = { id: this.nextId++, type, team, x: x ?? (team ? WORLD - 200 : 205), lane: this.random() * 50 - 10, hp: Math.round(d.hp * factor), maxHP: Math.round(d.hp * factor), damage: d.damage * factor, cooldown: this.random() * .8, phase: this.random() * 6.28, action: 'idle', cargo: 0, mineTime: 0, hurt: 0, swing: 0, facing: team ? -1 : 1 };
    this.units.push(u); return u;
  }
  start() { if (this.status === 'ready') { this.status = 'playing'; this.emit('start'); } }
  train(type) {
    if (!UNITS[type] || ['won', 'lost'].includes(this.status)) return { ok: false, message: '这场战斗已经结束' };
    if (this.status === 'paused') return { ok: false, message: '请先继续战斗' };
    const d = UNITS[type];
    if (this.queue.length >= 5) return { ok: false, message: '训练队列已满，最多同时排队 5 个单位' };
    if (population(this.units, this.queue) + d.pop > 40) return { ok: false, message: '已达到 40 人口上限' };
    if (this.gold < d.cost) return { ok: false, message: `黄金不足，还需要 ${Math.ceil(d.cost - this.gold)} 黄金` };
    this.gold -= d.cost; this.queue.push({ type, remaining: d.train, total: d.train });
    this.emit('train', { unitType: type }); return { ok: true };
  }
  cancelTraining(index = this.queue.length - 1) {
    if (['won','lost'].includes(this.status) || !this.queue[index]) return false;
    this.gold += UNITS[this.queue[index].type].cost; this.queue.splice(index, 1); return true;
  }
  command(order) { if (!['garrison','defend','attack'].includes(order)) return; this.order = order; this.selected = null; this.emit('order', { order }); }
  skill(type) {
    if (this.status !== 'playing') return { ok: false, message: '开始战斗后可施放技能' };
    if (type === 'rage' && this.rageCooldown <= 0) { this.rage = 12; this.rageCooldown = 55; this.emit('skill', { skill: type }); return { ok: true }; }
    if (type === 'heal' && this.healCooldown <= 0) { this.healCooldown = 65; for (const u of this.units.filter(u => u.team === 0 && u.hp > 0)) { u.hp = Math.min(u.maxHP, u.hp + u.maxHP * .45); this.effects.push({ type: 'heal', x: u.x, lane: u.lane, life: 1.2, maxLife: 1.2 }); } this.emit('skill', { skill: type }); return { ok: true }; }
    return { ok: false, message: '技能正在冷却' };
  }
  hit(target, amount, source) {
    if (!target || target.hp <= 0) return;
    target.hp = Math.max(0, target.hp - amount); target.hurt = .16;
    this.effects.push({ type: 'hit', x: target.x, lane: target.lane - 32, life: .3, maxLife: .3, value: Math.round(amount), team: target.team });
    if (target.hp <= 0) { this.emit('death', { unit: target.type, team: target.team }); this.effects.push({ type: 'death', x: target.x, lane: target.lane, life: .7, maxLife: .7, team: target.team }); if (target.team) { this.stats.kills++; this.gold += 18 + UNITS[target.type].pop * 7; } else { this.stats.lost++; if (this.selected === target.id) this.selected = null; } }
    if (source?.type === 'giant' && target.hp > 0) target.x += source.team ? -18 : 18;
  }
  strike(u, target, base = false) {
    const d = UNITS[u.type]; u.cooldown = d.cooldown; u.swing = .4; u.action = 'attack';
    let damage = u.damage * (u.team === 0 && this.rage > 0 ? 1.6 : 1);
    if (u.id === this.selected && this.manual.attack) damage *= 1.35;
    if (base) {
      if (u.type === 'giant') damage *= 2;
      if (u.team) this.baseHP = Math.max(0, this.baseHP - damage); else this.enemyHP = Math.max(0, this.enemyHP - damage);
      this.effects.push({ type: 'hit', x: u.team ? 175 : WORLD - 175, lane: -50, life: .4, maxLife: .4, value: Math.round(damage) });
    } else if (u.type === 'archer' || u.type === 'mage') {
      this.projectiles.push({ x: u.x, fromX: u.x, target: target.id, toX: target.x, lane: u.lane - 43, toLane: target.lane - 35, progress: 0, speed: u.type === 'mage' ? 550 : 820, type: u.type, team: u.team, damage });
    } else if (u.type === 'giant') {
      for (const t of this.units.filter(t => t.team !== u.team && t.hp > 0 && Math.abs(t.x - target.x) < 90)) this.hit(t, damage, u);
      this.effects.push({ type: 'stomp', x: target.x, lane: target.lane, life: .5, maxLife: .5 });
    } else this.hit(target, damage, u);
    if (u.team === 0) this.emit('attack', { unit: u.type });
  }
  move(u, targetX, dt, speedFactor = 1) { const delta = targetX - u.x; if (Math.abs(delta) > 3) { u.facing = Math.sign(delta); u.x += Math.sign(delta) * Math.min(Math.abs(delta), UNITS[u.type].speed * dt * speedFactor); u.action = 'walk'; } else u.action = 'idle'; }
  update(dt) {
    if (this.status !== 'playing') return;
    dt = Math.min(.1, Math.max(0, dt)); this.time += dt;
    this.rage = Math.max(0, this.rage - dt); this.rageCooldown = Math.max(0, this.rageCooldown - dt); this.healCooldown = Math.max(0, this.healCooldown - dt);
    this.gold += dt * 1.5; this.enemyGold += dt * this.config.income * this.factor;
    for (const e of this.effects) e.life -= dt; this.effects = this.effects.filter(e => e.life > 0);
    if (this.queue.length) { this.queue[0].remaining -= dt; if (this.queue[0].remaining <= 0) { const q = this.queue.shift(); this.spawn(q.type, 0); this.stats.trained++; this.emit('trained', { unitType: q.type }); } }
    this.enemyTimer -= dt;
    if (this.enemyTimer <= 0 && this.units.filter(u => u.team === 1).length < 28) {
      const type = this.config.types[Math.floor(this.random() * this.config.types.length)];
      if (this.enemyGold >= UNITS[type].cost * .72) { this.enemyGold -= UNITS[type].cost * .72; this.spawn(type, 1); }
      this.enemyTimer = this.config.interval / (this.factor * (this.survival ? 1 + this.wave * .09 : 1));
    }
    if (this.time >= this.nextWave) {
      this.wave++; this.nextWave += this.survival ? 36 : 48;
      if (this.survival) this.config.types = ['sword','archer','spear','mage','giant'].slice(0, Math.min(5, 2 + Math.floor(this.wave / 3)));
      this.emit('wave', { wave: this.wave });
      const count = this.survival ? Math.min(9, 2 + this.wave) : 1 + Math.floor(this.level / 2);
      for (let i = 0; i < count; i++) { const type = this.config.types[Math.floor(this.random() * this.config.types.length)]; this.spawn(type, 1, WORLD - 220 - i * 34); }
    }
    const alive = this.units.filter(u => u.hp > 0);
    for (const u of alive) {
      u.cooldown -= dt; u.hurt = Math.max(0, u.hurt - dt); u.swing = Math.max(0, u.swing - dt); u.phase += dt * (u.action === 'walk' ? 9 : 2);
      if (u.hp <= 0) continue;
      const def = UNITS[u.type];
      if (u.id === this.selected && (this.manual.left || this.manual.right)) { this.move(u, u.x + (this.manual.right ? 80 : -80), dt, 1.2); u.x = Math.max(100, Math.min(WORLD - 100, u.x)); continue; }
      if (!u.team && this.order === 'garrison' && u.id !== this.selected) { this.move(u, 170 + (u.id % 4) * 19, dt, 1.2); if (u.x < 260) u.hp = Math.min(u.maxHP, u.hp + dt * u.maxHP * .035); continue; }
      if (u.type === 'miner' && u.id !== this.selected) {
        const mineX = 400 + u.id % 3 * 48, home = 220;
        if (u.cargo > 0) { this.move(u, home, dt); if (Math.abs(u.x - home) < 8) { this.gold += u.cargo; this.stats.goldMined += u.cargo; this.effects.push({ type: 'gold', x: u.x, lane: u.lane - 50, value: u.cargo, life: 1.5, maxLife: 1.5 }); u.cargo = 0; } }
        else { this.move(u, mineX, dt); if (Math.abs(u.x - mineX) < 8) { u.action = 'mine'; u.mineTime += dt; if (u.mineTime >= 3.4 / (1 + (this.upgrades.miner || 0) * .2)) { u.cargo = 35 + (this.upgrades.miner || 0) * 8; u.mineTime = 0; } } }
        continue;
      }
      let target = null, distance = Infinity;
      for (const t of alive) if (t.team !== u.team && t.hp > 0) { const d = Math.abs(t.x - u.x); if (d < distance) { distance = d; target = t; } }
      const baseX = u.team ? 175 : WORLD - 175, baseDistance = Math.abs(u.x - baseX);
      const isManual = u.id === this.selected;
      const mayAttack = !isManual || this.manual.attack;
      if (distance <= def.range + 12 && mayAttack) { u.action = 'attack'; u.facing = Math.sign(target.x - u.x) || u.facing; if (u.cooldown <= 0) this.strike(u, target); }
      else if (baseDistance <= def.range + 40 && mayAttack && (u.team || this.order === 'attack' || isManual) && !(this.survival && !u.team)) { u.action = 'attack'; u.facing = u.team ? -1 : 1; if (u.cooldown <= 0) this.strike(u, null, true); }
      else if (!isManual) {
        let dest;
        if (u.team) { dest = this.wave > 0 ? (target ? target.x : 190) : WORLD - 520 - (u.id % 5) * 24; }
        else if (this.order === 'attack') dest = target ? target.x : WORLD - 180;
        else dest = target && target.x < 860 ? target.x : 620 - (u.id % 5) * 28 - (def.range > 100 ? 120 : 0);
        if (target && Math.abs(dest - target.x) < 2) dest -= (target.x > u.x ? 1 : -1) * (def.range - 5);
        this.move(u, dest, dt, this.rage > 0 && !u.team ? 1.2 : 1);
      } else u.action = 'idle';
    }
    for (const p of this.projectiles) {
      p.progress += dt * p.speed / Math.max(70, Math.abs(p.toX - p.fromX)); p.x = p.fromX + (p.toX - p.fromX) * Math.min(1, p.progress);
      if (p.progress >= 1) { const target = this.units.find(u => u.id === p.target); if (p.type === 'mage') { this.effects.push({ type: 'magic', x: p.toX, lane: p.toLane, life: .6, maxLife: .6 }); for (const t of this.units.filter(u => u.team !== p.team && u.hp > 0 && Math.abs(u.x - p.toX) < 100)) this.hit(t, p.damage); } else this.hit(target, p.damage); }
    }
    this.projectiles = this.projectiles.filter(p => p.progress < 1);
    // Base archers protect a retreat, but cannot win a battle on their own.
    this.towerCooldown -= dt;
    if (this.towerCooldown <= 0) { const invader = this.units.find(u => u.team === 1 && u.hp > 0 && u.x < 380); if (invader) { this.hit(invader, 20); this.towerCooldown = 1.7; this.effects.push({ type: 'tower', x: invader.x, lane: invader.lane, life: .3, maxLife: .3 }); } }
    this.units = this.units.filter(u => u.hp > 0);
    if (this.baseHP <= 0) { this.status = 'lost'; this.emit('end', { win: false }); }
    else if (this.enemyHP <= 0 && !this.survival) { this.status = 'won'; this.emit('end', { win: true }); }
  }
  snapshot() { const { events, effects, manual, ...data } = this; return JSON.parse(JSON.stringify(data)); }
  static restore(data) {
    if (!data || !['ready','playing','paused'].includes(data.status) || !Array.isArray(data.units) || !Number.isFinite(data.gold)) return null;
    const battle = new Battle(data); Object.assign(battle, data); battle.config = battle.survival ? { ...LEVELS[0], hp: 999999, income: 18, interval: 12, types: ['sword','archer','spear','mage','giant'].slice(0,Math.min(5,2+Math.floor(battle.wave/3))) } : LEVELS[battle.level]; battle.events = []; battle.effects = []; battle.manual = { left: false, right: false, attack: false }; battle.selected = null; if (battle.status === 'playing') battle.status = 'paused'; return battle;
  }
}
