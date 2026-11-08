// Neon Syndicate — phone controller.
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const store = {
  get(k, d) { try { const v = localStorage.getItem('nsx.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('nsx.' + k, JSON.stringify(v)); } catch (e) { } },
};
const device = store.get('device', null) || (() => { const id = Math.random().toString(36).slice(2, 10); store.set('device', id); return id; })();

const settings = { mode: store.get('mode', 'motion'), sens: store.get('sens', 'med'), flip: store.get('flip', false), flipv: store.get('flipv', false) };
const THRESH = { low: 19, med: 14, high: 10 };

let peer = null, conn = null, room = '', mySlot = 0, state = { phase: 'lobby' }, myFighter = 'kira';
let motionOK = false;

// ---------- screens ----------
function show(id) { $$('.screen').forEach(s => s.hidden = s.id !== id); }

// ---------- join ----------
const params = new URLSearchParams(location.search);
$('#room').value = (params.get('room') || store.get('room', '') || '').toUpperCase();

$('#btn-join').addEventListener('click', async () => {
  $('#join-err').textContent = '';
  room = $('#room').value.trim().toUpperCase();
  if (!/^[A-Z]{4}$/.test(room)) { $('#join-err').textContent = 'Enter the 4-letter room code from the projector.'; return; }
  store.set('room', room);
  // Motion permission (iOS needs this inside the tap).
  try {
    const reqs = [];
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) reqs.push(DeviceMotionEvent.requestPermission());
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) reqs.push(DeviceOrientationEvent.requestPermission());
    const res = await Promise.all(reqs);
    motionOK = res.every(r => r === 'granted');
  } catch (e) { motionOK = false; }
  if (!window.isSecureContext) motionOK = false;
  if (!motionOK && typeof DeviceMotionEvent !== 'undefined' && !DeviceMotionEvent.requestPermission) motionOK = true; // Android: no prompt needed
  if (!motionOK) { settings.mode = 'buttons'; store.set('mode', 'buttons'); }
  startSensors();
  keepAwake();
  connect();
  $('#btn-join').disabled = true; $('#btn-join').textContent = 'CONNECTING...';
});

// ---------- networking ----------
function connect() {
  if (typeof Peer === 'undefined') { $('#join-err').textContent = 'Could not load the network library. Check your internet.'; return; }
  if (!peer || peer.destroyed) {
    peer = new Peer({ debug: 0 });
    peer.on('open', openConn);
    peer.on('error', err => {
      const msg = err.type === 'peer-unavailable' ? 'Room ' + room + ' not found. Check the code on the projector.' : 'Network error: ' + (err.type || err.message);
      $('#join-err').textContent = msg; setNet(false);
      $('#btn-join').disabled = false; $('#btn-join').textContent = 'ENTER THE FIGHT';
    });
    peer.on('disconnected', () => { setTimeout(() => peer && !peer.destroyed && peer.reconnect(), 1000); });
  } else openConn();
}
function openConn() {
  conn = peer.connect('nsx-' + room, { reliable: true, metadata: { device } });
  conn.on('open', () => { setNet(true); send({ t: 'pick', f: myFighter }); });
  conn.on('data', onMsg);
  conn.on('close', () => { setNet(false); setTimeout(() => { if (peer && !peer.destroyed) openConn(); }, 1500); });
}
function send(m) { if (conn && conn.open) { try { conn.send(m); } catch (e) { } } }
function setNet(ok) { const p = $('#net'); p.textContent = ok ? 'Connected' : 'Reconnecting...'; p.classList.toggle('bad', !ok); }

function onMsg(m) {
  if (!m) return;
  if (m.t === 'full') { $('#join-err').textContent = 'This game already has 2 players.'; show('s-join'); return; }
  if (m.t === 'you') { mySlot = m.slot; myFighter = m.fighter; $('#who').textContent = 'P' + m.slot; markCard(); show('s-lobby'); applyMode(); }
  if (m.t === 'buzz') { hitFeedback(m.k); }
  if (m.t === 'nometer') { flashText('METER NOT FULL', 700); }
  if (m.t === 'special') { flashText('SPECIAL!', 700); }
  if (m.t === 'st') { state = m; render(); }
}

// ---------- lobby ----------
function markCard() { $$('.card').forEach(c => c.classList.toggle('on', c.dataset.f === myFighter)); }
$$('.card').forEach(c => c.addEventListener('click', () => { myFighter = c.dataset.f; markCard(); send({ t: 'pick', f: myFighter }); }));
$('#btn-ready').addEventListener('click', () => { recenter(); send({ t: 'ready' }); });
$('#btn-solo').addEventListener('click', () => { recenter(); send({ t: 'ready', solo: true }); });
$('#btn-rematch').addEventListener('click', () => send({ t: 'ready' }));

$$('[data-mode]').forEach(b => b.addEventListener('click', () => { settings.mode = b.dataset.mode; store.set('mode', settings.mode); applyMode(); }));
$$('[data-sens]').forEach(b => b.addEventListener('click', () => { settings.sens = b.dataset.sens; store.set('sens', settings.sens); applyMode(); }));
$('#flip').checked = settings.flip;
$('#flip').addEventListener('change', e => { settings.flip = e.target.checked; store.set('flip', settings.flip); });
$('#flipv').checked = settings.flipv;
$('#flipv').addEventListener('change', e => { settings.flipv = e.target.checked; store.set('flipv', settings.flipv); });
function applyMode() {
  $$('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === settings.mode));
  $$('[data-sens]').forEach(b => b.classList.toggle('on', b.dataset.sens === settings.sens));
  $('#pad-buttons').hidden = settings.mode !== 'buttons';
  $('#cheat').hidden = settings.mode === 'buttons';
}

let lastPhase = '';
function render() {
  const ph = state.phase;
  setTimeout(() => { lastPhase = ph; }, 0);
  if (ph === 'lobby') {
    show('s-lobby');
    $('#lobby-msg').textContent = state.ready ? (state.opp ? 'Ready! Waiting for ' + state.opp + '...' : 'Ready! Waiting for player 2...') : (state.opp ? 'Opponent: ' + state.opp : 'Waiting for player 2 to scan in...');
    $('#btn-ready').textContent = state.ready ? 'READY ✓' : 'READY';
  } else if (ph === 'over') {
    show('s-over');
    const won = state.winner === mySlot;
    $('#over-title').textContent = won ? 'YOU WIN' : 'YOU LOSE';
    $('#over-title').style.color = won ? 'var(--cyan)' : 'var(--pink)';
    $('#over-sub').textContent = state.wins + ' - ' + state.oppWins + (state.ready ? ' · waiting for rematch...' : '');
  } else {
    show('s-fight');
    $('#me-name').textContent = (state.fighter === 'brick' ? 'BRICK' : 'KIRA-9');
    $('#score').textContent = state.wins + ' - ' + state.oppWins;
    const hp = $('#hp'); hp.style.width = state.hp + '%'; hp.classList.toggle('low', state.hp <= 30);
    const segs = $$('#sp i'); segs.forEach((s, i) => s.classList.toggle('on', (i + 1) * 20 <= state.sp));
    $('#sp').classList.toggle('full', state.sp >= 100);
    $('#btn-special').classList.toggle('ready', state.sp >= 100);
    $('#sp-note').textContent = state.sp >= 100 ? 'READY!' : Math.floor(state.sp) + '%';
    if (ph === 'intro') { flashText('GET READY'); if (lastPhase !== 'intro') recenter(); }
    if (ph === 'ko') flashText(state.winner === mySlot ? 'K.O.! NICE' : 'K.O.');
    if (ph === 'timeup') flashText('TIME!');
  }
}

let flashTimer = 0;
function flashText(t, ms = 900) { const el = $('#flashmsg'); el.textContent = t; clearTimeout(flashTimer); flashTimer = setTimeout(() => { el.textContent = ''; }, ms); }
function hitFeedback(kind) {
  const f = $('#hitflash'); f.classList.toggle('blk', kind === 'block'); f.classList.add('on');
  setTimeout(() => f.classList.remove('on'), 60);
  if (navigator.vibrate) navigator.vibrate(kind === 'block' ? 20 : 60);
}

// ---------- input: tilt + gestures ----------
// Tilt comes from the gravity direction (works at any holding angle); the jab comes from sudden forward motion.
let roll = 0, pitch = 0, pitch0 = 0, haveGrav = false;
let mx = 0, block = false, duck = false, holdLeft = false, holdRight = false, holdDuck = false;
let upArmed = true, cooldownUntil = 0, freezeUntil = 0;
const grav = { x: 0, y: -9.8, z: 0 }, lp = { x: 0, y: 0, z: 0 };
const UP_ON = 20, UP_RESET = 10, DUCK_ON = 16, DUCK_OFF = 10;

function startSensors() { addEventListener('devicemotion', onMotion); }
function recenter() { pitch0 = pitch; upArmed = true; }
$('#btn-recenter').addEventListener('click', () => { recenter(); flashText('CENTRED', 600); });

function onMotion(e) {
  const g = e.accelerationIncludingGravity;
  const now = performance.now();
  let a = e.acceleration;
  if (g && g.x != null) {
    if (!a || a.x == null) { // no separate linear acceleration: estimate it
      lp.x = lp.x * 0.85 + g.x * 0.15; lp.y = lp.y * 0.85 + g.y * 0.15; lp.z = lp.z * 0.85 + g.z * 0.15;
      a = { x: g.x - lp.x, y: g.y - lp.y, z: g.z - lp.z };
    }
    // gravity = total minus the hand's own motion, smoothed
    if (now > freezeUntil) {
      const k = haveGrav ? 0.25 : 1;
      grav.x += ((g.x - a.x) - grav.x) * k; grav.y += ((g.y - a.y) - grav.y) * k; grav.z += ((g.z - a.z) - grav.z) * k;
      roll = Math.atan2(grav.x, Math.hypot(grav.y, grav.z)) * 180 / Math.PI;
      pitch = Math.atan2(grav.z, Math.abs(grav.y)) * 180 / Math.PI;
      if (!haveGrav) { haveGrav = true; pitch0 = pitch; }
    }
  }
  if (!a || a.z == null) return;
  // JAB: a hard push straight forward/back along the screen's axis
  if (now < cooldownUntil) return;
  const ax = Math.abs(a.x), ay = Math.abs(a.y), az = Math.abs(a.z), T = THRESH[settings.sens];
  if (az > T && az > 1.3 * Math.max(ax, ay)) {
    cooldownUntil = now + 260; freezeUntil = now + 320;   // hold tilt still so the jab doesn't also move/jump you
    if (settings.mode === 'motion' && state.phase === 'fight') { send({ t: 'act', a: 'punch' }); flashText(duck ? 'UPPERCUT!' : 'PUNCH!', 400); }
    const gt = $('#gesture-test'); if (gt && !$('#s-lobby').hidden) gt.textContent = duck ? 'UPPERCUT!' : 'PUNCH!';
  }
}

function tiltLR() { return settings.flip ? -roll : roll; }
function tiltUD() { const d = pitch - pitch0; return settings.flipv ? -d : d; }

function updateMotion() {
  if (settings.mode === 'buttons') {
    mx = (holdRight ? 1 : 0) - (holdLeft ? 1 : 0); duck = holdDuck; return;
  }
  const g = tiltLR(), dz = 8, full = 26;
  mx = Math.abs(g) < dz ? 0 : Math.max(-1, Math.min(1, (g - Math.sign(g) * dz) / (full - dz)));
  const v = tiltUD();
  // duck: hold the phone tipped down (hysteresis so it doesn't flicker)
  duck = duck ? v < -DUCK_OFF : v < -DUCK_ON;
  // jump: tip it up once; tip back to neutral before the next jump
  if (upArmed && v > UP_ON) { upArmed = false; if (state.phase === 'fight') { send({ t: 'act', a: 'jump' }); flashText('JUMP!', 350); } const gt = $('#gesture-test'); if (gt && !$('#s-lobby').hidden) gt.textContent = 'JUMP!'; }
  if (!upArmed && v < UP_RESET) upArmed = true;
  if (!$('#s-lobby').hidden && duck) { const gt = $('#gesture-test'); if (gt) gt.textContent = 'DUCKING'; }
}

let lastSent = '';
setInterval(() => {
  updateMotion();
  const lr = settings.mode === 'buttons' ? mx : Math.max(-1, Math.min(1, tiltLR() / 26));
  const ud = settings.mode === 'buttons' ? (duck ? -1 : 0) : Math.max(-1, Math.min(1, tiltUD() / 26));
  for (const [id, pid] of [['#tilt-dot', '#pad2d'], ['#tilt-dot2', '#pad2d-2']]) {
    const d = $(id); if (!d) continue;
    d.style.left = `calc(${50 + 44 * lr}% - 8px)`; d.style.top = `calc(${50 - 40 * ud}% - 8px)`;
    const p = $(pid); p.classList.toggle('duck', duck); p.classList.toggle('jump', !upArmed && settings.mode === 'motion');
  }
  const msg = { t: 'in', mx: Math.round(mx * 100) / 100, block, duck };
  const k = msg.mx + '|' + block + '|' + duck;
  if (k !== lastSent || Math.random() < 0.15) { send(msg); lastSent = k; }
}, 33);

// ---------- buttons ----------
function bindHold(el, on, off) {
  const down = e => { e.preventDefault(); el.classList.add('pressed'); on(); };
  const up = e => { e.preventDefault(); el.classList.remove('pressed'); off(); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindHold($('#btn-block'), () => { block = true; }, () => { block = false; });
const holds = { left: v => holdLeft = v, right: v => holdRight = v, duck: v => holdDuck = v };
$$('[data-hold]').forEach(b => bindHold(b, () => holds[b.dataset.hold](true), () => holds[b.dataset.hold](false)));
$$('[data-act]').forEach(b => {
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('pressed'); send({ t: 'act', a: b.dataset.act }); });
  const up = () => b.classList.remove('pressed');
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
});

// ---------- keep screen on ----------
let wakeLock = null;
async function keepAwake() { try { wakeLock = await navigator.wakeLock?.request('screen'); } catch (e) { } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { keepAwake(); if (conn && !conn.open && peer && !peer.destroyed) openConn(); } });

applyMode();
