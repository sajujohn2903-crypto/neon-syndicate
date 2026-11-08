// Neon Syndicate — projector screen (game host).
'use strict';

const VW = 320, VH = 180, S = 2;          // canvas resolution; world art pixels are drawn at 2x
const WORLD_W = 160, GROUND = 78;
const ROUND_TIME = 60, ROUNDS_TO_WIN = 2;
const FONT = '"Press Start 2P", monospace';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
cv.width = VW; cv.height = VH;
ctx.imageSmoothingEnabled = false;

let SPRITES = null;
let BG = null;

// ---------- seeded random ----------
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- background (160x90 art pixels) ----------
function buildBackground() {
  const c = document.createElement('canvas'); c.width = WORLD_W; c.height = 90;
  const g = c.getContext('2d'); const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const rand = rng(3), ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  [[0, 22, '#0b0720'], [22, 14, '#120b2e'], [36, 12, '#1a1040'], [48, 10, '#24145a'], [58, 16, '#2a1868']].forEach(([y, h, col]) => R(0, y, 160, h, col));
  let x = 0;
  while (x < 160) {
    const w = ri(6, 14), h = ri(18, 40); R(x, 74 - h, w, h, '#1d1446');
    for (let wy = 74 - h + 2; wy < 72; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 2)
      if (rand() < 0.22) R(wx, wy, 1, 1, ['#2ee6ff', '#ff2e88', '#6b5bd6'][ri(0, 2)]);
    x += w + ri(0, 2);
  }
  R(4, 20, 22, 54, '#140d33'); R(132, 14, 26, 60, '#140d33');
  R(136, 22, 6, 30, '#2ee6ff'); R(137, 23, 4, 28, '#0a2a3a');
  for (let yy = 25; yy < 50; yy += 4) R(138, yy, 2, 2, '#7ff3ff');
  R(60, 8, 40, 18, '#0f2d4a'); R(61, 9, 38, 16, '#123a5c');
  for (let yy = 10; yy < 25; yy += 2) R(61, yy, 38, 1, '#164a73');
  R(74, 12, 12, 10, '#2ee6ff'); R(76, 14, 8, 6, '#123a5c'); R(78, 16, 4, 2, '#ff2e88');
  R(0, 74, 160, 16, '#2a1f4f'); R(0, 74, 160, 1, '#ff2e88'); R(0, 75, 160, 1, '#5a3a8a');
  for (let xx = 0; xx < 160; xx += 16) R(xx, 76, 1, 14, '#221844');
  [80, 85].forEach(yy => R(0, yy, 160, 1, '#221844'));
  R(20, 82, 14, 1, '#ff2e88'); R(110, 86, 18, 1, '#2ee6ff');
  return c;
}
// flickering neon sign drawn each frame
const SIGN_PIX = [[10,29],[11,29],[12,29],[10,30],[10,31],[11,31],[12,31],[12,32],[10,33],[11,33],[12,33],[15,29],[15,30],[15,31],[15,32],[15,33],[16,31],[17,31],[18,29],[18,30],[18,31],[18,32],[18,33]];
let rain = [];
function initRain() { const r = rng(9); rain = Array.from({ length: 110 }, () => ({ x: r() * 160, y: r() * 90, v: 1.6 + r() * 1.2 })); }

// ---------- audio (tiny synth) ----------
let actx = null;
function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (actx && actx.state === 'suspended') actx.resume(); return actx; }
function blip(freq, dur, type = 'square', vol = 0.12, slide = 0) {
  const a = actx; if (!a || a.state !== 'running') return;
  const o = a.createOscillator(), gn = a.createGain(); o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
  gn.gain.setValueAtTime(vol, a.currentTime); gn.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(gn); gn.connect(a.destination); o.start(); o.stop(a.currentTime + dur);
}
function noise(dur, vol = 0.2) {
  const a = actx; if (!a || a.state !== 'running') return;
  const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(), gn = a.createGain(); s.buffer = b; gn.gain.value = vol; s.connect(gn); gn.connect(a.destination); s.start();
}
const SFX = {
  whoosh: () => noise(0.08, 0.06),
  hit: () => { noise(0.12, 0.25); blip(160, 0.12, 'square', 0.1, -80); },
  heavy: () => { noise(0.2, 0.35); blip(90, 0.25, 'sawtooth', 0.14, -50); },
  block: () => blip(900, 0.05, 'square', 0.06),
  ko: () => { blip(220, 0.9, 'sawtooth', 0.15, -180); noise(0.5, 0.25); },
  tick: () => blip(660, 0.06, 'square', 0.06),
  fight: () => { blip(440, 0.12); setTimeout(() => blip(880, 0.25), 120); },
  special: () => blip(300, 0.35, 'sawtooth', 0.12, 900),
};

