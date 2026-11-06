/** Repeatable acceptance simulation. The commanders use the same paid commands
 * as a player: no unit injection, balance edits, consumables, skins or free skills. */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { Battle, UNITS, population } from '../dist/engine.js';
import { LEVELS } from '../dist/content.js';
import { freshProgress, canPlay, purchaseUpgrade, recordVictory } from '../dist/progress.js';

export const CAMPAIGN_SEEDS = [24, 193, 7921];
export const STRATEGIES = {
  economy: {
    name: '稳健集结、盾弓与法师推进', miners: 5, attackAt: 75,
    upgrades: ['archerBow', 'minerPick', 'swordHelmet', 'spearHelmet', 'swordBlade', 'minerBag', 'spearSpear', 'mageHat', 'mageStaff', 'giantClub', 'statueHealth', 'spearShield', 'castleArchers'],
    composition: [['sword', 6], ['archer', 10], ['spear', 3], ['mage', 2], ['giant', 1]],
  },
  pressure: {
    name: '剑弓早压、重兵收尾', miners: 5, attackAt: 65,
    upgrades: ['archerBow', 'minerPick', 'swordBlade', 'swordHelmet', 'minerBag', 'giantClub', 'mageStaff', 'mageHat', 'spearSpear', 'spearHelmet', 'statueHealth', 'castleArchers', 'spearShield'],
    composition: [['sword', 14], ['archer', 8], ['spear', 2], ['mage', 1], ['giant', 1]],
  },
};

function buyEarnedUpgrades(save, plan) {
  let changed = true;
  while (save.upgradePoints > 0 && changed) {
    changed = false;
    for (const id of plan.upgrades) {
      if (purchaseUpgrade(save, id)) { changed = true; break; }
    }
  }
}
function count(battle, type) {
  return battle.units.filter(u => !u.team && u.hp > 0 && u.type === type).length
    + battle.queue.filter(q => q.type === type).length;
}
function commandArmy(battle, plan) {
  const rush = battle.config.ai.strategy === 'pressure';
  const attackAt = rush ? Math.min(plan.attackAt, 60) : plan.attackAt;
  const order = battle.config.goal === 'defend' || battle.time < attackAt ? 'defend' : 'attack';
  if (battle.order !== order) battle.dispatch({ type: 'order', order });
  if (battle.queue.length >= 2) return;
  if (count(battle, 'miner') < (rush ? Math.min(plan.miners, 4) : plan.miners)) {
    battle.dispatch({ type: 'train', unitType: 'miner' });
    return;
  }
  const army = battle.units.filter(u => !u.team && u.hp > 0 && !['miner', 'minion'].includes(u.type)).length
    + battle.queue.filter(q => q.type !== 'miner').length;
  if (army < 3) { battle.dispatch({ type: 'train', unitType: 'sword' }); return; }
  // Replenish missing roles proportionally. Always filling the front line first
  // starves support recruitment indefinitely when that front line takes losses.
  const candidates = plan.composition.map(([type, target]) => [type, rush && type === 'sword' ? Math.max(8, target) : target])
    .filter(([type, target]) => battle.allowedTypes.includes(type) && count(battle, type) < target
      && (!(rush && battle.time < 125) || !['spear', 'mage', 'giant'].includes(type))
      && (type !== 'spear' || army >= 4) && (type !== 'mage' || army >= 6) && (type !== 'giant' || army >= 10))
    .sort(([a, ta], [b, tb]) => count(battle, a) / ta - count(battle, b) / tb);
  if (candidates.length) { battle.dispatch({ type: 'train', unitType: candidates[0][0] }); return; }
  battle.dispatch({ type: 'train', unitType: plan === STRATEGIES.economy && battle.allowedTypes.includes('archer') ? 'archer' : 'sword' });
}
function verifyWallets(battle, initial) {
  const stats = battle.stats;
  assert.ok(battle.gold >= -1e-7 && battle.enemyGold >= -1e-7, 'both armies must remain solvent');
  assert.ok(Math.abs(battle.gold - initial.gold - stats.goldMined + stats.goldSpent - stats.goldRefunded) < 1e-6, 'player gold has a source');
  assert.ok(Math.abs(battle.enemyGold - initial.enemyGold - stats.enemyGoldMined + stats.enemyGoldSpent - stats.enemyGoldRefunded) < 1e-6, 'enemy gold has a source');
  assert.ok(population(battle.units, battle.queue, 0) <= 50);
  assert.ok(population(battle.units, battle.enemyQueue, 1) <= 50);
  assert.equal(stats.items, 0);
}

