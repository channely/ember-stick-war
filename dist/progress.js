import { LEVELS, SKINS, ITEMS } from './content.js';
export const SAVE_KEY='ember-kingdom-v1';
const TYPES=['miner','sword','archer','spear','mage','giant'];
const integer=(v,max=9999)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
export function freshProgress(){return {version:2,gems:3,cleared:{},upgrades:{},difficulty:'normal',sound:false,reduced:false,bestWave:0,selectedLevel:0,unlocked:0,checkpoint:null,ownedSkins:['classic'],loadout:Object.fromEntries(TYPES.map(t=>[t,'classic'])),inventory:{gold:2,mining:1,reinforcements:1,arrows:1,repair:2,frost:1}};}
export function migrateProgress(raw){
  const save=freshProgress();if(!raw||typeof raw!=='object')return {save,migrated:false};
  if(![1,2].includes(raw.version))return {save,migrated:false};
  save.gems=integer(raw.gems);save.bestWave=integer(raw.bestWave);save.difficulty=['easy','normal','hard'].includes(raw.difficulty)?raw.difficulty:'normal';save.sound=raw.sound===true;save.reduced=raw.reduced===true;
  for(const type of [...TYPES,'statue'])save.upgrades[type]=integer(raw.upgrades?.[type],3);
  const migrated=raw.version===1;
  if(migrated){
    for(let i=0;i<6;i++){const stars=integer(raw.cleared?.[i],3);if(stars){save.cleared[i*5+4]=stars;save.unlocked=Math.max(save.unlocked,Math.min(29,(i+1)*5));}}
    save.selectedLevel=Math.min(save.unlocked,integer(raw.selectedLevel,5)*5+4);if(!Object.keys(save.cleared).length)save.selectedLevel=0;
    // Old stars, crystals and upgrades remain; a different combat schema starts at the camp.
  }else{
    for(let i=0;i<LEVELS.length;i++){const stars=integer(raw.cleared?.[i],3);if(stars)save.cleared[i]=stars;}
    save.unlocked=Math.max(integer(raw.unlocked,29),...Object.keys(save.cleared).map(i=>Math.min(29,Number(i)+1)));save.selectedLevel=Math.min(save.unlocked,integer(raw.selectedLevel,29));
    save.ownedSkins=[...new Set(['classic',...(Array.isArray(raw.ownedSkins)?raw.ownedSkins:[])].filter(id=>SKINS[id]))];
    for(const type of TYPES)if(save.ownedSkins.includes(raw.loadout?.[type]))save.loadout[type]=raw.loadout[type];
    for(const type of Object.keys(ITEMS))save.inventory[type]=integer(raw.inventory?.[type],99);
    save.checkpoint=raw.checkpoint?.schema===2?raw.checkpoint:null;
  }
  return {save,migrated};
}
export function canPlay(save,index){return Number.isInteger(index)&&index>=0&&index<LEVELS.length&&index<=save.unlocked;}
export function purchaseSkin(save,id){const skin=SKINS[id];if(!skin||save.ownedSkins.includes(id))return false;if(save.gems<skin.cost)return false;save.gems-=skin.cost;save.ownedSkins.push(id);return true;}
export function equipSkin(save,type,id){if(!TYPES.includes(type)||!save.ownedSkins.includes(id))return false;save.loadout[type]=id;return true;}
export function purchaseItem(save,id){const item=ITEMS[id];if(!item||save.gems<item.cost||save.inventory[id]>=99)return false;save.gems-=item.cost;save.inventory[id]=(save.inventory[id]||0)+1;return true;}
export function recordVictory(save,battle){const stars=battle.baseHP/battle.baseMax>.8&&battle.stats.lost<3?3:battle.baseHP/battle.baseMax>.4?2:1;const reward=save.cleared[battle.level]?1:LEVELS[battle.level].reward;save.cleared[battle.level]=Math.max(save.cleared[battle.level]||0,stars);save.unlocked=Math.max(save.unlocked,Math.min(LEVELS.length-1,battle.level+1));save.gems+=reward;return {stars,reward};}
