import { LEVELS, SKINS, ITEMS, UPGRADE_BRANCHES, CAMPAIGN_ID, RULESET_VERSION, availableTypes } from './content.js';

export const SAVE_KEY = 'ember-kingdom-v3';
export const LEGACY_SAVE_KEY = 'ember-kingdom-v1';
const TYPES = ['miner', 'sword', 'archer', 'spear', 'mage', 'giant'];
const LEGACY_ITEM_PRICES = {gold:1, mining:1, reinforcements:2, arrows:2, repair:1, frost:2};
const integer = (value, max = 999999) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(max, Math.floor(Number(value)))) : 0;
const clone = value => JSON.parse(JSON.stringify(value));
const scores = value => Object.fromEntries(LEVELS.flatMap(level => {
  const stars = integer(value?.[level.id], 3);
  return stars ? [[level.id, stars]] : [];
}));
const unlockedByScores = value => Object.keys(value).reduce((n,id) => Math.max(n, Math.min(29, LEVELS.findIndex(l => l.id === id) + 1)), 0);

export function freshProgress() {
  return {
    version:3, campaignId:CAMPAIGN_ID, gems:3, upgradePoints:0,
    upgrades:Object.fromEntries(Object.keys(UPGRADE_BRANCHES).map(id => [id,0])), claimedUpgradeLevels:[],
    cleared:{}, assistedCleared:{}, unlocked:0, assistedUnlocked:0,
    selectedLevel:0, selectedLevelId:LEVELS[0].id, difficulty:'normal', sound:false, reduced:false,
    bestWave:0, family:false, checkpoint:null, campaignCheckpoint:null,
    ownedSkins:Object.fromEntries(TYPES.map(type => [type,['classic']])),
    loadout:Object.fromEntries(TYPES.map(type => [type,'classic'])),
    inventory:{mining:2, rage:1, arrows:1, spear:1, heal:2, reinforcements:1},
    practiceCompleted:[], legacyHistory:null, migrationNotice:''
  };
}

export function migrateProgress(raw) {
  const save = freshProgress();
  if (!raw || typeof raw !== 'object' || ![1,2,3].includes(raw.version)) return {save,migrated:false};
  save.gems = integer(raw.gems);
  save.bestWave = integer(raw.bestWave);
  save.difficulty = ['easy','normal','hard'].includes(raw.difficulty) ? raw.difficulty : 'normal';
  save.sound = raw.sound === true;
  save.reduced = raw.reduced === true;
  if (raw.version < 3) {
    const upgradeRefund = [...TYPES,'statue'].reduce((sum,type) => {
      const rank = integer(raw.upgrades?.[type], 3);
      return sum + rank * (rank + 1) / 2;
    }, 0);
    const itemRefund = Object.entries(LEGACY_ITEM_PRICES).reduce((sum,[id,cost]) => sum + integer(raw.inventory?.[id],99) * cost, 0);
    save.gems += upgradeRefund + itemRefund;
    const owned = [...new Set(['classic',...(Array.isArray(raw.ownedSkins)?raw.ownedSkins:[])].filter(id => Object.hasOwn(SKINS,id)))];
    for (const type of TYPES) {
      save.ownedSkins[type] = [...owned];
      if (owned.includes(raw.loadout?.[type])) save.loadout[type] = raw.loadout[type];
    }
    save.legacyHistory = {version:raw.version, source:clone(raw), upgradeRefund, itemRefund};
    save.migrationNotice = `已升级至 0.3.0：旧成绩与战局已归档，升级及道具返还 ${upgradeRefund+itemRefund} 宝石。新战役从第一关开始，已购皮肤保留。`;
    return {save,migrated:true,notice:save.migrationNotice};
  }
  save.upgradePoints = integer(raw.upgradePoints,999);
  for (const [id,branch] of Object.entries(UPGRADE_BRANCHES)) save.upgrades[id] = integer(raw.upgrades?.[id],branch.max);
  save.claimedUpgradeLevels = [...new Set((Array.isArray(raw.claimedUpgradeLevels)?raw.claimedUpgradeLevels:[]).filter(id => LEVELS.some(level => level.id === id)))];
  save.cleared = scores(raw.cleared);
  save.assistedCleared = scores(raw.assistedCleared);
  save.unlocked = Math.max(integer(raw.unlocked,29),unlockedByScores(save.cleared));
  save.assistedUnlocked = Math.max(integer(raw.assistedUnlocked,29),unlockedByScores(save.assistedCleared));
  save.family = raw.family === true;
  const requestedLevel = LEVELS.findIndex(level => level.id === raw.selectedLevelId);
  save.selectedLevel = Math.min(save.family?save.assistedUnlocked:save.unlocked,requestedLevel>=0?requestedLevel:integer(raw.selectedLevel,29));
  save.selectedLevelId = LEVELS[save.selectedLevel].id;
  for (const type of TYPES) {
    const owned = Array.isArray(raw.ownedSkins?.[type]) ? raw.ownedSkins[type] : [];
    save.ownedSkins[type] = [...new Set(['classic',...owned].filter(id => Object.hasOwn(SKINS,id)))];
    if (save.ownedSkins[type].includes(raw.loadout?.[type])) save.loadout[type] = raw.loadout[type];
  }
  for (const id of Object.keys(ITEMS)) save.inventory[id] = integer(raw.inventory?.[id],99);
  save.practiceCompleted = [...new Set((Array.isArray(raw.practiceCompleted)?raw.practiceCompleted:[]).filter(type => TYPES.includes(type)))];
  save.legacyHistory = raw.legacyHistory && typeof raw.legacyHistory === 'object' ? clone(raw.legacyHistory) : null;
  save.migrationNotice = typeof raw.migrationNotice === 'string' ? raw.migrationNotice.slice(0,600) : '';
  for (const field of ['checkpoint','campaignCheckpoint']) {
    const checkpoint = raw[field];
    if (checkpoint?.schema === 3 && checkpoint.campaignId === CAMPAIGN_ID && checkpoint.rulesetVersion === RULESET_VERSION && LEVELS.some(level => level.id === checkpoint.levelId) && (field !== 'campaignCheckpoint' || !checkpoint.practice)) {
      save[field] = clone(checkpoint);
    }
  }
  return {save,migrated:false};
}

