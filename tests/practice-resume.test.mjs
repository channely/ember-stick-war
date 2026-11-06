import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from '../dist/engine.js';
import {freshProgress,migrateProgress} from '../dist/progress.js';

test('a suspended campaign survives practice save and reload with its gold, mine contents and training intact',()=>{
 const b=new Battle({seed:78});b.start();b.train('miner');b.update(.6);
 const save=freshProgress();save.campaignCheckpoint=b.snapshot();
 const practice=new Battle({practice:'giant'});practice.start();save.checkpoint=practice.snapshot();
 const loaded=migrateProgress(JSON.parse(JSON.stringify(save))).save;
 assert.equal(loaded.checkpoint.practice,'giant');
 const resumed=Battle.restore(loaded.campaignCheckpoint);
 assert.ok(resumed);assert.equal(resumed.status,'paused');assert.equal(resumed.practice,null);
 assert.equal(resumed.time,b.time);assert.equal(resumed.gold,b.gold);
 assert.deepEqual(resumed.mines,b.mines);assert.deepEqual(resumed.queue,b.queue);
 assert.equal(resumed.selected,null);assert.equal(resumed.manual.attack,false);
});

test('an obsolete battle or another practice cannot occupy the suspended campaign slot',()=>{
 const raw=freshProgress();raw.campaignCheckpoint={schema:2};
 assert.equal(migrateProgress(raw).save.campaignCheckpoint,null);
 raw.campaignCheckpoint=new Battle({practice:'miner'}).snapshot();
 assert.equal(migrateProgress(raw).save.campaignCheckpoint,null);
 delete raw.campaignCheckpoint;
 assert.equal(migrateProgress(raw).save.campaignCheckpoint,null);
});
