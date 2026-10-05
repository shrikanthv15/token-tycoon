/* TOKEN TYCOON v3 — "SURVIVE"
   Pixel-art office survival sim. Build your AI company, see how long you last.
   One room. One subscription. Revenue in, costs out. Drag jobs onto people.
*/
'use strict';

// ---------- data ----------
const SUBS = {
  claude: { name: 'Claude', price: 20, color: 0xd97757, css: '#d97757', h5: 400, wk: 2000 },
  codex:  { name: 'Codex',  price: 20, color: 0x10a37f, css: '#10a37f', h5: 300, wk: 1500 },
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
    // seated: torso + hands over the keyboard; hands jiggle while typing
    const hands = { 3: '....NN..NN..', 4: '...NN...NN...', 5: '....NN.NN...' }[frame];
    return rows.slice(0, 11).concat([hands]);
  }
  return rows;
}
const PAL = { H: [90, 60, 40], S: [235, 200, 170], T: null, P: [50, 70, 120], X: [40, 40, 45], N: [235, 200, 170] };

function bakePerson(scene, key, shirtHex) {
  for (let f = 0; f < 6; f++) {
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

// ---------- state ----------
function freshState() {
  return {
    cash: 100, day: 1, week: 1, dayT: 0, speed: 1, over: false,
    subs: {},          // id -> {h5, wk}
    staff: [],         // {model, desk, sprite, busy, job}
    jobs: [],          // inbox job cards {id,title,stars,pay,card}
    revenue: 0, spent: 0, nextJobIn: 8,
    jobSeq: 1, done: 0, failed: 0,
    departments: [],   // {name:string, desks:[deskIdx]}
  };
}

// ---------- scene ----------
class Office extends Phaser.Scene {
  constructor() { super('office'); }
  create() {
    this.S = freshState();
    this.currentDept = null;
    this.buildTextures();
    this.buildOffice();
    this.buildTopbar();
    this.buildSidebar();
    this.hint = this.add.text(475, 100, 'Buy a subscription (HIRE tab) → hire a model → drag jobs onto them',
      { fontFamily: 'Courier New', fontSize: '15px', color: '#f5b942', align: 'center' }).setOrigin(0.5).setDepth(50);
    this.time.delayedCall(12000, () => this.hint && this.hint.destroy(), [], this);
    this.exposeHooks();
  }

  // ----- textures -----
  buildTextures() {
    for (const [mid, m] of Object.entries(MODELS)) bakePerson(this, 'p_' + mid, SUBS[m.sub].color);
    // floor tile
    const ft = this.textures.createCanvas('tile', 32, 32), fc = ft.getContext();
    fc.fillStyle = '#3a3f4a'; fc.fillRect(0, 0, 32, 32);
    fc.fillStyle = '#343945'; fc.fillRect(0, 0, 16, 16); fc.fillRect(16, 16, 16, 16);
    fc.fillStyle = '#2c313b'; fc.fillRect(0, 31, 32, 1); fc.fillRect(31, 0, 1, 32);
    ft.refresh();
    // desk top
    const dt = this.textures.createCanvas('desk', 56, 28), dc = dt.getContext();
    dc.fillStyle = '#6b4a2f'; dc.fillRect(0, 0, 56, 28);
    dc.fillStyle = '#7d5a3a'; dc.fillRect(0, 0, 56, 6);
    dc.fillStyle = '#4a3220'; dc.fillRect(0, 26, 56, 2);
    dt.refresh();
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
    this.add.text(DOOR.x, OY + OH + 13, 'DOOR', { fontFamily: 'Courier New', fontSize: '12px', color: '#8b98ad' }).setOrigin(0.5);
    // desks
    // desks creation
    this.deskObjs = DESKS.map((d, i) => {
      const c = this.add.container(d.x, d.y).setDepth(10);
      const top = this.add.image(0, 0, 'desk').setDisplaySize(168, 84);
      // monitor (off to the left so the seated person is visible)
      const mon = this.add.graphics();
      mon.fillStyle(0x1a1e28, 1).fillRect(-78, -52, 52, 34);
      mon.fillStyle(0x58c4dc, 0.85).fillRect(-74, -48, 44, 26);
      mon.fillStyle(0x1a1e28, 1).fillRect(-56, -18, 8, 10);
      // keyboard (centered under the seated person's hands)
      const kb = this.add.graphics();
      kb.fillStyle(0xdfe6ee, 1).fillRect(-14, 22, 48, 12);
      kb.fillStyle(0x8b98ad, 1);
      for (let k = 0; k < 6; k++) kb.fillRect(-10 + k * 8, 24, 5, 8);
      // name plate
      const plate = this.add.text(0, 44, 'EMPTY DESK', { fontFamily: 'Courier New', fontSize: '11px', color: '#5a6578' }).setOrigin(0.5);
      c.add([top, mon, kb, plate]);
      const deskObj = { x: d.x, y: d.y, c, plate, taken: false, idx: i };
      // make desk interactive for department assignment
      c.setSize(168, 84).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => this.toggleDeskDept(i));
      return deskObj;
    });
    // office chairs at each desk (depth 8: behind seated staff at 9, in front of floor)
    DESKS.forEach(d => {
      const ch = this.add.graphics().setDepth(8);
      const x = d.x, b = d.y - 28;
      ch.fillStyle(0x2a3140, 1);
      ch.fillRect(x - 13, b - 64, 26, 48);   // backrest (peeks above the head)
      ch.fillRect(x - 17, b - 18, 34, 10);   // seat (tucks under the torso)
      ch.fillRect(x - 3, b - 8, 6, 20);       // post
      ch.fillRect(x - 16, b + 10, 32, 6);     // base
      ch.fillStyle(0x39424f, 1);
      ch.fillRect(x - 13, b - 64, 26, 8);     // backrest top highlight
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
    const mk = (x, label, cb) => {
      const b = this.add.container(x, 32);
      const bg = this.add.graphics();
      bg.fillStyle(0x1f2a3f, 1).fillRoundedRect(-30, -18, 60, 36, 6);
      const t = this.add.text(0, 0, label, { fontFamily: 'Courier New', fontSize: '16px', color: '#eceff4' }).setOrigin(0.5);
      b.add([bg, t]); b.setSize(60, 36).setInteractive({ useHandCursor: true });
      b.on('pointerdown', cb); b.on('pointerover', () => bg.clear().fillStyle(0x2a3852, 1).fillRoundedRect(-30, -18, 60, 36, 6));
      b.on('pointerout', () => bg.clear().fillStyle(0x1f2a3f, 1).fillRoundedRect(-30, -18, 60, 36, 6));
      return b;
    };
    mk(1080, 'II', () => this.S.speed = this.S.speed === 0 ? 1 : 0);
    mk(1150, '1×', () => this.S.speed = 1);
    mk(1220, '2×', () => this.S.speed = 2);
    this.refreshTop();
  }
  weeklyBurn() {
    let b = RENT;
    for (const id of Object.keys(this.S.subs)) b += SUBS[id].price;
    return b;
  }
  refreshTop() {
    const S = this.S;
    this.cashT.setText('$' + Math.round(S.cash));
    this.cashT.setColor(S.cash < 40 ? '#f87171' : '#4ade80');
    this.clockT.setText(`WEEK ${S.week} · DAY ${S.day}/7`);
    this.burnT.setText(`burn -$${this.weeklyBurn()}/wk`);
  }

  // ----- sidebar -----
  buildSidebar() {
    const SX = 950;
    const g = this.add.graphics();
    g.fillStyle(0x0e131c, 1).fillRect(SX, 64, 330, 736);
    g.lineStyle(1, 0x1f2a3f, 1).lineBetween(SX, 64, SX, 800);
    this.tab = 'inbox';
    const mkTab = (x, label, id) => {
      const t = this.add.text(x, 84, label, { fontFamily: 'Courier New', fontSize: '16px', color: '#8b98ad', fontStyle: 'bold' })
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { this.tab = id; this.renderSidebar(); });
      t.setData('id', id);
      return t;
    };
    this.tabInbox = mkTab(SX + 24, 'INBOX', 'inbox');
    this.tabHire = mkTab(SX + 130, 'HIRE', 'hire');
    this.tabDept = mkTab(SX + 236, 'DEPT', 'dept');
    this.sideC = this.add.container(0, 0).setDepth(20);
    this.renderSidebar();
  }
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
  renderInbox(SX) {
    const S = this.S;
    if (!S.jobs.length) {
      this.sideC.add(this.add.text(SX + 165, 300, 'No jobs yet.\nClients will ping you soon.',
        { fontFamily: 'Courier New', fontSize: '14px', color: '#5a6578', align: 'center' }).setOrigin(0.5));
      return;
    }
    S.jobs.forEach((j, i) => {
      const y = 130 + i * 96;
      const card = this.add.container(SX + 165, y);
      const bg = this.add.graphics();
      bg.fillStyle(0x121826, 1).fillRoundedRect(-145, -40, 290, 80, 8);
      bg.lineStyle(2, 0xf5b942, 1).strokeRoundedRect(-145, -40, 290, 80, 8);
      const title = this.add.text(-130, -28, j.title, { fontFamily: 'Courier New', fontSize: '14px', color: '#eceff4', fontStyle: 'bold' });
      const meta = this.add.text(-130, -4, '★'.repeat(j.stars) + `  $${j.pay}`, { fontFamily: 'Courier New', fontSize: '13px', color: '#8b98ad' });
      const hint = this.add.text(-130, 18, 'drag onto a person', { fontFamily: 'Courier New', fontSize: '11px', color: '#5a6578' });
      card.add([bg, title, meta, hint]);
      card.setInteractive(new Phaser.Geom.Rectangle(-145, -40, 290, 80), Phaser.Geom.Rectangle.Contains);
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
    let y = 130;
    for (const [sid, sub] of Object.entries(SUBS)) {
      const owned = !!S.subs[sid];
      const row = this.add.container(SX + 165, y);
      const bg = this.add.graphics();
      bg.fillStyle(0x121826, 1).fillRoundedRect(-145, -26, 290, 52, 8);
      bg.lineStyle(2, owned ? 0x4ade80 : 0x1f2a3f, 1).strokeRoundedRect(-145, -26, 290, 52, 8);
      row.add([bg,
        this.add.text(-130, -18, sub.name, { fontFamily: 'Courier New', fontSize: '15px', color: sub.css, fontStyle: 'bold' }),
        this.add.text(-130, 4, owned ? 'active' : `$${sub.price}/wk`, { fontFamily: 'Courier New', fontSize: '12px', color: '#8b98ad' }),
      ]);
      if (!owned) {
        const b = this.add.text(110, -8, '[ BUY ]', { fontFamily: 'Courier New', fontSize: '13px', color: '#f5b942', fontStyle: 'bold' })
          .setInteractive({ useHandCursor: true });
        b.on('pointerdown', () => this.buySub(sid));
        row.add(b);
      }
      this.sideC.add(row); y += 62;
      if (owned) {
        for (const mid of Object.keys(MODELS).filter(m => MODELS[m].sub === sid)) {
          const m = MODELS[mid];
          const hired = S.staff.some(s => s.model === mid);
          const mr = this.add.container(SX + 165, y);
          const mbg = this.add.graphics();
          mbg.fillStyle(0x0e131c, 1).fillRoundedRect(-135, -20, 270, 40, 6);
          mr.add([mbg,
            this.add.text(-120, -12, `${m.name}  ${'★'.repeat(m.cap)}`, { fontFamily: 'Courier New', fontSize: '13px', color: '#eceff4' }),
            this.add.text(-120, 6, hired ? 'hired' : 'click to hire → walks in',
              { fontFamily: 'Courier New', fontSize: '11px', color: hired ? '#4ade80' : '#5a6578' }),
          ]);
          if (!hired) {
            mr.setSize(270, 40).setInteractive({ useHandCursor: true });
            mr.on('pointerdown', () => this.hire(mid));
          }
          this.sideC.add(mr); y += 46;
        }
        y += 8;
      }
    }
    // staff list with fire buttons
    if (S.staff.length) {
      this.sideC.add(this.add.text(SX + 20, y, 'STAFF (click to fire):', { fontFamily: 'Courier New', fontSize: '12px', color: '#8b98ad' }));
      y += 24;
      S.staff.forEach(s => {
        const t = this.add.text(SX + 20, y, `• ${MODELS[s.model].name}`, { fontFamily: 'Courier New', fontSize: '13px', color: '#eceff4' })
          .setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => this.fire(s));
        this.sideC.add(t); y += 22;
      });
    }
  }

  // ----- department UI -----
  renderDept(SX) {
    const S = this.S;
    let y = 130;
    // List existing departments
    S.departments.forEach((dept, idx) => {
      const row = this.add.container(SX + 165, y);
      const bg = this.add.graphics();
      bg.fillStyle(0x121826, 1).fillRoundedRect(-145, -26, 290, 52, 8);
      bg.lineStyle(2, 0x4ade80, 1).strokeRoundedRect(-145, -26, 290, 52, 8);
      row.add([bg,
        this.add.text(-130, -18, dept.name, { fontFamily: 'Courier New', fontSize: '15px', color: '#eceff4', fontStyle: 'bold' }),
        this.add.text(-130, 4, `Desks: ${dept.desks.length}`, { fontFamily: 'Courier New', fontSize: '12px', color: '#8b98ad' })
      ]);
      // make row selectable
      row.setSize(290, 52).setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => this.setCurrentDept(dept));
      if (dept.unlocks && dept.unlocks.length) {
        const u = this.add.text(-130, 20, 'Unlocks: ' + dept.unlocks.join(', '), { fontFamily: 'Courier New', fontSize: '11px', color: '#5a6578' });
        row.add(u);
        y += 8;
      }
      this.sideC.add(row);
      y += 62;
    });
    // Button to create new department
    const newBtn = this.add.text(SX + 165, y, '[ CREATE DEPT ]', { fontFamily: 'Courier New', fontSize: '13px', color: '#f5b942', fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    newBtn.on('pointerdown', () => this.createDepartment());
    this.sideC.add(newBtn);
    // highlight selected dept name
    if (this.currentDept) {
      this.sideC.add(this.add.text(SX + 10, 100, 'Current: ' + this.currentDept.name, { fontFamily: 'Courier New', fontSize: '14px', color: '#f5b942' }));
    }
  }

  createDepartment() {
    const name = prompt('Enter department name:');
    if (!name) return;
    if (this.S.departments.some(d => d.name === name)) { alert('Name exists'); return; }
    this.S.departments.push({ name, desks: [], unlocks: ['batch', 'pool'] });
    // refresh DEPT view
    this.renderDept(950);
  }

  // ----- economy -----
  buySub(sid) {
    const S = this.S, sub = SUBS[sid];
    if (S.subs[sid] || S.cash < sub.price || S.over) return;
    S.cash -= sub.price; S.spent += sub.price;
    S.subs[sid] = { h5: sub.h5, wk: sub.wk };
    this.refreshTop(); this.renderSidebar();
  }
  hire(mid) {
    const S = this.S, m = MODELS[mid];
    if (!S.subs[m.sub] || S.staff.some(s => s.model === mid) || S.over) return;
    const desk = this.deskObjs.find(d => !d.taken);
    if (!desk) return; // no free desk
    desk.taken = true;
    desk.plate.setText(m.name.toUpperCase());
    // person walks in through the door
    const spr = this.add.image(DOOR.x, DOOR.y + 20, 'p_' + mid + '0').setScale(3).setDepth(15);
    const st = { model: mid, desk, spr, busy: false, job: null, frame: 0, walkT: 0 };
    S.staff.push(st);
    // click person to fire
    spr.setInteractive({ useHandCursor: true });
    spr.on('pointerdown', () => this.fire(st));
    // walk to desk
    this.tweens.add({
      targets: spr, x: desk.x, y: desk.y + 66, duration: 1400, ease: 'Linear',
      onUpdate: () => {
        st.walkT += 1;
        if (st.walkT % 12 === 0) { st.frame = st.frame === 1 ? 2 : 1; spr.setTexture('p_' + mid + st.frame); }
      },
      onComplete: () => {
        this.sitDown(st);
      },
    });
    this.renderSidebar();
  }
  sitDown(st) {
    // seated pose: torso+hands frame on the chair, gentle idle breathing
    const spr = st.spr, mid = st.model;
    spr.setTexture('p_' + mid + '3').setDepth(9);
    spr.y = st.desk.y - 64;
    if (st.idle) st.idle.stop();
    st.idle = this.tweens.add({
      targets: spr, y: st.desk.y - 66, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
  fire(st) {
    const S = this.S;
    if (st.busy || S.over) return;
    if (st.idle) st.idle.stop();
    S.staff = S.staff.filter(s => s !== st);
    st.desk.taken = false;
    st.desk.plate.setText('EMPTY DESK');
    st.spr.setDepth(15).setTexture('p_' + st.model + '0');
    this.tweens.add({
      targets: st.spr, x: DOOR.x, y: DOOR.y + 40, duration: 1200, ease: 'Linear',
      onComplete: () => st.spr.destroy(),
    });
    this.renderSidebar();
  }
  assignJob(jobId, deskObj) {
    const S = this.S;
    const st = S.staff.find(s => s.desk === deskObj);
    const j = S.jobs.find(x => x.id === jobId);
    if (!st || !j || st.busy || S.over) { this.renderSidebar(); return; }
    const m = MODELS[st.model], sub = S.subs[m.sub];
    let cost = Math.round(m.cost * (0.7 + 0.3 * j.stars));
    if (!sub || sub.h5 < cost || sub.wk < cost) {
      this.flashText(deskObj.x, deskObj.y - 118, 'POOL DRY', '#f87171');
      this.renderSidebar(); return;
    }
    // Department passive unlocks check
    if (this.currentDept && this.currentDept.unlocks.includes('batch')) {
      // batch processing reduces cost by 10%
      cost = Math.round(cost * 0.9);
    }
    sub.h5 -= cost; sub.wk -= cost;
    S.jobs = S.jobs.filter(x => x !== j);
    st.busy = true; st.job = j;
    // progress bar above person
    const bar = this.add.graphics().setDepth(30);
    st.bar = bar;
    const dur = (j.stars === 1 ? 40 : j.stars === 2 ? 65 : 100) * 1000;
    st.workT = 0; st.workDur = dur;
    // typing: hands alternate frames, body bounces at the keyboard
    if (st.idle) st.idle.stop();
    st.spr.y = st.desk.y - 64;
    st.spr.setTexture('p_' + st.model + '4');
    st.typeT = 0; st.typeF = 4;
    st.bounce = this.tweens.add({ targets: st.spr, y: '-=4', duration: 180, yoyo: true, repeat: -1 });
    this.renderSidebar();
  }
  completeJob(st, success) {
    const S = this.S, j = st.job;
    if (st.bounce) st.bounce.stop();
    st.busy = false; st.job = null;
    if (st.bar) { st.bar.destroy(); st.bar = null; }
    this.sitDown(st);
    if (success) {
      S.cash += j.pay; S.revenue += j.pay; S.done++;
      this.flashText(st.desk.x, st.desk.y - 118, `+$${j.pay}`, '#4ade80');
      this.tweens.add({ targets: st.spr, y: '-=10', duration: 160, yoyo: true, repeat: 1 }); // happy hop
    } else {
      S.failed++;
      this.flashText(st.desk.x, st.desk.y - 118, 'FAILED', '#f87171');
    }
    this.refreshTop();
  }
  flashText(x, y, msg, color) {
    const t = this.add.text(x, y, msg, { fontFamily: 'Courier New', fontSize: '18px', color, fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }
  spawnJob(stars, pay) {
    const S = this.S;
    if (S.jobs.length >= 5 || S.over) return;
    stars = stars || (1 + Math.floor(Math.random() * 3));
    pay = pay || (stars === 1 ? 8 + Math.floor(Math.random() * 5) : stars === 2 ? 15 + Math.floor(Math.random() * 11) : 30 + Math.floor(Math.random() * 21));
    S.jobs.push({ id: S.jobSeq++, title: JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)], stars, pay });
    if (this.tab === 'inbox') this.renderSidebar();
  }

  // ----- main loop -----
  update(time, delta) {
    const S = this.S;
    if (S.over || S.speed === 0) return;
    const dt = (delta / 1000) * S.speed;
    // clock
    S.dayT += dt;
    if (S.dayT >= DAY_LEN) {
      S.dayT = 0; S.day++;
      if (S.day > DAYS_PER_WEEK) {
        S.day = 1; S.week++;
        this.weeklyTick();
      }
      this.refreshTop();
    }
    // job spawner
    S.nextJobIn -= dt;
    if (S.nextJobIn <= 0) { this.spawnJob(); S.nextJobIn = 18 + Math.random() * 14; }
    // work progress
    for (const st of S.staff) {
      if (!st.busy) continue;
      // typing hands: alternate the two typing frames
      st.typeT = (st.typeT || 0) + delta * S.speed;
      if (st.typeT > 160) {
        st.typeT = 0;
        st.typeF = st.typeF === 4 ? 5 : 4;
        st.spr.setTexture('p_' + st.model + st.typeF);
      }
      st.workT += delta * S.speed;
      const p = Math.min(1, st.workT / st.workDur);
      const g = st.bar; g.clear();
      g.fillStyle(0x1f2a3f, 1).fillRect(st.desk.x - 30, st.desk.y - 100, 60, 8);
      g.fillStyle(0xf5b942, 1).fillRect(st.desk.x - 30, st.desk.y - 100, 60 * p, 8);
      if (p >= 1) {
        const m = MODELS[st.model], j = st.job;
        const fit = m.cap - j.stars; // >=0 good
        const fail = Math.max(0.03, 0.10 - fit * 0.06 + (j.stars - 1) * 0.03);
        this.completeJob(st, Math.random() > fail);
      }
    }
  }
  weeklyTick() {
    const S = this.S;
    const burn = this.weeklyBurn();
    S.cash -= burn; S.spent += burn;
    // reset weekly pools
    for (const [sid, p] of Object.entries(S.subs)) { p.h5 = SUBS[sid].h5; p.wk = SUBS[sid].wk; }
    // apply shared pool boost from departments
    if (this.S.departments.some(d => d.unlocks && d.unlocks.includes('pool'))) {
      for (const [sid, p] of Object.entries(S.subs)) {
        // increase both pools by 10%
        p.h5 = Math.round(p.h5 * 1.1);
        p.wk = Math.round(p.wk * 1.1);
      }
    }
    if (S.cash < 0) return this.gameOver();
    this.flashText(475, 400, `WEEK ${S.week} — bills paid: $${burn}`, '#f5b942');
    this.refreshTop();
  }
  gameOver() {
    const S = this.S;
    S.over = true;
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
    btn.on('pointerdown', () => this.scene.restart());
    o.add(btn);
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