// ---------- moves ----------
// frames at 60fps: startup, active, recovery. reach in art px from body centre.
// high: ducked under by a crouching opponent. low: misses anyone in the air.
const MOVES = {
  punch:   { s: 4,  a: 4, r: 9,  dmg: 6,  reach: [6, 21], stun: 16, kb: 1.2, meter: 8, high: true },
  kick:    { s: 7,  a: 5, r: 14, dmg: 9,  reach: [8, 25], stun: 18, kb: 2.0, meter: 10 },
  upper:   { s: 6,  a: 5, r: 18, dmg: 11, reach: [4, 16], stun: 30, kb: 1.0, meter: 12, launch: -3.0, hitsAir: true },
  sweep:   { s: 7,  a: 5, r: 16, dmg: 8,  reach: [6, 25], stun: 32, kb: 0.8, meter: 10, launch: -1.6, low: true },
  airpunch:{ s: 3,  a: 6, r: 6,  dmg: 5,  reach: [4, 21], stun: 14, kb: 1.2, meter: 6, hitsAir: true },
  airkick: { s: 5,  a: 7, r: 8,  dmg: 8,  reach: [6, 25], stun: 16, kb: 1.8, meter: 8, hitsAir: true },
  special: { s: 10, a: 14, r: 18, dmg: 20, reach: [0, 14], stun: 34, kb: 3.0, meter: 0, launch: -2.2, hitsAir: true },
};
// What each move can be cancelled into once it has landed (this is what makes combos flow).
const CANCELS = {
  punch: ['punch', 'kick', 'upper', 'sweep', 'special'],
  kick: ['upper', 'sweep', 'special'],
  sweep: ['upper', 'special'],
  upper: ['special'],
  airpunch: ['airkick', 'special'],
  airkick: ['special'],
  special: [],
};
const BUFFER = 14; // frames a button press is remembered while you're busy

// ---------- players / inputs ----------
function freshInput() { return { mx: 0, block: false, duck: false, q: [] }; }
const slots = {
  1: { conn: null, fighter: 'kira', ready: false, cpu: false, input: freshInput() },
  2: { conn: null, fighter: 'brick', ready: false, cpu: false, input: freshInput() },
};
function pushAct(s, a) { slots[s].input.q.push({ a, age: 0 }); }

function makeFighter(slot, key, x, facing, palKey) {
  const f = FIGHTERS[key];
  return { slot, key, def: f, palKey, x, y: 0, vy: 0, facing, hp: 100, sp: 0, state: 'idle', move: null, t: 0, hasHit: false,
    stun: 0, kb: 0, flash: 0, walkT: 0, combo: 0, comboShow: 0, blockT: 0 };
}

let P = [];               // [p1, p2]
let projectiles = [], sparks = [];
let phase = 'lobby', phaseT = 0, round = 1, wins = { 1: 0, 2: 0 }, timer = ROUND_TIME, timerAcc = 0;
let hitstop = 0, shake = 0, banner = '', bannerSub = '', roundWinner = 0, flawless = false;

function startMatch() { wins = { 1: 0, 2: 0 }; round = 1; startRound(); }
function startRound() {
  const k1 = slots[1].fighter, k2 = slots[2].fighter;
  P = [makeFighter(1, k1, 52, 1, 'pal'), makeFighter(2, k2, 108, -1, k1 === k2 ? 'alt' : 'pal')];
  projectiles = []; sparks = []; timer = ROUND_TIME; timerAcc = 0;
  for (const s of [1, 2]) slots[s].input.q = [];
  setPhase('intro');
}
function setPhase(p) { phase = p; phaseT = 0; broadcastState(); }

// ---------- fighter update ----------
function onGround(f) { return f.y >= 0; }
function startupOf(f) { const m = MOVES[f.move]; return m.s + (f.move === 'special' ? 0 : f.def.startup); }

// Turn a button press into the move it means right now (ducking + punch = uppercut, etc.)
function resolveAct(f, inp, a) {
  if (a === 'special') return 'special';
  if (a === 'jump') return onGround(f) ? 'jump' : null;
  if (!onGround(f)) return a === 'punch' ? 'airpunch' : a === 'kick' ? 'airkick' : a === 'upper' ? 'airpunch' : null;
  if (inp.duck) return a === 'punch' ? 'upper' : a === 'kick' ? 'sweep' : a;
  return a;
}

// Take the oldest press that can be used now. Special with an empty meter is dropped with a message.
function takeAct(f, inp, allowed) {
  for (let i = 0; i < inp.q.length; i++) {
    const mv = resolveAct(f, inp, inp.q[i].a);
    if (!mv) { inp.q.splice(i--, 1); continue; }
    if (mv === 'special' && f.sp < 100) { inp.q.splice(i--, 1); send(f.slot, { t: 'nometer' }); continue; }
    if (allowed && !allowed.includes(mv)) continue;
    inp.q.splice(i, 1); return mv;
  }
  return null;
}

function startMove(f, name) {
  if (name === 'special') { f.sp = 0; SFX.special(); send(f.slot, { t: 'special' }); }
  else SFX.whoosh();
  f.state = 'attack'; f.move = name; f.t = 0; f.hasHit = false;
}

