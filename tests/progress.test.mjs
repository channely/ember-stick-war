import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_ID, LEVELS, SKINS, ITEMS, UPGRADE_BRANCHES } from '../dist/content.js';
import {
  SAVE_KEY, LEGACY_SAVE_KEY, freshProgress, migrateProgress, canPlay,
  purchaseSkin, equipSkin, purchaseItem, purchaseUpgrade, recordVictory,
} from '../dist/progress.js';

const TYPES = ['miner', 'sword', 'archer', 'spear', 'mage', 'giant'];
const copy = value => JSON.parse(JSON.stringify(value));
function victory(level = 0, extra = {}) {
  return {
    level, levelId: LEVELS[level].id, config: LEVELS[level], campaignId: CAMPAIGN_ID,
    status: 'won', baseHP: 1500, baseMax: 1500, stats: { lost: 0, items: 0 },
    assisted: false, practice: null, ...extra,
  };
}
function containsValue(value, expected) {
  if (JSON.stringify(value) === JSON.stringify(expected)) return true;
  return value && typeof value === 'object'
    && Object.values(value).some(child => containsValue(child, expected));
}

test('new progress separates upgrade points, gems, per-unit equipment and assisted records', () => {
  const save = freshProgress();
  assert.equal(save.version, 3);
  assert.notEqual(SAVE_KEY, LEGACY_SAVE_KEY);
  assert.equal(SAVE_KEY, 'ember-kingdom-v3');
  assert.equal(save.upgradePoints, 0);
  assert.deepEqual(save.cleared, {});
  assert.deepEqual(save.assistedCleared, {});
  assert.equal(save.unlocked, 0);
  assert.equal(save.assistedUnlocked, 0);
  assert.equal(save.selectedLevelId, LEVELS[0].id);
  assert.equal(save.checkpoint, null);
  for (const type of TYPES) {
    assert.deepEqual(save.ownedSkins[type], ['classic']);
    assert.equal(save.loadout[type], 'classic');
  }
});

test('v2 migration archives old scores and checkpoint, refunds exact old prices and restarts the new campaign', () => {
  const raw = {
    version: 2, gems: 17, cleared: { 0: 3, 29: 2 }, unlocked: 29, selectedLevel: 29,
    upgrades: { miner: 2, sword: 1, statue: 3 },
    inventory: { gold: 2, mining: 1, reinforcements: 1, arrows: 3, repair: 2, frost: 1 },
    ownedSkins: ['classic', 'leaf', 'vamp'], loadout: { sword: 'vamp', miner: 'leaf' },
    checkpoint: { schema: 2, level: 29, gold: 452, time: 73, units: [] },
    sound: true, reduced: true, difficulty: 'hard', bestWave: 8,
  };
  const before = copy(raw);
  const { save, migrated } = migrateProgress(raw);
  assert.equal(migrated, true);
  assert.deepEqual(raw, before, 'migration must preserve the legacy source, not mutate it');
  assert.equal(save.gems, 42, '17 existing + 10 upgrade refund + 15 old item refund');
  assert.deepEqual(save.cleared, {});
  assert.deepEqual(save.assistedCleared, {});
  assert.equal(save.unlocked, 0);
  assert.equal(save.selectedLevel, 0);
  assert.equal(save.selectedLevelId, LEVELS[0].id);
  assert.equal(save.checkpoint, null);
  assert.equal(save.upgradePoints, 0);
  assert.ok(Object.values(save.upgrades).every(rank => rank === 0));
  assert.ok(containsValue(save.legacyHistory, raw.cleared), 'old scores must remain reviewable');
  assert.ok(containsValue(save.legacyHistory, raw.checkpoint), 'old battle is archived, not resumed');
  for (const type of TYPES) assert.deepEqual(new Set(save.ownedSkins[type]), new Set(raw.ownedSkins));
  assert.equal(save.loadout.sword, 'vamp');
  assert.equal(save.loadout.miner, 'leaf');
  assert.equal(save.sound, true);
  assert.equal(save.reduced, true);
  assert.equal(save.bestWave, 8);
  const again = migrateProgress(copy(save));
  assert.equal(again.migrated, false);
  assert.deepEqual(again.save, save, 'reloading v3 must not repeat refunds or duplicate history');
});

test('v1 six-chapter scores remain historical and do not unlock redesigned stages', () => {
  const raw = { version: 1, gems: 9, cleared: { 0: 3, 1: 2 }, upgrades: { miner: 2 }, selectedLevel: 2 };
  const { save, migrated } = migrateProgress(raw);
  assert.equal(migrated, true);
  assert.equal(save.gems, 12);
  assert.ok(containsValue(save.legacyHistory, raw.cleared));
  assert.deepEqual(save.cleared, {});
  assert.equal(canPlay(save, 0), true);
  assert.equal(canPlay(save, 1), false);
});

test('skin purchases belong to one unit and invalid or duplicate purchases are atomic', () => {
  const save = freshProgress();
  save.gems = 100000;
  assert.equal(equipSkin(save, 'sword', 'leaf'), false);
  const before = save.gems;
  assert.equal(purchaseSkin(save, 'sword', 'leaf'), true);
  assert.ok(save.gems < before);
  assert.ok(save.ownedSkins.sword.includes('leaf'));
  assert.ok(!save.ownedSkins.miner.includes('leaf'));
  assert.equal(equipSkin(save, 'sword', 'leaf'), true);
  assert.equal(equipSkin(save, 'miner', 'leaf'), false);
  const snapshot = copy(save);
  for (const args of [['sword', 'leaf'], ['dragon', 'leaf'], ['sword', 'unknown']]) {
    assert.equal(purchaseSkin(save, ...args), false);
    assert.deepEqual(save, snapshot);
  }
  save.gems = 0;
  assert.equal(purchaseSkin(save, 'sword', 'ice'), false);
  assert.equal(save.gems, 0);
});

