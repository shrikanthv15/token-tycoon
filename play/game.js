/* TOKEN TYCOON v3 — "SURVIVE"
   Pixel-art office survival sim. Build your AI company, see how long you last.
   One room. One subscription. Revenue in, costs out. Drag jobs onto people.
*/
'use strict';

  // Feature flag for Nemotron bridge
// Remove local NEMOTRON_ENABLED flag and add helper
function isNemotronEnabled(){
  return typeof window !== 'undefined' && window.NemotronBridge && window.NemotronBridge.isEnabled();
}


// ---------- data ----------
const SUBS = {
  claude: { name: 'Claude', price: 20, color: 0xd97757, css: '#d97757', h5: 400, wk: 2000 },
  codex:  { name: 'Codex',  price: 20, color: 0x10a37f, css: '#10a37f', h5: 300, wk: 1500 },
  openrouter: { name: 'OpenRouter', price: 30, color: 0xffa500, css: '#ffa500', h5: 350, wk: 1800 },
  anthropic: { name: 'Anthropic', price: 35, color: 0x00aaff, css: '#00aaff', h5: 380, wk: 1900 },
  gemini: { name: 'Gemini', price: 32, color: 0x8e44ad, css: '#8e44ad', h5: 360, wk: 1850 },
  openclaw: { name: 'OpenClaw', price: 28, color: 0x27ae60, css: '#27ae60', h5: 340, wk: 1700 },
  hyperbrain: { name: 'HyperBrain', price: 40, color: 0xe74c3c, css: '#e74c3c', h5: 420, wk: 2100 },
};
const MODELS = {
  haiku: { name: 'Haiku',        sub: 'claude', cap: 1, cost: 40  },
  fable: { name: 'Fable 5.1',    sub: 'claude', cap: 2, cost: 70  },
  opus:  { name: 'Opus 5.5',     sub: 'claude', cap: 3, cost: 120 },
  codex: { name: 'Codex',        sub: 'codex',  cap: 2, cost: 60  },
  astra: { name: 'GPT-6 Astra',  sub: 'codex',  cap: 3, cost: 110 },
  sol:   { name: 'Sol',          sub: 'codex',  cap: 2, cost: 55  },
  luna:  { name: 'Luna',         sub: 'codex',  cap: 1, cost: 35  },
};
const JOB_TITLES = ['Fix login bug','Write API docs','Refactor auth module','Build landing page',
  'Triage 50 tickets','Migrate database','Add dark mode','Optimize slow queries','Write test suite',
  'Set up CI pipeline','Debug memory leak','Localize onboarding','Audit permissions','Speed up search'];

// Parallel array of rich multi-line descriptions for each job title.
const JOB_DESCRIPTIONS = [
  'Fix the critical login bug causing 5% of users to be locked out.\nEnsure authentication flow works across browsers.',
  'Write comprehensive API documentation for the new endpoints.\nInclude examples and error handling.',
  'Refactor the authentication module to improve security and maintainability.',
  'Build a responsive landing page with modern UI components and SEO.',
  'Triage 50 incoming tickets, prioritize bugs, and assign to developers.',
  'Migrate the legacy database to the new schema with zero downtime.',
  'Add dark mode toggle throughout the app, respecting user settings.',
  'Optimize slow query performance by adding indexes and caching.',
  'Write a full test suite covering unit, integration, and end‑to‑end tests.',
  'Set up CI pipeline with linting, testing, and deployment steps.',
  'Debug memory leak in the analytics module causing increased RAM usage.',
  'Localize onboarding flow for French and Spanish markets.',
  'Audit permissions across services to tighten security.',
  'Speed up search functionality with improved indexing and caching.',
];
const DAY_LEN = 30;          // seconds per game day
const DAYS_PER_WEEK = 7;
const RENT = 20;             // $/week for the room
const DESKS = [
  { x: 220, y: 330 }, { x: 560, y: 330 },
  { x: 220, y: 600 }, { x: 560, y: 600 },
];
const DOOR = { x: 790, y: 800 };

// ---------- pixel sprites ----------
function personFrame(shirt, frame) {
  // 12 wide. frame: 0 stand, 1 walk-a, 2 walk-b, 3 sit idle, 4 sit typing-a, 5 sit typing-b
  const S = 'S', H = 'H', T = 'T', P = 'P', X = 'X', d = '.', N = 'N';
  const legs = [
    ['...PP..PP...', '...PP..PP...', '...PP..PP...', '..PPP..PPP..', '..XXX..XXX..'],
    ['..PP...PP...', '..PP...PP...', '..PP...PP...', '.PPP....PPP.', '.XXX....XXX.'],
    ['...PP..PP...', '...PP..PP...', '...PP..PP...', '..PPP..PPP..', '..XXX..XXX..'],
  ][frame <= 2 ? frame : 0];
  const rows = [
    '....HHHH....',
    '...HHHHHH...',
    '...HSSSSH...',
    '...SSSSSS...',
    '....SSSS....',
    '..TTTTTTTT..',
    '.TTTTTTTTTT.',
    '.STTTTTTTTS.',
    '.TTTTTTTTTT.',
    '..TTTTTTTT..',
    '...TTTTTT...',
    '...PPPPPP...',
    '...PPPPPP...',
    ...legs,
  ];
  if (frame >= 3) {
    const hands = { 3: '....NN..NN..', 4: '...NN...NN...', 5: '....NN.NN...' }[frame];
    return rows.slice(0, 11).concat([hands]);
  }
  return rows;
}
const PAL = { H: [90, 60, 40], S: [235, 200, 170], T: null, P: [50, 70, 120], X: [40, 40, 45], N: [235, 200, 170] };

function bakePerson(scene, key, shirtHex) {
  for (let f = 0; f < 6; f++) {
    // Guard: skip if texture already exists (scene.restart retains old textures)
    if (scene.textures.exists(key + f)) continue;
    const rows = personFrame(shirtHex, f);
    const w = 12, h = rows.length;
    const t = scene.textures.createCanvas(key + f, w, h);
    const c = t.getContext();
    const pal = Object.assign({}, PAL, { T: hexRgb(shirtHex) });
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        const [r, g, b] = pal[ch];
        c.fillStyle = `rgb(${r},${g},${b})`;
        c.fillRect(x, y, 1, 1);
      });
    });
    t.refresh();
  }
}
function hexRgb(h) { return [(h >> 16) & 255, (h >> 8) & 255, h & 255]; }

// ----- state ----------
// ----- state ----------
function freshState() {
  return {
    cash: 100, day: 1, week: 1, dayT: 0, speed: 1, over: false,
    subs: {},          // id -> {h5, wk}
    staff: [],         // {model, desk, sprite, busy, job, contextFill}
    jobs: [],          // inbox job cards {id,title,stars,pay,card}
    revenue: 0, spent: 0, nextJobIn: 8,
    jobSeq: 1, done: 0, failed: 0,
    departments: [],   // {name:string, desks:[deskIdx]}
    roster: [],        // unassigned models {model, id}
    quarter: 1,
    quarterWeeks: 0,
    profitTarget: 20,
    quarterStartCash: 100,
  };
}

