import test from 'node:test';
import assert from 'node:assert/strict';
import { Battle, UNITS, population } from '../dist/engine.js';
import { CAMPAIGN_ID, RULESET_VERSION } from '../dist/content.js';

const STEP = 1 / 60;
function advance(b, seconds, hz = 60) { for (let i = 0; i < Math.round(seconds * hz); i++) b.update(1 / hz); }
function until(b, predicate, seconds = 10) {
  for (let i = 0; i < seconds * 60 && !predicate(); i++) b.update(STEP);
  return predicate();
}
function quiet(options = {}) {
  const b = new Battle({ level: 29, ...options });
  b.units = []; b.queue = []; b.enemyQueue = []; b.projectiles = [];
  b.enemyEnabled = false; b.nextWave = 1e9; b.waveIndex = b.config.waves.length;
  b.config = { ...b.config, goal: 'destroy', bossFinal: false, waves: [] };
  b.gold = 20000; b.enemyGold = 20000; b.start();
  return b;
}
function select(b, u) { assert.equal(b.dispatch({ type: 'select', id: u.id }).ok, true); }
function action(b, name, pressed) {
  return b.dispatch({ type: 'action', action: name, ...(pressed === undefined ? {} : { pressed }) });
}
function normalize(v) {
  if (typeof v === 'number') return Math.round(v * 1e7) / 1e7;
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, value]) => [k, normalize(value)]));
  return v;
}

test('Legacy costs, population and verified training times replace 0.2 values', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(UNITS).map(([key, u]) => [key, [u.cost, u.pop]])), {
    miner: [150, 1], sword: [125, 1], archer: [300, 1], spear: [500, 2], mage: [1200, 5], giant: [1500, 4],
  });
  assert.deepEqual(['miner', 'sword', 'archer', 'spear'].map(t => UNITS[t].train), [10, 5, 10, 12]);
  for (const type of ['mage', 'giant']) {
    assert.ok(UNITS[type].train > 0);
    assert.ok(UNITS[type].calibration, 'unverified timing must be labelled as calibration');
  }
});

test('locked units, insufficient funds and full queue cannot spend gold', () => {
  const first = new Battle();
  assert.equal(first.train('archer').ok, false); assert.equal(first.train('mage').ok, false);
  const b = quiet(); b.gold = 124;
  assert.equal(b.train('sword').ok, false); assert.equal(b.gold, 124);
  b.gold = 2000;
  for (let i = 0; i < 5; i++) assert.equal(b.train('miner').ok, true);
  const balance = b.gold;
  assert.equal(b.train('sword').ok, false); assert.equal(b.gold, balance); assert.equal(b.queue.length, 5);
});

test('one serial training queue refunds the actual discounted payment on cancellation', () => {
  const b = quiet({ loadout: { miner: 'leaf' } }), gold = b.gold;
  assert.equal(b.train('sword').ok, true); assert.equal(b.train('miner').ok, true);
  assert.equal(b.queue[1].paid, 135); assert.equal(b.queue[1].total, 5);
  advance(b, UNITS.sword.train - STEP);
  assert.equal(b.stats.trained, 0);
  assert.equal(b.queue[1].remaining, b.queue[1].total, 'waiting units cannot train in parallel');
  advance(b, STEP * 2);
  assert.equal(b.stats.trained, 1); assert.equal(b.queue.length, 1); assert.ok(b.queue[0].remaining > 4.9);
  assert.equal(b.cancelTraining(0), true); assert.equal(b.gold, gold - UNITS.sword.cost);
  assert.equal(b.stats.goldRefunded, 135); assert.equal(b.cancelTraining(0), false);
});

test('50 population includes queued and garrisoned units but excludes summoned minions', () => {
  const b = quiet();
  for (let i = 0; i < 12; i++) b.spawn('giant', 0, 200, { lane: i });
  b.spawn('miner', 0, 200).hidden = true;
  for (let i = 0; i < 5; i++) b.spawn('minion', 0, 400, { ownerId: b.units[0].id });
  assert.equal(population(b.units, b.queue), 49);
  assert.equal(b.train('mage').ok, false); assert.equal(b.train('archer').ok, true);
  assert.equal(population(b.units, b.queue), 50);
  const balance = b.gold;
  assert.equal(b.train('miner').ok, false); assert.equal(b.gold, balance);
  assert.equal(b.cancelTraining(), true); assert.equal(population(b.units, b.queue), 49);
});