test('upgrades consume only upgrade points and enforce unlocks and rank caps', () => {
  const save = freshProgress();
  save.gems = 10000;
  assert.equal(purchaseUpgrade(save, 'minerPick'), false, 'gems cannot buy campaign upgrades');
  save.upgradePoints = 30;
  assert.equal(purchaseUpgrade(save, 'swordBlade'), false, 'sword technology is locked until its campaign unlock');
  assert.equal(purchaseUpgrade(save, 'mageHat'), false);
  const gems = save.gems;
  for (let rank = 1; rank <= UPGRADE_BRANCHES.minerPick.max; rank++) {
    const points = save.upgradePoints;
    assert.equal(purchaseUpgrade(save, 'minerPick'), true);
    assert.equal(save.upgrades.minerPick, rank);
    assert.equal(save.upgradePoints, points - UPGRADE_BRANCHES.minerPick.cost);
  }
  const snapshot = copy(save);
  assert.equal(purchaseUpgrade(save, 'minerPick'), false);
  assert.equal(purchaseUpgrade(save, 'unknown'), false);
  assert.deepEqual(save, snapshot);
  assert.equal(save.gems, gems);
  save.unlocked = 3;
  assert.equal(purchaseUpgrade(save, 'swordBlade'), true);
});

test('items are bought with gems, and insufficient funds or full inventory never consume currency', () => {
  const save = freshProgress();
  const id = 'mining';
  save.gems = ITEMS[id].cost;
  const before = save.inventory[id];
  assert.equal(purchaseItem(save, id), true);
  assert.equal(save.inventory[id], before + 1);
  assert.equal(save.gems, 0);
  assert.equal(purchaseItem(save, id), false);
  save.gems = 10000;
  save.inventory[id] = 99;
  const snapshot = copy(save);
  assert.equal(purchaseItem(save, id), false);
  assert.equal(purchaseItem(save, 'gold'), false, 'removed 0.2 gold grant is not purchasable');
  assert.deepEqual(save, snapshot);
});

test('normal and assisted unlocks are independent; the same stage grants upgrade points only once', () => {
  const save = freshProgress();
  const gems = save.gems;
  const assisted = recordVictory(save, victory(0, { assisted: true }));
  assert.equal(assisted.upgradeReward, 2);
  assert.equal(save.upgradePoints, 2);
  assert.equal(save.gems, gems + LEVELS[0].reward);
  assert.equal(save.assistedCleared[LEVELS[0].id], 3);
  assert.equal(save.cleared[LEVELS[0].id], undefined);
  assert.equal(canPlay(save, 1, true), true);
  assert.equal(canPlay(save, 1, false), false);
  const normal = recordVictory(save, victory());
  assert.equal(normal.upgradeReward, 0);
  assert.equal(save.upgradePoints, 2);
  assert.equal(save.cleared[LEVELS[0].id], 3);
  assert.equal(canPlay(save, 1, false), true);
  const replay = recordVictory(save, victory(0, { baseHP: 1, stats: { lost: 12, items: 0 } }));
  assert.equal(replay.reward, 1);
  assert.equal(replay.upgradeReward, 0);
  assert.equal(save.cleared[LEVELS[0].id], 3, 'replaying poorly must preserve the best score');
  assert.equal(canPlay(save, 2, false), false);
});

test('practice and unfinished battles cannot mint campaign rewards or unlock stages', () => {
  const save = freshProgress();
  const before = { gems: save.gems, points: save.upgradePoints, unlocked: save.unlocked };
  const result = recordVictory(save, victory(0, { practice: 'miner' }));
  assert.equal(result.reward, 0);
  assert.equal(result.upgradeReward, 0);
  assert.deepEqual(save.cleared, {});
  assert.deepEqual({ gems: save.gems, points: save.upgradePoints, unlocked: save.unlocked }, before);
  const snapshot = copy(save);
  for (const status of ['ready', 'playing', 'paused', 'lost']) {
    recordVictory(save, victory(0, { status }));
    assert.deepEqual(save, snapshot, `${status} is not a completed victory`);
  }
});

test('v3 sanitation rejects unknown equipment, nonfinite currency and invalid campaign indices', () => {
  const raw = freshProgress();
  raw.gems = Infinity;
  raw.upgradePoints = -20;
  raw.unlocked = 500;
  raw.selectedLevel = 500;
  raw.selectedLevelId = 'campaign-30';
  raw.ownedSkins.sword = ['classic', 'dragon'];
  raw.loadout.sword = 'vamp';
  raw.inventory.mining = 1000;
  raw.upgrades.minerPick = 999;
  raw.checkpoint = { schema: 2 };
  const { save } = migrateProgress(raw);
  assert.ok(Number.isFinite(save.gems));
  assert.ok(save.gems >= 0);
  assert.equal(save.upgradePoints, 0);
  assert.ok(save.unlocked >= 0 && save.unlocked < LEVELS.length);
  assert.ok(save.selectedLevel <= save.unlocked);
  assert.equal(save.selectedLevelId, LEVELS[save.selectedLevel].id);
  assert.deepEqual(save.ownedSkins.sword, ['classic']);
  assert.equal(save.loadout.sword, 'classic');
  assert.equal(save.inventory.mining, 99);
  assert.equal(save.upgrades.minerPick, UPGRADE_BRANCHES.minerPick.max);
  assert.equal(save.checkpoint, null);
  for (const type of TYPES) assert.ok(save.ownedSkins[type].every(id => SKINS[id]));
});
