import test from 'node:test';
import assert from 'node:assert/strict';
import { runCampaign, CAMPAIGN_SEEDS, STRATEGIES } from '../scripts/simulate-campaign.mjs';
import { LEVELS } from '../dist/content.js';

test('two distinct commanders complete all 30 standard stages across three seeds using earned resources', { timeout: 120000 }, async t => {
  const reports = [];
  for (const strategy of Object.keys(STRATEGIES)) {
    for (const seed of CAMPAIGN_SEEDS) {
      await t.test(`${strategy}, seed ${seed}`, () => {
        const result = runCampaign({ strategy, seed });
        assert.equal(result.ok, true, JSON.stringify(result.failure));
        assert.equal(result.stages.length, LEVELS.length);
        assert.equal(Object.keys(result.save.cleared).length, 30);
        assert.equal(result.save.claimedUpgradeLevels.length, 30);
        assert.equal(result.save.unlocked, 29);
        assert.deepEqual(result.save.assistedCleared, {});
        assert.equal(result.save.assistedUnlocked, 0);
        assert.ok(result.stages.every(stage => stage.goldMined > 0 && stage.enemyGoldSpent >= 0));
        assert.ok(Object.values(result.save.upgrades).reduce((a, b) => a + b, 0) <= 60);
        reports.push(result);
      });
    }
  }
  const economic = reports.find(r => r.strategy === 'economy');
  const pressure = reports.find(r => r.strategy === 'pressure');
  if (economic && pressure) {
    assert.notDeepEqual(economic.stages.map(s => s.trained), pressure.stages.map(s => s.trained), 'routes must recruit different army compositions');
    assert.notDeepEqual(economic.stages[5].upgrades, pressure.stages[5].upgrades, 'routes must make different paid upgrade choices');
  }
});