function doJump(f, inp) { f.vy = -3.3; f.y = -0.1; f.state = 'jump'; f.jumpDir = Math.sign(inp.mx) || 0; blip(300, 0.08, 'square', 0.05, 200); }

function updateFighter(f, o, inp) {
  if (f.flash > 0) f.flash--;
  if (f.comboShow > 0) f.comboShow--;
  for (const e of inp.q) e.age++;
  inp.q = inp.q.filter(e => e.age <= BUFFER);
  // gravity
  if (!onGround(f) || f.vy < 0) { f.vy += 0.2; f.y += f.vy; if (f.y >= 0) { f.y = 0; f.vy = 0; if (f.state === 'jump') f.state = 'idle'; } }
  // air control (tilt while jumping steers you)
  if (!onGround(f) && f.state !== 'hit' && f.state !== 'ko') f.x += 0.8 * f.def.speed * (inp.mx || 0);

  if (f.state === 'ko') { f.x += f.kb; f.kb *= 0.9; return; }

  if (f.state === 'hit' || f.state === 'blockstun') {
    f.x += f.kb; f.kb *= 0.85;
    if (--f.stun <= 0 && onGround(f)) { f.state = 'idle'; o.combo = 0; }
    return;
  }

  if (f.state === 'attack') {
    const m = MOVES[f.move]; const su = startupOf(f);
    f.t++;
    if (f.move === 'special' && f.key === 'kira' && f.t > su && f.t <= su + m.a) f.x += f.facing * 3.2;
    if (f.move === 'special' && f.key === 'brick' && f.t === su) {
      projectiles.push({ x: f.x + f.facing * 10, dir: f.facing, owner: f, life: 70 }); shake = 6; SFX.heavy();
    }
    const brickSpecial = f.move === 'special' && f.key === 'brick';
    if (!brickSpecial && !f.hasHit && f.t > su && f.t <= su + m.a) tryHit(f, o, m);
    // combo cancel: once a move lands, the next press flows straight into the next move
    if (f.hasHit && f.t > su && phase === 'fight') {
      const next = takeAct(f, inp, CANCELS[f.move]);
      if (next) { startMove(f, next); return; }
    }
    if (f.t >= su + m.a + m.r) { f.state = onGround(f) ? 'idle' : 'jump'; f.move = null; }
    else return;
  }

  // free to act
  if (o.state !== 'ko' && phase === 'fight') f.facing = o.x >= f.x ? 1 : -1;
  if (phase !== 'fight') { inp.q.length = 0; f.state = onGround(f) ? 'idle' : 'jump'; return; }

  if (inp.block && onGround(f)) {
    f.state = inp.duck ? 'crouchblock' : 'block';
    // special still fires from block (so you can't get stuck holding it)
    const sp = takeAct(f, inp, ['special']); if (sp) startMove(f, sp);
    return;
  }

  const act = takeAct(f, inp, null);
  if (act === 'jump') { doJump(f, inp); return; }
  if (act) { startMove(f, act); return; }

  if (onGround(f) && inp.duck) { f.state = 'crouch'; return; }
  if (onGround(f)) {
    f.x += 0.9 * f.def.speed * (inp.mx || 0);
    if (Math.abs(inp.mx) > 0.15) { f.state = 'walk'; f.walkT++; } else f.state = 'idle';
  }
}

function isDucking(f) { return f.state === 'crouch' || f.state === 'crouchblock'; }

function hurtCheck(att, def, m) {
  const d = (def.x - att.x) * att.facing;
  if (d < m.reach[0] - 6 || d > m.reach[1] + 6) return false;
  const dy = def.y - att.y;
  if (dy < -22 && !m.hitsAir) return false;  // target far above
  if (dy < -30) return false;
  if (m.high && onGround(att) && isDucking(def)) return false;   // ducked under it
  if (m.low && def.y < -6) return false;                          // jumped over it
  return true;
}

function tryHit(att, def, m) {
  if (def.state === 'ko' || !hurtCheck(att, def, m)) return;
  att.hasHit = true;
  applyHit(att, def, m, att.x + att.facing * Math.min(m.reach[1] - 4, Math.abs(def.x - att.x) - 4), GROUND - 22 + Math.min(0, def.y));
}

function applyHit(att, def, m, hx, hy) {
  const from = Math.sign(hx - def.x) || -def.facing;
  const blocking = (def.state === 'block' || def.state === 'crouchblock' || def.state === 'blockstun') && def.facing === from;
  const dir = Math.sign(def.x - att.x) || att.facing;
  if (blocking) {
    const chip = Math.max(1, Math.round(m.dmg * 0.15));
    def.hp = Math.max(0, def.hp - chip); def.state = 'blockstun'; def.stun = 10; def.kb = dir * 1.2;
    def.sp = Math.min(100, def.sp + 4); SFX.block(); spark(hx, hy, '#2ee6ff', 6);
    send(def.slot, { t: 'buzz', k: 'block' });
  } else {
    const dmg = Math.round(m.dmg * att.def.power * def.def.armor);
    def.hp = Math.max(0, def.hp - dmg);
    def.state = 'hit'; def.stun = m.stun; def.kb = dir * m.kb; def.flash = 8;
    if (m.launch) { def.vy = m.launch; def.y = Math.min(def.y, -0.1); }
    else if (!onGround(def)) def.vy = Math.min(def.vy, -1.2);
    att.sp = Math.min(100, att.sp + m.meter); def.sp = Math.min(100, def.sp + 6);
    att.combo++; att.comboShow = 70;
    hitstop = dmg >= 15 ? 9 : 5; shake = dmg >= 15 ? 7 : 3;
    (dmg >= 10 ? SFX.heavy : SFX.hit)();
    spark(hx, hy, '#ffe14d', dmg >= 10 ? 14 : 9);
    send(def.slot, { t: 'buzz', k: 'hit' });
    if (def.hp <= 0) knockOut(att, def);
  }
  broadcastState();
}