test('both armies pay the same recruit costs and cannot purchase into debt', () => {
  const b = quiet(); b.gold = b.enemyGold = 500;
  assert.equal(b.train('spear', 0).ok, true); assert.equal(b.train('spear', 1).ok, true);
  assert.equal(b.gold, 0); assert.equal(b.enemyGold, 0);
  assert.equal(b.stats.goldSpent, 500); assert.equal(b.stats.enemyGoldSpent, 500);
  assert.equal(b.train('miner', 0).ok, false); assert.equal(b.train('miner', 1).ok, false);
  assert.equal(b.queue.length, 1); assert.equal(b.enemyQueue.length, 1);
});

test('idle income and kill bounties cannot create gold outside the mining economy', () => {
  const b = quiet(), before = [b.gold, b.enemyGold];
  advance(b, 30); assert.deepEqual([b.gold, b.enemyGold], before);
  const source = b.spawn('sword', 0, 900, { lane: 0 }), target = b.spawn('sword', 1, 930, { lane: 0 });
  b.hit(target, target.hp, source); assert.deepEqual([b.gold, b.enemyGold], before);
});

test('manual miner fills a bag and must return home before gold is spendable', () => {
  const b = quiet(), mine = b.mines.find(m => m.team === 0);
  const miner = b.spawn('miner', 0, mine.x, { lane: mine.lane }); select(b, miner);
  const before = b.gold, remaining = mine.remaining;
  action(b, 'primary', true);
  assert.equal(until(b, () => miner.cargo > 0, 10), true);
  assert.equal(b.gold, before); assert.equal(b.stats.goldMined, 0); assert.ok(mine.remaining < remaining);
  action(b, 'primary', false); b.dispatch({ type: 'move', x: -1, y: 0 });
  assert.equal(until(b, () => b.stats.goldMined > 0, 15), true);
  b.dispatch({ type: 'move', x: 0, y: 0 });
  assert.equal(miner.cargo, 0); assert.equal(b.gold - before, b.stats.goldMined);
});

test('finite mines conserve extracted gold across both wallets and bags', () => {
  const b = quiet(); for (const mine of b.mines) mine.remaining = mine.capacity = 120;
  const initial = b.mines.reduce((sum, m) => sum + m.remaining, 0);
  for (const team of [0, 1]) {
    const mine = b.mines.find(m => m.team === team);
    b.spawn('miner', team, mine.x, { lane: mine.lane });
    b.spawn('miner', team, mine.x + 18, { lane: mine.lane + 10 });
  }
  const gold = b.gold, enemyGold = b.enemyGold; advance(b, 65);
  assert.ok(b.stats.goldMined > 0); assert.ok(b.stats.enemyGoldMined > 0);
  assert.equal(b.gold - gold, b.stats.goldMined); assert.equal(b.enemyGold - enemyGold, b.stats.enemyGoldMined);
  assert.ok(b.mines.every(m => m.remaining >= 0 && m.remaining <= m.capacity));
  const carried = b.units.reduce((sum, u) => sum + (u.cargo || 0), 0);
  const unmined = b.mines.reduce((sum, m) => sum + m.remaining, 0);
  assert.ok(Math.abs(initial - unmined - carried - b.stats.goldMined - b.stats.enemyGoldMined) < 1e-6);
});

test('melee has windup, exactly one hit, and recovery before movement resumes', () => {
  const b = quiet(), sword = b.spawn('sword', 0, 900, { lane: 0 });
  const target = b.spawn('spear', 1, 930, { lane: 0 }); target.stun = 100; select(b, sword);
  b.strike(sword, target); assert.equal(target.hp, target.maxHP);
  b.dispatch({ type: 'move', x: -1, y: 0 });
  advance(b, .05); assert.equal(target.hp, target.maxHP); assert.equal(sword.x, 900, 'held movement waits for recovery');
  assert.equal(until(b, () => target.hp < target.maxHP, 1), true);
  const afterHit = target.hp; advance(b, 1.5); assert.equal(target.hp, afterHit, 'one swing resolves once');
  assert.ok(sword.x < 900, 'the already-held movement resumes without another keydown');
});

test('depth separation makes a visually missed melee strike miss in the simulation', () => {
  const b = quiet(), sword = b.spawn('sword', 0, 900, { lane: -40 });
  const target = b.spawn('spear', 1, 930, { lane: 75 }); target.stun = 100; select(b, sword);
  b.strike(sword, target); advance(b, 1); assert.equal(target.hp, target.maxHP);
});

