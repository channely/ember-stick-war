// Every device writes the same held-input state. Pointer ownership lets the
// joystick and an action remain pressed independently on a touch screen.
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const actionKeys = { Space: 'attack', KeyQ: 'secondary', KeyE: 'special' };
export function createControls({canvas, minimap, viewport, renderer, getBattle, isModalOpen, onAction, onSelect, onChange, onUnlock}) {
  const keys = new Set(), pointers = new Map();
  const stick = document.getElementById('move-stick');
  const knob = document.getElementById('stick-knob');
  let stickPointer = null, stickX = 0, stickY = 0, drag = null;
  let aimX = null, aimLane = null, selectedId = null;
  const battle = () => getBattle();
  const selected = () => battle().units.find(u => u.id === battle().selected && u.hp > 0);
  function send(data) {
    if (battle().dispatch) battle().dispatch({type:'manual', ...data});
    else Object.assign(battle().manual, data, {left:data.x < 0, right:data.x > 0});
  }
  function sync() {
    let x = stickX + Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    let y = stickY + Number(keys.has('KeyS')) - Number(keys.has('KeyW'));
    const length = Math.hypot(x, y); if (length > 1) {x /= length; y /= length;}
    const held = name => [...pointers.values()].some(p => p.action === name) || Object.entries(actionKeys).some(([key, value]) => value === name && keys.has(key));
    send({x, y, attack:held('attack'), secondary:held('secondary'), special:held('special'), aimX, aimLane});
    for (const button of document.querySelectorAll('[data-manual]')) {
      button.classList.toggle('held', held(button.dataset.manual));
      button.setAttribute('aria-pressed', String(held(button.dataset.manual)));
    }
  }
  function reset() {
    keys.clear(); pointers.clear(); stickPointer = null; stickX = stickY = 0; drag = null;
    if (knob) knob.style.transform = 'translate(-50%,-50%)';
    // Reset is intentionally not an ordinary attack release: dismissing a menu
    // or losing focus must never accidentally fire a charged arrow.
    if (battle().dispatch) battle().dispatch({type:'reset-input'});
    else battle().manual = {x:0,y:0,attack:false,secondary:false,special:false,aimX,aimLane};
    document.querySelectorAll('[data-manual]').forEach(el => {el.classList.remove('held'); el.setAttribute('aria-pressed','false');});
  }
  function defaultAim(unit) {
    if(unit.type!=='archer'){aimX=aimLane=null;return;}
    const targets = battle().units.filter(u => u.team !== unit.team && u.hp > 0);
    targets.sort((a,b) => Math.hypot(a.x-unit.x,a.lane-unit.lane)-Math.hypot(b.x-unit.x,b.lane-unit.lane));
    const target = targets[0]; aimX = target?.x ?? unit.x + unit.facing * 350; aimLane = target?.lane ?? unit.lane;
  }
  function choose(unit) {
    reset(); selectedId = unit?.id ?? null;
    if (unit) {defaultAim(unit); renderer.setCamera(unit.x-renderer.visibleWidth*.45,true);} else aimX = aimLane = null;
    onSelect(unit); canvas.focus({preventScroll:true}); sync(); onChange();
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {x:event.clientX-rect.left,y:event.clientY-rect.top};
  }
  function targetAt(x,y) {
    if (renderer.hitTest) return renderer.hitTest(battle(),x,y);
    return battle().units.filter(u=>!u.team&&u.hp>0).map(u=>({u,p:renderer.unitScreen(u)})).sort((a,b)=>Math.hypot(a.p.x-x,a.p.y-35*renderer.scale-y)-Math.hypot(b.p.x-x,b.p.y-35*renderer.scale-y)).find(v=>Math.hypot(v.p.x-x,v.p.y-35*renderer.scale-y)<48)?.u;
  }
  function aimAt(event) {
    const unit=selected(); if (!unit) return;
    const p=point(event), world=renderer.screenToWorld?.(p.x,p.y) || {x:renderer.toWorld(p.x),lane:(p.y-renderer.ground)/renderer.scale};
    const enemy=battle().units.filter(u=>u.team!==unit.team&&u.hp>0).map(u=>({u,p:renderer.unitScreen(u)})).find(v=>Math.hypot(v.p.x-p.x,v.p.y-24*renderer.scale-p.y)<30*renderer.scale);
    aimX=clamp(enemy?.u.x??world.x,0,2700); aimLane=clamp(enemy?.u.lane??world.lane+24,-45,80); sync();
  }
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape') {event.preventDefault(); reset(); onAction('escape'); return;}
    if (isModalOpen() || ['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName) || event.ctrlKey || event.metaKey || event.altKey) return;
    const code=event.code;
    if (code==='Space' && event.target.closest('button,a')) return;
    const gameKeys=['KeyW','KeyA','KeyS','KeyD','Space','KeyQ','KeyE','ArrowLeft','ArrowRight'];
    if (gameKeys.includes(code)) {event.preventDefault(); keys.add(code); sync();}
    if (event.repeat) return;
    if (/^Digit[1-6]$/.test(code)) onAction('train',Number(code.slice(-1))-1);
    else if (['KeyZ','KeyX','KeyC'].includes(code)) onAction('command',{KeyZ:'garrison',KeyX:'defend',KeyC:'attack'}[code]);
    else if (code==='KeyP') {reset(); onAction('pause');}
    else if (code==='Space'&&!selected()&&battle().status==='ready') onAction('start');
    else if (code==='KeyR') {
      const allies=battle().units.filter(u=>u.team===0&&u.hp>0&&!u.hidden&&!u.summoned);
      const index=allies.findIndex(u=>u.id===battle().selected); choose(allies[(index+1)%allies.length]);
    }
  });
  document.addEventListener('keyup', event => {if(keys.delete(event.code)) sync();});
  canvas.addEventListener('pointerdown', event => {
    if(isModalOpen() || drag || event.button>0) return;
    onUnlock(); canvas.focus({preventScroll:true});
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,camera:renderer.targetCamera,moved:false};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if (isModalOpen()) return;
    if (selected()?.type==='archer' && event.pointerType==='mouse') aimAt(event);
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.hypot(dx,dy)>7)drag.moved=true;
    if(drag.moved)renderer.setCamera(drag.camera-dx/renderer.scale,true);
  });
  canvas.addEventListener('pointerup',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const moved=drag.moved;drag=null;
    if(!moved){const p=point(event);choose(targetAt(p.x,p.y));}
  });
  for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(drag?.id===event.pointerId)drag=null;});
  canvas.addEventListener('wheel',event=>{if(isModalOpen())return;event.preventDefault();renderer.setCamera(renderer.targetCamera+(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY));},{passive:false});
  minimap.addEventListener('pointerdown',event=>{if(isModalOpen())return;const r=minimap.getBoundingClientRect();renderer.setCamera((event.clientX-r.left)/r.width*2700-renderer.visibleWidth/2);});
  minimap.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();event.stopPropagation();renderer.setCamera(renderer.targetCamera+(event.code==='ArrowRight'?200:-200));}});
  function moveStick(event) {
    const rect=stick.getBoundingClientRect(),radius=rect.width*.32;
    let x=(event.clientX-rect.left-rect.width/2)/radius,y=(event.clientY-rect.top-rect.height/2)/radius;
    const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
    stickX=Math.abs(x)<.12?0:x;stickY=Math.abs(y)<.12?0:y;
    knob.style.transform=`translate(calc(-50% + ${stickX*radius}px),calc(-50% + ${stickY*radius}px))`;sync();
  }
  stick.addEventListener('pointerdown',event=>{if(isModalOpen()||!selected()||stickPointer!==null)return;event.preventDefault();stickPointer=event.pointerId;stick.setPointerCapture(event.pointerId);moveStick(event);});
  stick.addEventListener('pointermove',event=>{if(stickPointer===event.pointerId)moveStick(event);});
  function endStick(event){if(stickPointer!==event.pointerId)return;stickPointer=null;stickX=stickY=0;knob.style.transform='translate(-50%,-50%)';sync();}
  for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,endStick);
  for(const button of document.querySelectorAll('[data-manual]')) {
    button.addEventListener('pointerdown',event=>{
      if(isModalOpen()||!selected()||button.disabled)return;event.preventDefault();onUnlock();
      button.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{action:button.dataset.manual,x:event.clientX,y:event.clientY,aimX,aimLane});sync();
    });
    button.addEventListener('pointermove',event=>{
      const pointer=pointers.get(event.pointerId);
      if(pointer?.action==='attack'&&selected()?.type==='archer'&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>8){
        const unit=selected(),dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
        // A relative aiming pad: small drags adjust the existing crosshair and
        // never jump to the depth boundary just because the button is low down.
        aimX=clamp((pointer.aimX??unit.x+unit.facing*300)+dx/renderer.scale,0,2700);
        aimLane=clamp((pointer.aimLane??unit.lane)+dy/renderer.scale*.45,-45,80);sync();
      }
    });
    button.addEventListener('pointerup',event=>{if(pointers.delete(event.pointerId))sync();});
    for(const name of ['pointercancel','lostpointercapture'])button.addEventListener(name,event=>{
      if(!pointers.has(event.pointerId))return;
      // Cancel the charge, rather than treating an interrupted gesture as fire.
      pointers.delete(event.pointerId);battle().dispatch?.({type:'reset-input'});sync();
    });
    button.addEventListener('keydown',event=>{
      if(!['Space','Enter'].includes(event.code)||event.repeat||isModalOpen()||!selected())return;
      event.preventDefault();event.stopPropagation();pointers.set('key:'+button.id,{action:button.dataset.manual});sync();
    });
    button.addEventListener('keyup',event=>{
      if(!['Space','Enter'].includes(event.code))return;event.preventDefault();event.stopPropagation();
      if(pointers.delete('key:'+button.id))sync();
    });
    button.addEventListener('blur',()=>{if(pointers.delete('key:'+button.id)){battle().dispatch?.({type:'reset-input'});sync();}});
    button.addEventListener('click',event=>event.preventDefault());
  }
  window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  window.addEventListener('orientationchange',reset);
  function tick(dt) {
    if(selectedId!==battle().selected){selectedId=battle().selected;reset();const unit=selected();if(unit)defaultAim(unit);}
    if(isModalOpen())return;
    if(keys.has('ArrowLeft'))renderer.setCamera(renderer.targetCamera-dt*650);
    if(keys.has('ArrowRight'))renderer.setCamera(renderer.targetCamera+dt*650);
    const unit=selected();if(unit&&(Math.abs(battle().manual.x||0)+Math.abs(battle().manual.y||0)>0))renderer.setCamera(unit.x-renderer.visibleWidth*.45);
  }
  return {reset,tick,choose,aimAt};
}
