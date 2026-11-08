// Neon Syndicate — pixel art data. Each pose = upper body (rows 0-21) + legs (rows 22-36).
// Letters: O outline, H hair, S skin, s skin shade, E eye, T top, t top shade, A accent, P pants, p pants shade, B boots, W extra.
'use strict';
const W = 34;

const HEAD = [
  '................................',
  '................................',
  '................................',
  '........OOOOO...........',
  '.......OHHHHHO..........',
  '......OHHHHHHHO.........',
  '......OHHSSSSSO.........',
  '......OHSSSESSO.........',
  '......OHSSSSSSO.........',
  '.......OSSssSO..........',
  '........OSSSO...........',
];

const UPPER = {
  guard: HEAD.concat([
    '.....OOOOTTTOOOO........',
    '....OTTTTTTTTTTTO.......',
    '...OTTTTTTTTTTTSSO......',
    '...OTTTtTTTTTTOSSSO.....',
    '..OTTTtTTTTTTTOSSSSOO...',
    '..OTTTtTTTTTTTO.OSSSSO..',
    '..OSSOtTTTTTTTO..OSSSO..',
    '..OSSOTTTTTTTTO..OSSSO..',
    '..OSSSOtTTTTTO...OOOO...',
    '...OSSSOTTTTTO..........',
    '....OSSOAAAAAO..........',
  ]),
  punch: HEAD.concat([
    '.....OOOOTTTOOOO................',
    '....OTTTTTTTTTTTOOOOOOOOOOOO....',
    '...OTTTTTTTTTTTTSSSSSSSSSSSSOO..',
    '...OTTTtTTTTTTTTSSSSSSSSSSSSSSO.',
    '..OTTTtTTTTTTTOOOOOOOOOOOOSSSSO.',
    '..OTTTtTTTTTTTO..........OOOOO..',
    '..OSSOtTTTTTTTO.................',
    '..OSSOTTTTTTTTO.................',
    '..OSSSOtTTTTTO..................',
    '...OSSSOTTTTTO..................',
    '....OSSOAAAAAO..................',
  ]),
  upper: [
    '................................',
    '....................OOOO........',
    '...................OSSSSO.......',
    '........OOOOO......OSSSSO.......',
    '.......OHHHHHO.....OSSSSO.......',
    '......OHHHHHHHO....OSSSO........',
    '......OHHSSSSSO...OSSSO.........',
    '......OHSSSESSO...OSSO..........',
    '......OHSSSSSSO..OSSO...........',
    '.......OSSssSO..OSSO............',
    '........OSSSO..OSSO.............',
    '.....OOOOTTTOOOSSO..............',
    '....OTTTTTTTTTTSO...............',
    '...OTTTTTTTTTTTO................',
    '...OTTTtTTTTTTO.................',
    '..OTTTtTTTTTTTO.................',
    '..OTTTtTTTTTTTO.................',
    '..OSSOtTTTTTTTO.................',
    '..OSSOTTTTTTTTO.................',
    '..OSSSOtTTTTTO..................',
    '...OSSSOTTTTTO..................',
    '....OSSOAAAAAO..................',
  ],
  block: [
    '................................',
    '................................',
    '................................',
    '........OOOOO...........',
    '.......OHHHHHO..........',
    '......OHHHHHHHO.........',
    '......OHHSSSSSOOOOO.....',
    '......OHSSSESSOSSSSO....',
    '......OHSSSSSSOSSSSO....',
    '.......OSSssSOSSSSO.....',
    '........OSSSOSSSSO......',
    '.....OOOOTTTOSSSOOO.....',
    '....OTTTTTTTTOSSSSSO....',
    '...OTTTTTTTTTOSSSSSSO...',
    '...OTTTtTTTTTTOSSSSSO...',
    '..OTTTtTTTTTTTOSSSSO....',
    '..OTTTtTTTTTTTTOOOO.....',
    '..OTTTtTTTTTTTO.........',
    '..OTTTTTTTTTTTO.........',
    '..OTTTtTTTTTTO..........',
    '...OTTTTTTTTTO..........',
    '....OTTOAAAAAO..........',
  ],
};