test('aimed arrows travel through space and a target can dodge after release', () => {
  for (const dodge of [false, true]) {
    const b = quiet(), archer = b.spawn('archer', 0, 900, { lane: 0 });
    const target = b.spawn('spear', 1, 1240, { lane: 0 }); target.stun = 100; select(b, archer);
    b.dispatch({ type: 'aim', x: target.x, lane: target.lane }); action(b, 'primary', true);
    advance(b, .6); assert.equal(target.hp, target.maxHP); action(b, 'primary', false);
    assert.equal(until(b, () => b.projectiles.length > 0, 2), true);
    assert.equal(target.hp, target.maxHP, 'release must not damage a target by ID');
    for (const key of ['x', 'lane', 'z']) assert.ok(Number.isFinite(b.projectiles[0][key]));
    if (dodge) target.lane = 75;
    advance(b, 2);
    if (dodge) assert.equal(target.hp, target.maxHP);
    else assert.ok(target.hp < target.maxHP, 'same shot must hit the undodging control case');
  }
});

test('sub-frame taps execute once, and cancelling input before the next tick discards buffered taps', () => {
  for (const type of ['archer', 'mage']) for (const cancelled of [false, true]) {
    const b = quiet(), unit = b.spawn(type, 0, 900, { lane: 0 });
    const target = b.spawn('spear', 1, 1240, { lane: 0 }); target.stun = 100; select(b, unit);
    b.dispatch({ type: 'aim', x: target.x, lane: target.lane });
    const name = type === 'mage' ? 'secondary' : 'primary';
    action(b, name, true); action(b, name, false);
    if (cancelled) b.dispatch({ type: 'reset-input' });
    advance(b, 2);
    if (type === 'mage') assert.equal(b.units.filter(u => u.ownerId === unit.id).length, cancelled ? 0 : 1);
    else if (cancelled) assert.equal(target.hp, target.maxHP);
    else assert.ok(target.hp < target.maxHP);
    assert.equal(b.events.filter(e => e.type === 'attack' && e.unit === type).length, cancelled ? 0 : 1);
  }
});

test('an intervening front-line body intercepts an arrow aimed at a unit behind it', () => {
  const b = quiet(), archer = b.spawn('archer', 0, 900, { lane: 0 });
  const front = b.spawn('spear', 1, 1080, { lane: 0 }), rear = b.spawn('spear', 1, 1240, { lane: 0 });
  front.stun = rear.stun = 100; select(b, archer);
  b.dispatch({ type: 'aim', x: rear.x, lane: rear.lane });
  action(b, 'primary', true); advance(b, .5); action(b, 'primary', false); advance(b, 2);
  assert.ok(front.hp < front.maxHP); assert.equal(rear.hp, rear.maxHP);
});

test('shield block protects the facing side but not a rear attack', () => {
  const damages = [];
  for (const side of [1, -1]) {
    const b = quiet(), spear = b.spawn('spear', 0, 1000, { lane: 0 });
    const enemy = b.spawn('sword', 1, 1000 + side * 35, { lane: 0 }); enemy.stun = 100;
    select(b, spear); spear.facing = 1; action(b, 'secondary', true); advance(b, .1);
    b.hit(spear, 100, enemy); damages.push(spear.maxHP - spear.hp);
  }
  assert.ok(damages[0] > 0 && damages[0] < damages[1]); assert.equal(damages[1], 100);
});

test('sword leap advances and hits through its action timeline, then observes cooldown', () => {
  const b = quiet(), sword = b.spawn('sword', 0, 900, { lane: 0 });
  const target = b.spawn('spear', 1, 985, { lane: 0 }); target.stun = 100; select(b, sword);
  b.dispatch({ type: 'aim', x: target.x, lane: target.lane }); const x = sword.x;
  assert.equal(action(b, 'special').ok, true); assert.equal(target.hp, target.maxHP);
  advance(b, 1); assert.ok(sword.x > x); assert.ok(target.hp < target.maxHP);
  assert.equal(action(b, 'special').ok, false); advance(b, 5); assert.equal(action(b, 'special').ok, true);
});