// ---------- scene ----------
class Office extends Phaser.Scene {
  constructor() { super('office'); }
  create() {
    // load persisted state if available
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('tt_state')); } catch(e) {}
    this.S = freshState();
    this.currentDept = null;
    this.buildTextures();
    this.buildOffice();
    // State must exist before the HUD builds (buildTopbar calls refreshTop).
    // Restore then runs over it. Fix by Kratos Muse 2026-10-04: restore used
    // to run before buildTopbar, throwing on undefined text objects and
    // killing boot after reload.
    this.S = freshState();
    this.buildTopbar();
    this.buildSidebar();
    if (saved) this._restoreFromSnapshot(saved);
    this.hint = this.add.text(475, 100, 'Buy a subscription (HIRE tab) → hire a model → drag jobs onto them',
      { fontFamily: 'Courier New', fontSize: '15px', color: '#f5b942', align: 'center' }).setOrigin(0.5).setDepth(50);
    this.time.delayedCall(12000, () => this.hint && this.hint.destroy(), [], this);
    this.exposeHooks();
    // Day/night overlay based on clock
    const { width, height } = this.scale;
    this.tintOverlay = this.add.rectangle(width/2, height/2, width, height, 0xffe0a0).setDepth(5);
    this.prevDay = this.S.day;
    this.updateTint();
    // Tangent event timer: occasional staff wander off, wasting pool
    this.time.addEvent({ delay: 6000, loop: true, callback: this.maybeTangent, callbackScope: this });
    this.tangentActive = false;
    this.tangentStaff = null;
    this.tangentToast = null;
  }

  maybeTangent() {
    if (this.S.speed === 0) return;
    // 5% chance each interval
    if (Math.random() < 0.05 && !this.tangentActive) {
      // pick an idle staff member
      const idle = this.S.staff.find(s => !s.busy && !s.tangent);
      if (!idle) return;
      this.tangentActive = true;
      this.tangentStaff = idle;
      idle.tangent = true;
      // move sprite to wander position
      const wanderX = idle.desk.x + (Math.random() * 100 - 50);
      const wanderY = idle.desk.y + (Math.random() * 100 - 50);
      this.tweens.add({ targets: idle.spr, x: wanderX, y: wanderY, duration: 1200, ease: 'Linear' });
      // waste pool: deduct 5 from sub pool if any
      const model = MODELS[idle.model];
      const subId = model.sub;
      const sub = this.S.subs[subId];
      if (sub) {
        sub.wk = Math.max(0, sub.wk - 5);
        sub.h5 = Math.max(0, sub.h5 - 2);
      }
      // show toast alert
      this.showTangentToast();
    }
  }

  showTangentToast() {
    const tx = 640, ty = 100;
    const bg = this.add.graphics();
    bg.fillStyle(0x2a3852, 1).fillRoundedRect(tx - 200, ty - 30, 400, 60, 10);
    const msg = this.add.text(tx, ty, 'Staff wandered! Pool wasted.', { fontFamily: 'Courier New', fontSize: '16px', color: '#f5b942' }).setOrigin(0.5);
    const recoverBtn = this.add.text(tx - 80, ty + 20, '[ RECOVER ]', { fontFamily: 'Courier New', fontSize: '13px', color: '#4ade80', fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    const pauseBtn = this.add.text(tx + 40, ty + 20, '[ PAUSE ]', { fontFamily: 'Courier New', fontSize: '13px', color: '#f87171', fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    const container = this.add.container(0, 0, [bg, msg, recoverBtn, pauseBtn]);
    this.tangentToast = container;
    recoverBtn.on('pointerdown', () => {
      // restore pool values (simple: add back same amount)
      const idle = this.tangentStaff;
      if (idle) {
        const model = MODELS[idle.model];
        const sub = this.S.subs[model.sub];
        if (sub) {
          sub.wk += 5;
          sub.h5 += 2;
        }
        // move staff back to desk and sit
        this.tweens.add({ targets: idle.spr, x: idle.desk.x, y: idle.desk.y - 64, duration: 800, ease: 'Linear', onComplete: () => {
          this.sitDown(idle);
        } });
        idle.tangent = false;
      }
      this.clearTangent();
    });
    pauseBtn.on('pointerdown', () => {
      this.S.speed = 0;
      this.updatePauseButton();
    });
    // auto dismiss after 6 seconds
    this.time.delayedCall(6000, () => this.clearTangent(), [], this);
  }

  clearTangent() {
    // If a staff member is currently tangent, move them back to their desk before clearing.
    if (this.tangentStaff) {
      const staff = this.tangentStaff;
      // Tween back to desk position
      this.tweens.add({
        targets: staff.spr,
        x: staff.desk.x,
        y: staff.desk.y,
        duration: 800,
        ease: 'Linear',
        onComplete: () => {
          this.sitDown(staff);
          staff.tangent = false;
          this.tangentStaff = null;
          // Clean up toast and state
          if (this.tangentToast) { this.tangentToast.destroy(); this.tangentToast = null; }
          this.tangentActive = false;
          this.renderSidebar();
        }
      });
      return; // wait for tween completion
    }
    // No staff tangent; just clear toast
    if (this.tangentToast) { this.tangentToast.destroy(); this.tangentToast = null; }
    this.tangentActive = false;
    this.renderSidebar();
  }

  // Update tint overlay based on day (daytime vs night)
  updateTint() {
    const S = this.S;
    // Define daytime: days 1-5, night: days 6-7
    if (S.day <= 5) {
      // warm daylight tint
      this.tintOverlay.setFillStyle(0xffe0a0, 0.2);
    } else {
      // deep blue/purple night tint
      this.tintOverlay.setFillStyle(0x001030, 0.2);
    }
  }

  // ----- existing methods continue below -----
  // ----- textures -----
  buildTextures() {
    // Guard: skip tile texture if it already exists (scene.restart retains it)
    if (!this.textures.exists('tile')) {
      const ft = this.textures.createCanvas('tile', 32, 32), fc = ft.getContext();
      fc.fillStyle = '#3a3f4a'; fc.fillRect(0, 0, 32, 32);
      fc.fillStyle = '#343945'; fc.fillRect(0, 0, 16, 16); fc.fillRect(16, 16, 16, 16);
      fc.fillStyle = '#2c313b'; fc.fillRect(0, 31, 32, 1); fc.fillRect(31, 0, 1, 32);
      ft.refresh();
    }
    for (const [mid, m] of Object.entries(MODELS)) bakePerson(this, 'p_' + mid, SUBS[m.sub].color);
    // desk top
    if (!this.textures.exists('desk')) {
      const dt = this.textures.createCanvas('desk', 56, 28), dc = dt.getContext();
      dc.fillStyle = '#6b4a2f'; dc.fillRect(0, 0, 56, 28);
      dc.fillStyle = '#7d5a3a'; dc.fillRect(0, 0, 56, 6);
      dc.fillStyle = '#4a3220'; dc.fillRect(0, 26, 56, 2);
      dt.refresh();
    }
  }

  // ----- office -----
  buildOffice() {
    const OX = 0, OY = 64, OW = 950, OH = 736;
    // floor
    for (let x = 0; x < OW; x += 32) for (let y = 0; y < OH; y += 32)
      this.add.image(OX + x + 16, OY + y + 16, 'tile').setDisplaySize(32, 32);
    // rug
    const rug = this.add.graphics();
    rug.fillStyle(0x8a2f2f, 1).fillRect(360, 420, 230, 130);
    rug.fillStyle(0xa8433a, 1).fillRect(372, 432, 206, 106);
    rug.fillStyle(0x8a2f2f, 1).fillRect(384, 444, 182, 82);
    // walls: top + left
    const wall = this.add.graphics();
    wall.fillStyle(0x232936, 1).fillRect(OX, OY - 26, OW, 26);
    wall.fillStyle(0x1b2130, 1).fillRect(OX, OY - 26, 26, OH + 26);
    // whiteboard with motto
    const wb = this.add.graphics();
    wb.fillStyle(0xdfe6ee, 1).fillRect(120, 70, 200, 110);
    wb.fillStyle(0x8b98ad, 1).fillRect(120, 70, 200, 110).fillStyle(0xdfe6ee, 1).fillRect(124, 74, 192, 102);
    this.add.text(220, 122, 'SHIP IT.', { fontFamily: 'Courier New', fontSize: '22px', color: '#b03a3a', fontStyle: 'bold' }).setOrigin(0.5);
    // plant
    const pl = this.add.graphics();
    pl.fillStyle(0x6b4a2f, 1).fillRect(880, 640, 26, 30);
    pl.fillStyle(0x2f8a4a, 1);
    pl.fillCircle(893, 625, 16); pl.fillCircle(883, 635, 12); pl.fillCircle(903, 635, 12);
    // water cooler
    const wc = this.add.graphics();
    wc.fillStyle(0xdfe6ee, 1).fillRect(890, 120, 24, 44);
    wc.fillStyle(0x58c4dc, 1).fillRect(890, 100, 24, 22);
    // door (bottom wall gap) + mat
    const dw = this.add.graphics();
    dw.fillStyle(0x232936, 1).fillRect(OX, OY + OH, DOOR.x - OX - 60, 26);
    dw.fillStyle(0x232936, 1).fillRect(DOOR.x + 60, OY + OH, OW - (DOOR.x + 60 - OX), 26);
    dw.fillStyle(0x4a3220, 1).fillRect(DOOR.x - 46, OY + OH - 4, 92, 30);
    this.add.text(DOOR.x, OY + OH + 13, 'DOOR', { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad' }).setOrigin(0.5);
    // desks
    this.deskObjs = DESKS.map((d, i) => {
      const c = this.add.container(d.x, d.y).setDepth(10);
      const top = this.add.image(0, 0, 'desk').setDisplaySize(168, 84);
      const mon = this.add.graphics();
      mon.fillStyle(0x1a1e28, 1).fillRect(-78, -52, 52, 34);
      mon.fillStyle(0x58c4dc, 0.85).fillRect(-74, -48, 44, 26);
      mon.fillStyle(0x1a1e28, 1).fillRect(-56, -18, 8, 10);
      const kb = this.add.graphics();
      kb.fillStyle(0xdfe6ee, 1).fillRect(-14, 22, 48, 12);
      kb.fillStyle(0x8b98ad, 1);
      for (let k = 0; k < 6; k++) kb.fillRect(-10 + k * 8, 24, 5, 8);
      const plate = this.add.text(0, 44, 'EMPTY DESK', { fontFamily: 'Courier New', fontSize: '13px', color: '#5a6578' }).setOrigin(0.5);
      // pool meters (text)
      const h5Text = this.add.text(0, -150, '', { fontFamily: 'Courier New', fontSize: '13px', color: '#f5b942' }).setOrigin(0.5);
      const wkText = this.add.text(0, -134, '', { fontFamily: 'Courier New', fontSize: '13px', color: '#f5b942' }).setOrigin(0.5);
      const h5Timer = this.add.text(0, -120, '', { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad' }).setOrigin(0.5);
      const wkTimer = this.add.text(0, -106, '', { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad' }).setOrigin(0.5);
      // pool meters (bars)
      const h5BarBg = this.add.graphics();
      h5BarBg.fillStyle(0x2a3852, 1).fillRect(-28, -112, 56, 8);
      const h5Bar = this.add.graphics();
      const wkBarBg = this.add.graphics();
      wkBarBg.fillStyle(0x2a3852, 1).fillRect(-28, -100, 56, 8);
      const wkBar = this.add.graphics();
      c.add([top, mon, kb, plate, h5Text, wkText, h5Timer, wkTimer, h5BarBg, h5Bar, wkBarBg, wkBar]);
      const deskObj = { x: d.x, y: d.y, c, plate, taken: false, idx: i, h5Text, wkText, h5Timer, wkTimer, h5Bar, wkBar, h5BarBg, wkBarBg };
      c.setSize(168, 84).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => this.toggleDeskDept(i));
      return deskObj;
    });
    // office chairs at each desk (depth 8: behind seated staff at 9, in front of floor)
    DESKS.forEach(d => {
      const ch = this.add.graphics().setDepth(8);
      const x = d.x, b = d.y - 28;
      ch.fillStyle(0x2a3140, 1);
      ch.fillRect(x - 13, b - 64, 26, 48);
      ch.fillRect(x - 17, b - 18, 34, 10);
      ch.fillRect(x - 3, b - 8, 6, 20);
      ch.fillRect(x - 16, b + 10, 32, 6);
      ch.fillStyle(0x39424f, 1);
      ch.fillRect(x - 13, b - 64, 26, 8);
    });
  }

  // ----- top bar -----
  buildTopbar() {
    const g = this.add.graphics();
    g.fillStyle(0x121826, 1).fillRect(0, 0, 1280, 64);
    g.lineStyle(1, 0x1f2a3f, 1).lineBetween(0, 64, 1280, 64);
    this.cashT = this.add.text(20, 20, '', { fontFamily: 'Courier New', fontSize: '24px', color: '#4ade80', fontStyle: 'bold' });
    this.clockT = this.add.text(220, 22, '', { fontFamily: 'Courier New', fontSize: '18px', color: '#8b98ad' });
    this.burnT = this.add.text(430, 22, '', { fontFamily: 'Courier New', fontSize: '15px', color: '#f87171' });
    // quarter timer and profit target
    this.quarterT = this.add.text(620, 20, '', { fontFamily: 'Courier New', fontSize: '18px', color: '#ffbf00' });
    this.profitT = this.add.text(770, 20, '', { fontFamily: 'Courier New', fontSize: '18px', color: '#66ff66' });
    const mk = (x, label, cb) => {
      const b = this.add.container(x, 32);
      const bg = this.add.graphics();
      bg.fillStyle(0x1f2a3f, 1).fillRoundedRect(-30, -18, 60, 36, 6);
      const t = this.add.text(0, 0, label, { fontFamily: 'Courier New', fontSize: '16px', color: '#eceff4' }).setOrigin(0.5);
      b.add([bg, t]); b.setSize(60, 36).setInteractive({ useHandCursor: true });
      b.on('pointerdown', cb); b.on('pointerover', () => bg.clear().fillStyle(0x2a3852, 1).fillRoundedRect(-30, -18, 60, 36, 6));
      b.on('pointerout', () => bg.clear().fillStyle(0x1f2a3f, 1).fillRoundedRect(-30, -18, 60, 36, 6));
      b._label = t; // store reference for dynamic updates
      return b;
    };
    // pause button: visual toggles between '▶' (running) and 'II' (paused)
    this.pauseBtn = mk(1080, '\u25b6', () => { this.S.speed = this.S.speed === 0 ? 1 : 0; this.updatePauseButton(); });
    // PAUSED indicator text, shown when speed == 0
    this.pausedLabel = this.add.text(1080, 10, 'PAUSED', { fontFamily: 'Courier New', fontSize: '16px', color: '#f5b942' })
      .setOrigin(0.5).setDepth(25).setVisible(this.S.speed === 0);
    mk(1150, '1×', () => { this.S.speed = 1; this.updatePauseButton(); });
    mk(1220, '2×', () => { this.S.speed = 2; this.updatePauseButton(); });
    this.refreshTop();
  }
  // Update pause button label to reflect current speed state and paused indicator
  updatePauseButton() {
    if (!this.pauseBtn) return;
    const label = this.S.speed === 0 ? 'II' : '\u25b6';
    this.pauseBtn._label.setText(label);
    // Show or hide PAUSED label
    if (this.pausedLabel) {
      this.pausedLabel.setVisible(this.S.speed === 0);
    }
  }
  weeklyBurn() {
    let b = RENT + (this.quarterRentIncrease || 0);
    for (const id of Object.keys(this.S.subs)) b += SUBS[id].price;
    return b;
  }
  refreshTop() {
    const S = this.S;
    this.cashT.setText('$' + Math.round(S.cash));
    this.cashT.setColor(S.cash < 40 ? '#f87171' : '#4ade80');
    this.clockT.setText(`WEEK ${S.week} · DAY ${S.day}/7`);
    this.burnT.setText(`burn -$${this.weeklyBurn()}/wk`);
    // quarter timer display (13 weeks per quarter)
    const weeksLeft = Math.max(0, 13 - S.quarterWeeks);
    this.quarterT.setText(`Q${S.quarter} ${weeksLeft}w`);
    // profit progress display
    const profitSoFar = Math.round(S.cash - S.quarterStartCash);
    this.profitT.setText(`$${profitSoFar}/${S.profitTarget}`);
  }

  // ----- sidebar -----
  buildSidebar() {
    const SX = 950;
    const g = this.add.graphics();
    g.fillStyle(0x0e131c, 1).fillRect(SX, 64, 330, 736);
    g.lineStyle(1, 0x1f2a3f, 1).lineBetween(SX, 64, SX, 800);
    this.tab = 'inbox';
    this.jobTier = 'ALL'; // filter for job tiers
    const mkTab = (x, label, id) => {
      const t = this.add.text(x, 84, label, { fontFamily: 'Courier New', fontSize: '16px', color: '#8b98ad', fontStyle: 'bold' })
        .setInteractive({ useHandCursor: true })
        .setDepth(30); // PAN-35: tabs must render above job cards (sideC is depth 20; first card spans y70-190 over the tab bar at y84)
      t.on('pointerdown', () => { this.tab = id; this.renderSidebar(); });
      t.setData('id', id);
      return t;
    };
    this.tabInbox = mkTab(SX + 24, 'INBOX', 'inbox');
    this.tabHire = mkTab(SX + 130, 'HIRE', 'hire');
    this.tabDept = mkTab(SX + 236, 'DEPT', 'dept');
    // Tier filter tabs (only visible in INBOX)
    const tierLabels = ['ALL','LOCAL','PRO','ELITE'];
    this.tierTabs = {};
    tierLabels.forEach((lbl, idx) => {
      const x = SX + 24 + idx * 70; // spaced horizontally
      const t = this.add.text(x, 110, lbl, { fontFamily: 'Courier New', fontSize: '14px', color: '#8b98ad' })
        .setInteractive({ useHandCursor: true })
        .setDepth(30);
      t.on('pointerdown', () => { this.jobTier = lbl; this.renderSidebar(); });
      this.tierTabs[lbl] = t;
    });
    this.jobSourceText = this.add.text(SX + 20, 140, 'jobs: LOCAL', {fontFamily: 'Courier New', fontSize: '14px', color: '#f5b942'}).setDepth(30);
    this.sideC = this.add.container(0, 0).setDepth(20);
    this.renderSidebar();
  }
  // ----- UI -----
  renderSidebar() {
    this.sideC.removeAll(true);
    this.tabInbox.setColor(this.tab === 'inbox' ? '#f5b942' : '#8b98ad');
    this.tabHire.setColor(this.tab === 'hire' ? '#f5b942' : '#8b98ad');
    this.tabDept.setColor(this.tab === 'dept' ? '#f5b942' : '#8b98ad');
    const SX = 950;
    if (this.tab === 'inbox') this.renderInbox(SX);
    else if (this.tab === 'hire') this.renderHire(SX);
    else if (this.tab === 'dept') this.renderDept(SX);
  }

  // Compact action resets context and risk
  compact(st) {
    const S = this.S;
    if (st.busy || S.over) return;
    st.busy = true;
    this.flashText(st.desk.x, st.desk.y - 118, 'COMPACTING', '#f5b942');
    const duration = 2000; // ms
    this.time.delayedCall(duration, () => {
      st.contextFill = 0;
      st.risk = 0;
      st.busy = false;
      this.sitDown(st);
      this.refreshTop();
    }, [], this);
  }

  // ----- job UI -----
  renderInbox(SX) {
    // Filter jobs based on selected tier
    const tierMap = {
      'LOCAL': 1,
      'PRO': 2,
      'ELITE': 3,
    };
    let jobsToShow = this.S.jobs;
    if (this.jobTier && this.jobTier !== 'ALL') {
      const star = tierMap[this.jobTier];
      if (star !== undefined) {
        jobsToShow = jobsToShow.filter(j => j.stars === star);
      }
    }
    // update job source indicator
    if (this.jobSourceText) this.jobSourceText.setText('jobs: ' + (this.lastJobSource || 'local').toUpperCase());

    const S = this.S;
    const jobs = jobsToShow;
    if (!jobs.length) {
      this.sideC.add(this.add.text(SX + 165, 300, 'No jobs yet.\nClients will ping you soon.',
        { fontFamily: 'Courier New', fontSize: '14px', color: '#5a6578', align: 'center' }).setOrigin(0.5));
      return;
    }
    jobs.forEach((j, i) => {
      const y = 130 + i * 140; // increased spacing for description
      const card = this.add.container(SX + 165, y);
      const bg = this.add.graphics();
      bg.fillStyle(0x121826, 1).fillRoundedRect(-145, -60, 290, 120, 8);
      bg.lineStyle(2, 0xf5b942, 1).strokeRoundedRect(-145, -60, 290, 120, 8);
      const title = this.add.text(-130, -48, j.title, { fontFamily: 'Courier New', fontSize: '14px', color: '#eceff4', fontStyle: 'bold' });
      const desc = this.add.text(-130, -30, j.description || '', { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad', wordWrap: { width: 260 } });
      const meta = this.add.text(-130, 4, '★'.repeat(j.stars) + `  $${j.pay}`, { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad' });
      const hint = this.add.text(-130, 28, 'drag onto a person', { fontFamily: 'Courier New', fontSize: '13px', color: '#5a6578' });
      // badge for AI jobs
      let badge = null;
      if (j.ai) {
        badge = this.add.text(120, -48, 'AI', { fontFamily: 'Courier New', fontSize: '13px', color: '#ffbf00', fontStyle: 'bold' })
          .setOrigin(0.5);
      }
      card.add([bg, title, desc, meta, hint]);
      if (badge) card.add(badge);
      card.setInteractive(new Phaser.Geom.Rectangle(-145, -60, 290, 120), Phaser.Geom.Rectangle.Contains);
      this.input.setDraggable(card);
      card.setData('jobId', j.id);
      card.on('dragstart', () => card.setScale(1.05).setDepth(100));
      card.on('drag', (p, x, y2) => card.setPosition(x, y2));
      card.on('dragend', (p) => {
        card.setScale(1).setDepth(20);
        const hit = this.deskObjs.find(d => Math.abs(p.x - d.x) < 95 && Math.abs(p.y - d.y) < 70);
        if (hit) this.assignJob(j.id, hit); else this.renderSidebar();
      });
      j.card = card;
      this.sideC.add(card);
    });
  }
  renderHire(SX) {
    const S = this.S;
    const UNLOCK_WEEKS = { claude: 1, codex: 1, openrouter: 3, anthropic: 5, gemini: 7, openclaw: 9, hyperbrain: 11 };
    const subRows = [];
    for (const [sid, sub] of Object.entries(SUBS)) {
      const owned = !!S.subs[sid];
      const unlocked = owned || (S.week >= (UNLOCK_WEEKS[sid] || 1));
      // sub row
      const row = this.add.container(SX + 165, 0);
      const bg = this.add.graphics();
      // grey out locked providers
      const bgColor = unlocked ? 0x121826 : 0x0a0d13;
      bg.fillStyle(bgColor, 1).fillRoundedRect(-145, -26, 290, 52, 8);
      bg.lineStyle(2, owned ? 0x4ade80 : 0x1f2a3f, 1).strokeRoundedRect(-145, -26, 290, 52, 8);
      row.add([bg,
        this.add.text(-130, -18, sub.name, { fontFamily: 'Courier New', fontSize: '15px', color: sub.css, fontStyle: 'bold' }),
        this.add.text(-130, 4, owned ? 'active' : (unlocked ? `$${sub.price}/wk` : `[ LOCKED: week ${UNLOCK_WEEKS[sid]} ]`), { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad' })
      ]);
      if (!owned && unlocked) {
        const b = this.add.text(110, -8, '[ BUY ]', { fontFamily: 'Courier New', fontSize: '13px', color: '#f5b942', fontStyle: 'bold' })
          .setInteractive({ useHandCursor: true });
        b.on('pointerdown', () => this.buySub(sid));
        row.add(b);
      }
      subRows.push(row);
    }
    // position sub rows
    let y = 155;
    for (const r of subRows) { r.setY(y); this.sideC.add(r); y += 62; }
    // roster models for owned subs
    for (const [sid, sub] of Object.entries(SUBS)) {
      if (!S.subs[sid]) continue;
      const modelsForSub = Object.keys(MODELS).filter(m => MODELS[m].sub === sid && S.roster.some(r => r.model === m));
      for (const mid of modelsForSub) {
        const m = MODELS[mid];
        const mr = this.add.container(SX + 165, y);
        const mbg = this.add.graphics();
        mbg.fillStyle(0x0e131c, 1).fillRoundedRect(-135, -20, 270, 40, 6);
        mr.add([mbg,
          this.add.text(-120, -12, `${m.name}  ${'★'.repeat(m.cap)}`, { fontFamily: 'Courier New', fontSize: '13px', color: '#eceff4' }),
          this.add.text(-120, 6, 'click to assign → walks in', { fontFamily: 'Courier New', fontSize: '13px', color: '#5a6578' })
        ]);
        // roster row hitbox: invisible Zone exactly over the visual bg rect.
        // The row container itself is NOT made interactive: container input
        // hit-tests ~20px above the container in this Phaser build (verified
        // by sweep), so an explicit Zone gives the pixel-exact hit region.
        const hz = this.add.zone(SX + 165, y, 270, 40).setInteractive({ useHandCursor: true });
        hz.on('pointerdown', () => this.hire(mid)); // reuse hire which now checks roster
        this.sideC.add(mr);
        this.sideC.add(hz);
        y += 46;
      }
    }
    // staff list with fire buttons and context meters
    if (S.staff.length) {
      this.sideC.add(this.add.text(SX + 20, y, 'STAFF (click to fire):', { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad' }));
      y += 24;
      S.staff.forEach(s => {
        const meter = Math.round(s.contextFill || 0);
        const risk = Math.min(1, 0.03 + (meter / 100) * 0.5);
        const bar = this.add.graphics();
        bar.fillStyle(0x1f2a3f, 1).fillRect(SX + 200, y, 80, 8);
        bar.fillStyle(risk > 0.5 ? 0xf5b942 : 0x4ade80, 1).fillRect(SX + 200, y, 80 * (meter / 100), 8);
        const t = this.add.text(SX + 20, y, `• ${MODELS[s.model].name} (${meter}%)`, { fontFamily: 'Courier New', fontSize: '13px', color: '#eceff4' })
          .setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => this.fire(s));
        this.sideC.add([t, bar]);
        if (meter > 0) {
          const btn = this.add.text(SX + 300, y-2, '[COMPACT]', { fontFamily: 'Courier New', fontSize: '13px', color: '#f5b942' }).setInteractive({ useHandCursor: true });
          btn.on('pointerdown', () => this.compact(s));
          this.sideC.add(btn);
        }
        y += 22;
      });
    }
  }

  // ----- department UI -----
  renderDept(SX) {
    const S = this.S;
    let y = 155;
    S.departments.forEach((dept, idx) => {
      const row = this.add.container(SX + 165, y);
      const bg = this.add.graphics();
      bg.fillStyle(0x121826, 1).fillRoundedRect(-145, -26, 290, 52, 8);
      bg.lineStyle(2, 0x4ade80, 1).strokeRoundedRect(-145, -26, 290, 52, 8);
      row.add([bg,
        this.add.text(-130, -18, dept.name, { fontFamily: 'Courier New', fontSize: '15px', color: '#eceff4', fontStyle: 'bold' }),
        this.add.text(-130, 4, `Desks: ${dept.desks.length}`, { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad' })
      ]);
      row.setSize(290, 52).setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => this.setCurrentDept(dept));
      if (dept.unlocks && dept.unlocks.length) {
        const u = this.add.text(-130, 20, 'Unlocks: ' + dept.unlocks.join(', '), { fontFamily: 'Courier New', fontSize: '13px', color: '#5a6578' });
        row.add(u);
        y += 8;
      }
      this.sideC.add(row);
      y += 62;
    });
    const newBtn = this.add.text(SX + 165, y, '[ CREATE DEPT ]', { fontFamily: 'Courier New', fontSize: '13px', color: '#f5b942', fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    newBtn.on('pointerdown', () => this.createDepartment());
    this.sideC.add(newBtn);
    if (this.currentDept) {
      // Render "Current:" label below department list and create button, never above y=130
      const labelY = Math.max(y + 20, 130);
      this.sideC.add(this.add.text(SX + 10, labelY, 'Current: ' + this.currentDept.name, { fontFamily: 'Courier New', fontSize: '14px', color: '#f5b942' }));
    }
  }

  // Set the current department (selected from DEPT tab)
  setCurrentDept(dept) {
    this.currentDept = dept;
    // Re-render sidebar to reflect selection and show current label
    this.renderSidebar();
  }

  // Toggle desk i in the currently selected department
  toggleDeskDept(i) {
    if (!this.currentDept) {
      // hint to user: no dept selected
      this.flashText(this.deskObjs[i].x, this.deskObjs[i].y - 118, 'Select DEPT', '#f5b942');
      return;
    }
    const desks = this.currentDept.desks;
    const idx = desks.indexOf(i);
    if (idx === -1) {
      desks.push(i);
    } else {
      desks.splice(idx, 1);
    }
    // Update UI: re-render department list to show updated count
    this.renderSidebar();
  }

  createDepartment() {
    const n = this.S.departments.length + 1;
    let name = `Dept ${n}`;
    if (this.S.departments.some(d => d.name === name)) {
      let i = n + 1;
      while (this.S.departments.some(d => d.name === `Dept ${i}`)) i++;
      name = `Dept ${i}`;
    }
    // Apply organization cash bonus on department creation
    const bonus = 10; // cash bonus amount
    this.S.cash = Math.round((this.S.cash || 0) + bonus);
    // Show HUD text for the bonus
    this.flashText(640, 100, `+${bonus} cash (Dept Bonus)`, '#4ade80');
    this.S.departments.push({ name, desks: [], unlocks: ['batch', 'pool'] });
    this.renderSidebar();
  }

  // ----- economy -----
  buySub(sid) {
    const S = this.S, sub = SUBS[sid];
    if (S.subs[sid] || S.cash < sub.price || S.over) return;
    S.cash -= sub.price; S.spent += sub.price;
    S.subs[sid] = { h5: sub.h5, wk: sub.wk };
    // unlock all models for this sub into roster
    for (const [mid, m] of Object.entries(MODELS)) {
      if (m.sub === sid) {
        // avoid duplicates
        if (!S.roster.some(r => r.model === mid)) {
          S.roster.push({ model: mid, id: S.roster.length + 1 });
        }
      }
    }
    this.refreshTop(); this.renderSidebar();
  }
  hire(mid) {
    const S = this.S, m = MODELS[mid];
    // Must own subscription and model must be in roster (unassigned)
    if (!S.subs[m.sub] || !S.roster.some(r => r.model === mid) || S.over) return;
    const desk = this.deskObjs.find(d => !d.taken);
    if (!desk) return; // no free desk
    // remove from roster
    S.roster = S.roster.filter(r => r.model !== mid);
    desk.taken = true;
    desk.plate.setText(m.name.toUpperCase());
    const spr = this.add.image(DOOR.x, DOOR.y + 20, 'p_' + mid + '0').setScale(3).setDepth(15);
    const st = { model: mid, desk, spr, busy: false, job: null, contextFill: 0, frame: 0, walkT: 0 };
    S.staff.push(st);
    spr.setInteractive({ useHandCursor: true });
    spr.on('pointerdown', () => this.fire(st));
    // walk to desk (reuse hire animation)
    this.tweens.add({
      targets: spr, x: desk.x, y: desk.y + 66, duration: 1400, ease: 'Linear',
      onUpdate: () => {
        st.walkT += 1;
        if (st.walkT % 12 === 0) { st.frame = st.frame === 1 ? 2 : 1; spr.setTexture('p_' + mid + st.frame); }
      },
      onComplete: () => {
        this.sitDown(st);
        // persist after assignment
        this._persist();
      },
    });
    this.renderSidebar();
  }
  sitDown(st) {
    const spr = st.spr, mid = st.model;
    spr.setTexture('p_' + mid + '3').setDepth(9);
    spr.y = st.desk.y - 64;
    if (st.idle) st.idle.stop();
    st.idle = this.tweens.add({ targets: spr, y: st.desk.y - 66, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  fire(st) {
    const S = this.S;
    if (st.busy || S.over) return;
    if (st.idle) st.idle.stop();
    // return model to roster
    S.roster.push({ model: st.model, id: S.roster.length + 1 });
    S.staff = S.staff.filter(s => s !== st);
    st.desk.taken = false;
    st.desk.plate.setText('EMPTY DESK');
    st.spr.setDepth(15).setTexture('p_' + st.model + '0');
    this.tweens.add({
      targets: st.spr, x: DOOR.x, y: DOOR.y + 40, duration: 1200, ease: 'Linear',
      onComplete: () => st.spr.destroy(),
    });
    this.renderSidebar();
    // persist state snapshot
    this._persist()
  }
  assignJob(jobId, deskObj) {
    const S = this.S;
    const st = S.staff.find(s => s.desk === deskObj);
    const j = S.jobs.find(x => x.id === jobId);
    if (!st || !j || st.busy || S.over) { this.renderSidebar(); return; }
    const m = MODELS[st.model], sub = S.subs[m.sub];
    let cost = Math.round(m.cost * (0.7 + 0.3 * j.stars));
    const fillInc = Math.min(100, Math.round(cost / 10));
    st.contextFill = Math.min(100, (st.contextFill || 0) + fillInc);
    const rawRisk = 0.03 + (st.contextFill / 100) * 0.5 + (m.cap - j.stars) * 0.1;
    const risk = Math.max(0, Math.min(1, rawRisk));
    st.risk = risk;
    if (!sub || sub.h5 < cost || sub.wk < cost) {
      this.flashText(deskObj.x, deskObj.y - 118, 'POOL DRY', '#f87171');
      this.renderSidebar(); return;
    }
    if (this.currentDept && this.currentDept.unlocks.includes('batch')) {
      cost = Math.round(cost * 0.9);
    }
    sub.h5 -= cost; sub.wk -= cost;
    S.jobs = S.jobs.filter(x => x !== j);
    st.busy = true; st.job = j;
    const bar = this.add.graphics().setDepth(30);
    st.bar = bar;
    const dur = (j.stars === 1 ? 40 : j.stars === 2 ? 65 : 100) * 1000;
    st.workT = 0; st.workDur = dur;
    if (st.idle) st.idle.stop();
    st.spr.y = st.desk.y - 64;
    st.spr.setTexture('p_' + st.model + '4');
    st.typeT = 0; st.typeF = 4;
    st.bounce = this.tweens.add({ targets: st.spr, y: '-=4', duration: 180, yoyo: true, repeat: -1 });
    this.renderSidebar();
  }
  completeJob(st, success) {
    const S = this.S, j = st.job;
    // clean up any prior failure UI
    if (st.failMarker) { st.failMarker.destroy(); st.failMarker = null; }
    if (st.debugHandler) { st.spr.off('pointerdown', st.debugHandler); st.debugHandler = null; }
    if (st.bounce) st.bounce.stop();
    st.busy = false; st.job = null;
    if (st.bar) { st.bar.destroy(); st.bar = null; }
    this.sitDown(st);
    // compute failure chance with hallucination risk
    const baseFail = Math.max(0.03, 0.10 - (MODELS[st.model].cap - j.stars) * 0.06 + (j.stars - 1) * 0.03);
    const riskFail = st.risk !== undefined ? st.risk : 0;
    const finalFail = Math.max(baseFail, riskFail);
    const didSucceed = Math.random() > finalFail;
    if (didSucceed) {
      S.cash += j.pay; S.revenue += j.pay; S.done++;
      this.flashText(st.desk.x, st.desk.y - 118, `+$${j.pay}`, '#4ade80');
      this.tweens.add({ targets: st.spr, y: '-=10', duration: 160, yoyo: true, repeat: 1 });
    } else {
      S.failed++;
      // show failing marker
      const marker = this.add.text(st.spr.x, st.spr.y - 80, '⚠️', { fontSize: '28px' }).setOrigin(0.5).setDepth(70);
      st.failMarker = marker;
      // add debug click handler
      const self = this;
      const debugHandler = function () {
        const overlay = self.add.rectangle(640, 360, 1280, 720, 0x000000, 0.4).setDepth(80).setInteractive();
        const modal = self.add.container(640, 360).setDepth(81);
        const bg = self.add.graphics();
        bg.fillStyle(0x2a3852, 0.9).fillRoundedRect(-150, -80, 300, 160, 12);
        const msg = self.add.text(0, -40, 'Debug job?', { fontFamily: 'Courier New', fontSize: '20px', color: '#f5b942' }).setOrigin(0.5);
        const btn = self.add.text(0, 30, '[ DEBUG ]', { fontFamily: 'Courier New', fontSize: '18px', color: '#4ade80', fontStyle: 'bold' })
          .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        modal.add([bg, msg, btn]);
        btn.on('pointerdown', () => {
          const SAVE_CHANCE = 0.2; // small constant chance to save
          if (Math.random() < SAVE_CHANCE) {
            S.cash += j.pay; S.revenue += j.pay; S.done++;
            self.flashText(st.desk.x, st.desk.y - 118, `+$${j.pay}`, '#4ade80');
          } else {
            self.flashText(st.desk.x, st.desk.y - 118, 'FAILED', '#f87171');
          }
          if (st.failMarker) { st.failMarker.destroy(); st.failMarker = null; }
          // detach debug handler and reattach fire handler
          st.spr.off('pointerdown', debugHandler);
          st.debugHandler = null;
          st.spr.on('pointerdown', () => self.fire(st));
          overlay.destroy();
          modal.destroy();
          self.refreshTop();
        });
        overlay.on('pointerdown', () => {
          if (st.failMarker) { st.failMarker.destroy(); st.failMarker = null; }
          // detach debug handler and reattach fire handler
          st.spr.off('pointerdown', debugHandler);
          st.debugHandler = null;
          st.spr.on('pointerdown', () => self.fire(st));
          overlay.destroy();
          modal.destroy();
        });
      };
      st.debugHandler = debugHandler;
      st.spr.setInteractive({ useHandCursor: true });
      st.spr.off('pointerdown');
      st.spr.on('pointerdown', debugHandler);
    }
    this.refreshTop();
  }
  flashText(x, y, msg, color) {
    const t = this.add.text(x, y, msg, { fontFamily: 'Courier New', fontSize: '18px', color, fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }
  spawnJob(stars = null, pay = null, title = null, description = null) {
    const S = this.S;
    if (S.jobs.length >= 5 || S.over) return;
    // If Nemotron bridge enabled, try remote job generation
    if (isNemotronEnabled() && typeof window.NemotronBridge !== 'undefined' && typeof window.NemotronBridge.requestJobs === 'function') {
      const snapshot = { cash: S.cash, day: S.day, week: S.week, staffCount: S.staff.length };
      // requestJobs returns a promise
      window.NemotronBridge.requestJobs(snapshot).then(remoteJobs => {
        if (Array.isArray(remoteJobs) && remoteJobs.length) {
          this.lastJobSource = 'ai';
          remoteJobs.forEach(job => {
            const finalTitle = job.title || title || 'Untitled';
            const finalDesc = job.description || description || '';
            const finalStars = job.stars || stars || 1;
            const finalPay = job.pay || pay || 0;
            S.jobs.push({ id: S.jobSeq++, title: finalTitle, description: finalDesc, stars: finalStars, pay: finalPay, ai: true });
          });
          if (this.tab === 'inbox') this.renderSidebar();
        } else {
          // fallback to local generation
          this.lastJobSource = 'local';
          this._localSpawnJob(stars, pay, title, description);
        }
      }).catch(() => {
        // network or other error – fallback locally
        this.lastJobSource = 'local';
        this._localSpawnJob(stars, pay, title, description);
      });
      return; // async handling will add jobs later
    }
    // Fallback local generation
    this.lastJobSource = 'local';
    this._localSpawnJob(stars, pay, title, description);
  }

  // Helper for local job generation (existing logic)
  _localSpawnJob(stars = null, pay = null, title = null, description = null) {
    const S = this.S;
    // Determine defaults if not provided
    const jobStars = stars || (Math.random() < 0.5 ? 1 : Math.random() < 0.5 ? 2 : 3);
    const jobPay = pay || Math.round(10 + Math.random() * 40);
    const jobTitle = title || JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
    const jobDesc = description || JOB_DESCRIPTIONS[JOB_TITLES.indexOf(jobTitle)] || '';
    S.jobs.push({ id: S.jobSeq++, title: jobTitle, description: jobDesc, stars: jobStars, pay: jobPay });
    if (this.tab === 'inbox') this.renderSidebar();
  }
  // ----- main loop -----
  update(time, delta) {
    const S = this.S;
    if (S.over || S.speed === 0) return;
    const dt = (delta / 1000) * S.speed;
    S.dayT += dt;
    if (S.dayT >= DAY_LEN) {
      S.dayT = 0; S.day++;
      if (S.day > DAYS_PER_WEEK) { S.day = 1; S.week++; this.weeklyTick(); }
      this.refreshTop();
      this.updateTint();
    }
    S.nextJobIn -= dt;
    if (S.nextJobIn <= 0) { this.spawnJob(); S.nextJobIn = 18 + Math.random() * 14; }
    for (const st of S.staff) {
      // Guard against staff without an active progress bar (e.g., after a compact action)
      if (!st.busy || !st.bar) continue;
      // typing hands: alternate the two typing frames
      st.typeT = (st.typeT || 0) + delta * S.speed;
      if (st.typeT > 160) { st.typeT = 0; st.typeF = st.typeF === 4 ? 5 : 4; st.spr.setTexture('p_' + st.model + st.typeF); }
      st.workT += delta * S.speed;
      const p = Math.min(1, st.workT / st.workDur);
      const g = st.bar; g.clear();
      g.fillStyle(0x1f2a3f, 1).fillRect(st.desk.x - 30, st.desk.y - 100, 60, 8);
      g.fillStyle(0xf5b942, 1).fillRect(st.desk.x - 30, st.desk.y - 100, 60 * p, 8);
      if (p >= 1) { const m = MODELS[st.model], j = st.job; const fit = m.cap - j.stars; const fail = Math.max(0.03, 0.10 - fit * 0.06 + (j.stars - 1) * 0.03); this.completeJob(st, Math.random() > fail); }
    }
    this.updatePoolMeters();
  }
   // ---- pool meters update ----
   updatePoolMeters() {
    const S = this.S;
    for (const desk of this.deskObjs) {
      // clear texts
      desk.h5Text.setText('');
      desk.wkText.setText('');
      desk.h5Timer.setText('');
      desk.wkTimer.setText('');
      // clear bars
      if (desk.h5Bar) desk.h5Bar.clear();
      if (desk.wkBar) desk.wkBar.clear();
      if (!desk.taken) continue;
      const staff = S.staff.find(s => s.desk === desk);
      if (!staff) continue;
      const subId = MODELS[staff.model].sub;
      const sub = S.subs[subId];
      if (!sub) continue;
      // pool amounts
      desk.h5Text.setText(`5h: ${sub.h5}`);
      desk.wkText.setText(`Wk: ${sub.wk}`);
      // bars fill proportionally to max caps
      const caps = SUBS[subId];
      if (desk.h5Bar && caps) {
        const pct = caps.h5 ? sub.h5 / caps.h5 : 0;
        desk.h5Bar.fillStyle(0xf5b942, 1).fillRect(-28, -112, 56 * pct, 8);
      }
      if (desk.wkBar && caps) {
        const pct = caps.wk ? sub.wk / caps.wk : 0;
        desk.wkBar.fillStyle(0xf5b942, 1).fillRect(-28, -100, 56 * pct, 8);
      }
      // timers
      const totalWeek = DAYS_PER_WEEK * DAY_LEN;
      const elapsed = (S.day - 1) * DAY_LEN + S.dayT;
      const weekRem = Math.max(0, totalWeek - elapsed);
      const weekMin = Math.floor(weekRem / 60);
      const weekSec = Math.floor(weekRem % 60);
      desk.wkTimer.setText(`reset in ${weekMin}:${weekSec.toString().padStart(2,'0')}`);
      const period = 5 * DAY_LEN;
      const periodRem = Math.max(0, period - (elapsed % period));
      const pMin = Math.floor(periodRem / 60);
      const pSec = Math.floor(periodRem % 60);
      desk.h5Timer.setText(`reset in ${pMin}:${pSec.toString().padStart(2,'0')}`);
    }
   }
   weeklyTick() {
    const S = this.S;
    const burn = this.weeklyBurn();
    S.cash -= burn; S.spent += burn;
    for (const [sid, p] of Object.entries(S.subs)) { p.h5 = SUBS[sid].h5; p.wk = SUBS[sid].wk; }
    if (this.S.departments.some(d => d.unlocks && d.unlocks.includes('pool'))) {
      for (const [sid, p] of Object.entries(S.subs)) { p.h5 = Math.round(p.h5 * 1.1); p.wk = Math.round(p.wk * 1.1); }
    }
    if (S.cash < 0) return this.gameOver();
    this.flashText(475, 400, `WEEK ${S.week} — bills paid: $${burn}`, '#f5b942');
    this.refreshTop();
    // quarter progression
    S.quarterWeeks += 1;
    if (S.quarterWeeks >= 13) this.evaluateQuarter();
  }
  gameOver() {
    const S = this.S; S.over = true;
    const o = this.add.container(0, 0).setDepth(200);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0d13, 0.88).fillRect(0, 0, 1280, 800);
    o.add([bg,
      this.add.text(640, 300, 'BANKRUPT', { fontFamily: 'Courier New', fontSize: '64px', color: '#f87171', fontStyle: 'bold' }).setOrigin(0.5),
      this.add.text(640, 380, `You survived ${S.week - 1} week${S.week - 1 === 1 ? '' : 's'}.`, { fontFamily: 'Courier New', fontSize: '24px', color: '#eceff4' }).setOrigin(0.5),
      this.add.text(640, 420, `Revenue earned: $${S.revenue} · Total burned: $${S.spent}`, { fontFamily: 'Courier New', fontSize: '16px', color: '#8b98ad' }).setOrigin(0.5),
    ]);
    const btn = this.add.container(640, 500);
    const bbg = this.add.graphics();
    bbg.fillStyle(0xf5b942, 1).fillRoundedRect(-110, -28, 220, 56, 10);
    btn.add([bbg, this.add.text(0, 0, 'TRY AGAIN', { fontFamily: 'Courier New', fontSize: '20px', color: '#111111', fontStyle: 'bold' }).setOrigin(0.5)]);
    btn.setSize(220, 56).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { localStorage.removeItem('tt_state'); this.scene.restart(); });
    o.add(btn);
  }

  evaluateQuarter() {
    const S = this.S;
    const profit = Math.round(S.cash - S.quarterStartCash);
    if (profit >= S.profitTarget) {
      // win
      S.quarter += 1;
      // increase rent for next quarter
      this.quarterRentIncrease = Math.round(RENT * 0.1 * (S.quarter - 1));
      // raise profit target
      S.profitTarget += 10;
      // reset quarter tracking
      S.quarterStartCash = S.cash;
      S.quarterWeeks = 0;
      this.showQuarterWin(profit);
    } else {
      // lose – use existing BANKRUPT overlay
      this.gameOver();
    }
    this.refreshTop();
  }

  showQuarterWin(profit) {
    const S = this.S;
    const overlay = this.add.container(0, 0).setDepth(200);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0d13, 0.88).fillRect(0, 0, 1280, 800);
    overlay.add([bg,
      this.add.text(640, 250, 'QUARTER WON', { fontFamily: 'Courier New', fontSize: '48px', color: '#66ff66', fontStyle: 'bold' }).setOrigin(0.5),
      this.add.text(640, 320, `Profit $${profit} met target $${S.profitTarget - 10}`, { fontFamily: 'Courier New', fontSize: '20px', color: '#eceff4' }).setOrigin(0.5),
      this.add.text(640, 380, `Next quarter rent ↑ $${this.quarterRentIncrease || 0}`, { fontFamily: 'Courier New', fontSize: '18px', color: '#ffbf00' }).setOrigin(0.5)
    ]);
    const btn = this.add.container(640, 460);
    const bbg = this.add.graphics();
    bbg.fillStyle(0xf5b942, 1).fillRoundedRect(-110, -28, 220, 56, 10);
    btn.add([bbg, this.add.text(0, 0, 'CONTINUE', { fontFamily: 'Courier New', fontSize: '20px', color: '#111111', fontStyle: 'bold' }).setOrigin(0.5)]);
    btn.setSize(220, 56).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      overlay.destroy();
    });
    overlay.add(btn);
  }


  // ----- persistence helpers -----
  _snapshot() {
    const S = this.S;
    return {
      cash: S.cash,
      day: S.day,
      week: S.week,
      speed: S.speed,
      revenue: S.revenue,
      spent: S.spent,
      roster: S.roster,
      subs: S.subs,
      departments: S.departments || [],
      staff: S.staff.map(st => ({ model: st.model, deskIndex: this.deskObjs.indexOf(st.desk) })),
      // jobs carry j.card (Phaser container) once rendered — strip to plain fields
      // or JSON.stringify throws on circular refs and _persist silently dies (D-001)
      jobs: S.jobs.map(j => ({ id: j.id, title: j.title, stars: j.stars, pay: j.pay })),
      nextJobIn: S.nextJobIn,
      jobSeq: S.jobSeq,
      done: S.done,
      failed: S.failed,
    };
  }

  _persist() {
    try { localStorage.setItem('tt_state', JSON.stringify(this._snapshot())); } catch(e) {}
  }

  _restoreFromSnapshot(saved) {
    this.S = freshState();
    this.S.cash = saved.cash;
    this.S.day = saved.day;
    this.S.week = saved.week;
    this.S.speed = saved.speed;
    this.updatePauseButton();
    this.S.revenue = saved.revenue;
    this.S.spent = saved.spent;
    this.S.roster = saved.roster || [];
    this.S.subs = saved.subs || {};
    this.S.departments = saved.departments || [];
    this.S.jobs = saved.jobs || [];
    this.S.nextJobIn = saved.nextJobIn;
    this.S.jobSeq = saved.jobSeq;
    this.S.done = saved.done;
    this.S.failed = saved.failed;
    if (Array.isArray(saved.staff)) {
      saved.staff.forEach(stSnap => {
        const desk = this.deskObjs[stSnap.deskIndex];
        if (!desk) return;
        const mid = stSnap.model;
        const spr = this.add.image(DOOR.x, DOOR.y + 20, 'p_' + mid + '0').setScale(3).setDepth(15);
        const st = { model: mid, desk, spr, busy: false, job: null, frame: 0, walkT: 0 };
        this.S.staff.push(st);
        desk.taken = true;
        desk.plate.setText(MODELS[mid].name.toUpperCase());
        spr.setInteractive({ useHandCursor: true });
        spr.on('pointerdown', () => this.fire(st));
        this.sitDown(st);
      });
    }
    this.refreshTop();
    this.renderSidebar();
  }

  // ----- test hooks -----
  exposeHooks() {
    window.__tt = {
      state: this.S,
      scene: this,
      buySub: (id) => this.buySub(id),
      hire: (mid) => this.hire(mid),
      fire: (st) => this.fire(st),
      spawnJob: (...a) => this.spawnJob(...a),
      assign: (jobId, deskIdx) => this.assignJob(jobId, this.deskObjs[deskIdx]),
      desks: this.deskObjs,
      cash: () => Math.round(this.S.cash),
      departments: this.S.departments,
      currentDept: this.currentDept,
      // Tangent event state for testing
      tangentActive: () => this.tangentActive,
    };
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280, height: 800,
  pixelArt: true, roundPixels: true,
  backgroundColor: '#0a0d13',
  scene: [Office],
});
