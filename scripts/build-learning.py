"""Generate the self-contained learning examples. Run with Python 3; no runtime dependencies."""
from pathlib import Path
from textwrap import dedent
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/learn/examples'
OUT.mkdir(parents=True,exist_ok=True)
STYLE='''*{box-sizing:border-box}body{margin:0;padding:24px;background:#f7f2e6;color:#293b32;font:16px/1.65 system-ui,sans-serif}main{max-width:760px;margin:auto}h1{font-size:24px;margin:0 0 8px}p{margin:9px 0;color:#657362}button,select,input{font:inherit}button{background:#426a4d;color:#fff6df;border:0;border-radius:7px;padding:10px 17px;cursor:pointer;margin:4px 6px 4px 0}button:disabled{opacity:.4;cursor:default}button.secondary{background:#e5decb;color:#52634c}label{display:inline-flex;align-items:center;gap:10px;margin:8px 16px 8px 0}canvas{display:block;width:100%;background:#d9ebd0;border:1px solid #b6c8aa;border-radius:12px;margin:15px 0}.board{background:#fffdf4;border:1px solid #ddd6bf;border-radius:10px;padding:18px;margin:15px 0}.numbers{display:flex;gap:14px;flex-wrap:wrap}.number{background:#ece4c8;padding:10px 16px;border-radius:8px}.number b{font-size:24px;color:#486b43}output{display:block;min-height:30px;margin:10px 0;color:#9e6c36}code{background:#e8e2ce;padding:2px 5px;border-radius:3px}small{color:#7f876d}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;border-bottom:1px solid #ddd6bf;padding:7px}.states{display:flex;gap:8px;flex-wrap:wrap}.states span{padding:6px 10px;background:#e8e4d2;border-radius:5px}.states .active{background:#426a4d;color:white}@media(max-width:500px){body{padding:15px}h1{font-size:21px}button{padding:9px 12px}.number{padding:8px 12px}}'''
DRAW='''// 火柴人 = 圆脑袋 + 身体 + 四肢。x、y 是脚下的位置。
function stick(x,y,color='#2e4233',step=0,hat=false){
  ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=5; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(x,y-47,9,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x,y-36); ctx.lineTo(x,y-17);
  ctx.moveTo(x-13,y-24); ctx.lineTo(x,y-33); ctx.lineTo(x+13,y-23);
  ctx.moveTo(x-12-step,y); ctx.lineTo(x,y-17); ctx.lineTo(x+12+step,y); ctx.stroke();
  if(hat){ctx.fillStyle='#c59742';ctx.fillRect(x-13,y-58,26,6);}
}
function field(){ctx.clearRect(0,0,720,240);ctx.fillStyle='#a9c689';ctx.fillRect(0,185,720,55);ctx.fillStyle='#98bba0';ctx.beginPath();ctx.moveTo(0,185);ctx.lineTo(160,45);ctx.lineTo(320,185);ctx.lineTo(510,65);ctx.lineTo(720,185);ctx.fill();}
'''
examples=[]
def page(number,name,title,explain,body,script,change):
    source='<!doctype html>\n<html lang="zh-CN">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+title+'</title>\n<style>'+STYLE+'</style>\n<main>\n<h1>'+title+'</h1>\n<p>'+explain+'</p>\n'+dedent(body)+'\n<script>\n"use strict";\n'+dedent(script)+'\n</script>\n<p><small>小设计师任务：'+change+'</small></p>\n</main>\n</html>\n'
    file=f'{number:02d}-{name}.html';(OUT/file).write_text(source);examples.append((number,file,title,change))
