// Simulation geometry uses world coordinates: x along the battlefield and
// lane for the foot position across its depth. No screen coordinates belong here.
export const FIELD_BOUNDS = Object.freeze({ minX:90, maxX:2610, minLane:-45, maxLane:80 });
const EPSILON = 1e-9;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(b.x-a.x, b.lane-a.lane);
}

/** Move in two dimensions without overshooting. Returns distance travelled. */
export function moveToward(unit, target, speed, dt) {
  if (![unit.x,unit.lane,target.x,target.lane,speed,dt].every(Number.isFinite) || speed<=0 || dt<=0) return 0;
  const targetX=clamp(target.x,FIELD_BOUNDS.minX,FIELD_BOUNDS.maxX);
  const targetLane=clamp(target.lane,FIELD_BOUNDS.minLane,FIELD_BOUNDS.maxLane);
  const dx=targetX-unit.x, dy=targetLane-unit.lane, remaining=Math.hypot(dx,dy);
  if (remaining<EPSILON) return 0;
  const ratio=Math.min(1,speed*dt/remaining), previousX=unit.x, previousLane=unit.lane;
  unit.x=clamp(unit.x+dx*ratio,FIELD_BOUNDS.minX,FIELD_BOUNDS.maxX);
  unit.lane=clamp(unit.lane+dy*ratio,FIELD_BOUNDS.minLane,FIELD_BOUNDS.maxLane);
  return Math.hypot(unit.x-previousX,unit.lane-previousLane);
}

/** First collision of a swept point with a circle, as a segment fraction. */
export function segmentCircleHit(from, to, target, radius) {
  if (![from.x,from.lane,to.x,to.lane,target.x,target.lane,radius].every(Number.isFinite) || radius<0) return null;
  const dx=to.x-from.x, dy=to.lane-from.lane;
  const ox=from.x-target.x, oy=from.lane-target.lane;
  const c=ox*ox+oy*oy-radius*radius;
  if (c<=EPSILON) return 0;
  const a=dx*dx+dy*dy;
  if (a<EPSILON) return null;
  const b=2*(ox*dx+oy*dy), discriminant=b*b-4*a*c;
  if (discriminant < -EPSILON) return null;
  const t=(-b-Math.sqrt(Math.max(0,discriminant)))/(2*a);
  return t>=-EPSILON && t<=1+EPSILON ? clamp(t,0,1) : null;
}

/** Gentle same-team spacing. Summoned units obey the same physical rules. */
export function separateUnits(units) {
  const active=units.filter(u=>u.hp>0&&!u.hidden&&Number.isFinite(u.x)&&Number.isFinite(u.lane))
    .map((unit,index)=>({unit,index}))
    .sort((a,b)=>(a.unit.id??a.index)-(b.unit.id??b.index)||a.index-b.index)
    .map(entry=>entry.unit);
  for(let i=0;i<active.length;i++) for(let j=i+1;j<active.length;j++) {
    const a=active[i], b=active[j];
    if(a.team!==b.team) continue;
    const radius=(a.type==='giant'?18:11)+(b.type==='giant'?18:11);
    const dx=b.x-a.x, dy=b.lane-a.lane, length=Math.hypot(dx,dy);
    if(length>=radius) continue;
    const strength=Math.min(.8,(radius-length)*.14);
    // Depth receives the larger adjustment; exact overlaps use id order.
    const laneSign=dy===0?1:Math.sign(dy);
    const shiftLane=laneSign*strength*(.65+.35*Math.abs(dy)/Math.max(length,EPSILON));
    const shiftX=length>EPSILON?dx/length*strength*.3:0;
    a.x=clamp(a.x-shiftX,FIELD_BOUNDS.minX,FIELD_BOUNDS.maxX);
    b.x=clamp(b.x+shiftX,FIELD_BOUNDS.minX,FIELD_BOUNDS.maxX);
    a.lane=clamp(a.lane-shiftLane,FIELD_BOUNDS.minLane,FIELD_BOUNDS.maxLane);
    b.lane=clamp(b.lane+shiftLane,FIELD_BOUNDS.minLane,FIELD_BOUNDS.maxLane);
  }
}
