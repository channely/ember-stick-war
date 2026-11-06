# 0.3.0 integration contract

This is the shared implementation interface. Root owns content/progress; engine agent owns engine/rules/sim; UI agent owns game/input/index/styles; renderer owns art/pose; QA owns tests; workshop owns learn and teaching artifacts. Coordinate changes before changing contracts.

## Content

Keep VERSION, REGIONS, SKINS, ITEMS, GOALS, LEVELS, skinFor, missionText exports. VERSION=0.3.0. Add CAMPAIGN_ID='classic-v3', RULESET_VERSION='legacy-web-0.3.0', UPGRADE_BRANCHES, availableTypes(level).

LEVELS always has 30 entries. Preserve id/title/text/tip/chapter/stage/region/biome/color/goal/hp/startGold/types/waves/modifier/duration/reward for existing rendering. New id is classic-01..classic-30. chapter is 0..5 (five cards/group remains compatible). Add playerTypes, startingAllies/startingEnemies (arrays of unit type strings, suffix ! for boss), enemyGold, ai={strategy,attackAt,retreatAt,minerTarget,composition}, mines={amount,slots}, tactics (string), bossFinal(boolean), unlockText. startGold is gold separate from starting units. types is enemy allowed recruitment. waves=[{at,units:[type strings],label}] are explicitly finite scripted reinforcements, no implicit infinite waves after last. Standard goal destroy, limited ambush levels defend. Scene modifier normal by default (no hidden weather gameplay penalties). Practice handled by engine constructor and never records campaign reward.

SKINS preserve visuals/bonus, add unit-specific overrides via perUnit as needed. IDs classic/leaf/ice/lava/savage/vamp/volt. ITEMS IDs mining/rage/arrows/spear/heal/reinforcements, costs numeric gems, desc exact to engine behavior. No free global rage/heal in new UI. Keep legacy conversion costs in progress only.

UPGRADE_BRANCHES ids: minerPick,minerBag,swordBlade,swordHelmet,archerBow,spearSpear,spearShield,spearHelmet,mageStaff,mageHat,giantClub,statueHealth,castleArchers. All have {name,type,description,max:3,cost:1}; numeric effects declared in engine/rules and tooltips aligned to actual effect. mageHat adds one minion per rank, default 2. Unit upgrades are independent branches, not uniform damage+HP. Branch unlock follows associated playerType; swordBlade/Helmet require level>=3.

## Battle API

Preserve Battle/UNITS/WORLD=2700/population exports. Constructor {level=0,levelId?,difficulty='normal',upgrades={},loadout={},survival=false,seed=24,assisted=false,practice=null}. UNITS includes six recruitable types only; minions have type='minion' and own internal definition, renderer/UI tolerate it. Battle fields retain level/config/gold/baseHP/baseMax/enemyHP/enemyMax/time/status/order/units/queue/projectiles/effects/events/stats/selected. Add campaignId/rulesetVersion/schema=3/assisted/practice/mines/enemyQueue/enemyOrder/allowedTypes. Population filters hidden as alive and excludes minions.

Unit existing fields remain (x,lane,type,team,id,hp,maxHP,skin,facing,action,cargo,phase,swing,hurt). lane is true foot-plane depth in [-45,80], used by movement and hit testing. New fields: hidden,stun,hasSpear,ownerId,cooldowns,actionState. Agent engine publishes precise actionState shape to renderer. Projectiles have simulated x/lane/z and previous positions; renderer uses these, not target IDs. Damage events resolve exactly once during actual hit phase.

Battle.manual={x:0,y:0,attack:false,secondary:false,special:false,aimX:null,aimLane:null}. secondary: sword/spear hold block, mage summon, nonclassic giant earthquake; special: sword leap / spear throw. Archer attack hold/release aims/fires; engine and UI must coordinate edge semantics. Primary attacks/mines. Selected miner deposits cargo on entering home zone automatically. Movement held during attacks resumes after recovery. Legacy left/right input compatibility allowed internally.

dispatch commands: {type:'move',x,y}; {type:'aim',x,lane}; {type:'action',action:'primary'|'secondary'|'special',pressed:boolean}; {type:'select',id}; {type:'release'}; {type:'order',order}; {type:'train',unitType}; {type:'cancel',index}; {type:'item',item}; {type:'pause'}; {type:'resume'}. Return {ok,message?} for fallible commands. Preserve start/update/train/cancelTraining/command/useItem/snapshot/static restore wrappers. train applies unlock, cost, queue and population rules; assisted mode may queue recruitment/orders while paused, no time/resource ticks. snapshot schema3 includes fixed timestep accumulator and RNG; restore checks campaign/ruleset/level IDs and returns paused battle; mismatch returns null or throws safely. Practice config offers all units through free resettable preplaced exercises, no transferable progress/gold.

## Progress API (root)

SAVE_KEY='ember-kingdom-v3'; LEGACY_SAVE_KEY='ember-kingdom-v1'. freshProgress returns version3, gems, upgradePoints, upgrades, claimedUpgradeLevels, cleared (levelId=>stars), assistedCleared, unlocked, assistedUnlocked (numeric max index), selectedLevel, selectedLevelId, difficulty, sound, reduced, bestWave, family=false, checkpoint, campaignCheckpoint (suspended real campaign while practicing), ownedSkins (type=>array of IDs), loadout (type=>id), inventory (new ITEMS IDs), practiceCompleted, legacyHistory.

migrateProgress(raw) -> {save,migrated,notice?}. UI loads v3 first then legacy, preserves legacy raw key, writes only v3. V1/V2 migration archives scores and checkpoint, restarts new campaign, keeps gems, refunds old upgrades sum(rank*(rank+1)/2) and old inventory*old prices, grants every formerly-owned skin to all six types. Never directly resume schema2 checkpoint. migration is idempotent. New default inventory mining:2,rage:1,arrows:1,spear:1,heal:2,reinforcements:1.

canPlay(save,index,assisted=save.family); purchaseSkin(save,type,id); equipSkin(save,type,id); purchaseItem(save,id); purchaseUpgrade(save,id) all return bool. recordVictory(save,battle) returns {stars,reward,upgradeReward}, stores assisted scores separately, gives +2 upgrade points only once per levelId across both modes, first-clear gems=level.reward/replay=1; practice gives zero rewards and records practiced type. Upgrade purchase checks currently unlocked type / sword technology. skill inventory decremented by UI only after battle.useItem returned ok. All new APIs directly import from progress/content.

## Renderer API

Keep Renderer constructor/resize/draw/setCamera/unitScreen and portrait/icon exports compatible. Add screenToWorld(screenX,screenY)->{x,lane}; hitTest(screenX,screenY,units)->unit|null if practical. Draw hidden=false units only, sort by foot depth; pose and effects use battle.time. draw(battle,now,dt?) supports frame-independent camera smoothing. Renderer and UI agents coordinate method names.

## Acceptance

No remote mutation or commits by subagents; root integrates and publishes. Tests require real resources for campaign completion, no items/skins in normal full run; unit tests may use local scenario fixtures. Include 30/60/120fps replay consistency, manual miner cycle, arrow miss, shield direction, spear rearm, minion cap, skin earthquake gating, old migration idempotence, paused input release and mobile multitouch. Document calibration versus verified Legacy rules honestly.