page(1,'rules','01 · 用豆子造一个兵营','先开采，再最多买一名。新矿工从下一回合开始工作。第 6 回合末，争取拥有 2 名守卫和 2 黄金。', '''
<div class="numbers"><span class="number">回合 <b id="round">0</b> / 6</span><span class="number">黄金 <b id="gold">4</b></span><span class="number">矿工 <b id="miners">1</b></span><span class="number">守卫 <b id="guards">0</b></span></div>
<div class="board"><button id="next">开始回合 · 开采</button><button id="miner" disabled>买矿工 · 3 金</button><button id="guard" disabled>买守卫 · 4 金</button><button id="wait" disabled>这次等待</button><button id="reset" class="secondary">重新摆豆子</button><output id="message">先预测：你想先买谁？</output></div>
<table><thead><tr><th>回合</th><th>选择</th><th>黄金</th><th>矿工</th><th>守卫</th></tr></thead><tbody id="log"></tbody></table>''','''
// 四个记事盒；phase 记录当前应该做哪一步。
let gold=4,miners=1,guards=0,round=0,phase='mine';
const $=id=>document.getElementById(id);
function show(){for(const [id,value] of Object.entries({gold,miners,guards,round}))$(id).textContent=value;
  $('next').disabled=phase!=='mine';$('miner').disabled=phase!=='buy'||gold<3;
  $('guard').disabled=phase!=='buy'||gold<4;$('wait').disabled=phase!=='buy';}
$('next').onclick=()=>{if(phase!=='mine')return;round++;gold+=miners;phase='buy';$('message').textContent='开采完毕！现在买一名，或者等待。';show();};
function choose(type){if(phase!=='buy')return;let label='等待';
  if(type==='miner'){if(gold<3)return;gold-=3;miners++;label='买矿工';}
  if(type==='guard'){if(gold<4)return;gold-=4;guards++;label='买守卫';}
  $('log').insertAdjacentHTML('beforeend',`<tr><td>${round}</td><td>${label}</td><td>${gold}</td><td>${miners}</td><td>${guards}</td></tr>`);
  phase=round>=6?'end':'mine';$('message').textContent=phase==='end'?(guards>=2&&gold>=2?'目标达成！说说哪一步帮助了你。':'试验完成。下一局想只改哪一步？'):'已记录。下一回合才会再次开采。';show();
}
$('miner').onclick=()=>choose('miner');$('guard').onclick=()=>choose('guard');$('wait').onclick=()=>choose('wait');
$('reset').onclick=()=>{gold=4;miners=1;guards=0;round=0;phase='mine';$('log').textContent='';$('message').textContent='新一局，先留下你的预测。';show();};show();
''','把起始黄金 gold=4 改成 3。只改这一处，再比较两局。')
page(2,'memory','02 · 黄金住在哪个盒子里？','按一下按钮，数字就变化一次。电脑用变量记住黄金。','''<div class="board"><div class="number">黄金 <b id="gold">4</b></div><button id="mine">开采 · +1</button><button id="reset" class="secondary">重置</button><output id="message">我有 4 黄金。</output></div>''','''
let gold=4; // gold 是盒子的名字，4 是现在放在里面的数字。
function show(){document.getElementById('gold').textContent=gold;}
document.getElementById('mine').onclick=()=>{gold=gold+1;show();document.getElementById('message').textContent='你触发了一次开采事件。';};
document.getElementById('reset').onclick=()=>{gold=4;show();};
''','找到 gold=gold+1，把 1 改成 2。按三次，先猜会有多少黄金。')
page(3,'condition','03 · 钱够不够？','守卫要 4 黄金。试一试黄金为 3、4、5 时，各会发生什么。','''<div class="board"><div class="numbers"><span class="number">黄金 <b id="gold">4</b></span><span class="number">守卫 <b id="guards">0</b></span></div><button id="mine">开采 · +1</button><button id="buy">买守卫 · 4 金</button><button id="three" class="secondary">测试：3 金</button><button id="four" class="secondary">测试：4 金</button><button id="five" class="secondary">测试：5 金</button><output id="message">先猜，再按购买。</output></div>''','''
let gold=4,guards=0;const price=4;
function show(){document.getElementById('gold').textContent=gold;document.getElementById('guards').textContent=guards;}
document.getElementById('buy').onclick=()=>{
  if(gold>=price){gold=gold-price;guards=guards+1;document.getElementById('message').textContent='购买成功！';}
  else{document.getElementById('message').textContent='还买不起，黄金没有被扣掉。';}
  show();
};
document.getElementById('mine').onclick=()=>{gold++;show();};
for(const [id,value] of [['three',3],['four',4],['five',5]])document.getElementById(id).onclick=()=>{gold=value;guards=0;show();document.getElementById('message').textContent='准备测试：'+value+' 黄金。';};
''','把判断里的 >= 改成 >。用 4 黄金测试，发现哪里不公平了吗？')
page(4,'drawing','04 · 一个圆，加上几条线','先画脑袋，再画身体和四肢。皮肤先只改变颜色，不改变力气。','''<label>衣服颜色 <input id="color" type="color" value="#385c45"></label><label><input id="hat" type="checkbox"> 戴上矿工帽</label><canvas id="canvas" width="720" height="240"></canvas>''','''
const ctx=document.getElementById('canvas').getContext('2d');
'''+DRAW+'''
function draw(){field();stick(360,185,document.getElementById('color').value,0,document.getElementById('hat').checked);}
document.getElementById('color').oninput=draw;document.getElementById('hat').onchange=draw;draw();
''','找到 stick(360,185，把 360 改成 100。人物往哪边去了？')
page(5,'walking','05 · 每一小会儿，往前一点','位置变化很多次，就形成动画。速度越大，同样时间走得越远。','''<label>速度 <input id="speed" type="range" min="10" max="150" value="60"><b id="speedValue">60</b></label><button id="pause">暂停</button><button id="reset" class="secondary">回到起点</button><canvas id="canvas" width="720" height="240"></canvas><output id="message">位置：60</output>''','''
const ctx=document.getElementById('canvas').getContext('2d');let x=60,speed=60,running=true,last=0;
'''+DRAW+'''
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
  if(running){x=x+speed*dt;if(x>675)x=45;}
  field();stick(x,185,'#354936',running?Math.sin(now/120)*5:0);document.getElementById('message').textContent='位置：'+Math.round(x);
  requestAnimationFrame(frame);
}
document.getElementById('speed').oninput=e=>{speed=Number(e.target.value);document.getElementById('speedValue').textContent=speed;};
document.getElementById('pause').onclick=e=>{running=!running;e.target.textContent=running?'暂停':'继续';};
document.getElementById('reset').onclick=()=>{x=60;};requestAnimationFrame(frame);
''','把 x=x+speed*dt 中的 + 改成 -，看看方向怎样变化。然后恢复。')
page(6,'miner','06 · 矿工的四张任务卡','去矿山 → 开采 → 回家 → 交金。只有交金时，黄金盒子才增加。','''<div class="states"><span data-state="go">去矿山</span><span data-state="dig">开采</span><span data-state="return">回家</span><span data-state="deliver">交金</span></div><canvas id="canvas" width="720" height="240"></canvas><div class="numbers"><span class="number">仓库黄金 <b id="gold">0</b></span><span class="number">背包黄金 <b id="cargo">0</b></span></div><button id="pause">暂停观察</button><button id="reset" class="secondary">重置</button><output id="message">规则：每次带回 3 黄金。</output>''','''
const ctx=document.getElementById('canvas').getContext('2d');let x=100,state='go',cargo=0,gold=0,timer=0,last=0,running=true;
'''+DRAW+'''
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
  if(running){
    if(state==='go'){x+=90*dt;if(x>=580){x=580;state='dig';timer=0;}}
    else if(state==='dig'){timer+=dt;if(timer>=2){cargo=3;state='return';}}
    else if(state==='return'){x-=90*dt;if(x<=100){x=100;state='deliver';timer=0;gold+=cargo;cargo=0;}}
    else if(state==='deliver'){timer+=dt;if(timer>=1)state='go';}
  }
  field();ctx.fillStyle='#7c8e6b';ctx.fillRect(60,120,80,65);ctx.fillStyle='#c8a041';ctx.beginPath();ctx.moveTo(545,185);ctx.lineTo(580,140);ctx.lineTo(615,185);ctx.fill();stick(x,185,'#344834',state==='go'||state==='return'?Math.sin(now/100)*4:0,true);
  document.getElementById('gold').textContent=gold;document.getElementById('cargo').textContent=cargo;
  document.querySelectorAll('[data-state]').forEach(el=>el.classList.toggle('active',el.dataset.state===state));requestAnimationFrame(frame);
}
document.getElementById('pause').onclick=e=>{running=!running;e.target.textContent=running?'暂停观察':'继续';};
document.getElementById('reset').onclick=()=>{x=100;state='go';cargo=gold=timer=0;};requestAnimationFrame(frame);
''','找到 cargo=3，改成 5。先观察背包，再观察仓库，判断哪里应该加钱。')
page(7,'queue','07 · 兵营里的小火车','最多排队 3 名。先来的先训练，取消会退还全部黄金。','''<div class="numbers"><span class="number">黄金 <b id="gold">12</b></span><span class="number">完成 <b id="army">0</b></span></div><button id="guard">守卫 · 4 金 · 2 秒</button><button id="archer">弓手 · 5 金 · 3 秒</button><button id="cancel" class="secondary">取消最后一名</button><button id="reset" class="secondary">重置</button><div class="board" id="queue">队列空了</div><output id="message">试一试：先排守卫，再排弓手。</output>''','''
let gold=12,army=0,queue=[],last=0;
function add(name,cost,time){if(queue.length>=3){say('队列满了。');return;}if(gold<cost){say('黄金不够。');return;}gold-=cost;queue.push({name,cost,time});say(name+'进入队列。');}
function say(text){document.getElementById('message').textContent=text;}
document.getElementById('guard').onclick=()=>add('守卫',4,2);document.getElementById('archer').onclick=()=>add('弓手',5,3);
document.getElementById('cancel').onclick=()=>{const unit=queue.pop();if(unit){gold+=unit.cost;say('已退款 '+unit.cost+' 黄金。');}};
document.getElementById('reset').onclick=()=>{gold=12;army=0;queue=[];};
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
  if(queue.length){queue[0].time-=dt;if(queue[0].time<=0){const done=queue.shift();army++;say(done.name+'训练完成！');}}
  document.getElementById('gold').textContent=gold;document.getElementById('army').textContent=army;
  document.getElementById('queue').textContent=queue.map((u,i)=>`${i+1}. ${u.name}（${u.time.toFixed(1)} 秒）`).join(' → ')||'队列空了';requestAnimationFrame(frame);
}requestAnimationFrame(frame);
''','把 queue.length>=3 改成 >=2。连续招募时，哪个规则先阻止了购买？')
page(8,'combat','08 · 挥剑也要讲规则','只有距离够近、冷却完成，攻击才会生效。拖动对手位置，再连续点击攻击。','''<label>对手位置 <input id="distance" type="range" min="330" max="650" value="500"></label><canvas id="canvas" width="720" height="240"></canvas><button id="attack">挥剑</button><button id="reset" class="secondary">恢复生命</button><output id="message">先靠近，再挥剑。</output><div class="numbers"><span class="number">对手生命 <b id="hp">10</b></span><span class="number">冷却 <b id="cooldown">0.0</b> 秒</span></div>''','''
const ctx=document.getElementById('canvas').getContext('2d');let enemyX=500,hp=10,cooldown=0,last=0;const range=100,damage=2;
'''+DRAW+'''
document.getElementById('distance').oninput=e=>enemyX=Number(e.target.value);
document.getElementById('attack').onclick=()=>{let text;
  if(hp<=0)text='对手已经退出，重置后再试。';
  else if(Math.abs(enemyX-300)>range)text='距离太远，没有命中。';
  else if(cooldown>0)text='还在冷却，这次没有造成伤害。';
  else{hp=Math.max(0,hp-damage);cooldown=1;text='命中！生命减少 '+damage+'。';}
  document.getElementById('message').textContent=text;
};
document.getElementById('reset').onclick=()=>{hp=10;cooldown=0;};
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;cooldown=Math.max(0,cooldown-dt);field();
  ctx.strokeStyle='#a99656';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.strokeRect(300-range,110,range*2,85);ctx.setLineDash([]);stick(300,185);if(hp>0)stick(enemyX,185,'#a45f49');
  document.getElementById('hp').textContent=hp;document.getElementById('cooldown').textContent=cooldown.toFixed(1);requestAnimationFrame(frame);
}requestAnimationFrame(frame);
''','把 range=100 改成 150。更长的武器应该更贵，还是挥得更慢？')
# The final three game lessons share the same readable foundation; only the level selector is introduced in lesson 10.
MINIGAME='''
// 设计区：改一个数字，保存，再试。颜色只影响外观。
const RULES={minerCost:3,guardCost:4,incomeTime:3,trainTime:2,speed:48,damage:2,cooldown:1};
const LEVELS=[
  {name:'草地：学会积攒',enemyHP:20,enemyEvery:12,enemyDamage:1,color:'#d9ebd0'},
  {name:'沙地：保护矿工',enemyHP:26,enemyEvery:10,enemyDamage:1,color:'#edddb0'},
  {name:'雪地：先守再攻',enemyHP:32,enemyEvery:9,enemyDamage:2,color:'#dce9ec'}
];
const $=id=>document.getElementById(id),ctx=$('canvas').getContext('2d');
let gold,miners,units,queue,baseHP,enemyHP,time,incomeClock,enemyClock,status,last=0;
let order='defend',levelIndex=0,nextId=1;
function reset(){gold=8;miners=1;units=[];queue=[];baseHP=30;enemyHP=LEVELS[levelIndex].enemyHP;time=incomeClock=enemyClock=0;status='ready';order='defend';nextId=1;$('message').textContent='先招募矿工与守卫，再开始。';show();}
function recruit(type){
  if(status==='won'||status==='lost'||status==='paused')return;
  const cost=type==='miner'?RULES.minerCost:RULES.guardCost;
  if(gold<cost){$('message').textContent='黄金不够，等矿工带回来。';return;}
  if(queue.length>=3){$('message').textContent='先来的要先训练，队列满了。';return;}
  if(units.filter(u=>!u.team).length+miners+queue.length>=12){$('message').textContent='最多 12 名伙伴。';return;}
  gold-=cost;queue.push({type,remaining:RULES.trainTime});show();
}
function spawn(team){units.push({id:nextId++,team,x:team?650:80,hp:team?7:10,cd:0});}
function finish(result){status=result;$('message').textContent=result==='won'?'胜利！请讲讲哪条规则帮助了你。':'这次没有守住。下一次想只改哪一步？';}
function update(dt){
  if(status!=='playing')return;
  time+=dt;incomeClock+=dt;enemyClock+=dt;
  if(incomeClock>=RULES.incomeTime){incomeClock-=RULES.incomeTime;gold+=miners;}
  if(queue.length){queue[0].remaining-=dt;if(queue[0].remaining<=0){const done=queue.shift();if(done.type==='miner')miners++;else spawn(0);}}
  if(enemyClock>=LEVELS[levelIndex].enemyEvery){enemyClock=0;spawn(1);}
  for(const u of units){
    if(u.hp<=0)continue;u.cd-=dt;
    const enemies=units.filter(v=>v.hp>0&&v.team!==u.team).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x));
    const target=enemies[0],distance=target?Math.abs(target.x-u.x):Infinity;
    const destination=u.team?70:order==='attack'?650:240;
    if(target&&distance<=35){if(u.cd<=0){target.hp=Math.max(0,target.hp-(u.team?LEVELS[levelIndex].enemyDamage:RULES.damage));u.cd=RULES.cooldown;}}
    else if((u.team&&u.x<=82)||(!u.team&&order==='attack'&&u.x>=638)){
      if(u.cd<=0){if(u.team)baseHP=Math.max(0,baseHP-1);else enemyHP=Math.max(0,enemyHP-RULES.damage);u.cd=RULES.cooldown;}
    }else{const goal=target&&(u.team||order==='attack'||target.x<320)?target.x:destination;u.x+=Math.sign(goal-u.x)*Math.min(Math.abs(goal-u.x),RULES.speed*dt);}
  }
  units=units.filter(u=>u.hp>0);
  if(baseHP<=0)finish('lost');else if(enemyHP<=0)finish('won');
}
'''+DRAW+'''
function show(){
  $('gold').textContent=gold;$('miners').textContent=miners;$('base').textContent=baseHP;$('enemy').textContent=enemyHP;
  $('queue').textContent=queue.map(u=>(u.type==='miner'?'矿工':'守卫')+' '+u.remaining.toFixed(1)+'秒').join(' → ')||'兵营空闲';
  $('state').textContent=({ready:'准备',playing:'进行中',paused:'暂停',won:'胜利',lost:'结束'})[status]+' · '+Math.floor(time)+' 秒 · '+(order==='attack'?'进攻':'防守');
  $('pause').textContent=status==='paused'?'继续':'暂停';
}
function draw(now){field();ctx.fillStyle='#6f8872';ctx.fillRect(25,115,55,70);ctx.fillStyle='#a6765d';ctx.fillRect(640,115,55,70);
  for(let i=0;i<Math.min(miners,6);i++)stick(100+i*17,205,'#696c37',Math.sin(now/180)*2,true);
  for(const u of units){stick(u.x,185,u.team?'#995a48':'#345e44',status==='playing'?Math.sin(now/130)*3:0);ctx.fillStyle='#304737';ctx.fillRect(u.x-13,117,26*u.hp/(u.team?7:10),4);}
}
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt);draw(now);show();requestAnimationFrame(frame);}
$('miner').onclick=()=>recruit('miner');$('guard').onclick=()=>recruit('guard');
$('start').onclick=()=>{if(status==='ready'){status='playing';$('message').textContent='军团出发！可以继续招募。';}};
$('attack').onclick=()=>{order='attack';};$('defend').onclick=()=>{order='defend';};
$('pause').onclick=()=>{if(status==='playing')status='paused';else if(status==='paused')status='playing';};
$('reset').onclick=reset;
if($('level'))$('level').onchange=e=>{levelIndex=Number(e.target.value);$('canvas').style.background=LEVELS[levelIndex].color;reset();};
reset();requestAnimationFrame(frame);
'''
BODY='''<div class="numbers"><span class="number">黄金 <b id="gold"></b></span><span class="number">矿工 <b id="miners"></b></span><span class="number">我方基地 <b id="base"></b></span><span class="number">对方基地 <b id="enemy"></b></span></div>
<canvas id="canvas" width="720" height="240"></canvas>
<button id="miner">招募矿工 · 3 金</button><button id="guard">招募守卫 · 4 金</button><button id="start">开始</button><button id="defend" class="secondary">防守</button><button id="attack">进攻</button><button id="pause" class="secondary">暂停</button><button id="reset" class="secondary">重新开始</button>
<div class="board"><b id="state"></b><div id="queue"></div><output id="message"></output></div>'''
page(9,'finish','09 · 让故事有开始和结束','把变量、训练、战斗连接起来。建议先招 1 名矿工和 1 名守卫，再开始。守住第一波后带着 3 名守卫进攻。',BODY,MINIGAME,'暂停时等 5 秒，黄金应该变化吗？获胜后再等 5 秒，时间应该变化吗？')
page(10,'levels','10 · 三张地图，三个问题','同一套游戏规则，读取三组关卡数据。切换关卡会开始新一局。','<label>关卡 <select id="level"><option value="0">草地 · 学会积攒</option><option value="1">沙地 · 保护矿工</option><option value="2">雪地 · 先守再攻</option></select></label>'+BODY,MINIGAME,'找到 LEVELS 数组，只把雪地的 enemyEvery:9 改成 12。感觉有什么变化？')
page(11,'detective','11 · 当一次游戏侦探','兵营藏着一个边界错误：刚好够钱时买不了。先运行测试，再尝试修好。','''<div class="board"><label><input id="fix" type="checkbox"> 将 gold > price 改成 gold >= price</label><br><button id="test">运行三个边界测试</button><output id="message">先猜：3、4、5 黄金，哪种情况能购买？</output><table><thead><tr><th>输入</th><th>期望</th><th>实际</th><th>结论</th></tr></thead><tbody id="results"></tbody></table></div>''','''
function canBuy(gold,price){
  // 勾选修复，观察多出来的等号做了什么。
  if(document.getElementById('fix').checked)return gold>=price;
  return gold>price;
}
document.getElementById('test').onclick=()=>{
  const cases=[{gold:3,expected:false},{gold:4,expected:true},{gold:5,expected:true}];let passed=0;
  document.getElementById('results').textContent='';
  for(const t of cases){const actual=canBuy(t.gold,4),ok=actual===t.expected;if(ok)passed++;
    document.getElementById('results').insertAdjacentHTML('beforeend',`<tr><td>${t.gold} 金</td><td>${t.expected?'能买':'不能买'}</td><td>${actual?'能买':'不能买'}</td><td>${ok?'通过':'发现不同'}</td></tr>`);}
  document.getElementById('message').textContent=`${passed} / 3 个测试通过。`;
};
''','试着口头解释：价格前一个数、价格本身、价格后一个数，为什么都要测试？')
page(12,'our-kingdom','12 · 我们的火柴人王国 v1','给这个作品起一个新名字，选择一条规则修改，邀请一位家人试玩。规则仍在源码的设计区。','<label>关卡 <select id="level"><option value="0">草地 · 学会积攒</option><option value="1">沙地 · 保护矿工</option><option value="2">雪地 · 先守再攻</option></select></label>'+BODY,MINIGAME,'修改页面 h1 中的王国名字，在设计师日记里写下：我改了什么、为什么、怎样验证。')
import json
advanced=json.loads((OUT/'advanced-manifest.json').read_text())
for item in advanced:
 assert (OUT/item['file']).is_file(), f"Missing advanced lesson: {item['file']}"
(OUT/'manifest.json').write_text(json.dumps([{'lesson':n,'file':f,'title':t,'task':c} for n,f,t,c in examples]+advanced,ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(examples)} introductory examples; retained {len(advanced)} advanced experiments')