test('a thrown spear remains unavailable until its owner garrisons and rearms', () => {
  const b = quiet(), spear = b.spawn('spear', 0, 440, { lane: 0 });
  const target = b.spawn('giant', 1, 850, { lane: 0 }); target.stun = 100; select(b, spear);
  b.dispatch({ type: 'aim', x: target.x, lane: target.lane }); assert.equal(action(b, 'special').ok, true);
  assert.equal(until(b, () => !spear.hasSpear, 2), true); advance(b, 6);
  assert.equal(action(b, 'special').ok, false); b.command('garrison');
  assert.equal(until(b, () => spear.hasSpear && spear.hidden, 15), true);
  b.command('defend'); advance(b, 1); assert.equal(spear.hidden, false);
  select(b, spear); assert.equal(action(b, 'special').ok, true);
});

test('each mage has two minions or five with max hat upgrades, none consuming population', () => {
  for (const rank of [0, 3]) {
    const b = quiet({ upgrades: { mageHat: rank } }), mage = b.spawn('mage', 0, 500, { lane: 0 });
    select(b, mage); action(b, 'secondary', true); advance(b, 65);
    assert.equal(b.units.filter(u => u.type === 'minion' && u.ownerId === mage.id && u.hp > 0).length, 2 + rank);
    assert.equal(population(b.units, b.queue), UNITS.mage.pop);
    advance(b, 20); assert.equal(b.units.filter(u => u.type === 'minion' && u.ownerId === mage.id).length, 2 + rank);
  }
});

test('summoned minions retain their cap ownership and survive the summoner death', () => {
  const b = quiet(), mage = b.spawn('mage', 0, 500, { lane: 0 }); select(b, mage);
  action(b, 'secondary', true); advance(b, 26); action(b, 'secondary', false);
  const minions = b.units.filter(u => u.ownerId === mage.id); assert.equal(minions.length, 2);
  b.hit(mage, mage.hp); advance(b, 1);
  assert.ok(minions.every(u => b.units.includes(u) && u.hp > 0));
  assert.equal(population(b.units), 0);
});

test('upgrade branches alter the promised attribute without a uniform all-stats multiplier', () => {
  const base = quiet().spawn('sword', 0, 500);
  const blade = quiet({ upgrades: { swordBlade: 3 } }).spawn('sword', 0, 500);
  const helmet = quiet({ upgrades: { swordHelmet: 3 } }).spawn('sword', 0, 500);
  const pick = quiet({ upgrades: { minerPick: 3 } }).spawn('sword', 0, 500);
  assert.ok(blade.damage > base.damage); assert.equal(blade.maxHP, base.maxHP);
  assert.ok(helmet.maxHP > base.maxHP); assert.equal(helmet.damage, base.damage);
  assert.equal(pick.maxHP, base.maxHP); assert.equal(pick.damage, base.damage);
});

test('earthquake requires manual control and a nonclassic giant skin', () => {
  for (const skin of ['classic', 'leaf']) {
    const b = quiet(), giant = b.spawn('giant', 0, 900, { skin, lane: 0 });
    const target = b.spawn('spear', 1, 1080, { lane: 0 }); target.stun = 100; select(b, giant);
    assert.equal(action(b, 'secondary').ok, skin !== 'classic'); advance(b, 2);
    if (skin === 'classic') assert.equal(target.hp, target.maxHP); else assert.ok(target.hp < target.maxHP);
  }
});

test('garrison hides normal troops, pauses mining and heals while giants stay outside', () => {
  const b = quiet(), sword = b.spawn('sword', 0, 300, { lane: 0 });
  const miner = b.spawn('miner', 0, 400, { lane: -20 }), giant = b.spawn('giant', 0, 350, { lane: 60 });
  sword.hp = 30; b.command('garrison'); advance(b, 10);
  assert.equal(sword.hidden, true); assert.equal(miner.hidden, true); assert.equal(giant.hidden, false);
  assert.ok(sword.hp > 30); assert.equal(b.stats.goldMined, 0); assert.equal(population(b.units), 6);
  b.command('attack'); advance(b, .2); assert.equal(sword.hidden, false); assert.equal(miner.hidden, false);
});

test('pause freezes every simulation clock and resume clears held movement and attacks', () => {
  const b = quiet(), sword = b.spawn('sword', 0, 700, { lane: 0 }); select(b, sword); b.train('miner');
  b.dispatch({ type: 'move', x: 1, y: 1 }); action(b, 'primary', true); b.dispatch({ type: 'pause' });
  const snapshot = b.snapshot(); advance(b, 30); assert.deepEqual(b.snapshot(), snapshot);
  assert.equal(b.train('miner').ok, false); b.dispatch({ type: 'resume' });
  assert.equal(b.manual.x, 0); assert.equal(b.manual.y, 0); assert.equal(b.manual.attack, false);
  const position = [sword.x, sword.lane]; advance(b, .5); assert.deepEqual([sword.x, sword.lane], position);
});