const LEGS = {
  stance: [
    '.....OOOPPPPPPO.........',
    '......OPPPPPPPPO........',
    '.....OPPPpOOPPPPO.......',
    '.....OPPPpO.OPPPPO......',
    '....OPPPpO...OPPPPO.....',
    '....OPPPpO....OPPPPO....',
    '...OPPPpO......OPPPO....',
    '...OPPPpO......OPPPO....',
    '...OPPPO.......OPPPPO...',
    '..OPPPpO........OPPPO...',
    '..OPPPO.........OPPPO...',
    '..OBBBO.........OBBBO...',
    '.OBBBBO.........OBBBBO..',
    '.OBBBBBO........OBBBBBO.',
    '.OOOOOOO........OOOOOOO.',
  ],
  walk: [
    '.....OOOPPPPPPO.........',
    '......OPPPPPPPPO........',
    '......OPPPpOPPPO........',
    '......OPPPpOPPPO........',
    '.....OPPPpO.OPPPO.......',
    '.....OPPPpO.OPPPO.......',
    '.....OPPPO..OPPPO.......',
    '.....OPPPO...OPPPO......',
    '....OPPPpO...OPPPO......',
    '....OPPPO....OPPPO......',
    '....OPPPO....OPPPO......',
    '....OBBBO....OBBBO......',
    '...OBBBBO....OBBBBO.....',
    '...OBBBBBO...OBBBBBO....',
    '...OOOOOOO...OOOOOOO....',
  ],
  kick: [
    '.....OOOPPPPPPOOOOOOOOOOOOOOOOO..',
    '......OPPPPPPPPPPPPPPPPPPPPPPBBO.',
    '.....OPPPpOOPPPPPPPPPPPPPPPPPBBBO',
    '.....OPPPpO.OOOOOOOOOOOOOOOOOBBBO',
    '....OPPPpO..................OOOO.',
    '....OPPPpO.......................',
    '...OPPPpO........................',
    '...OPPPpO........................',
    '...OPPPO.........................',
    '..OPPPpO.........................',
    '..OPPPO..........................',
    '..OBBBO..........................',
    '.OBBBBO..........................',
    '.OBBBBBO.........................',
    '.OOOOOOO.........................',
  ],
  crouch: [
    '....OPPPPPPPPPPPPO......',
    '...OPPPpPPPPPPPPPPO.....',
    '..OPPPpOOOOOOOOPPPPO....',
    '..OBBBBO......OBBBBO....',
    '.OBBBBBBO.....OBBBBBBO..',
    '.OOOOOOOO.....OOOOOOOO..',
  ],
  sweep: [
    '....OPPPPPPPPPPPPOOOOOOOOOOOOOO..',
    '...OPPPpPPPPPPPPPPPPPPPPPPPPPBBO.',
    '..OPPPpOOOOOOOOOOOOOOOOOOOOOOBBBO',
    '..OBBBBO....................OOOO.',
    '.OBBBBBBO........................',
    '.OOOOOOOO........................',
  ],
  jump: [
    '.....OOOPPPPPPO.........',
    '......OPPPPPPPPOO.......',
    '.....OPPPPPPPPPPPO......',
    '.....OPPPpOOOPPPPPO.....',
    '......OPPPO..OOPPPO.....',
    '.......OPPPO..OPPPO.....',
    '........OBBBO.OBBBO.....',
    '........OBBBBOOBBBBO....',
    '.........OOOOO.OOOOO....',
    '', '', '', '', '', '',
  ],
};

function toGrid(rows) {
  return rows.map(r => r.padEnd(W, '.').slice(0, W).split(''));
}

function overlay(g, kind) {
  const put = (r, c, ch) => { if (g[r] && c >= 0 && c < W) g[r][c] = ch; };
  const isHead = (r, c) => g[r] && g[r][c] !== '.';
  if (kind === 'visor') {
    for (let r = 0; r < 24; r++) {
      // find the eye row (contains 'E') and turn it into a glowing visor band
      const i = g[r].indexOf('E');
      if (i > 0) { for (let c = i - 3; c <= i + 2; c++) if (isHead(r, c) && g[r][c] !== 'O') put(r, c, 'A'); }
    }
  }
  if (kind === 'mohawk') {
    for (let r = 1; r < 24; r++) {
      const i = g[r].indexOf('H');
      if (i > 0 && g[r - 1] && g[r - 1].slice(i, i + 5).every(ch => ch === 'O' || ch === '.')) {
        // first hair row: stack a mohawk above it
        for (let k = 1; k <= 3; k++) { put(r - 1 - k, i + 2, 'O'); put(r - 1 - k, i + 3, 'A'); put(r - 1 - k, i + 4, 'O'); }
        put(r - 5, i + 3, 'O');
        break;
      }
    }
  }
  return g;
}

