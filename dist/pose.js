// A single pose drives skin, body and weapon anchors. All time comes from the simulation.
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
export const unitScale = u => (u.type === 'giant' ? 1.65 : (u.summoned || u.type === 'minion') ? .84 : 1) * (u.boss ? 1.22 : 1);
export function unitPose(u, time = 0, reduced = false) {
  const state = u.actionState || {};
  const kind = state.kind || u.action || 'idle';
  const duration = state.duration || 1;
  const progress = clamp(state.progress ?? u.actionProgress ?? (state.elapsed || 0) / duration, 0, 1);
  const windup = clamp((state.windup || duration * .42) / duration, .15, .8);
  const active = ['attack', 'mine', 'leap', 'throw', 'blast', 'earthquake'].includes(kind);
  // The forward extension peaks at the simulation's release/hit boundary.
  let extension = active ? (progress < windup ? progress / windup : 1 - (progress - windup) / (1 - windup)) : 0;
  if (kind === 'mine') extension = Math.sin(progress * Math.PI * 2.5) ** 2;
  const phase = Number.isFinite(u.phase) ? u.phase : time * 9 + u.id;
  const walking = kind === 'walk';
  const stride = walking ? Math.sin(phase) * 11 : 0;
  const bob = walking ? Math.abs(Math.cos(phase)) * 2 : reduced ? 0 : Math.sin(phase) * .35;
  // Landing and damage both occur at the end of windup; recovery stays grounded.
  const jump = kind === 'leap' && progress < windup ? Math.sin(progress / windup * Math.PI) * 28 : 0;
  const lean = walking ? .045 : kind === 'stunned' ? -.12 : kind === 'leap' ? .15 * extension : active ? extension * .1 : 0;
  const mining = kind === 'mine' ? Math.sin(progress * Math.PI * 2 - .8) : 0;
  const block = kind === 'block';
  const aimX = state.aimX ?? u.aimX;
  const aimLane = state.aimLane ?? u.aimLane;
  const angle = Number.isFinite(aimX) && Number.isFinite(aimLane)
    ? clamp(Math.atan2(aimLane - u.lane, Math.max(15, Math.abs(aimX - u.x))), -.55, .55) : 0;
  return {kind, progress, windup, extension, stride, bob, jump, lean, mining, block, angle,
    scale: unitScale(u), head: [0, -58], shoulder: [0, -44], hip: [0, -28],
    leftFoot: [-10 + stride * .9, 0], rightFoot: [10 - stride * .9, 0],
    leftHand: block ? [19, -42] : [-12 - stride * .35, -25],
    rightHand: [24 + extension * 15, -42 + extension * 10]};
}