function knockOut(att, def) {
  def.state = 'ko'; def.kb = (Math.sign(def.x - att.x) || att.facing) * 2.5; def.vy = -2.4; def.y = -0.1;
  roundWinner = att.slot; flawless = att.hp >= 100; wins[att.slot]++;
  hitstop = 22; shake = 10; SFX.ko(); setPhase('ko');
}

function spark(x, y, col, n) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 0.6 + Math.random() * 1.8; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 12 + Math.random() * 10, col: Math.random() < 0.35 ? '#ffffff' : col }); }
}

function updateProjectiles() {
  for (const p of projectiles) {
    p.x += p.dir * 2.3; p.life--;
    const o = P[0] === p.owner ? P[1] : P[0];
    if (!p.dead && o.state !== 'ko' && Math.abs(o.x - p.x) < 7 && o.y > -7) {
      p.dead = true; applyHit(p.owner, o, MOVES.special, p.x, GROUND - 6);
    }
    if (p.x < -10 || p.x > 170 || p.life <= 0) p.dead = true;
  }
  projectiles = projectiles.filter(p => !p.dead);
}

function separate() {
  const [a, b] = P; const minD = 13;
  const d = b.x - a.x;
  if (Math.abs(d) < minD && Math.abs(a.y - b.y) < 26) {
    const push = (minD - Math.abs(d)) / 2 * (Math.sign(d) || 1);
    a.x -= push; b.x += push;
  }
  for (const f of P) f.x = Math.max(10, Math.min(WORLD_W - 10, f.x));
}

// ---------- CPU ----------
const cpuMem = { 1: { blockT: 0, cd: 0, duckT: 0 }, 2: { blockT: 0, cd: 0, duckT: 0 } };
function cpuThink(slotN, me, foe) {
  const inp = slots[slotN].input, mem = cpuMem[slotN];
  inp.mx = 0; inp.block = false; inp.duck = false;
  if (phase !== 'fight' || me.state === 'ko') return;
  const d = Math.abs(foe.x - me.x), dir = Math.sign(foe.x - me.x);
  if (mem.duckT > 0) { mem.duckT--; inp.duck = true; }
  if (mem.blockT > 0) { mem.blockT--; inp.block = true; return; }
  if (foe.state === 'attack' && d < 32 && Math.random() < 0.06) {
    if (foe.move === 'punch' && Math.random() < 0.5) { mem.duckT = 16; inp.duck = true; } else { mem.blockT = 18; inp.block = true; return; }
  }
  if (mem.cd > 0) mem.cd--;
  if (d > 22 && !inp.duck) inp.mx = dir * (Math.random() < 0.85 ? 1 : 0);
  else if (d < 12 && Math.random() < 0.03) inp.mx = -dir;
  if (mem.cd <= 0 && me.state !== 'attack') {
    const r = Math.random();
    const press = a => inp.q.push({ a, age: 0 });
    if (me.sp >= 100 && d < 45 && r < 0.05) { press('special'); mem.cd = 40; }
    else if (d < 22 && r < 0.05) { press('punch'); if (Math.random() < 0.4) press('kick'); mem.cd = 14 + Math.random() * 20; }
    else if (d < 27 && r < 0.08) { press('kick'); mem.cd = 20 + Math.random() * 25; }
    else if (d < 25 && r < 0.1) { mem.duckT = 10; inp.duck = true; press(Math.random() < 0.5 ? 'punch' : 'kick'); mem.cd = 30; }
    else if (r < 0.006) { press('jump'); mem.cd = 30; }
  }
}