function composePose(upper, legs, kind) {
  let rows = UPPER[upper].concat(LEGS[legs]);
  if (LEGS[legs].length === 6) rows = Array(9).fill('').concat(UPPER[upper], LEGS[legs]); // crouching: body drops 9px
  const g = toGrid(rows);
  return overlay(g, kind);
}

function rotateCCW(g) {
  const h = g.length, w = g[0].length, out = [];
  for (let c = w - 1; c >= 0; c--) { const row = []; for (let r = 0; r < h; r++) row.push(g[r][c]); out.push(row); }
  return out;
}

function bake(grid, pal, mirror, flash) {
  const h = grid.length, w = grid[0].length;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const cx = cv.getContext('2d');
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const ch = grid[r][c]; if (ch === '.' || !pal[ch]) continue;
    cx.fillStyle = flash ? (ch === 'O' ? '#ffffff' : '#ff2e88') : pal[ch];
    cx.fillRect(mirror ? w - 1 - c : c, r, 1, 1);
  }
  return cv;
}

const POSES = {
  idle: ['guard', 'stance'], walk: ['guard', 'walk'], jump: ['guard', 'jump'],
  punch: ['punch', 'stance'], kick: ['guard', 'kick'], upper: ['upper', 'stance'],
  block: ['block', 'stance'], hit: ['guard', 'walk'], airpunch: ['punch', 'jump'], airkick: ['guard', 'kick'],
  special: ['punch', 'walk'],
  crouch: ['guard', 'crouch'], crouchblock: ['block', 'crouch'], sweep: ['guard', 'sweep'],
};

const FIGHTERS = {
  kira: {
    name: 'KIRA-9', head: 'visor', speed: 1.0, armor: 1.0, power: 0.9, startup: 0,
    specialName: 'VOLT DASH',
    pal: { O: '#0a0614', H: '#e8e8f5', S: '#f1c7a8', s: '#c9977a', E: '#0a0614', T: '#2b2d42', t: '#1c1d2e', A: '#2ee6ff', P: '#3a3d5c', p: '#26283f', B: '#ff2e88' },
    alt: { O: '#0a0614', H: '#1b1b24', S: '#f1c7a8', s: '#c9977a', E: '#0a0614', T: '#e8e8f5', t: '#b9b9cc', A: '#ffe14d', P: '#e8e8f5', p: '#b9b9cc', B: '#ffe14d' },
  },
  brick: {
    name: 'BRICK', head: 'mohawk', speed: 0.68, armor: 0.85, power: 1.25, startup: 2,
    specialName: 'GROUND POUND',
    pal: { O: '#0a0614', H: '#4a2c1a', S: '#8d5a3b', s: '#6b4029', E: '#ff2e88', T: '#5b5f6b', t: '#40434d', A: '#ff2e88', P: '#2a2a35', p: '#1a1a22', B: '#5b5f6b' },
    alt: { O: '#0a0614', H: '#e8e8f5', S: '#8d5a3b', s: '#6b4029', E: '#2ee6ff', T: '#7a1f3d', t: '#5a142c', A: '#2ee6ff', P: '#14141c', p: '#0a0a10', B: '#7a1f3d' },
  },
};

// Build baked sprite sets: SPRITES[fighterKey][palKey][pose][facing 1|-1][flash 0|1]
function buildSprites() {
  const out = {};
  for (const key of Object.keys(FIGHTERS)) {
    const f = FIGHTERS[key]; out[key] = {};
    for (const palKey of ['pal', 'alt']) {
      const set = {};
      for (const pose of Object.keys(POSES)) {
        const g = composePose(POSES[pose][0], POSES[pose][1], f.head);
        set[pose] = { 1: [bake(g, f[palKey], false, false), bake(g, f[palKey], false, true)], [-1]: [bake(g, f[palKey], true, false), bake(g, f[palKey], true, true)] };
      }
      const ko = rotateCCW(composePose('guard', 'stance', f.head));
      set.ko = { 1: [bake(ko, f[palKey], false, false), bake(ko, f[palKey], false, true)], [-1]: [bake(ko, f[palKey], true, false), bake(ko, f[palKey], true, true)] };
      out[key][palKey] = set;
    }
  }
  return out;
}

// Anchor: column of the body's centre in the 34-wide grid, and the feet row.
const ANCHOR_X = 9, FEET_Y = 37;