test('assisted pause accepts paid commands but does not advance training or economy', () => {
  const b = quiet({ assisted: true }); b.dispatch({ type: 'pause' }); const gold = b.gold;
  assert.equal(b.train('miner').ok, true); assert.equal(b.gold, gold - 150); assert.equal(b.command('attack').ok, true);
  const snapshot = b.snapshot(); advance(b, 10); assert.deepEqual(b.snapshot(), snapshot);
});

test('30, 60 and 120 Hz give identical seeded fixed-step battle results', () => {
  const results = [];
  for (const hz of [30, 60, 120]) {
    const b = new Battle({ seed: 7921 }); b.start(); b.train('miner'); b.train('sword'); b.command('attack');
    const soldier = b.units.find(u => !u.team && u.type === 'sword');
    for (let frame = 0; frame < 24 * hz; frame++) {
      if (frame === 2 * hz) { select(b, soldier); b.dispatch({ type: 'move', x: 1, y: .5 }); }
      if (frame === 3 * hz) { action(b, 'special', true); action(b, 'special', false); }
      if (frame === 4 * hz) b.dispatch({ type: 'move', x: 1, y: -.5 });
      if (frame === 5 * hz) b.dispatch({ type: 'release' });
      if (frame === 6 * hz) b.command('garrison');
      if (frame === 8 * hz) b.command('attack');
      b.update(1 / hz);
    }
    results.push(normalize(b.snapshot()));
  }
  assert.deepEqual(results[0], results[1]); assert.deepEqual(results[1], results[2]);
});

test('schema3 resumes RNG and accumulator deterministically and rejects incompatible checkpoints', () => {
  const b = new Battle({ seed: 193, upgrades: { minerPick: 2 } }); b.start(); b.train('sword'); advance(b, 3); b.update(.007);
  const snapshot = b.snapshot();
  assert.equal(snapshot.schema, 3); assert.equal(snapshot.campaignId, CAMPAIGN_ID); assert.equal(snapshot.rulesetVersion, RULESET_VERSION);
  const restored = Battle.restore(snapshot); assert.ok(restored); assert.equal(restored.status, 'paused'); assert.equal(restored.selected, null);
  assert.deepEqual(restored.units, b.units); assert.deepEqual(restored.queue, b.queue); assert.deepEqual(restored.mines, b.mines);
  assert.equal(restored.seed, b.seed); assert.equal(restored.accumulator, b.accumulator);
  restored.dispatch({ type: 'resume' }); advance(b, 8); advance(restored, 8);
  assert.deepEqual(normalize(restored.snapshot()), normalize(b.snapshot()));
  for (const bad of [null, { ...snapshot, schema: 2 }, { ...snapshot, campaignId: 'old' }, { ...snapshot, rulesetVersion: 'old' },
    { ...snapshot, levelId: 'missing' }, { ...snapshot, gold: NaN }, { ...snapshot, units: [{ type: 'dragon', hp: 1, x: 20 }] }]) {
    assert.equal(Battle.restore(bad), null);
  }
});

test('authored reinforcements end without infinite waves, and defeat ends the simulation once', () => {
  const b = quiet(); b.config.waves = [{ at: 1, units: ['sword'], label: 'one' }, { at: 3, units: ['archer'], label: 'two' }];
  b.enemyEnabled = true; b.enemyGold = 0; b.config.ai = { ...b.config.ai, minerTarget: 0, attackAt: 1e9 };
  b.waveIndex = 0; b.nextWave = 1; advance(b, 5); assert.equal(b.stats.scriptedEnemies, 2);
  advance(b, 80); assert.equal(b.stats.scriptedEnemies, 2); assert.equal(b.nextWave, Infinity);
  b.baseHP = 0; advance(b, STEP); assert.equal(b.status, 'lost'); assert.equal(b.events.filter(e => e.type === 'end').length, 1);
  const snapshot = b.snapshot(); advance(b, 5); assert.deepEqual(b.snapshot(), snapshot); assert.equal(b.train('sword').ok, false);
});