export function canPlay(save,index,assisted=save.family) {
  return Number.isInteger(index) && index >= 0 && index < LEVELS.length && index <= (assisted?save.assistedUnlocked:save.unlocked);
}
export function purchaseSkin(save,type,id) {
  if (!TYPES.includes(type) || !Object.hasOwn(SKINS,id)) return false;
  const owned = save.ownedSkins[type], skin = SKINS[id];
  if (owned.includes(id) || save.gems < skin.cost) return false;
  save.gems -= skin.cost; owned.push(id); return true;
}
export function equipSkin(save,type,id) {
  if (!TYPES.includes(type) || !save.ownedSkins[type].includes(id)) return false;
  save.loadout[type] = id; return true;
}
export function purchaseItem(save,id) {
  if (!Object.hasOwn(ITEMS,id)) return false;
  const item = ITEMS[id];
  if (save.gems < item.cost || save.inventory[id] >= 99) return false;
  save.gems -= item.cost; save.inventory[id] = (save.inventory[id] || 0) + 1; return true;
}
export function upgradeAvailable(save,id) {
  const branch = UPGRADE_BRANCHES[id];
  if (!branch) return false;
  const unlock = Math.max(save.unlocked,save.assistedUnlocked);
  return (branch.type === 'statue' || availableTypes(unlock).includes(branch.type)) && (!id.startsWith('sword') || unlock >= 3);
}
export function purchaseUpgrade(save,id) {
  if (!Object.hasOwn(UPGRADE_BRANCHES,id) || !upgradeAvailable(save,id)) return false;
  const branch = UPGRADE_BRANCHES[id], rank = save.upgrades[id] || 0;
  if (rank >= branch.max || save.upgradePoints < branch.cost) return false;
  save.upgradePoints -= branch.cost; save.upgrades[id] = rank + 1; return true;
}
export function recordVictory(save,battle) {
  const none = {stars:0,reward:0,upgradeReward:0};
  if (!battle || battle.status !== 'won' || battle.resultRecorded) return none;
  if (battle.practice) {
    if (TYPES.includes(battle.practice) && !save.practiceCompleted.includes(battle.practice)) save.practiceCompleted.push(battle.practice);
    battle.resultRecorded = true;
    return none;
  }
  if (battle.survival || battle.campaignId !== CAMPAIGN_ID) return none;
  const id = battle.levelId || battle.config?.id;
  const index = LEVELS.findIndex(level => level.id === id);
  if (index < 0 || !canPlay(save,index,!!battle.assisted)) return none;
  const cleared = battle.assisted ? save.assistedCleared : save.cleared;
  const health = battle.baseMax > 0 ? battle.baseHP/battle.baseMax : 0;
  const stars = health>.8 && (battle.stats?.lost||0)<3 ? 3 : health>.4 ? 2 : 1;
  const reward = cleared[id] ? 1 : LEVELS[index].reward;
  const upgradeReward = save.claimedUpgradeLevels.includes(id) ? 0 : 2;
  cleared[id] = Math.max(cleared[id] || 0,stars);
  const field = battle.assisted ? 'assistedUnlocked' : 'unlocked';
  save[field] = Math.max(save[field],Math.min(LEVELS.length-1,index+1));
  save.gems += reward; save.upgradePoints += upgradeReward;
  if (upgradeReward) save.claimedUpgradeLevels.push(id);
  battle.resultRecorded = true;
  return {stars,reward,upgradeReward};
}
