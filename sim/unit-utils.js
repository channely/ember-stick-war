import { UNITS, WORLD } from '../rules.js';

const MINION = { ...UNITS.sword, name:'召唤小兵', hp:65, damage:13, range:32, speed:75, cooldown:1.3, windup:.25, recovery:.25, pop:0, radius:8 };
export const definition = type => type === 'minion' ? MINION : UNITS[type];
export const homeX = team => team ? WORLD - 205 : 205;
export const baseX = team => team ? WORLD - 175 : 175;
export const isAlive = unit => unit.hp > 0 && !unit.hidden;