export function runCampaign({ strategy = 'economy', seed = 24, maxLevels = LEVELS.length, limitSeconds = 900, onStage } = {}) {
  const plan = STRATEGIES[strategy];
  assert.ok(plan, `unknown strategy ${strategy}`);
  const save = freshProgress();
  const initialInventory = JSON.stringify(save.inventory);
  const stages = [];
  for (let level = 0; level < Math.min(maxLevels, LEVELS.length); level++) {
    assert.equal(canPlay(save, level, false), true);
    buyEarnedUpgrades(save, plan);
    const battle = new Battle({ level, seed: (seed + level * 104729) >>> 0, difficulty: 'normal', upgrades: save.upgrades, loadout: save.loadout });
    const initial = { gold: battle.gold, enemyGold: battle.enemyGold };
    const trained = Object.fromEntries(Object.keys(UNITS).map(type => [type, 0]));
    battle.start();
    let nextCommand = 0;
    for (let tick = 0; tick < limitSeconds * 60 && battle.status === 'playing'; tick++) {
      if (tick >= nextCommand) {
        nextCommand += 60;
        const before = battle.queue.length;
        commandArmy(battle, plan);
        if (battle.queue.length > before) trained[battle.queue.at(-1).type]++;
        verifyWallets(battle, initial);
      }
      battle.update(1 / 60);
    }
    verifyWallets(battle, initial);
    const result = {
      strategy, seed, level: level + 1, id: battle.levelId, title: battle.config.title,
      status: battle.status, time: Math.round(battle.time * 10) / 10,
      baseHP: Math.round(battle.baseHP), enemyHP: Math.round(battle.enemyHP),
      gold: Math.round(battle.gold), goldMined: battle.stats.goldMined, goldSpent: battle.stats.goldSpent,
      enemyGoldMined: battle.stats.enemyGoldMined, enemyGoldSpent: battle.stats.enemyGoldSpent,
      lost: battle.stats.lost, kills: battle.stats.kills, population: population(battle.units, battle.queue),
      trained, upgrades: { ...save.upgrades }, reason: battle.lossReason || (battle.status === 'playing' ? 'simulation time limit' : ''),
    };
    stages.push(result);
    onStage?.(result);
    if (battle.status !== 'won') return { ok: false, strategy, seed, stages, save, failure: result };
    const reward = recordVictory(save, battle);
    assert.equal(reward.upgradeReward, 2, 'each sequential first clear earns exactly two upgrade points');
    assert.equal(save.cleared[battle.levelId] > 0, true);
    assert.equal(JSON.stringify(save.inventory), initialInventory, 'campaign must not consume starting items');
    assert.ok(Object.values(save.loadout).every(skin => skin === 'classic'));
  }
  return { ok: true, strategy, seed, stages, save };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const strategy = process.argv[2] || 'economy';
  const seed = Number(process.argv[3] || 24);
  const maxLevels = Number(process.argv[4] || LEVELS.length);
  const result = runCampaign({ strategy, seed, maxLevels, onStage: stage => process.stdout.write(`${JSON.stringify(stage)}\n`) });
  process.stdout.write(`${JSON.stringify({ ok: result.ok, strategy, seed, completed: result.stages.filter(s => s.status === 'won').length, total: maxLevels })}\n`);
  if (!result.ok) process.exitCode = 1;
}