// ---------- keyboard (testing + projector remote) ----------
const keys = new Set();
const KEYMAP = {
  1: { left: 'KeyA', right: 'KeyD', jump: 'KeyW', duck: 'KeyS', block: 'KeyQ', punch: 'KeyF', kick: 'KeyG', special: 'KeyE' },
  2: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', duck: 'ArrowDown', block: 'KeyJ', punch: 'KeyK', kick: 'KeyL', special: 'KeyO' },
};
let keyboardUsed = { 1: false, 2: false };
addEventListener('keydown', e => {
  audio();
  if (e.repeat) return;
  keys.add(e.code);
  for (const s of [1, 2]) {
    const km = KEYMAP[s];
    for (const a of ['jump', 'punch', 'kick', 'special']) if (e.code === km[a]) { keyboardUsed[s] = true; pushAct(s, a); }
    if ([km.left, km.right, km.block, km.duck].includes(e.code)) keyboardUsed[s] = true;
  }
  if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') confirmPressed();
  if (e.code === 'KeyC' && phase === 'lobby') { slots[2].cpu = true; slots[2].ready = true; slots[1].ready = true; tryStart(); }
  if (e.code === 'KeyF' && e.shiftKey) toggleFullscreen();
});
addEventListener('keyup', e => keys.delete(e.code));
function keyboardInputs() {
  for (const s of [1, 2]) {
    if (!keyboardUsed[s] || slots[s].conn || slots[s].cpu) continue;
    const km = KEYMAP[s], inp = slots[s].input;
    inp.mx = (keys.has(km.right) ? 1 : 0) - (keys.has(km.left) ? 1 : 0);
    inp.block = keys.has(km.block);
    inp.duck = keys.has(km.duck);
  }
}
function confirmPressed() {
  if (phase === 'lobby') { if (slotFilled(1) && !slotFilled(2)) { slots[2].cpu = true; } if (!slotFilled(1)) { keyboardUsed[1] = true; } if (!slotFilled(2)) { keyboardUsed[2] = true; } slots[1].ready = slots[2].ready = true; tryStart(); }
  else if (phase === 'over') { backToLobbyOrRematch(); }
}
function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => { }); else document.exitFullscreen?.(); }
cv.addEventListener('click', () => { audio(); toggleFullscreen(); });

function slotFilled(s) { return !!slots[s].conn || slots[s].cpu || keyboardUsed[s]; }
function tryStart() {
  if (phase !== 'lobby' && phase !== 'over') return;
  if (slotFilled(1) && slotFilled(2) && slots[1].ready && slots[2].ready) startMatch();
  else broadcastState();
}
function backToLobbyOrRematch() {
  for (const s of [1, 2]) slots[s].ready = slots[s].cpu || (!slots[s].conn);
  setPhase('lobby'); tryStart();
}

// ---------- networking (PeerJS / WebRTC) ----------
const ROOM = (() => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)]; return s; })();
let peer = null, netStatus = 'connecting';
const controllerURL = new URL('controller.html?room=' + ROOM, location.href).href;
let qr = null;
try { qr = qrcode(0, 'M'); qr.addData(controllerURL); qr.make(); } catch (e) { qr = null; }

function initNet() {
  if (typeof Peer === 'undefined') { netStatus = 'offline'; return; }
  peer = new Peer('nsx-' + ROOM, { debug: 0 });
  peer.on('open', () => { netStatus = 'online'; });
  peer.on('error', err => { netStatus = 'error: ' + (err.type || err.message); console.warn(err); });
  peer.on('disconnected', () => { netStatus = 'reconnecting'; setTimeout(() => peer && peer.reconnect(), 1500); });
  peer.on('connection', conn => {
    conn.on('open', () => {
      // previous slot by device id, else first free
      const id = conn.metadata && conn.metadata.device;
      let s = id ? [1, 2].find(n => slots[n].deviceId === id) : 0;
      if (s && slots[s].conn && slots[s].conn !== conn) { const old = slots[s].conn; old.slot = 0; try { old.close(); } catch (e) { } slots[s].conn = null; }
      if (!s) s = [1, 2].find(n => !slots[n].conn && !(slots[n].cpu && phase !== 'lobby'));
      if (!s) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 500); return; }
      const sl = slots[s]; const rejoin = sl.deviceId === id && !!id; sl.conn = conn; sl.deviceId = id; sl.cpu = false; if (!rejoin) sl.ready = false; keyboardUsed[s] = false;
      conn.slot = s;
      conn.send({ t: 'you', slot: s, fighter: sl.fighter });
      blip(520, 0.1); setTimeout(() => blip(780, 0.12), 90);
      broadcastState();
    });
    conn.on('data', msg => onMsg(conn, msg));
    conn.on('close', () => { const s = conn.slot; if (s && slots[s].conn === conn) { slots[s].conn = null; slots[s].ready = false; slots[s].input = freshInput(); broadcastState(); } });
  });
}

function onMsg(conn, m) {
  const s = conn.slot; if (!s || !m) return; const sl = slots[s];
  switch (m.t) {
    case 'in': sl.input.mx = Math.max(-1, Math.min(1, +m.mx || 0)); sl.input.block = !!m.block; sl.input.duck = !!m.duck; break;
    case 'act': if (['jump', 'punch', 'kick', 'special'].includes(m.a)) pushAct(s, m.a); break;
    case 'pick': if (FIGHTERS[m.f] && (phase === 'lobby' || phase === 'over')) { sl.fighter = m.f; broadcastState(); } break;
    case 'ready':
      if (phase === 'over') { backToLobbyOrRematch(); }
      sl.ready = true;
      if (m.solo) { const other = s === 1 ? 2 : 1; if (!slots[other].conn) { slots[other].cpu = true; slots[other].ready = true; } }
      tryStart(); break;
  }
}

