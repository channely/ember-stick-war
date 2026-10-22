import { Renderer as BaseRenderer, ICONS, icon, icons, portrait as basePortrait } from './art.js';
import { WORLD } from './engine.js';
import { SKINS, REGIONS } from './content.js';
export { icon, icons };
Object.assign(ICONS,{
  pickaxe:'<path d="m5 21 12-17M4 7q10-8 17 2M15 4l4 4"/>',
  horn:'<path d="M3 12 20 4v16L3 12Zm4 2 2 6h5l-2-4M20 4l2-1v18l-2-1"/>',
  arrows:'<path d="m3 21 6-12m-8 3 8-3 2 8M11 21l6-12m-8 3 8-3 2 8m0-13 3-3m-8 1 3-3"/>',
  snow:'<path d="M12 2v20M3 7l18 10M3 17 21 7M8 4l4 4 4-4M8 20l4-4 4 4M3 11l6-1-2-5m-4 8 6 1-2 5m14-8-6-1 2-5m4 8-6 1 2 5"/>',
  cart:'<path d="M3 5h2l3 12h11l3-9H6m1 4h13"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
  'chevron-right':'<path d="m9 6 6 6-6 6"/>'
});
const polygon=(c,p,fill,stroke,width=1)=>{c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}};
const stroke=(c,p,color,width=2)=>{c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();};
const oval=(c,x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();};
const rnd=n=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
export function portrait(type,skin='classic'){
  const s=SKINS[skin]||SKINS.classic;let svg=basePortrait(type);
  for(const [old,value] of Object.entries({'#30352d':'#171b16','#45473b':'#25251e','#9ba385':s.accent,'#9aa37c':s.cloth,'#b9aa70':s.accent,'#b6ab79':s.accent,'#7a825a':s.cloth,'#858c60':s.accent,'#b4ab79':s.trim,'#8c9972':s.cloth,'#88927c':s.cloth,'#7c8677':s.cloth,'#a0a99b':s.metal,'#afb4a1':s.metal,'#8a8c77':s.metal,'#a3b9a1':s.aura,'#a89b73':s.cloth,'#b4ab83':s.accent,'#b9bea0':s.trim,'#d8d8c0':'#86755144','#dbdbc8':'#86755144'}))svg=svg.replaceAll(old,value);
  const overlays={
    leaf:`<path d="M24 35q-10-13-5-16 12 3 10 17m18-7q12-10 12-3-5 9-13 8" fill="${s.accent}" stroke="${s.trim}" stroke-width=".7"/>`,
    ice:`<path d="m27 15 1-12 6 9 5-13 4 12 7-6-3 14" fill="${s.metal}" stroke="${s.accent}"/><path d="m26 40 8-4m7 12 5-6" stroke="${s.aura}" stroke-width="2"/>`,
    lava:`<path d="m32 28 5 8-3 8 8 7m-12-32 7-5 8 6M48 37l7 2" fill="none" stroke="${s.aura}" stroke-width="2"/><path d="m25 19 3-10 5 6m11 1 4-6 1 10" fill="${s.metal}"/>`,
    savage:`<path d="m28 18-7-11 1 11 9 5m12-6 10-10-1 12-9 5" fill="${s.metal}" stroke="#7f745c"/><path d="m33 14 10 1 2 9-13-2Z" fill="${s.metal}"/><path d="m34 18 2 1m4 0 2 0" stroke="#383328" stroke-width="2"/>`,
    vamp:`<path d="m27 30-8 28 8-5 4 7 1-26m13-6 11 27-7-5-5 7-2-25" fill="${s.cloth}"/><path d="m30 21 4 1m7 0 4-1" stroke="#e36e77" stroke-width="1.4"/>`,
    volt:`<path d="m38 29-6 11 6-1-3 11 11-16-7 1 4-6" fill="${s.aura}"/><path d="m16 27 5 4-4 5 6 4M58 9l-4 7 5 3-4 7" fill="none" stroke="${s.aura}" stroke-width="1.7"/>`
  };
  return svg.replace('</svg>',(overlays[skin]||'')+'</svg>');
}
export class Renderer extends BaseRenderer {
  draw(b,now){
    this.camera+=(this.targetCamera-this.camera)*.12;const c=this.ctx,t=this.reduced?0:now/1000;this.biome=b.survival?'night':b.config.biome;this.landscape(c,b,t);
    c.save();c.translate(-this.camera*this.scale,this.ground);c.scale(this.scale,this.scale);
    this.base(c,175,0,b.baseHP/b.baseMax,t);this.base(c,WORLD-175,1,b.enemyHP/b.enemyMax,t);this.rocks(c,434,22);this.rocks(c,WORLD-437,22);this.banner(c,292,-24,0,t);this.banner(c,WORLD-292,-24,1,t);
    if(b.convoy)this.cart(c,b.convoy,t);
    if(b.config.modifier==='embers'){const hot=b.nextHazard-b.time<1.5;stroke(c,[[1190,10],[1250,22],[1320,6],[1390,28],[1490,11]],hot?'#ffc15c':'#c66f3b',hot?5:2);}
    for(const u of [...b.units].sort((a,v)=>a.lane-v.lane))if(u.x>this.camera-130&&u.x<this.camera+this.visibleWidth+130)this.unit(c,u,b,t);
    for(const p of b.projectiles){const k=p.progress,y=p.lane*(1-k)+p.toLane*k-Math.sin(k*Math.PI)*(p.type==='mage'?22:50),theme=SKINS[p.skin]||SKINS.classic;if(p.type==='mage'){oval(c,p.x,y,12,12,theme.aura+'66');oval(c,p.x,y,6,6,theme.aura);oval(c,p.x,y,2,2,'#fff9d5');}else{const d=p.team?-1:1;stroke(c,[[p.x-d*16,y+2],[p.x,y]],'#29291e',1.6);polygon(c,[[p.x,y],[p.x-d*6,y-3],[p.x-d*5,y+4]],theme.metal,'#505747',.7);}}
    for(const e of b.effects)this.effect(c,e);c.restore();this.weather(c,b,t);this.drawMinimap(b);
    if(b.convoy){const x=b.convoy.x/WORLD*174;this.mctx.fillStyle='#e8bb57';this.mctx.fillRect(x-2,15,5,6);}
  }
  landscape(c,b,t){
    const r=REGIONS.find(r=>r.id===this.biome)||REGIONS[0],w=this.width,h=this.height,g=this.ground,cam=this.camera,night=r.id==='night';
    const sky=c.createLinearGradient(0,0,0,g);sky.addColorStop(0,r.sky[0]);sky.addColorStop(1,r.sky[1]);c.fillStyle=sky;c.fillRect(0,0,w,h);
    if(night){for(let i=0;i<65;i++){const x=(rnd(i+70)*3400-cam*.07)%w,y=rnd(i+10)*g*.72;oval(c,x,y,rnd(i+40)>.8?1.4:.8,rnd(i+40)>.8?1.4:.8,`rgba(245,239,207,${.35+rnd(i)*.55})`);}oval(c,w*.8-cam*.04,78,32,32,'#eee6bb');oval(c,w*.8-cam*.04+13,68,28,28,r.sky[0]);}
    else{oval(c,w*.78-cam*.04,86,48,48,'#ffe8a62c');oval(c,w*.78-cam*.04,86,34,34,'#fff0b8');}
    if(r.id!=='volcano'&&r.id!=='forest')for(let i=0;i<7;i++){const x=i*270-cam*.1+Math.sin(t*.02+i)*18,y=60+(i%3)*32;c.save();c.globalAlpha=night?.12:.55;oval(c,x,y,57,12,'#fff8e6');oval(c,x-15,y-6,29,16,'#fff8e6');oval(c,x+22,y-5,28,13,'#fff8e6');c.restore();}
    for(let layer=0;layer<3;layer++){
      const pts=[[-400,h]];for(let i=-2;i<16;i++){const x=i*260-cam*(.13+layer*.15),peak=g*(.25+layer*.2+rnd(i+60+layer*9)*.16);pts.push([x,peak],[x+135,g*(.66+layer*.12)]);}pts.push([w+1000,h]);polygon(c,pts,r.mountain[layer]);
      if(r.id==='snow'&&layer<2)for(let i=-1;i<10;i++){const x=i*260-cam*(.13+layer*.15),y=g*(.25+layer*.2+rnd(i+60+layer*9)*.16);polygon(c,[[x,y],[x-42,y+45],[x-12,y+35],[x+9,y+48],[x+44,y+49]],'#eef3ed');}
    }
    if(r.id==='volcano'){
      for(let i=0;i<3;i++){const x=600+i*800-cam*.2,y=g*.25;polygon(c,[[x-200,g*.9],[x-30,y],[x+38,y],[x+240,g*.9]],'#655b60');polygon(c,[[x-30,y],[x+38,y],[x+52,y+23],[x+1,y+13],[x-40,y+27]],'#e7954f');stroke(c,[[x,y+12],[x-21,y+69],[x+11,y+118],[x-35,g*.85]],'#d77c3a',5);for(let j=0;j<4;j++)oval(c,x+Math.sin(t*.2+j)*12,y-24-j*19,18+j*10,15,'#67627055');}
    }
    for(let i=0;i<24;i++){
      const x=i*153-cam*.55-40,y=g-15-rnd(i+18)*18,size=30+rnd(i+24)*50;if(x<-90||x>w+90)continue;
      if(['grass','forest','snow'].includes(r.id))this.tree(c,x,y,size,r.id,r.mountain[2],t);
      if(r.id==='desert'&&i%3===0){stroke(c,[[x,y],[x,y-size]],'#6f8653',6);stroke(c,[[x,y-size*.5],[x-16,y-size*.5],[x-16,y-size*.8]],'#6f8653',5);stroke(c,[[x,y-size*.35],[x+12,y-size*.35],[x+12,y-size*.7]],'#6f8653',4);}
      if(night&&i%3===0){c.fillStyle='#394654';c.fillRect(x,y-size,20,size);polygon(c,[[x-5,y-size],[x+25,y-size],[x+25,y-size-8],[x-5,y-size-8]],'#52616b');}
    }
    const earth=c.createLinearGradient(0,g-24,0,h);earth.addColorStop(0,r.ground[0]);earth.addColorStop(1,r.ground[1]);c.fillStyle=earth;c.beginPath();c.moveTo(0,g-14);for(let x=0;x<=w+20;x+=20)c.lineTo(x,g-17+Math.sin((x+cam)/130)*5);c.lineTo(w,h);c.lineTo(0,h);c.fill();
    c.fillStyle=r.id==='snow'?'#e8eddf88':r.id==='volcano'?'#c1a57d33':'#d7bd7b55';c.beginPath();c.moveTo(0,g+34);c.bezierCurveTo(w*.3,g+58,w*.65,g+12,w,g+28);c.lineTo(w,g+65);c.bezierCurveTo(w*.7,g+38,w*.3,g+86,0,g+60);c.fill();
    for(let i=0;i<290;i++){const wx=rnd(i+28)*WORLD,x=(wx-cam)*this.scale,y=g+rnd(i+98)*(h-g);if(x<0||x>w)continue;if(rnd(i)>.5&&!['desert','volcano','snow'].includes(r.id))stroke(c,[[x-4,y],[x-3,y-5],[x,y],[x+3,y-7]],night?'#9ca97766':'#4f733e66',1);else oval(c,x,y,1+rnd(i+22)*3,.8,night?'#9ca57744':'#736b4544');}
    if(r.id==='forest'){for(let i=0;i<4;i++){const x=i*450-cam*.4;c.save();c.globalAlpha=.055;polygon(c,[[x,0],[x+40,0],[x+220,g],[x+110,g]],'#ffffcf');c.restore();}}
  }
  tree(c,x,y,size,biome,color,t){
    stroke(c,[[x,y],[x+2,y-size*.85]],biome==='snow'?'#6d7a76':'#6f6147',Math.max(3,size*.065));
    if(biome==='snow'){for(let j=0;j<3;j++){const top=y-size+j*size*.23,half=size*(.15+j*.07);polygon(c,[[x,top],[x-half,top+size*.4],[x+half,top+size*.4]],'#567d70');polygon(c,[[x,top],[x-half*.7,top+size*.23],[x+half*.7,top+size*.23]],'#dce9e1');}}
    else{for(let j=0;j<5;j++){const dx=(j%3-1)*size*.22,dy=Math.floor(j/3)*size*.2;oval(c,x+dx+Math.sin(t*.7+j)*.7,y-size*.7-dy,size*.28,size*.25,j%2?color:biome==='forest'?'#3f7653':'#578847');}if(biome==='forest')stroke(c,[[x-14,y-size*.8],[x-18,y-size*.3],[x-8,y-size*.4]],'#547c4a',1.5);}
  }
  base(c,x,team,health,t){
    c.save();c.translate(x,-4);if(team)c.scale(-1,1);oval(c,0,20,91,14,'#292a2438');
    // The iconic silhouette statue is carved as a single dark warrior above a stone plinth.
    polygon(c,[[-166,10],[-117,-65],[-58,10]],'#9f8150','#594c33',2);polygon(c,[[-117,-65],[-98,10],[-58,10]],team?'#9b5240':'#b8ad7d');polygon(c,[[-141,10],[-117,-45],[-94,10]],'#463e2e');stroke(c,[[-149,-11],[-172,13]],'#756b4e',1.5);stroke(c,[[-117,-67],[-117,-78]],'#6e5c3f',3);c.fillStyle='#88663f';c.fillRect(-78,-8,18,18);stroke(c,[[-77,-3],[-60,-3]],'#c5a471',2);
    polygon(c,[[-60,8],[57,8],[68,28],[-72,28]],'#898b7d','#52574b',2);polygon(c,[[-48,-13],[44,-13],[57,8],[-60,8]],'#b0afa0','#636b5e',2);c.fillStyle='#a0a394';c.fillRect(-35,-50,66,37);polygon(c,[[31,-50],[44,-43],[44,-13],[31,-13]],'#7d8575','#596553');stroke(c,[[-35,-30],[31,-30]],'#727a6a',1);stroke(c,[[-12,-50],[-12,-30],[14,-30],[14,-13]],'#727a6a',1);polygon(c,[[-42,-55],[37,-55],[44,-50],[-35,-50]],'#c6c7b1','#5a6254');
    const stone=health<.25?'#383a32':'#262c27';stroke(c,[[-1,-101],[-16,-57]],stone,15);stroke(c,[[1,-101],[21,-57]],stone,15);stroke(c,[[0,-147],[0,-101]],stone,18);oval(c,0,-167,17,19,stone);stroke(c,[[0,-139],[-25,-121],[-34,-96]],stone,12);stroke(c,[[6,-141],[31,-163],[39,-193]],stone,12);polygon(c,[[35,-201],[52,-259],[60,-269],[64,-255],[45,-198]],'#c9ceca','#3e4843',2);stroke(c,[[27,-202],[53,-196]],'#cbbd6d',5);stroke(c,[[42,-198],[39,-189]],'#60513b',5);
    stroke(c,[[-4,-154],[-4,-115]],'#56604b66',3);stroke(c,[[-6,-104],[-18,-65]],'#56604b66',2);
    if(team){polygon(c,[[-17,-177],[4,-190],[18,-179]],'#7c3636');}else{polygon(c,[[-18,-177],[-4,-188],[12,-183],[18,-176]],'#b9a044','#6f643c');}
    if(health<.6){stroke(c,[[5,-172],[-2,-147],[7,-129],[-3,-111]],'#999d7e',1.5);stroke(c,[[7,-48],[-4,-35],[9,-25],[3,-14]],'#5a6456',2);}
    if(health<.25)for(let i=0;i<4;i++)oval(c,28+Math.sin(t+i)*8,-30-i*18,6+i*2,5,'#574c4155');
    c.restore();
  }
  banner(c,x,y,team,t){c.save();c.translate(x,y);stroke(c,[[0,30],[0,-128]],'#766540',3);polygon(c,[[-4,-129],[0,-140],[4,-129]],'#d0b461','#74613d');const wave=Math.sin(t*2+x)*4;c.beginPath();c.moveTo(2,-124);c.bezierCurveTo(15,-127+wave,25,-118-wave,44,-122);c.lineTo(44,-77);c.lineTo(24,-84);c.lineTo(2,-78);c.closePath();c.fillStyle=team?'#a34237':'#386990';c.fill();c.strokeStyle=team?'#e2a06d':'#d9d6a9';c.lineWidth=1.6;c.stroke();stroke(c,[[21,-112],[29,-103],[21,-93],[13,-103],[21,-112]],'#e9d486',2);c.restore();}
  rocks(c,x,y){super.rocks(c,x,y);c.save();c.translate(x,y);polygon(c,[[-25,-11],[-17,-22],[-6,-16],[-11,-5]],'#edc853','#8e773c');polygon(c,[[4,-26],[12,-35],[20,-23],[13,-13]],'#ffdc65','#a18948');stroke(c,[[8,-30],[12,-33],[17,-24]],'#fff1a8',2);c.restore();}
  unit(c,u,b,t){
    const s=SKINS[u.skin]||SKINS.classic,scale=(u.type==='giant'?1.65:1)*(u.boss?1.22:1);
    if(u.skin==='vamp'||u.type==='spear'){c.save();c.translate(u.x,u.lane);c.scale(u.facing*scale,scale);polygon(c,[[-5,-48],[-17-Math.sin(t*4+u.id)*3,-9],[-4,-16],[2,-42]],u.team?'#9a393c':s.cloth);c.restore();}
    super.unit(c,u,b,t);
    c.save();c.translate(u.x,u.lane);c.scale(u.facing*scale,scale);
    if(u.skin==='ice'){polygon(c,[[-10,-61],[-12,-77],[-4,-67],[1,-81],[5,-65],[13,-73],[9,-59]],s.metal,s.accent,1);stroke(c,[[-5,-44],[3,-37],[-4,-29]],s.aura,2);}
    if(u.skin==='lava'){stroke(c,[[-5,-63],[3,-58],[-2,-52]],s.aura,1.7);stroke(c,[[-3,-45],[2,-38],[-2,-31]],s.aura,1.5);}
    if(u.skin==='leaf'){polygon(c,[[-6,-44],[-18,-55],[-20,-46],[-11,-38]],s.accent,s.trim,.7);polygon(c,[[5,-44],[17,-49],[13,-38],[5,-35]],s.accent,s.trim,.7);}
    if(u.skin==='savage'){polygon(c,[[-9,-62],[-18,-78],[-18,-65],[-8,-55]],s.metal,'#6f6249',1);polygon(c,[[8,-62],[17,-77],[17,-63],[8,-55]],s.metal,'#6f6249',1);}
    if(u.skin==='volt'){polygon(c,[[1,-48],[-6,-36],[0,-37],[-3,-26],[8,-40],[2,-39]],s.aura);if(u.swing>0)stroke(c,[[18,-52],[26,-58],[22,-64],[31,-73]],s.aura,1.5);}
    if(u.skin==='vamp')stroke(c,[[-5,-59],[-1,-58],[4,-59]],'#dd718e',1.3);
    if(u.boss){polygon(c,[[-14,-97],[-12,-110],[-5,-102],[0,-113],[6,-102],[14,-110],[12,-96]],'#edca64','#735826',1);}
    if(u.slow>0){stroke(c,[[-6,-9],[0,-1],[6,-9]],'#a9e6ff',2);oval(c,0,-32,17,32,'#8dd6ed20');}
    if(u.burn>0){for(let i=0;i<3;i++){const y=-4-Math.sin(t*7+i)*3;polygon(c,[[-11+i*9,y],[-8+i*9,y-14],[-3+i*9,y]],'#f3aa43cc');}}
    c.restore();
    if(u.boss){c.fillStyle='#ead489';c.font='bold 10px "Ember Sans",sans-serif';c.textAlign='center';c.fillText('统领',u.x,u.lane-118*scale);}
  }
  cart(c,u,t){c.save();c.translate(u.x,u.lane);oval(c,0,5,39,6,'#34332133');polygon(c,[[-35,-36],[34,-36],[28,-7],[-29,-7]],'#805c38','#422f20',2);stroke(c,[[-31,-24],[30,-24]],'#bd995c',2);stroke(c,[[-25,-36],[-21,-7],[20,-7],[25,-36]],'#bfa375',2);for(let i=0;i<5;i++)polygon(c,[[-25+i*11,-34],[-20+i*11,-48-rnd(i)*9],[-9+i*11,-35]],'#e6bf58','#aa873a',1);for(const x of [-23,23]){oval(c,x,0,10,10,'#473c2b');oval(c,x,0,7,7,'#a68c56');c.save();c.translate(x,0);c.rotate(u.stopped?0:t*3);stroke(c,[[-6,0],[6,0]],'#52412b',2);stroke(c,[[0,-6],[0,6]],'#52412b',2);c.restore();}c.fillStyle='#373e2f';c.fillRect(-32,-66,64,4);c.fillStyle='#dfc260';c.fillRect(-32,-66,64*u.hp/u.maxHP,4);c.fillStyle='#f9e6b1';c.font='10px "Ember Sans",sans-serif';c.textAlign='center';c.fillText(u.stopped?(u.waiting?'矿车 · 等待护卫':'矿车 · 清理前路'):'矿车 · 前进中',0,-76);c.restore();}
  weather(c,b,t){const r=this.biome,w=this.width,h=this.height;
    if(r==='snow'&&!this.reduced)for(let i=0;i<65;i++){const x=(rnd(i+55)*w+t*(10+rnd(i)*12))%w,y=(rnd(i+12)*h+t*(15+rnd(i)*10))%h;oval(c,x,y,1+rnd(i),1+rnd(i),'#f5fcffbb');}
    if((r==='volcano'||b.config.modifier==='embers')&&!this.reduced)for(let i=0;i<28;i++){const x=(rnd(i+88)*w+t*8)%w,y=h-(rnd(i+30)*h+t*(8+rnd(i)*10))%h;oval(c,x,y,1.3,1.3,'#f3b153bb');}
    if(b.config.modifier==='fog'){c.fillStyle='#c4d4b51a';for(let i=0;i<3;i++){c.beginPath();c.ellipse(w*.5+Math.sin(t*.08+i)*w*.2,h*.5+i*50,w*.8,16,0,0,7);c.fill();}}
    if(b.config.modifier==='sandstorm'&&!this.reduced)for(let i=0;i<55;i++){const x=(rnd(i)*w+t*85)%w,y=rnd(i+30)*h;stroke(c,[[x,y],[x+12,y-1]],'#eddaad66',1);}
    const cold=b.effects.find(e=>e.type==='frost');if(cold){c.fillStyle=`rgba(165,220,245,${cold.life/cold.maxLife*.25})`;c.fillRect(0,0,w,h);}
  }
  effect(c,e){
    const k=e.life/e.maxLife;c.save();c.globalAlpha=k;
    if(e.type==='lightning'){stroke(c,[[e.x,e.lane],[(e.x+e.toX)/2-6,e.lane-12],[(e.x+e.toX)/2+5,e.lane+8],[e.toX,e.toLane]],'#fff29f',2.5);}
    else if(e.type==='arrowrain'){for(let i=0;i<38;i++){const x=i*74+30,y=-240+(1-k)*280+rnd(i)*40;stroke(c,[[x,y],[x+18,y+38]],'#352d23',1.5);polygon(c,[[x+18,y+38],[x+11,y+31],[x+22,y+30]],'#c4cab4');}}
    else if(e.type==='eruption'){for(let i=0;i<20;i++){const x=e.x-150+rnd(i)*300,y=-Math.sin((1-k)*Math.PI)*(30+rnd(i+4)*80);oval(c,x,y,2+rnd(i)*4,4,'#ffb950');}}
    else if(e.type==='magic'){for(let i=0;i<8;i++){const a=i*Math.PI/4;stroke(c,[[e.x,e.lane],[e.x+Math.cos(a)*(1-k)*70,e.lane+Math.sin(a)*(1-k)*45]],'#bdda84',3);}super.effect(c,e);}
    else super.effect(c,e);c.restore();
  }
}
