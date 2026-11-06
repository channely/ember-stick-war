import test from 'node:test';
import assert from 'node:assert/strict';
import { UNITS } from '../dist/engine.js';
import { LEVELS, VERSION, CAMPAIGN_ID, availableTypes, UPGRADE_BRANCHES, ITEMS } from '../dist/content.js';

test('thirty redesigned encounters have distinct IDs, finite waves, budgets and authored tactics', () => {
  assert.equal(VERSION, '0.3.0'); assert.equal(CAMPAIGN_ID, 'classic-v3');
  assert.equal(LEVELS.length, 30); assert.equal(new Set(LEVELS.map(l => l.id)).size, 30);
  assert.equal(new Set(LEVELS.map(l => l.title)).size, 30);
  for (const [index, level] of LEVELS.entries()) {
    assert.equal(level.id, `classic-${String(index + 1).padStart(2, '0')}`);
    assert.ok(['destroy', 'defend'].includes(level.goal));
    assert.ok(level.startGold >= 0 && level.enemyGold >= 0);
    assert.equal(level.income, 0, 'enemy difficulty cannot hide an infinite income injection');
    assert.equal(level.modifier, 'normal', 'visual weather must not impose undocumented movement penalties');
    assert.ok(level.tactics.length >= 8 && level.tip.length >= 10);
    assert.ok(level.mines.amount > 0 && level.mines.slots === 2);
    assert.ok(level.ai && Number.isFinite(level.ai.attackAt));
    assert.deepEqual(level.playerTypes, availableTypes(index));
    let last = -1;
    for (const wave of level.waves) {
      assert.ok(Number.isFinite(wave.at) && wave.at > last); last = wave.at;
      assert.ok(wave.label && wave.units.length > 0);
      for (const type of wave.units) assert.ok(UNITS[type.replace('!', '')]);
    }
    for (const type of [...level.types, ...level.startingAllies, ...level.startingEnemies]) assert.ok(UNITS[type.replace('!', '')]);
    if (level.goal === 'defend') assert.ok(level.duration > last, 'all authored ambushes occur before victory');
  }
  assert.equal(LEVELS[11].bossFinal, true);
  assert.equal(LEVELS[29].bossFinal, true);
});

test('classic unit unlocks follow victory milestones, with clubmen available from the beginning', () => {
  assert.deepEqual(availableTypes(0), ['miner', 'sword']);
  const unlocks = { archer: 1, spear: 4, mage: 6, giant: 9 };
  for (const [type, level] of Object.entries(unlocks)) {
    assert.equal(availableTypes(level - 1).includes(type), false);
    assert.equal(availableTypes(level).includes(type), true);
  }
  assert.equal(Object.keys(UPGRADE_BRANCHES).length, 13);
  assert.equal(UPGRADE_BRANCHES.mageHat.max, 3);
  assert.deepEqual(new Set(Object.keys(ITEMS)), new Set(['mining', 'rage', 'arrows', 'spear', 'heal', 'reinforcements']));
});