function send(s, msg) { const c = slots[s] && slots[s].conn; if (c && c.open) { try { c.send(msg); } catch (e) { } } }
function broadcastState() {
  for (const s of [1, 2]) {
    const f = P.find(p => p.slot === s);
    const other = s === 1 ? 2 : 1;
    send(s, { t: 'st', phase, slot: s, fighter: slots[s].fighter, ready: slots[s].ready,
      hp: f ? f.hp : 100, sp: f ? f.sp : 0, wins: wins[s], oppWins: wins[other],
      opp: slotFilled(other) ? (slots[other].cpu ? 'CPU' : FIGHTERS[slots[other].fighter].name) : null,
      winner: phase === 'over' || phase === 'ko' ? roundWinner : 0 });
  }
}
setInterval(() => { if (phase === 'fight') broadcastState(); }, 250);

// ---------- main loop ----------
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
  draw();
  requestAnimationFrame(frame);
}

function step() {
  phaseT++;
  for (const d of rain) { d.y += d.v; d.x -= 0.3; if (d.y > 90) { d.y = -3; d.x = Math.random() * 170; } }
  for (const sp of sparks) { sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.05; sp.life--; }
  sparks = sparks.filter(s => s.life > 0);
  if (shake > 0) shake *= 0.85;
  if (phase === 'lobby') return;
  keyboardInputs();
  if (P.length) { for (const s of [1, 2]) if (slots[s].cpu) cpuThink(s, P[s - 1], P[2 - s]); }

  if (hitstop > 0) { hitstop--; return; }

  if (phase === 'intro') {
    if (phaseT === 1) blip(330, 0.15);
    if (phaseT === 100) SFX.fight();
    if (phaseT > 130) setPhase('fight');
  }
  if (phase === 'fight') {
    timerAcc++; if (timerAcc >= 60) { timerAcc = 0; timer--; if (timer <= 10 && timer > 0) SFX.tick(); }
    if (timer <= 0) { timer = 0; const [a, b] = P; roundWinner = a.hp === b.hp ? 0 : (a.hp > b.hp ? 1 : 2); if (roundWinner) wins[roundWinner]++; flawless = false; setPhase('timeup'); }
  }
  if (P.length) {
    const [a, b] = P;
    updateFighter(a, b, slots[1].input); updateFighter(b, a, slots[2].input);
    updateProjectiles(); separate();
  }
  if ((phase === 'ko' && phaseT > 170) || (phase === 'timeup' && phaseT > 150)) {
    if (wins[1] >= ROUNDS_TO_WIN || wins[2] >= ROUNDS_TO_WIN) {
      roundWinner = wins[1] > wins[2] ? 1 : 2; slots[1].ready = slots[2].ready = false; setPhase('over');
      for (const s of [1, 2]) if (slots[s].cpu) slots[s].ready = true;
    } else { round++; startRound(); }
  }
}

// ---------- drawing ----------
function txt(s, x, y, col, size = 8, align = 'left', shadow = '#000') {
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'top';
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(s, x + Math.max(1, size / 8), y + Math.max(1, size / 8)); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}

function drawWorld() {
  ctx.save();
  const sx = shake > 0.5 ? Math.round((Math.random() - 0.5) * shake) : 0, sy = shake > 0.5 ? Math.round((Math.random() - 0.5) * shake) : 0;
  ctx.translate(sx * S, sy * S);
  ctx.scale(S, S);
  ctx.drawImage(BG, 0, 0);
  // neon sign with flicker
  const on = !(phaseT % 240 > 200 && phaseT % 7 < 3);
  ctx.fillStyle = on ? '#ff2e88' : '#5a1435'; ctx.fillRect(7, 26, 16, 10);
  ctx.fillStyle = '#3a0f2e'; ctx.fillRect(8, 27, 14, 8);
  ctx.fillStyle = on ? '#ff7ab8' : '#5a1435'; for (const [x, y] of SIGN_PIX) ctx.fillRect(x, y, 1, 1);
  // rain
  ctx.fillStyle = '#3b3f8f'; for (const d of rain) ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 2);
  // shadows + fighters
  for (const f of P) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; const w = Math.max(8, 20 + f.y / 2); ctx.fillRect(Math.round(f.x - w / 2), GROUND - 1, Math.round(w), 2); }
  const order = P.slice().sort((a, b) => (a.state === 'attack') - (b.state === 'attack'));
  for (const f of order) drawFighter(f);
  // projectiles (ground shockwave)
  for (const p of projectiles) {
    const t = phaseT % 4 < 2;
    ctx.fillStyle = '#ff2e88'; ctx.fillRect(Math.round(p.x) - 4, GROUND - 6, 8, 6);
    ctx.fillStyle = t ? '#ffffff' : '#ffb3d6'; ctx.fillRect(Math.round(p.x) - 2, GROUND - 9, 4, 3);
    ctx.fillStyle = '#ffe14d'; ctx.fillRect(Math.round(p.x) - 6, GROUND - 2, 12, 2);
  }
  for (const s of sparks) { ctx.fillStyle = s.col; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
  ctx.restore();
}

