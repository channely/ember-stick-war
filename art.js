import { WORLD, UNITS } from './engine.js';
import { SKINS } from './content.js';
import { unitPose, unitScale } from './pose.js';
export const ICONS = {
  flag:'<path d="M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  swords:'<path d="m4 3 4 1 10 11-3 3L4 7 3 3Zm12 13 5 5M14 20l6-6M20 3l-4 1-4 5M5 15l-2 2m5-3 3 3m-7 4 6-6"/>',
  book:'<path d="M12 5C8 2 4 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-2-1-6-2-10 1v16"/>',
  gem:'<path d="m3 8 4-5h10l4 5-9 13L3 8Zm0 0h18M8 3l-2 5 6 13 6-13-2-5"/>',
  settings:'<path d="m9 3 1-1h4l1 3 3 1 2-1 2 4-2 2v3l1 2-3 4-3-1-2 2H9l-1-3-3-1-2 1-2-4 2-2v-3L2 7l3-3 3 1Z"/><circle cx="12" cy="12" r="3"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  'arrow-up-right':'<path d="M6 18 18 6M6 6h12v12"/>',
  'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  coins:'<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v4c0 4 12 4 12 0V6M3 10v4c0 4 12 4 12 0v-4m0-1c7 0 9 4 3 6m-5 3c4 3 9 0 9-2v-4M3 14v3c0 3 7 4 10 2"/>',
  users:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5v2"/>',
  pause:'<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  play:'<path d="m7 4 14 8-14 8V4Z"/>',
  maximize:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  home:'<path d="m3 10 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/>',
  shield:'<path d="m12 2 9 4v6c0 5-6 9-9 10-3-1-9-5-9-10V6l9-4Z"/>',
  'volume-off':'<path d="m11 4-5 4H3v8h3l5 4V4Zm6 5 5 6m0-6-5 6"/>',
  volume:'<path d="m11 4-5 4H3v8h3l5 4V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  flame:'<path d="M13 2c2 6-5 7-3 12 1-2 2-3 4-4 0 3 5 3 5 7 0 7-15 7-15-1 0-6 7-7 9-14Z"/>',
  sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4M3 18v4m-2-2h4"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v.1"/>',
  x:'<path d="m6 6 12 12M6 18 18 6"/>',
  trophy:'<path d="M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v4c0 3 2 4 5 4m9-8h4v4c0 3-2 4-5 4m-4 2v6m-5 0h10"/>',
  skull:'<path d="M5 17a9 9 0 1 1 14 0v5H5v-5Zm5 2v3m4-3v3"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><path d="m11 16 1-2 1 2"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  heart:'<path d="M12 21C-7 9 5-4 12 5c7-9 19 4 0 16Z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
};
export function icon(name) { return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.flag}</svg>`; }
export function icons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon)); }
export function portrait(type, options = {}) {
  const color = '#30352d', accent = '#9b976a';
  const legs = '<path d="M37 48 28 68m9-20 9 20" fill="none" stroke="#30352d" stroke-width="5" stroke-linecap="round"/>';
  const body = `<circle cx="37" cy="22" r="7" fill="${color}"/><path d="M37 32v17m0-12L25 46m12-9 14 5" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>${legs}`;
  let gear = '';
  if (type === 'miner') gear = '<path d="m50 51 9-28m-18 2q14-8 27 5" fill="none" stroke="#867953" stroke-width="3"/><path d="M29 20c-1-12 19-12 16 0Z" fill="#b9aa70"/><path d="M26 21h22" stroke="#7f805f" stroke-width="3"/><rect x="34" y="13" width="6" height="6" rx="1" fill="#e4ca7d"/><path d="M24 37q-16-2-14 15l10 3Z" fill="#b4a983"/>';
  if (type === 'sword') gear = '<path d="M30 18h15l-8-7Z" fill="#9ba385"/><path d="M28 19h18" stroke="#6e795a" stroke-width="3"/><path d="m51 43 15-24-3-4-17 25Z" fill="#a0a99b" stroke="#6c7663"/><path d="m46 35 11 6m-6-3-5 9" stroke="#a38b4c" stroke-width="3"/><path d="m29 29 13 3-15 5Z" fill="#9aa37c"/>';
  if (type === 'sword' && options.clubman) gear = '<path d="m30 18 14 2" stroke="#a18a57" stroke-width="4"/><path d="m50 44 14-22" stroke="#81603b" stroke-width="4" stroke-linecap="round"/><path d="m56 29 6-12 8 5-8 14Z" fill="#9f7b48" stroke="#705231"/><path d="m61 22 4 2m-7 3 4 2" stroke="#c4a16b" stroke-width="1.5"/>';
  if (type === 'archer') gear = '<path d="M29 21q-1-15 15-8l4 7Z" fill="#8c9972"/><path d="m30 18 4 15-8-4Z" fill="#8c9972"/><path d="M54 18q23 22 0 45m0-45 3 22-3 23" fill="none" stroke="#9b8154" stroke-width="2"/><path d="M41 40h28m-5-3 5 3-5 3" fill="none" stroke="#646d51" stroke-width="1.5"/><path d="m21 29 6 28" stroke="#94815f" stroke-width="5"/>';
  if (type === 'spear') gear = '<path d="M28 24V14q9-8 18 0v12h-6V18h-7v6Z" fill="#b6ab79"/><path d="M30 13q9-14 17 2" fill="none" stroke="#7a825a" stroke-width="6"/><path d="M59 69V9" stroke="#8d8053" stroke-width="3"/><path d="m59 0-4 13h8Z" fill="#afb4a1"/><ellipse cx="24" cy="44" rx="11" ry="15" fill="#858c60" stroke="#b4ab79" stroke-width="2"/><path d="M24 32v24m-8-12h16" stroke="#a6aa7b" stroke-width="1"/>';
  if (type === 'mage') gear = '<path d="m29 32-10 34h36L43 32Z" fill="#7c8677"/><path d="m21 20 16-19 12 19Z" fill="#88927c"/><path d="M18 21h36" stroke="#58674e" stroke-width="3"/><path d="M59 69V23" stroke="#9b875b" stroke-width="3"/><circle cx="59" cy="18" r="6" fill="#a3b9a1" stroke="#697e62" stroke-width="2"/><path d="m34 31 3 20 5-20" fill="#b9bea0"/><path d="m44 39 13-4" stroke="#30352d" stroke-width="4"/>';
  if (type === 'giant') return '<svg viewBox="0 0 80 76" aria-hidden="true"><ellipse cx="40" cy="70" rx="24" ry="3" fill="#d8d8c0"/><circle cx="37" cy="17" r="9" fill="#45473b"/><path d="M26 30q11-7 24 0l-3 21H28Z" fill="#45473b"/><path d="m28 35-10 13m28-13 11 13M32 51l-6 18m17-18 7 18" fill="none" stroke="#45473b" stroke-width="8" stroke-linecap="round"/><path d="m53 42 13-17" stroke="#7e7052" stroke-width="5"/><path d="m60 30 7-17 9 7-11 15Z" fill="#8a8c77"/><path d="M28 49h19l4 9H25Z" fill="#a89b73"/><path d="m29 13 16 4" stroke="#b4ab83" stroke-width="4"/></svg>';
  return `<svg viewBox="0 0 80 76" aria-hidden="true"><ellipse cx="38" cy="71" rx="20" ry="2" fill="#dbdbc8"/>${body}${gear}</svg>`;
}
function poly(ctx, points, fill, stroke, width = 1) { ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();} }
function line(ctx, points, color, width = 2) { ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(); }
function ellipse(ctx,x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function randomAt(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export class Renderer {
  constructor(canvas, minimap) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.minimap = minimap; this.mctx = minimap.getContext('2d'); this.camera = 0; this.targetCamera = 0; this.reduced = false; this.resize(); }
  resize() {
    const r=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);
    this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    // A short phone landscape still contains the complete statue and the rear/front lanes.
    this.scale=Math.max(.33,Math.min(1.08,this.width<640?.72:this.width/1050,this.height/290));
    this.visibleWidth=this.width/this.scale;this.ground=this.height*.72;
    this.setCamera(this.targetCamera,true);
  }
  setCamera(x, instant=false){this.targetCamera=Math.max(0,Math.min(Math.max(0,WORLD-this.visibleWidth),Number(x)||0));if(instant)this.camera=this.targetCamera;}
  toWorld(x){return x/this.scale+this.camera;}
  screenToWorld(x,y){return {x:this.toWorld(x),lane:(y-this.ground)/this.scale};}
  unitScreen(u){return {x:(u.x-this.camera)*this.scale,y:this.ground+u.lane*this.scale};}
  unitBounds(u){
    const p=this.unitScreen(u),s=unitScale(u)*this.scale,jump=unitPose(u).jump*s;
    return {left:p.x-23*s,right:p.x+23*s,top:p.y-(u.type==='mage'?88:80)*s-jump,bottom:p.y+5*s};
  }
  hitTest(battle,x,y){
    let best=null,distance=Infinity;
    for(const u of battle.units){
      if(u.team||u.hidden||u.hp<=0||u.type==='minion')continue;
      const r=this.unitBounds(u),margin=Math.max(4,10-this.scale*5);
      if(x<r.left-margin||x>r.right+margin||y<r.top-margin||y>r.bottom+margin)continue;
      const d=Math.hypot((x-(r.left+r.right)/2)/Math.max(14,r.right-r.left),(y-(r.top+r.bottom)/2)/Math.max(20,r.bottom-r.top));
      if(d<distance||(Math.abs(d-distance)<.03&&u.lane>(best?.lane??-Infinity))){best=u;distance=d;}
    }
    return best;
  }
  easeCamera(now){
    const dt=this.lastDraw==null?1/60:Math.max(0,Math.min(.1,(now-this.lastDraw)/1000));this.lastDraw=now;
    this.camera+=(this.targetCamera-this.camera)*(1-Math.exp(-9*dt));
  }
  draw(battle, now) {
    this.easeCamera(now); const c=this.ctx,w=this.width,h=this.height,t=this.reduced?0:battle.time;c.clearRect(0,0,w,h);
    this.landscape(c,battle,t);
    c.save();c.translate(-this.camera*this.scale,this.ground);c.scale(this.scale,this.scale);
    this.base(c,175,0,battle.baseHP/battle.baseMax,t);this.base(c,WORLD-175,1,battle.enemyHP/battle.enemyMax,t);
    for(const m of battle.mines||[])if(m.remaining>0)this.rocks(c,m.x,m.lane);this.banner(c,285,-24,0,t);this.banner(c,WORLD-285,-24,1,t);
    const list=[...battle.units].sort((a,b)=>a.lane-b.lane);
    for(const u of list){if(u.hidden||u.hp<=0||u.x<this.camera-120||u.x>this.camera+this.visibleWidth+120)continue;this.unit(c,u,battle,t);}
    for(const p of battle.projectiles){const y=p.lane-(p.z??43);c.save();c.translate(p.x,y);c.rotate(Math.atan2((p.vlane||0)-(p.vz||0),p.vx||(p.team?-1:1)));line(c,[[p.type==='spear'?-42:-20,0],[0,0]],'#605c42',1.5);poly(c,[[3,0],[-5,-3],[-5,3]],'#aab6a3');c.restore();}
    for(const e of battle.effects)this.effect(c,e);
    c.restore();this.foreground(c,t);this.drawMinimap(battle);
  }
  landscape(c,b,t){const w=this.width,h=this.height,g=this.ground,cam=this.camera;
    const sky=c.createLinearGradient(0,0,0,g);sky.addColorStop(0,'#ede7d3');sky.addColorStop(.6,'#e8dfbf');sky.addColorStop(1,'#dad3b4');c.fillStyle=sky;c.fillRect(0,0,w,h);
    const sunX=w*.78-cam*.04;ellipse(c,sunX,87,46,46,'#f8f0cf70');ellipse(c,sunX,87,34,34,'#faf3db80');
    // Broad soft clouds and three deliberately composed mountain ranges.
    c.fillStyle='#f9f4e536';for(let i=0;i<5;i++){let x=i*350-cam*.09+Math.sin(t*.04+i)*15;c.beginPath();c.ellipse(x,68+i%2*30,115,10,0,0,7);c.fill();}
    const mountain=(points,color,parallax)=>{const ps=points.map(([x,y])=>[x-cam*parallax,y*g]);poly(c,[[-800,h],...ps,[w+1000,h]],color);};
    mountain([[-250,.75],[-100,.55],[60,.58],[200,.2],[335,.52],[465,.35],[600,.7],[785,.33],[890,.57],[1010,.28],[1180,.5],[1370,.21],[1560,.52],[1790,.3],[2010,.57],[2310,.2],[2660,.68],[3100,.3]],'#d9cfaf',.14);
    mountain([[-250,.9],[-70,.68],[60,.76],[245,.48],[420,.75],[570,.56],[735,.67],[865,.4],[1030,.76],[1190,.51],[1360,.67],[1520,.49],[1720,.72],[1950,.47],[2220,.76],[2500,.54],[2900,.83]],b.level>2?'#b4b5a1':'#c6b995',.25);
    // Lit facets on the distant peaks.
    poly(c,[[200-cam*.14,g*.2],[169-cam*.14,g*.34],[230-cam*.14,g*.44],[335-cam*.14,g*.52]],'#e2d8b9');poly(c,[[865-cam*.25,g*.4],[785-cam*.25,g*.55],[1030-cam*.25,g*.76]],'#cdc5a6');
    mountain([[-300,.98],[-100,.76],[60,.83],[220,.72],[370,.86],[555,.68],[710,.87],[890,.74],[1080,.83],[1260,.69],[1460,.9],[1680,.76],[1880,.86],[2120,.67],[2420,.84],[2820,.73]],'#afb092',.42);
    // Distant cypress silhouettes.
    for(let i=0;i<60;i++){const x=i*73-cam*.5-60,size=13+randomAt(i+9)*28,y=g*(.84+randomAt(i)*.09);if(x<-30||x>w+30)continue;poly(c,[[x-size*.25,y],[x,y-size],[x+size*.27,y]],'#959d7d65');}
    const earth=c.createLinearGradient(0,g-30,0,h);earth.addColorStop(0,'#bcc0a1');earth.addColorStop(.4,'#c9c8a8');earth.addColorStop(1,'#b7bd98');c.fillStyle=earth;c.beginPath();c.moveTo(0,g-16);for(let x=0;x<=w+40;x+=40)c.lineTo(x,g-19+Math.sin((x+cam*.6)/90)*5);c.lineTo(w,h);c.lineTo(0,h);c.fill();
    // A worn path through the grass; terrain details are deterministic.
    c.fillStyle='#ded3ad55';c.beginPath();c.moveTo(0,g+32);c.bezierCurveTo(w*.35,g+42,w*.7,g+13,w,g+38);c.lineTo(w,g+66);c.bezierCurveTo(w*.7,g+38,w*.35,g+64,0,g+58);c.fill();
    for(let i=0;i<240;i++){const wx=randomAt(i+28)*WORLD,x=(wx-cam)*this.scale,y=g-6+randomAt(i+98)*(h-g);if(x<0||x>w)continue;const r=randomAt(i+44);if(r>.6){line(c,[[x-3,y+3],[x-1,y-2],[x,y+3],[x+3,y-4]],'#8f9b6e55',.8);}else{ellipse(c,x,y,1.2+randomAt(i+65)*3,.6,'#8e8d6f33');}}
    for(let i=0;i<4;i++){const x=(w*.45+i*29+t*4)% (w+100)-40,y=74+Math.sin(i*5)*22;const flap=Math.sin(t*3+i)*2;line(c,[[x-4,y-2-flap],[x,y],[x+5,y-2-flap]],'#a5a183',1);}
  }
  base(c,x,team,health,t){c.save();c.translate(x,-7);if(team)c.scale(-1,1);const stone=team?'#b1a38a':'#b6b4a0',edge=team?'#8e806b':'#8e9580';
    ellipse(c,0,23,100,14,'#7d846431');
    // Camp, canvas awning, and supplies.
    poly(c,[[-156,10],[-112,-66],[-62,10]],'#aaad8b','#8c9373');poly(c,[[-112,-66],[-88,10],[-62,10]],'#d0cb9f');poly(c,[[-133,10],[-112,-40],[-91,10]],'#6d7758');line(c,[[-112,-66],[-112,-79]],'#7e7e5d',2);poly(c,[[-112,-80],[-88,-74],[-112,-69]],team?'#9a6651':'#73815d');line(c,[[-140,-19],[-168,15]],'#979a7c',1);c.fillStyle='#a8a17c';c.fillRect(-85,-4,21,15);line(c,[[-85,2],[-64,2]],'#858365',1);c.fillStyle='#908c69';c.fillRect(-75,-10,12,11);
    // Cut stone plinth.
    poly(c,[[-57,13],[51,13],[65,28],[-70,28]],'#aaa68b',edge);poly(c,[[-48,-8],[42,-8],[51,13],[-57,13]],'#c1bea4',edge);c.fillStyle=stone;c.fillRect(-38,-53,70,45);poly(c,[[32,-53],[45,-45],[45,-8],[32,-8]],'#a3a48b',edge);poly(c,[[-43,-59],[36,-59],[45,-53],[-38,-53]],'#d1cbb1',edge);line(c,[[-38,-29],[32,-29]],'#93998166',1);line(c,[[-17,-53],[-17,-29],[9,-29],[9,-8]],'#93998166',1);c.fillStyle='#828c71';c.fillRect(-21,-40,35,20);c.fillStyle='#babc9b';c.font='9px Georgia';c.textAlign='center';c.fillText(team?'CHAOS':'ORDER',-3,-26);
    // Monument: a carved warrior with a raised blade and round shield.
    c.save();c.translate(-3,-59);line(c,[[-9,-46],[-21,-5]],edge,13);line(c,[[8,-46],[24,-5]],edge,13);line(c,[[-9,-46],[-21,-5]],stone,9);line(c,[[8,-46],[24,-5]],stone,9);poly(c,[[-19,-94],[13,-94],[19,-48],[-12,-42],[-24,-58]],stone,edge,2);poly(c,[[2,-92],[13,-94],[19,-48],[5,-45]],'#a1a68e');ellipse(c,-3,-111,15,18,stone);line(c,[[-18,-112],[-17,-126],[7,-132],[16,-119],[12,-101]],edge,3);poly(c,[[-19,-122],[6,-139],[18,-120]],'#a3aa8b',edge);line(c,[[-11,-131],[-4,-143],[11,-144],[22,-136]],team?'#9f7e61':'#a6a07b',5);line(c,[[13,-89],[32,-105],[45,-131]],edge,11);line(c,[[13,-89],[32,-105],[45,-131]],stone,7);poly(c,[[44,-139],[52,-192],[58,-198],[62,-190],[51,-137]],'#cacbb5',edge,1.5);line(c,[[36,-136],[60,-132]],'#898f73',5);line(c,[[-18,-89],[-34,-68]],edge,10);ellipse(c,-35,-66,23,30,'#959e80');ellipse(c,-37,-68,20,27,stone);ellipse(c,-37,-68,15,21,'#a7af90');line(c,[[-37,-83],[-37,-52]],'#d0ceb0',2);line(c,[[-49,-68],[-24,-68]],'#d0ceb0',2);ellipse(c,-37,-68,4,5,'#bec2a1');if(health<.5)line(c,[[4,-105],[-3,-88],[8,-71],[-2,-53]],'#6e7760',2);c.restore();
    c.restore();
  }
  banner(c,x,y,team,t){c.save();c.translate(x,y);line(c,[[0,30],[0,-126]],'#7a7b58',3);poly(c,[[-4,-126],[0,-135],[4,-126]],'#b2a371');const wave=Math.sin(t*2+x)*3;c.beginPath();c.moveTo(2,-124);c.bezierCurveTo(20,-128+wave,25,-117-wave,46,-120);c.lineTo(42,-79);c.bezierCurveTo(25,-73+wave,18,-83-wave,2,-78);c.closePath();c.fillStyle=team?'#a46f53':'#77835a';c.fill();line(c,[[5,-122],[5,-80]],'#d6c08a',1);c.strokeStyle='#d5c69a';c.lineWidth=1.4;c.beginPath();c.moveTo(21,-112);c.lineTo(30,-104);c.lineTo(21,-94);c.lineTo(13,-104);c.closePath();c.stroke();c.restore();}
  rocks(c,x,y){c.save();c.translate(x,y);ellipse(c,0,5,43,8,'#8f937650');poly(c,[[-39,1],[-33,-16],[-13,-25],[4,-15],[15,-2]],'#aaa47d','#97966f');poly(c,[[-11,4],[-13,-21],[5,-39],[22,-35],[38,-17],[35,5]],'#bbb28a','#99966f');poly(c,[[5,-39],[22,-35],[11,-16],[-13,-21]],'#d3bd7d');poly(c,[[10,-16],[30,-25],[38,-17],[35,5],[15,4]],'#b9a870');poly(c,[[-27,-9],[-18,-18],[-9,-12],[-14,-3]],'#dfc073');poly(c,[[1,-21],[7,-29],[15,-22],[9,-11]],'#e8c97c');poly(c,[[19,-7],[25,-17],[32,-8],[29,-1]],'#e3bf67');line(c,[[-18,-17],[-8,-13]],'#f0d99a',1);line(c,[[7,-28],[14,-22]],'#f7df98',1.5);c.restore();}
  unit(c,u,b,t){
    if(u.hidden||u.hp<=0)return;
    if(u.type==='minion')u={...u,type:'sword',summoned:true,clubman:true};
    const p=unitPose(u,t,this.reduced),s=SKINS[u.skin]||SKINS.classic,scale=p.scale;
    const body=u.hurt>0?'#f8e8c4':u.team?'#2b211f':u.summoned?'#383129':'#17201d';
    const accent=s.accent,metal=s.metal,wood='#80613d',edge='#454b3e';
    c.save();c.translate(u.x,u.lane);
    ellipse(c,0,2,18*scale,4*scale,'#252e2b38');
    if(u.id===b.selected){
      c.strokeStyle='#fff0a5';c.lineWidth=2/Math.max(.55,this.scale);c.beginPath();c.ellipse(0,2,26*scale,8*scale,0,0,Math.PI*2);c.stroke();
      poly(c,[[-5*scale,-4*scale],[0,-10*scale],[5*scale,-4*scale]],'#f2d47b');
    }
    c.scale((u.facing||1)*scale,scale);c.translate(0,-p.bob-p.jump);c.rotate(p.lean);
    // All equipment is inside this transform, so armor inherits the same walk/jump pose.
    if(u.skin==='vamp'||u.type==='spear'){
      const flutter=this.reduced?0:Math.sin(t*4+u.id)*3;
      poly(c,[[-4,-48],[-16-flutter,-10],[-10,-15],[-5,-7],[0,-42]],u.team?'#8f3e3a':s.cloth,'#302c2a',.6);
    }
    line(c,[[0,-29],[-7+p.stride,-14],p.leftFoot],body,u.type==='giant'?7:5);
    line(c,[[0,-29],[6-p.stride,-14],p.rightFoot],body,u.type==='giant'?7:5);
    if(u.type==='mage'){
      poly(c,[[-8,-48],[-19,-5],[20,-5],[8,-48]],u.team?'#803e47':s.cloth,edge,.6);
      line(c,[[0,-47],[3,-13]],s.trim,2);line(c,[[-14,-8],[16,-8]],s.trim,1.2);
    }else if(u.type==='giant'){
      poly(c,[[-12,-47],[10,-47],[13,-29],[-11,-29]],body);
      poly(c,[[-12,-27],[12,-27],[16,-18],[-15,-18]],s.cloth,edge,.7);line(c,[[-10,-24],[12,-24]],s.trim,1.5);
    }else line(c,[p.shoulder,p.hip],body,6);
    ellipse(c,...p.head,8,9,body);
    // A small uniform ribbon distinguishes teams without hiding skin identity.
    line(c,[[-5,-46],[5,-46]],u.team?'#b95144':'#4b88b2',2.5);
    if(u.type==='miner'){
      poly(c,[[-10,-60],[-6,-69],[5,-69],[11,-60]],accent,edge,.7);
      line(c,[[-12,-59],[12,-59]],s.trim,2);c.fillStyle='#ffe7a1';c.fillRect(-3,-67,6,5);
      const fullness=Math.min(1,(u.cargo||0)/(u.capacity||u.cargoCapacity||35));
      ellipse(c,-13,-32,8+fullness*3,9+fullness*4,'#a18a57');line(c,[[-15,-43],[-5,-39]],'#d2b675',2);
      if(fullness>0){poly(c,[[-21,-37],[-17,-43],[-12,-46],[-7,-38]],'#f0cd67',wood,.5);}
      line(c,[[0,-43],[-11,-35],[-13,-26]],body,4);
      const angle=p.kind==='mine'?-.7+p.extension*2:-.13;
      c.save();c.translate(15,-40);c.rotate(angle);line(c,[[-13,-3],[-4,5],[9,-2]],body,4);
      line(c,[[5,16],[14,-23]],wood,3.2);line(c,[[0,-22],[13,-27],[29,-21]],metal,4);
      poly(c,[[25,-24],[32,-19],[23,-20]],metal);c.restore();
    }else if(u.type==='sword'){
      if(u.clubman)line(c,[[-7,-61],[8,-59]],'#aa8b54',3);else poly(c,[[-10,-61],[-4,-70],[8,-65],[10,-60]],accent,edge,.6);
      const hand=p.block?[20,-46]:p.rightHand;
      line(c,[[0,-43],[12,-34],hand],body,4.5);line(c,[[0,-43],[-12-p.stride*.2,-31],p.leftHand],body,4);
      c.save();c.translate(...hand);c.rotate(p.block?-.75:-.35+p.extension*1.9);
      if(u.clubman||u.weapon==='club'||u.hasSword===false){line(c,[[1,8],[1,-24]],wood,5);line(c,[[1,-12],[1,-29]],'#9d7847',8);}
      else{poly(c,[[-2,2],[0,-28],[4,-34],[7,-28],[3,3]],metal,edge,.8);line(c,[[2,-24],[2,-2]],'#ffffff75',.8);line(c,[[-6,2],[8,2]],s.trim,3);line(c,[[1,4],[1,10]],wood,3);}
      c.restore();
    }else if(u.type==='archer'){
      poly(c,[[-11,-59],[-9,-68],[2,-71],[10,-61],[3,-55],[-11,-51]],s.cloth,edge,.6);
      line(c,[[-11,-50],[-13,-27]],wood,6);for(let i=0;i<3;i++){line(c,[[-13+i*3,-37],[-19+i*3,-59]],'#b3a581',1);line(c,[[-19+i*3,-59],[-22+i*3,-62]],s.trim,1.4);}
      c.save();c.translate(0,-43);c.rotate(p.angle);
      const draw=p.kind==='aim'?1:p.kind==='attack'?Math.max(0,1-p.progress*1.4):.18;
      line(c,[[0,0],[16,0],[28,0]],body,4);line(c,[[-2,0],[7,9],[23-draw*17,0]],body,4);
      line(c,[[28,-25],[35,-16],[39,0],[35,16],[28,25]],wood,2.5);
      line(c,[[28,-25],[24-draw*17,0],[28,25]],'#e8dcad',1);
      if(p.kind!=='attack'||p.progress<p.windup){line(c,[[8-draw*8,0],[49-draw*8,0]],'#6c6348',1.2);poly(c,[[49-draw*8,0],[44-draw*8,-3],[44-draw*8,3]],metal);}
      c.restore();
    }else if(u.type==='spear'){
      poly(c,[[-10,-57],[-10,-69],[7,-73],[12,-64],[11,-52],[5,-52],[5,-62],[-4,-62],[-4,-56]],accent,edge,.7);
      line(c,[[-8,-70],[0,-78],[10,-76],[17,-67]],u.team?'#9e4140':s.cloth,5);
      const thrust=p.extension,hand=[24+thrust*13,-42+thrust*2];
      line(c,[[1,-43],[13,-33],hand],body,4.5);
      c.save();c.translate(...hand);
      if(u.hasSpear!==false){
        c.rotate(p.kind==='throw'?-.5+thrust*1.9:p.kind==='attack'?1.4:-.22);
        line(c,[[0,34],[0,-46]],wood,3);poly(c,[[0,-60],[-5,-44],[0,-46],[5,-44]],metal,edge,.8);line(c,[[-2,-36],[2,-36]],s.trim,2);
      }else{c.rotate(-.3+thrust*1.6);poly(c,[[-2,2],[0,-19],[4,-23],[7,-18],[3,3]],metal,edge,.8);line(c,[[-4,2],[8,2]],s.trim,2);}
      c.restore();
      const shield=p.block?[25,-37]:[-13,-34];
      line(c,[[-2,-44],[shield[0]-6,-31],shield],body,4);
      ellipse(c,...shield,p.block?15:12,20,accent);c.lineWidth=2;c.strokeStyle=s.trim;c.stroke();
      ellipse(c,...shield,8,14,s.cloth);ellipse(c,...shield,4,5,metal);
      line(c,[[shield[0],shield[1]-13],[shield[0],shield[1]+13]],s.trim,1);
    }else if(u.type==='mage'){
      poly(c,[[-17,-62],[-4,-86],[13,-62]],accent,edge,.8);line(c,[[-20,-61],[17,-61]],s.trim,2);
      const casting=['summon','blast'].includes(p.kind),hand=casting?[24+p.extension*12,-48]:[-19,-29];
      line(c,[[-3,-45],[hand[0]*.6,-37],hand],body,4);
      line(c,[[3,-45],[15,-32],[27,-40]],body,4);line(c,[[28,0],[28,-62]],wood,3);
      ellipse(c,28,-66,7,8,s.aura);ellipse(c,28,-66,3,4,'#fff7cd');
      if(casting){ellipse(c,...hand,7+Math.sin(p.progress*Math.PI)*8,7+Math.sin(p.progress*Math.PI)*8,s.aura+'66');ellipse(c,...hand,3,3,'#fff9d8');}
      if(p.kind==='summon'){c.strokeStyle=s.aura;c.lineWidth=1;c.beginPath();c.ellipse(0,1,22,7,0,0,Math.PI*2);c.stroke();}
    }else{
      line(c,[[-8,-42],[-19,-29],[-16,-17]],body,7);
      const hand=[28+p.extension*6,-43+p.extension*21];line(c,[[7,-42],[20,-31],hand],body,7);
      c.save();c.translate(...hand);c.rotate(-.4+p.extension*1.8);
      line(c,[[0,4],[7,-29]],wood,5);poly(c,[[0,-27],[7,-45],[18,-38],[14,-19]],metal,edge,1.2);line(c,[[8,-40],[13,-37]],s.trim,2);c.restore();
      line(c,[[-7,-61],[7,-59]],accent,3);poly(c,[[-12,-43],[-15,-39],[-8,-35],[-4,-42]],accent,edge,.6);
    }
    this.skinDetails(c,u,s,p,t);
    if(p.block){c.globalAlpha=.4;c.strokeStyle='#f7df9a';c.lineWidth=1.5;c.beginPath();c.arc(12,-39,28,-1.1,1.1);c.stroke();c.globalAlpha=1;}
    if(u.stun>0||p.kind==='stunned'){for(let i=0;i<3;i++){const a=t*5+i*Math.PI*2/3;ellipse(c,Math.cos(a)*12,-83+Math.sin(a)*3,2,2,'#f7da72');}}
    if(u.slow>0){line(c,[[-6,-9],[0,-1],[6,-9]],'#a9e6ff',2);ellipse(c,0,-32,17,32,'#8dd6ed20');}
    if(u.burn>0){for(let i=0;i<3;i++){const y=-4-Math.sin(t*7+i)*3;poly(c,[[-11+i*9,y],[-8+i*9,y-14],[-3+i*9,y]],'#f3aa43cc');}}
    if(u.boss)poly(c,[[-14,-97],[-12,-110],[-5,-102],[0,-113],[6,-102],[14,-110],[12,-96]],'#edca64','#735826',1);
    c.restore();
    if(u.hp<u.maxHP||u.id===b.selected||u.boss){
      const width=(u.type==='giant'?43:30)*(u.boss?1.2:1),y=u.lane-(u.type==='mage'?94:87)*scale-p.jump*scale;
      c.fillStyle='#17251d88';c.fillRect(u.x-width/2-1,y-1,width+2,5);c.fillStyle=u.team?'#d46e54':'#a5cf6d';c.fillRect(u.x-width/2,y,width*Math.max(0,u.hp/u.maxHP),3);
      if(u.type==='miner'&&u.id===b.selected){c.font='10px "Ember Sans",sans-serif';c.textAlign='center';c.fillStyle='#ffedb3';c.fillText(`${Math.floor(u.cargo||0)} / ${u.capacity||u.cargoCapacity||35}`,u.x,y-5);}
    }
  }
  skinDetails(c,u,s,p,t){
    if(u.skin==='ice'){poly(c,[[-10,-61],[-12,-77],[-4,-67],[1,-81],[5,-65],[13,-73],[9,-59]],s.metal,s.accent,1);line(c,[[-5,-44],[3,-37],[-4,-29]],s.aura,2);}
    if(u.skin==='lava'){line(c,[[-5,-63],[3,-58],[-2,-52]],s.aura,1.7);line(c,[[-3,-45],[2,-38],[-2,-31]],s.aura,1.5);}
    if(u.skin==='leaf'){poly(c,[[-6,-44],[-18,-55],[-20,-46],[-11,-38]],s.accent,s.trim,.7);poly(c,[[5,-44],[17,-49],[13,-38],[5,-35]],s.accent,s.trim,.7);}
    if(u.skin==='savage'){poly(c,[[-9,-62],[-18,-78],[-18,-65],[-8,-55]],s.metal,'#6f6249',1);poly(c,[[8,-62],[17,-77],[17,-63],[8,-55]],s.metal,'#6f6249',1);}
    if(u.skin==='volt'){poly(c,[[1,-48],[-6,-36],[0,-37],[-3,-26],[8,-40],[2,-39]],s.aura);if(p.extension>.6)line(c,[[18,-52],[26,-58],[22,-64],[31,-73]],s.aura,1.5);}
    if(u.skin==='vamp')line(c,[[-5,-59],[-1,-58],[4,-59]],'#dd718e',1.3);
  }
  effect(c,e){const k=e.life/e.maxLife;c.save();c.globalAlpha=k;if(e.type==='gold'){c.fillStyle='#9e8039';c.font='bold 14px Georgia';c.textAlign='center';c.fillText('+'+e.value,e.x,e.lane-(1-k)*25);}else if(e.type==='hit'){c.fillStyle='#f5dfb3';for(let i=0;i<5;i++){const a=i*1.26;ellipse(c,e.x+Math.cos(a)*(1-k)*23,e.lane+Math.sin(a)*(1-k)*23,2,2,'#f4e6bd');}c.font='10px Arial';c.fillStyle='#7f6449';c.fillText(e.value||'',e.x+6,e.lane-15-(1-k)*13);}else if(e.type==='heal'){c.strokeStyle='#b5cf8c';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.lane-20,15+(1-k)*10,35,0,0,7);c.stroke();line(c,[[e.x-5,e.lane-40-(1-k)*20],[e.x+5,e.lane-40-(1-k)*20]],'#d4e4ae',2);line(c,[[e.x,e.lane-45-(1-k)*20],[e.x,e.lane-35-(1-k)*20]],'#d4e4ae',2);}else if(e.type==='magic'||e.type==='stomp'){c.strokeStyle=e.type==='magic'?'#c9dc9b':'#d4bd7b';c.lineWidth=3;c.beginPath();c.ellipse(e.x,e.lane,70*(1-k),e.type==='magic'?55*(1-k):15*(1-k),0,0,7);c.stroke();}else if(e.type==='death'){line(c,[[e.x-20,e.lane],[e.x+15,e.lane]],'#667052',4);ellipse(c,e.x-24,e.lane-2,6,6,'#667052');}else if(e.type==='tower'){line(c,[[175,-80],[e.x,e.lane-35]],'#c1aa68',1);}c.restore();}
  foreground(c,t){const h=this.height,w=this.width;for(let i=0;i<22;i++){const x=i*w/20+randomAt(i+5)*20,y=h+4;const s=12+randomAt(i+7)*15;if(i>3&&i<18)continue;line(c,[[x-7,y],[x-9+Math.sin(t+i)*2,y-s],[x,y-2],[x+6+Math.sin(t+i)*2,y-s-5],[x+4,y]],'#84936a88',2);}}
  drawMinimap(b){
    const c=this.mctx,w=this.minimap.width||174,h=this.minimap.height||40;c.clearRect(0,0,w,h);
    c.fillStyle='#8e977741';c.fillRect(0,h*.6,w,1);c.fillStyle='#82b67a';c.fillRect(8,h*.35,5,h*.36);c.fillStyle='#cf8062';c.fillRect(w-14,h*.35,5,h*.36);
    for(const mine of b.mines||[]){c.fillStyle=mine.remaining>0?'#dfbb62':'#777a69';c.fillRect(mine.x/WORLD*w-1,h*.5+mine.lane/8,3,3);}
    for(const u of b.units){if(u.hidden||u.hp<=0)continue;c.fillStyle=u.id===b.selected?'#fff0a0':u.team?'#d58365':u.type==='miner'?'#d1bc76':'#94bc80';c.fillRect(u.x/WORLD*w,h*.5+u.lane/8,u.boss?3:2,u.type==='giant'?5:3);}
    c.fillStyle='#f5f1d32b';c.strokeStyle='#d8d8a3';const x=this.camera/WORLD*w,vw=Math.min(w,this.visibleWidth/WORLD*w);c.fillRect(x,3,vw,h-6);c.strokeRect(x+.5,3.5,vw-1,h-7);
  }
}
