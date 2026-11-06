import test from 'node:test';
import assert from 'node:assert/strict';
import { Battle, UNITS, population } from '../dist/engine.js';
import { SKINS } from '../dist/content.js';
import { freshProgress, purchaseSkin, equipSkin } from '../dist/progress.js';

const STEP = 1 / 60;
const advance = (battle, seconds) => { for (let i = 0; i < Math.round(seconds * 60); i++) battle.update(STEP); };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} must equal ${expected}`);
function arena(options = {}, bossFinal = false) {
  const b = new Battle({ level: 29, ...options });
  b.units = []; b.queue = []; b.enemyQueue = []; b.projectiles = [];
  b.enemyEnabled = false; b.nextWave = Infinity;
  b.config = { ...b.config, goal: 'destroy', bossFinal, waves: [] };
  b.start(); return b;
}
function dummy(b, type, team, x, skin = 'classic') {
  return b.spawn(type, team, x, { lane: 0, skin, dummy: true });
}
function select(b, unit) { assert.equal(b.dispatch({ type: 'select', id: unit.id }).ok, true); }

// Ownership and combat effects are separate promises: buying one unit's skin
// must not silently equip or discount another unit type.
test('all seven skins equip only their purchased unit; Leaf discounts and speeds that recruit only', () => {
  for (const skin of Object.keys(SKINS)) {
    const save = freshProgress(); save.gems = 100;
    if (skin !== 'classic') assert.equal(purchaseSkin(save, 'sword', skin), true);
    assert.equal(equipSkin(save, 'sword', skin), true);
    if (skin !== 'classic') assert.equal(equipSkin(save, 'archer', skin), false);
    const b = arena({ loadout: save.loadout });
    assert.equal(b.spawn('sword', 0).skin, skin);
    assert.equal(b.spawn('archer', 0).skin, 'classic');
    assert.equal(b.trainingInfo('sword').cost, skin === 'leaf' ? 113 : UNITS.sword.cost);
    assert.equal(b.trainingInfo('sword').train, skin === 'leaf' ? 2.5 : UNITS.sword.train);
    assert.equal(b.trainingInfo('archer').cost, UNITS.archer.cost);
    assert.equal(b.trainingInfo('archer').train, UNITS.archer.train);
  }
  const b = arena({ loadout: { sword: 'leaf' } });
  const leaf = b.spawn('sword', 0, 600, { lane: 0 }), classic = dummy(b, 'sword', 0, 900);
  b.move(leaf, 800, 1); b.move(classic, 1100, 1);
  close(leaf.x - 600, classic.x - 900);
  leaf.x = 600; select(b, leaf); b.move(leaf, 800, 1);
  close(leaf.x - 600, (classic.x - 900) * 1.15);
});

test('Ice refreshes slow but its freeze cannot repeatedly stun inside the immunity window', () => {
  const b = arena(), source = dummy(b, 'sword', 0, 600, 'ice'), target = dummy(b, 'spear', 1, 1000);
  const controlled = { ...source, controlled: true };
  b.hit(target, 1, source); assert.equal(target.stun, 0); assert.equal(target.slowFactor, .7);
  b.hit(target, 1, controlled); close(target.stun, 1);
  advance(b, 1.2); close(target.stun, 0);
  b.hit(target, 1, controlled); close(target.stun, 0); close(target.slow, 2);
  advance(b, 1.9); b.hit(target, 1, controlled); close(target.stun, 1);
});

test('Lava reflects once; repeated controlled hits refresh burning without starving its damage ticks', () => {
  const b = arena(), source = dummy(b, 'spear', 0, 600, 'lava'), target = dummy(b, 'spear', 1, 1000, 'lava');
  b.hit(target, 40, source);
  close(target.maxHP - target.hp, 40); close(source.maxHP - source.hp, 6);
  assert.equal(b.effects.filter(e => e.type === 'hit').length, 2, 'two lava skins cannot recurse indefinitely');
  assert.equal(target.burn, 0, 'AI lava hits must not acquire the manual-only burn');

  target.skin = 'classic'; const before = target.hp;
  for (let i = 0; i < 4; i++) { b.hit(target, 1, { ...source, controlled: true }); advance(b, .5); }
  close(before - target.hp, 4 + 12, 'four hits plus two burn ticks');
  assert.ok(target.burn > 2, 'latest hit extends the same effect');
  const after = target.hp; advance(b, 3.2);
  assert.ok(target.hp < after); const expired = target.hp;
  advance(b, 1.1); close(target.hp, expired);
});

test('Vamp heals from actual surviving HP, while statue damage and repeated hits on a corpse give nothing', () => {
  const b = arena(), source = dummy(b, 'sword', 0, 600, 'vamp'), target = dummy(b, 'sword', 1, 1000);
  source.hp = 40; target.hp = 4;
  b.hit(target, 100, source); close(source.hp, 40.6);
  b.hit(target, 100, source); close(source.hp, 40.6); assert.equal(b.stats.kills, 1);
  source.x = 2490; select(b, source); const statueHP = b.enemyHP;
  assert.equal(b.strike(source, null, true), true); advance(b, 1);
  assert.ok(b.enemyHP < statueHP); close(source.hp, 40.6);
});

test('Volt chooses the nearest eligible neighbor once, without propagating through a cluster', () => {
  const b = arena(), source = dummy(b, 'sword', 0, 600, 'volt'), target = dummy(b, 'spear', 1, 1000);
  const farther = dummy(b, 'spear', 1, 1070), nearest = dummy(b, 'spear', 1, 1020), third = dummy(b, 'spear', 1, 1028);
  b.hit(target, 40, source);
  close(target.maxHP - target.hp, 40); close(nearest.maxHP - nearest.hp, 10);
  close(farther.hp, farther.maxHP); close(third.hp, third.maxHP);
  assert.equal(b.effects.filter(e => e.type === 'lightning').length, 1);
});

test('Savage resists stun but not Ice slow, and its damage bonus reaches the actual hit', () => {
  const b = arena(), source = dummy(b, 'sword', 0, 900, 'savage'), target = dummy(b, 'spear', 1, 930);
  select(b, source); b.applyStun(source, 5); assert.equal(source.stun, 0);
  b.hit(source, 1, { ...target, skin: 'ice', controlled: true });
  assert.equal(source.stun, 0); assert.equal(source.slowFactor, .7); assert.ok(source.slow > 0);
  assert.equal(b.strike(source, target), true); advance(b, .8);
  close(target.maxHP - target.hp, UNITS.sword.damage * 1.1);
});

test('items reject ineffective uses without cooldown or consumption, and successful effects share one cooldown', () => {
  const b = arena();
  for (const type of ['mining', 'rage', 'spear', 'arrows', 'heal']) {
    assert.equal(b.useItem(type).ok, false); assert.equal(b.itemCooldown, 0); assert.equal(b.stats.items, 0);
  }
  const sword = dummy(b, 'sword', 0, 600), enemy = dummy(b, 'spear', 1, 1500); select(b, sword);
  assert.equal(b.useItem('heal').ok, false, 'full health is not a consumable target');
  assert.equal(b.useItem('rage').ok, true); close(b.rage, 12); close(b.itemCooldown, 8);
  assert.equal(b.useItem('arrows').ok, false); assert.equal(enemy.hp, enemy.maxHP); assert.equal(b.stats.items, 1);
  advance(b, 8 + STEP);
  assert.equal(b.useItem('arrows').ok, true); close(enemy.maxHP - enemy.hp, 100); assert.equal(b.stats.items, 2);
  advance(b, 8 + STEP); sword.hp = 20;
  assert.equal(b.useItem('heal').ok, true); close(sword.hp, 20 + sword.maxHP * .45);
  advance(b, 8 + STEP); dummy(b, 'miner', 0, 250);
  assert.equal(b.useItem('mining').ok, true); close(b.miningBoost, 30);
  advance(b, 8 + STEP); dummy(b, 'spear', 0, 700);
  assert.equal(b.useItem('spear').ok, true); close(b.spearRage, 12);

  const locked = arena({ level: 0 });
  assert.equal(locked.useItem('reinforcements').ok, false); assert.equal(locked.itemCooldown, 0);
  const full = arena();
  for (let i = 0; i < 12; i++) dummy(full, 'giant', 0, 600 + i * 30);
  assert.equal(full.useItem('reinforcements').ok, false); assert.equal(full.stats.items, 0); assert.equal(full.itemCooldown, 0);
  full.units.pop(); for (let i = 0; i < 3; i++) dummy(full, 'sword', 0, 1500 + i * 30);
  assert.equal(population(full.units), 47); assert.equal(full.useItem('reinforcements').ok, true);
  assert.equal(population(full.units), 50); assert.equal(full.stats.trained, 3); assert.equal(full.stats.items, 1);
});

test('the final statue opens a single boss phase; only defeating that boss completes the battle', () => {
  const b = arena({ level: 11 }, true); b.damageBase(1, b.enemyMax); advance(b, STEP);
  assert.equal(b.status, 'playing'); assert.equal(b.bossPhase, true);
  const boss = b.units.find(u => u.boss); assert.ok(boss);
  advance(b, .2); assert.equal(b.units.filter(u => u.boss).length, 1);
  assert.equal(b.events.filter(e => e.type === 'end').length, 0);
  const resumed = Battle.restore(b.snapshot()); assert.ok(resumed); assert.equal(resumed.bossPhase, true);
  resumed.dispatch({ type: 'resume' }); const restoredBoss = resumed.units.find(u => u.boss);
  resumed.hit(restoredBoss, restoredBoss.hp); advance(resumed, STEP);
  assert.equal(resumed.status, 'won'); assert.equal(resumed.stats.bosses, 1);
  advance(resumed, 3); assert.equal(resumed.events.filter(e => e.type === 'end').length, 1);
});

test('mutual damage counts each death once, and a destroyed home statue prevents a simultaneous victory or boss spawn', () => {
  const b = arena(), source = dummy(b, 'sword', 0, 600, 'lava'), target = dummy(b, 'sword', 1, 1000, 'lava');
  source.hp = .1; target.hp = 1; b.hit(target, 20, source);
  assert.equal(source.hp, 0); assert.equal(target.hp, 0); assert.equal(b.stats.kills, 1); assert.equal(b.stats.lost, 1);
  b.hit(target, 20, source); b.hit(source, 20, target);
  assert.equal(b.events.filter(e => e.type === 'death').length, 2);
  const end = arena({ level: 11 }, true);
  end.damageBase(0, end.baseMax); end.damageBase(1, end.enemyMax); advance(end, STEP);
  assert.equal(end.status, 'lost'); assert.equal(end.bossSpawned, false);
  assert.deepEqual(end.events.filter(e => e.type === 'end').map(e => e.win), [false]);
});

test('manual healing shares its clock across selections and checkpoints, while pause and released control do not earn time', () => {
  const b = arena(), first = dummy(b, 'sword', 0, 600), second = dummy(b, 'sword', 0, 1000);
  first.hp = second.hp = 20; select(b, first); advance(b, 4.5);
  close(first.hp, 20); select(b, second); advance(b, .5);
  close(first.hp, 20); close(second.hp, 30); close(b.manualHealTimer, 0);
  advance(b, 3); b.dispatch({ type: 'pause' }); const saved = b.snapshot();
  advance(b, 20); close(b.manualHealTimer, 3); close(second.hp, 30);
  const restored = Battle.restore(saved); assert.ok(restored); restored.dispatch({ type: 'resume' });
  advance(restored, 10); close(restored.manualHealTimer, 3, 'restored unselected control cannot earn healing');
  const unit = restored.units.find(u => u.id === first.id); select(restored, unit); advance(restored, 2);
  close(unit.hp, 30); close(restored.manualHealTimer, 0);
  restored.dispatch({ type: 'release' }); advance(restored, 10); close(restored.manualHealTimer, 0);
  select(restored, unit); unit.hp = unit.maxHP - 3; advance(restored, 5); close(unit.hp, unit.maxHP);
});

test('physical hit height distinguishes a body hit, headshot and an overhead miss without duplicate impacts', () => {
  for (const [height, expectedDamage, expectedHeadshots] of [[25, 40, 0], [50, 60, 1], [75, 0, 0]]) {
    const b = arena(), source = dummy(b, 'archer', 0, 900), target = dummy(b, 'spear', 1, 1000); select(b, source);
    b.launchProjectile(source, { aimX: target.x, aimLane: target.lane, controlled: true }, 40, 'arrow');
    // A controlled geometry fixture: same swept line, different vertical height.
    Object.assign(b.projectiles[0], { x:950, prevX:950, z:height, prevZ:height, vx:600, vlane:0, vz:0, gravity:0 });
    advance(b, .2); close(target.maxHP - target.hp, expectedDamage);
    assert.equal(b.events.filter(e => e.type === 'headshot').length, expectedHeadshots);
    advance(b, 1); close(target.maxHP - target.hp, expectedDamage);
  }
});