function poseFor(f) {
  switch (f.state) {
    case 'walk': return (Math.floor(f.walkT / 8) % 2) ? 'walk' : 'idle';
    case 'jump': return 'jump';
    case 'block': case 'blockstun': return 'block';
    case 'crouch': return 'crouch';
    case 'crouchblock': return 'crouchblock';
    case 'hit': return 'hit';
    case 'ko': return 'ko';
    case 'attack': {
      const m = MOVES[f.move]; const su = m.s + (f.move === 'special' ? 0 : f.def.startup);
      if (f.t <= Math.max(1, su - 2)) return f.move === 'sweep' ? 'crouch' : 'idle';
      if (f.move === 'special') return f.key === 'brick' ? (f.t < su ? 'upper' : 'block') : 'special';
      return f.move;
    }
    default: return 'idle';
  }
}

function drawFighter(f) {
  const pose = poseFor(f);
  const set = SPRITES[f.key][f.palKey];
  const img = set[pose][f.facing][f.flash > 0 && f.flash % 2 ? 1 : 0];
  let dx, dy;
  if (pose === 'ko') {
    dx = Math.round(f.x - img.width / 2); dy = Math.round(GROUND + f.y - 33);
  } else {
    const ax = f.facing === 1 ? ANCHOR_X : img.width - 1 - ANCHOR_X;
    const bob = ((f.state === 'idle' || f.state === 'crouch') && Math.floor(phaseT / 20) % 2) ? 1 : 0;
    const lean = f.state === 'hit' ? -f.facing * 2 : 0;
    dx = Math.round(f.x - ax + lean); dy = Math.round(GROUND + f.y - FEET_Y + bob);
  }
  if (f.move === 'special' && f.state === 'attack' && f.key === 'kira') {
    ctx.globalAlpha = 0.35; ctx.drawImage(set[pose][f.facing][1], dx - f.facing * 6, dy); ctx.drawImage(set[pose][f.facing][1], dx - f.facing * 12, dy); ctx.globalAlpha = 1;
  }
  ctx.drawImage(img, dx, dy);
  if (f.sp >= 100 && f.state !== 'ko' && phaseT % 20 < 10) { ctx.fillStyle = '#2ee6ff'; ctx.fillRect(Math.round(f.x) - 1, dy - 3, 3, 1); }
}

