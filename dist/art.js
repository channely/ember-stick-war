import { WORLD, UNITS } from './engine.js';
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
export function portrait(type) {
  const color = '#30352d', accent = '#9b976a';
  const legs = '<path d="M37 48 28 68m9-20 9 20" fill="none" stroke="#30352d" stroke-width="5" stroke-linecap="round"/>';
  const body = `<circle cx="37" cy="22" r="7" fill="${color}"/><path d="M37 32v17m0-12L25 46m12-9 14 5" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>${legs}`;
  let gear = '';
  if (type === 'miner') gear = '<path d="m50 51 9-28m-18 2q14-8 27 5" fill="none" stroke="#867953" stroke-width="3"/><path d="M29 20c-1-12 19-12 16 0Z" fill="#b9aa70"/><path d="M26 21h22" stroke="#7f805f" stroke-width="3"/><rect x="34" y="13" width="6" height="6" rx="1" fill="#e4ca7d"/><path d="M24 37q-16-2-14 15l10 3Z" fill="#b4a983"/>';
  if (type === 'sword') gear = '<path d="M30 18h15l-8-7Z" fill="#9ba385"/><path d="M28 19h18" stroke="#6e795a" stroke-width="3"/><path d="m51 43 15-24-3-4-17 25Z" fill="#a0a99b" stroke="#6c7663"/><path d="m46 35 11 6m-6-3-5 9" stroke="#a38b4c" stroke-width="3"/><path d="m29 29 13 3-15 5Z" fill="#9aa37c"/>';
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
  resize() { const r=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.width=r.width;this.height=r.height;this.canvas.width=r.width*dpr;this.canvas.height=r.height*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.scale=this.width<640?.72:Math.min(1.08,this.width/1100);this.visibleWidth=this.width/this.scale;this.ground=this.height*.74;this.setCamera(this.targetCamera,true); }
  setCamera(x, instant=false){this.targetCamera=Math.max(0,Math.min(WORLD-this.visibleWidth,x));if(instant)this.camera=this.targetCamera;}
  toWorld(x){return x/this.scale+this.camera;}
  unitScreen(u){return {x:(u.x-this.camera)*this.scale,y:this.ground+u.lane*this.scale};}
  draw(battle, now) {
    this.camera+=(this.targetCamera-this.camera)*.12; const c=this.ctx,w=this.width,h=this.height,t=this.reduced?0:now/1000;c.clearRect(0,0,w,h);
    this.landscape(c,battle,t);
    c.save();c.translate(-this.camera*this.scale,this.ground);c.scale(this.scale,this.scale);
    this.base(c,175,0,battle.baseHP/battle.baseMax,t);this.base(c,WORLD-175,1,battle.enemyHP/battle.enemyMax,t);
    this.rocks(c,434,22);this.rocks(c,WORLD-437,22);this.banner(c,285,-24,0,t);this.banner(c,WORLD-285,-24,1,t);
    const list=[...battle.units].sort((a,b)=>a.lane-b.lane);
    for(const u of list){if(u.x<this.camera-120||u.x>this.camera+this.visibleWidth+120)continue;this.unit(c,u,battle,t);}
    for(const p of battle.projectiles){const k=p.progress,y=p.lane*(1-k)+p.toLane*k-Math.sin(k*Math.PI)*(p.type==='mage'?20:55);if(p.type==='mage'){ellipse(c,p.x,y,8,8,'#b8c9a188');ellipse(c,p.x,y,4,4,'#e2e3b6');}else{line(c,[[p.x-12*(p.team?-1:1),y+2],[p.x,y]],'#605c42',1.5);poly(c,[[p.x,y],[p.x-5*(p.team?-1:1),y-2],[p.x-5*(p.team?-1:1),y+4]],'#6c6a54');}}
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
  unit(c,u,b,t){c.save();c.translate(u.x,u.lane);let scale=u.type==='giant'?1.65:1;const walk=u.action==='walk';const phase=this.reduced?0:u.phase;const stride=walk?Math.sin(phase)*12:Math.sin(phase)*.8;ellipse(c,0,1,17*scale,4*scale,'#6f755738');if(u.id===b.selected){c.strokeStyle='#d4b366';c.lineWidth=2;c.beginPath();c.ellipse(0,1,25*scale,7*scale,0,0,7);c.stroke();}c.scale(u.facing*scale,scale);const body=u.hurt>0?'#f4e9cc':u.team?'#494336':'#30382f',accent=u.team?'#a46f52':'#899572';const bob=walk?Math.abs(Math.cos(phase))*2:Math.sin(phase)*.4;c.translate(0,-bob);const attack=u.swing>0?Math.sin(u.swing/.4*Math.PI):0;
    line(c,[[0,-29],[-7+stride,-14],[-10+stride*.9,0]],body,5);line(c,[[0,-29],[6-stride,-14],[10-stride*.9,0]],body,5);
    if(u.type==='mage'){poly(c,[[-8,-48],[-19,-5],[20,-5],[8,-48]],u.team?'#85735e':'#7d8a72');line(c,[[0,-47],[3,-13]],'#b9b898',2);}else if(u.type==='giant'){poly(c,[[-12,-47],[10,-47],[13,-29],[-11,-29]],body);poly(c,[[-12,-27],[12,-27],[16,-18],[-15,-18]],'#a49773');}else line(c,[[0,-46],[0,-27]],body,6);
    ellipse(c,0,-58,8,9,body);
    if(u.type==='miner'){
      poly(c,[[-10,-60],[-6,-69],[5,-69],[11,-60]],'#b6a773');line(c,[[-12,-59],[12,-59]],'#8c8e60',2);c.fillStyle='#dfcb82';c.fillRect(-3,-67,6,5);
      c.save();c.translate(11,-39);c.rotate(u.action==='mine'?Math.sin(phase*3)*.6-.4:0);line(c,[[-10,-4],[7,1],[13,-12]],body,4);line(c,[[11,10],[19,-24]],'#8c7850',3);line(c,[[4,-23],[18,-29],[33,-22]],'#8b937b',3.5);c.restore();line(c,[[-3,-43],[-13,-35],[-15,-24]],body,4);if(u.cargo){ellipse(c,-13,-32,11,12,'#b4a06c');poly(c,[[-22,-38],[-14,-47],[-7,-38]],'#e1bf6d');}
    }else if(u.type==='sword'){
      poly(c,[[-10,-61],[-4,-70],[8,-65],[10,-60]],accent);poly(c,[[-7,-47],[9,-48],[4,-41],[-14,-44]],accent);line(c,[[1,-43],[12,-35],[25+attack*11,-44+attack*13]],body,4.5);line(c,[[-2,-44],[-12-stride*.2,-32],[-10-stride*.4,-22]],body,4);
      c.save();c.translate(25+attack*11,-44+attack*13);c.rotate(attack*1.5);poly(c,[[-2,2],[0,-28],[4,-34],[7,-28],[3,3]],'#b9bdac','#7f8772');line(c,[[-6,2],[8,2]],'#af9761',3);line(c,[[1,4],[1,10]],'#777854',3);c.restore();
    }else if(u.type==='archer'){
      poly(c,[[-11,-59],[-9,-68],[2,-71],[10,-61],[3,-55],[-11,-51]],accent);line(c,[[0,-42],[17,-43],[28,-43]],body,4);line(c,[[-2,-43],[10,-36],[20-attack*14,-43]],body,4);line(c,[[26,-67],[34,-57],[38,-43],[34,-28],[26,-18]],'#977d50',2.5);line(c,[[26,-67],[21-attack*7,-43],[26,-18]],'#c5bea0',1);line(c,[[17-attack*10,-44],[46,-44]],'#6b6f51',1);poly(c,[[46,-44],[41,-47],[41,-41]],'#88957a');line(c,[[-11,-50],[-13,-27]],'#9d8961',6);for(let i=0;i<3;i++)line(c,[[-13+i*3,-37],[-19+i*3,-59]],'#93825d',1);
    }else if(u.type==='spear'){
      poly(c,[[-10,-57],[-10,-69],[7,-73],[12,-64],[11,-52],[5,-52],[5,-62],[-4,-62],[-4,-56]],'#b3aa7b');line(c,[[-8,-70],[0,-78],[10,-76],[17,-67]],accent,5);line(c,[[1,-43],[14,-38],[28,-44]],body,4);line(c,[[30,-5],[30+attack*25,-87]],'#8e7952',3);poly(c,[[30+attack*25,-98],[26+attack*25,-83],[34+attack*25,-83]],'#bfc3ad','#7d8872');line(c,[[-3,-44],[-16,-35]],body,4);ellipse(c,-17,-33,13,20,accent);c.strokeStyle='#b6af7b';c.lineWidth=2;c.stroke();ellipse(c,-17,-33,4,5,'#a7af86');
    }else if(u.type==='mage'){
      poly(c,[[-17,-62],[-4,-86],[13,-62]],accent);line(c,[[-20,-61],[17,-61]],'#596b51',3);line(c,[[-3,-45],[-16,-35],[-20,-26]],body,4);line(c,[[3,-45],[15,-32],[27,-40]],body,4);line(c,[[28,0],[28,-62]],'#94805a',3);ellipse(c,28,-66,7,8,'#9ebba1');ellipse(c,28,-66,3,4,'#dde7bb');if(attack)ellipse(c,28,-66,9+attack*8,9+attack*8,'#c7d9a65c');
    }else{line(c,[[-8,-42],[-19,-29],[-16,-17]],body,7);line(c,[[7,-42],[20,-31],[32,-40+attack*15]],body,7);line(c,[[30,-34+attack*15],[44,-63+attack*30]],'#87734e',5);poly(c,[[36,-59+attack*30],[44,-77+attack*30],[53,-69+attack*30],[47,-49+attack*30]],'#979680','#75785d',1);line(c,[[-7,-61],[7,-59]],'#b0a582',3);}
    if(!u.team&&b.rage>0){c.globalAlpha=.6;line(c,[[-12,5],[-5,-5],[0,4],[6,-7],[13,4]],'#cb9460',1.3);c.globalAlpha=1;}
    c.restore();if(u.hp<u.maxHP||u.id===b.selected){const width=u.type==='giant'?42:28,y=u.lane-(u.type==='giant'?124:83);c.fillStyle='#3f493c44';c.fillRect(u.x-width/2,y,width,3);c.fillStyle=u.team?'#ae7257':'#7e925c';c.fillRect(u.x-width/2,y,width*u.hp/u.maxHP,3);}
  }
  effect(c,e){const k=e.life/e.maxLife;c.save();c.globalAlpha=k;if(e.type==='gold'){c.fillStyle='#9e8039';c.font='bold 14px Georgia';c.textAlign='center';c.fillText('+'+e.value,e.x,e.lane-(1-k)*25);}else if(e.type==='hit'){c.fillStyle='#f5dfb3';for(let i=0;i<5;i++){const a=i*1.26;ellipse(c,e.x+Math.cos(a)*(1-k)*23,e.lane+Math.sin(a)*(1-k)*23,2,2,'#f4e6bd');}c.font='10px Arial';c.fillStyle='#7f6449';c.fillText(e.value||'',e.x+6,e.lane-15-(1-k)*13);}else if(e.type==='heal'){c.strokeStyle='#b5cf8c';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.lane-20,15+(1-k)*10,35,0,0,7);c.stroke();line(c,[[e.x-5,e.lane-40-(1-k)*20],[e.x+5,e.lane-40-(1-k)*20]],'#d4e4ae',2);line(c,[[e.x,e.lane-45-(1-k)*20],[e.x,e.lane-35-(1-k)*20]],'#d4e4ae',2);}else if(e.type==='magic'||e.type==='stomp'){c.strokeStyle=e.type==='magic'?'#c9dc9b':'#d4bd7b';c.lineWidth=3;c.beginPath();c.ellipse(e.x,e.lane,70*(1-k),e.type==='magic'?55*(1-k):15*(1-k),0,0,7);c.stroke();}else if(e.type==='death'){line(c,[[e.x-20,e.lane],[e.x+15,e.lane]],'#667052',4);ellipse(c,e.x-24,e.lane-2,6,6,'#667052');}else if(e.type==='tower'){line(c,[[175,-80],[e.x,e.lane-35]],'#c1aa68',1);}c.restore();}
  foreground(c,t){const h=this.height,w=this.width;for(let i=0;i<22;i++){const x=i*w/20+randomAt(i+5)*20,y=h+4;const s=12+randomAt(i+7)*15;if(i>3&&i<18)continue;line(c,[[x-7,y],[x-9+Math.sin(t+i)*2,y-s],[x,y-2],[x+6+Math.sin(t+i)*2,y-s-5],[x+4,y]],'#84936a88',2);}}
  drawMinimap(b){const c=this.mctx,w=174,h=40;c.clearRect(0,0,w,h);c.fillStyle='#8e977741';c.fillRect(0,21,w,1);c.fillStyle='#7c8b61';c.fillRect(8,15,5,12);c.fillStyle='#a37559';c.fillRect(w-14,15,5,12);for(const u of b.units){c.fillStyle=u.team?'#a17458':u.type==='miner'?'#b9a461':'#6c8251';c.fillRect(u.x/WORLD*w,19+u.lane/10,2,5);}c.fillStyle='#f5f1d32b';c.strokeStyle='#88906b';const x=this.camera/WORLD*w,vw=this.visibleWidth/WORLD*w;c.fillRect(x,5,vw,30);c.strokeRect(x+.5,5.5,vw-1,29);}
}