function bar(x, y, w, h, pct, right, col) {
  ctx.fillStyle = '#000'; ctx.fillRect(x + 2, y + 2, w, h);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#3a0d12'; ctx.fillRect(x, y, w, h);
  const fw = Math.round(w * pct / 100);
  ctx.fillStyle = col; ctx.fillRect(right ? x + w - fw : x, y, fw, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(right ? x + w - fw : x, y, fw, 2);
}

function drawHUD() {
  if (!P.length) return;
  const [a, b] = P;
  bar(16, 12, 116, 9, a.hp, false, a.hp > 30 ? '#f5d90a' : '#ff4d4d');
  bar(VW - 16 - 116, 12, 116, 9, b.hp, true, b.hp > 30 ? '#f5d90a' : '#ff4d4d');
  txt(a.def.name + (slots[1].cpu ? ' (CPU)' : ''), 16, 25, '#ffffff', 8);
  txt(b.def.name + (slots[2].cpu ? ' (CPU)' : ''), VW - 16, 25, '#ffffff', 8, 'right');
  // round wins
  for (let i = 0; i < ROUNDS_TO_WIN; i++) {
    ctx.fillStyle = i < wins[1] ? '#ff2e88' : '#2a2a33'; ctx.fillRect(16 + i * 9, 36, 6, 6);
    ctx.fillStyle = i < wins[2] ? '#ff2e88' : '#2a2a33'; ctx.fillRect(VW - 22 - i * 9, 36, 6, 6);
  }
  // timer
  ctx.fillStyle = '#000'; ctx.fillRect(VW / 2 - 15, 9, 32, 22); ctx.fillStyle = '#ffffff'; ctx.fillRect(VW / 2 - 17, 7, 34, 22); ctx.fillStyle = '#0b0720'; ctx.fillRect(VW / 2 - 15, 9, 30, 18);
  txt(String(timer).padStart(2, '0'), VW / 2, 12, timer <= 10 ? '#ff4d4d' : '#ffffff', 16, 'center', null);
  txt(round >= 3 ? 'FINAL ROUND' : 'ROUND ' + round, VW / 2, 33, '#ff2e88', 8, 'center');
  // meters
  meter(16, VH - 16, a.sp, false); meter(VW - 16, VH - 16, b.sp, true);
  txt(a.sp >= 100 ? 'SPECIAL READY' : 'SPECIAL', 16, VH - 27, '#2ee6ff', 8);
  txt(b.sp >= 100 ? 'SPECIAL READY' : 'SPECIAL', VW - 16, VH - 27, '#2ee6ff', 8, 'right');
  // combos
  for (const f of P) if (f.comboShow > 0 && f.combo >= 2) {
    const left = f.slot === 1; txt(f.combo + ' HIT', left ? 16 : VW - 16, 56, '#ff2e88', 16, left ? 'left' : 'right');
    txt('COMBO!', left ? 16 : VW - 16, 75, '#ffffff', 8, left ? 'left' : 'right');
  }
}
function meter(x, y, pct, right) {
  for (let i = 0; i < 5; i++) {
    const on = (i + 1) * 20 <= pct;
    const px = right ? x - (i + 1) * 15 + 2 : x + i * 15;
    ctx.fillStyle = '#000'; ctx.fillRect(px, y, 13, 6);
    ctx.fillStyle = on ? '#2ee6ff' : '#2a2a33'; ctx.fillRect(px + 1, y + 1, 11, 4);
  }
}

function centerBanner(big, small, col = '#ffffff') {
  txt(big, VW / 2, 70, col, 24, 'center');
  if (small) txt(small, VW / 2, 102, '#ffffff', 8, 'center');
}

function drawLobby() {
  ctx.fillStyle = 'rgba(11,7,32,0.82)'; ctx.fillRect(0, 0, VW, VH);
  txt('NEON', 20, 18, '#2ee6ff', 16); txt('SYNDICATE', 20, 38, '#ff2e88', 16);
  txt('ROOFTOP BRAWL · BEST OF 3', 20, 60, '#ffffff', 8);
  // QR
  if (qr) {
    const n = qr.getModuleCount(), sz = Math.floor(96 / n) || 1, tot = n * sz, qx = VW - tot - 24, qy = 22;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(qx - 4, qy - 4, tot + 8, tot + 8);
    ctx.fillStyle = '#0b0720';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(qx + c * sz, qy + r * sz, sz, sz);
    txt('SCAN TO JOIN', qx + tot / 2, qy + tot + 10, '#ffffff', 8, 'center');
    txt('ROOM ' + ROOM, qx + tot / 2, qy + tot + 22, '#2ee6ff', 8, 'center');
  }
  const row = (s, y) => {
    const sl = slots[s];
    const who = sl.conn ? 'PHONE' : sl.cpu ? 'CPU' : keyboardUsed[s] ? 'KEYBOARD' : 'WAITING...';
    ctx.fillStyle = sl.conn || sl.cpu || keyboardUsed[s] ? '#1a1040' : '#120b2e'; ctx.fillRect(20, y, 150, 24);
    ctx.fillStyle = s === 1 ? '#2ee6ff' : '#ff2e88'; ctx.fillRect(20, y, 3, 24);
    txt('P' + s + '  ' + FIGHTERS[sl.fighter].name, 30, y + 4, '#ffffff', 8);
    txt(who + (sl.ready && (sl.conn) ? ' · READY' : ''), 30, y + 14, sl.ready && sl.conn ? '#ffe14d' : '#9a93c9', 8);
  };
  row(1, 80); row(2, 110);
  txt('One phone? Tap SOLO to fight the CPU.', 20, 144, '#9a93c9', 8);
  txt(netStatus === 'online' ? 'Projector remote: OK = start' : 'Network: ' + netStatus, 20, 158, netStatus === 'online' ? '#9a93c9' : '#ff4d4d', 8);
}

function draw() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
  drawWorld();
  if (phase === 'lobby') { drawLobby(); return; }
  drawHUD();
  if (phase === 'intro') {
    if (phaseT < 100) centerBanner(round >= 3 ? 'FINAL ROUND' : 'ROUND ' + round, P.map(p => p.def.name).join('  VS  '));
    else centerBanner('FIGHT!', null, '#ff2e88');
  }
  if (phase === 'ko') centerBanner('K.O.!', phaseT > 60 ? P[roundWinner - 1].def.name + ' WINS THE ROUND' + (flawless ? ' · FLAWLESS' : '') : null, '#ff4d4d');
  if (phase === 'timeup') centerBanner('TIME!', roundWinner ? P[roundWinner - 1].def.name + ' TAKES IT' : 'DRAW', '#ffe14d');
  if (phase === 'over') {
    ctx.fillStyle = 'rgba(11,7,32,0.6)'; ctx.fillRect(0, 50, VW, 80);
    centerBanner(P[roundWinner - 1].def.name + ' WINS', 'Press READY on your phone for a rematch', '#2ee6ff');
  }
}

// ---------- boot ----------
(async function boot() {
  try { await document.fonts.load('8px "Press Start 2P"'); } catch (e) { }
  SPRITES = buildSprites(); BG = buildBackground(); initRain();
  initNet();
  requestAnimationFrame(frame);
})();

function fit() {
  const sc = Math.max(1, Math.min(innerWidth / VW, innerHeight / VH));
  const k = sc >= 2 ? Math.floor(sc) : sc;
  cv.style.width = VW * k + 'px'; cv.style.height = VH * k + 'px';
}
addEventListener('resize', fit); fit();
