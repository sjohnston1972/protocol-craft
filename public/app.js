/* ============================================================
   Protocol Craft — game
   Vanilla JS, no dependencies. Loads data/recipes.json, runs the
   craft-to-discover loop, persists to localStorage.
   ============================================================ */
'use strict';

const TIER_ORDER = ['starting', 'concept', 'L2', 'L2.5', 'L3', 'L4', 'L5', 'L6', 'L7', 'disaster'];
const TIER_VAR = {
  starting: '--t-starting', concept: '--t-concept', L2: '--t-L2', 'L2.5': '--t-L2_5',
  L3: '--t-L3', L4: '--t-L4', L5: '--t-L5', L6: '--t-L6', L7: '--t-L7', disaster: '--t-disaster',
};
const MISS_LINES = [
  'Nothing routable here.', 'No route to host.', "These two won't negotiate.",
  'Connection refused.', 'Destination unreachable.', 'No such protocol — try another pair.',
  'Request timed out.',
];
const SUMMIT = 'HTTPS';
const STORE = { discovered: 'pc.discovered.v1', board: 'pc.board.v1' };

const els = {
  shelf: document.getElementById('shelf'),
  shelfList: document.getElementById('shelfList'),
  search: document.getElementById('search'),
  board: document.getElementById('board'),
  boardHint: document.getElementById('boardHint'),
  counterNum: document.getElementById('counterNum'),
  counter: document.getElementById('counter'),
  toastStack: document.getElementById('toastStack'),
  discoveryLayer: document.getElementById('discoveryLayer'),
  labnotes: document.getElementById('labnotes'),
  labnotesBody: document.getElementById('labnotesBody'),
  drawerScrim: document.getElementById('drawerScrim'),
  hintBtn: document.getElementById('hintBtn'),
  labBtn: document.getElementById('labBtn'),
  labClose: document.getElementById('labClose'),
  archiveBtn: document.getElementById('archiveBtn'),
  archive: document.getElementById('archive'),
  archiveBody: document.getElementById('archiveBody'),
  archiveClose: document.getElementById('archiveClose'),
  resetBtn: document.getElementById('resetBtn'),
  confirmScrim: document.getElementById('confirmScrim'),
  confirmCancel: document.getElementById('confirmCancel'),
  confirmReset: document.getElementById('confirmReset'),
  landing: document.getElementById('landing'),
  landingContent: document.getElementById('landingContent'),
  founderStage: document.getElementById('founderStage'),
  enterBtn: document.getElementById('enterBtn'),
};

const DB = {
  elements: {},          // name -> { tier, standard, discovery, milestone }
  recipes: new Map(),    // "a\0b" (sorted) -> result
  byResult: new Map(),   // result -> [[a,b], ...]
  ingredients: new Set(),// every name that appears as a recipe input
  starting: [],
};
const state = {
  discovered: new Set(),
  board: [],           // { id, name, x, y, el }
  nextId: 1,
};

/* ---------- data ---------- */
const pairKey = (a, b) => (a < b ? a + '\0' + b : b + '\0' + a);

async function loadData() {
  const res = await fetch('data/recipes.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Could not load recipes.json (' + res.status + ')');
  const data = await res.json();
  DB.elements = data.elements;
  DB.starting = data.startingElements;
  for (const r of data.recipes) {
    DB.recipes.set(pairKey(r.a, r.b), r.result);
    if (!DB.byResult.has(r.result)) DB.byResult.set(r.result, []);
    DB.byResult.get(r.result).push([r.a, r.b]);
    DB.ingredients.add(r.a);
    DB.ingredients.add(r.b);
  }
}

// a dead end is an element that no recipe accepts as an ingredient
const isDeadEnd = (name) => !DB.ingredients.has(name);

const tierOf = (name) => (DB.elements[name] && DB.elements[name].tier) || 'L3';
const tierColor = (name) => `var(${TIER_VAR[tierOf(name)] || '--t-L3'})`;

/* ---------- chip factory ---------- */
function makeChip(name) {
  const meta = DB.elements[name] || {};
  const tier = tierOf(name);
  const chip = document.createElement('div');
  chip.className = 'chip';
  if (meta.milestone) chip.classList.add('ms');
  if (tier === 'disaster') chip.classList.add('dis');
  if (name === SUMMIT) chip.classList.add('summit');
  chip.style.setProperty('--c', tierColor(name));
  chip.dataset.name = name;
  const n = document.createElement('span');
  n.className = 'name mono';
  n.textContent = name;
  chip.appendChild(n);
  return chip;
}

/* ---------- shelf ---------- */
function renderShelf() {
  const q = els.search.value.trim().toLowerCase();
  const names = [...state.discovered]
    .filter((n) => !isDeadEnd(n))
    .filter((n) => !q || n.toLowerCase().includes(q))
    .sort((a, b) => {
      const ta = TIER_ORDER.indexOf(tierOf(a));
      const tb = TIER_ORDER.indexOf(tierOf(b));
      return ta - tb || a.localeCompare(b);
    });

  els.shelfList.textContent = '';
  let lastTier = null;
  for (const name of names) {
    const tier = tierOf(name);
    if (tier !== lastTier) {
      const lbl = document.createElement('div');
      lbl.className = 'tier-label';
      lbl.textContent = tier === 'starting' ? 'starting elements' : tier;
      els.shelfList.appendChild(lbl);
      lastTier = tier;
    }
    const chip = makeChip(name);
    chip.setAttribute('role', 'listitem');
    attachShelfDrag(chip, name);
    els.shelfList.appendChild(chip);
  }
  updateArchiveBtn();
}

/* drag a shelf chip onto the board (a plain tap still spawns it) */
function attachShelfDrag(chip, name) {
  chip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const pid = e.pointerId, sx = e.clientX, sy = e.clientY;
    let ghost = null;
    try { chip.setPointerCapture(pid); } catch (_) {}
    e.preventDefault();

    const move = (ev) => {
      if (ev.pointerId !== pid) return;
      if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
        cancelTip(); hideTip();
        ghost = makeChip(name);
        ghost.classList.add('drag-ghost');
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
      }
    };
    const finish = (ev, drop) => {
      if (ev.pointerId !== pid) return;
      chip.removeEventListener('pointermove', move);
      chip.removeEventListener('pointerup', up);
      chip.removeEventListener('pointercancel', cancel);
      try { chip.releasePointerCapture(pid); } catch (_) {}
      if (!ghost) { if (drop) spawnFromShelf(name); return; }
      ghost.remove(); ghost = null;
      if (!drop) return;
      const r = boardRect();
      if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
        addInstance(name, ev.clientX - r.left, ev.clientY - r.top, 'spawn');
        saveBoard();
      }
    };
    const up = (ev) => finish(ev, true);
    const cancel = (ev) => finish(ev, false);
    chip.addEventListener('pointermove', move);
    chip.addEventListener('pointerup', up);
    chip.addEventListener('pointercancel', cancel);
  });
}

function flashShelf(name) {
  const chip = els.shelfList.querySelector(`.chip[data-name="${cssEscape(name)}"]`);
  if (chip) {
    chip.classList.remove('highlight'); void chip.offsetWidth;
    chip.classList.add('highlight');
    chip.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}
const cssEscape = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/"/g, '\\"'));

/* ---------- board instances ---------- */
function boardRect() { return els.board.getBoundingClientRect(); }

function addInstance(name, x, y, animClass) {
  const inst = { id: state.nextId++, name, x, y, el: null };
  const chip = makeChip(name);
  chip.classList.add('instance');
  if (animClass) chip.classList.add(animClass);
  chip.style.left = x + 'px';
  chip.style.top = y + 'px';
  chip.style.transform = 'translate(-50%,-50%)';
  inst.el = chip;
  attachDrag(inst);
  els.board.appendChild(chip);
  state.board.push(inst);
  hideHint();
  return inst;
}

function spawnFromShelf(name) {
  const r = boardRect();
  const cx = r.width * (0.42 + Math.random() * 0.16);
  const cy = r.height * (0.4 + Math.random() * 0.2);
  addInstance(name, cx, cy, 'spawn');
  saveBoard();
}

function removeInstance(inst, poof) {
  const done = () => { inst.el.remove(); };
  state.board = state.board.filter((b) => b !== inst);
  if (poof) { inst.el.classList.add('poof'); setTimeout(done, 220); }
  else done();
}

function hideHint() { els.boardHint.classList.add('gone'); }
function maybeShowHint() { if (state.board.length === 0) els.boardHint.classList.remove('gone'); }

/* ---------- drag + tap to combine ---------- */
function attachDrag(inst) {
  const el = inst.el;
  let startX = 0, startY = 0, originX = 0, originY = 0, moved = false, dragging = false, pid = null;

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pid = e.pointerId;
    startX = e.clientX; startY = e.clientY;
    originX = inst.x; originY = inst.y;
    moved = false; dragging = true;
    el.setPointerCapture(pid);
    el.classList.add('dragging');
    bringToFront(inst);
    e.preventDefault();
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!moved && Math.hypot(dx, dy) > 5) moved = true;
    inst.x = originX + dx; inst.y = originY + dy;
    el.style.left = inst.x + 'px';
    el.style.top = inst.y + 'px';
    highlightTarget(inst);
    els.shelf.classList.toggle('drop-remove', overShelf(e));
  });

  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== pid) return;
    dragging = false;
    el.classList.remove('dragging');
    try { el.releasePointerCapture(pid); } catch (_) {}
    clearTargets();
    els.shelf.classList.remove('drop-remove');
    if (moved) {
      if (overShelf(e)) {
        // dropped back on the shelf — clear it from the board
        const name = inst.name;
        removeInstance(inst, true);
        if (!isDeadEnd(name)) flashShelf(name);
        saveBoard();
        maybeShowHint();
        return;
      }
      const target = findOverlap(inst);
      if (target) { combine(inst, target); }
      else { clampInstance(inst); saveBoard(); }
    } else {
      cancelTip(); hideTip();
      showInfoCard(inst.name);
    }
  });

  el.addEventListener('pointercancel', () => {
    dragging = false; el.classList.remove('dragging'); clearTargets();
    els.shelf.classList.remove('drop-remove');
  });
}

function overShelf(e) {
  const r = els.shelf.getBoundingClientRect();
  return e.clientX <= r.right && e.clientY >= r.top;
}

function bringToFront(inst) {
  let max = 1;
  for (const b of state.board) max = Math.max(max, +b.el.style.zIndex || 1);
  inst.el.style.zIndex = max + 1;
}
function clampInstance(inst) {
  const r = boardRect(); const m = 8;
  inst.x = Math.max(m, Math.min(r.width - m, inst.x));
  inst.y = Math.max(m, Math.min(r.height - m, inst.y));
  inst.el.style.left = inst.x + 'px';
  inst.el.style.top = inst.y + 'px';
}

function findOverlap(inst) {
  const a = inst.el.getBoundingClientRect();
  let best = null, bestArea = 0;
  for (const b of state.board) {
    if (b === inst) continue;
    const rb = b.el.getBoundingClientRect();
    const ox = Math.max(0, Math.min(a.right, rb.right) - Math.max(a.left, rb.left));
    const oy = Math.max(0, Math.min(a.bottom, rb.bottom) - Math.max(a.top, rb.top));
    const area = ox * oy;
    if (area > bestArea && area > 200) { best = b; bestArea = area; }
  }
  return best;
}
function highlightTarget(inst) {
  clearTargets();
  const t = findOverlap(inst);
  if (t) t.el.classList.add('target');
}
function clearTargets() {
  for (const b of state.board) b.el.classList.remove('target');
}

/* ---------- combine ---------- */
async function combine(instA, instB) {
  const a = instA.name, b = instB.name;
  const midX = (instA.x + instB.x) / 2, midY = (instA.y + instB.y) / 2;
  let result = DB.recipes.get(pairKey(a, b));

  // ---- v2 extension point ---------------------------------------------
  // Off-recipe pairs currently just miss. A future version could ask a
  // server-side AI to invent a networking-flavoured result here. It is
  // intentionally dormant: the game makes NO external calls today.
  if (!result) {
    result = await tryLiveAICombine(a, b);   // always null for now
  }
  // ---------------------------------------------------------------------

  if (!result) {
    floater(midX, midY, MISS_LINES[(Math.random() * MISS_LINES.length) | 0]);
    nudgeApart(instA, instB);
    saveBoard();
    return;
  }

  const isNew = !state.discovered.has(result);
  const dead = isDeadEnd(result);
  removeInstance(instA, true);
  removeInstance(instB, true);
  const inst = addInstance(result, midX, midY, 'reveal');

  if (isNew) {
    state.discovered.add(result);
    saveDiscovered();
    renderShelf();
    renderLabNotes();
    bumpCounter();
    // dead ends leave the board for the archive once the announcement is dismissed
    showDiscoveryCard(result, a, b, dead ? inst : null);
  } else if (dead) {
    floater(midX, midY, 'Dead end — already archived.');
    setTimeout(() => {
      if (state.board.includes(inst)) { removeInstance(inst, true); saveBoard(); maybeShowHint(); }
    }, 1100);
  } else {
    flashShelf(result);
  }
  clampInstance(inst);
  saveBoard();
}

// Dormant by design — see combine(). Returns null; never calls out.
async function tryLiveAICombine(/* a, b */) { return null; }

function nudgeApart(a, b) {
  const push = (inst, dir) => { inst.x += dir * 26; clampInstance(inst); };
  push(a, -1); push(b, 1);
}

/* ---------- counter ---------- */
function discoveryCount() {
  let n = 0;
  for (const name of state.discovered) if (!DB.starting.includes(name)) n++;
  return n;
}
function updateCounter() { els.counterNum.textContent = discoveryCount(); }
function bumpCounter() {
  updateCounter();
  els.counterNum.classList.remove('bump'); void els.counterNum.offsetWidth;
  els.counterNum.classList.add('bump');
}

/* ---------- hints ---------- */
function availableNewRecipes() {
  const out = [];
  for (const [key, result] of DB.recipes) {
    if (state.discovered.has(result)) continue;
    const i = key.indexOf('\0');
    const a = key.slice(0, i), b = key.slice(i + 1);
    if (state.discovered.has(a) && state.discovered.has(b)) out.push({ a, b, result });
  }
  return out;
}
let lastHint = null;
function hintNext() {
  const avail = availableNewRecipes();
  if (!avail.length) {
    toast(`<div><div class="t-kicker">hints</div><div class="t-name">Nothing left — you've discovered it all.</div></div>`, 'hint', 4000);
    return;
  }
  // nudge toward foundations: prefer the lowest-tier result, random within that band
  let minTier = Infinity;
  for (const r of avail) minTier = Math.min(minTier, TIER_ORDER.indexOf(tierOf(r.result)));
  let band = avail.filter((r) => TIER_ORDER.indexOf(tierOf(r.result)) === minTier);
  if (band.length > 1 && lastHint) {
    const f = band.filter((r) => r.a + '+' + r.b !== lastHint);
    if (f.length) band = f;
  }
  const pick = band[(Math.random() * band.length) | 0];
  lastHint = pick.a + '+' + pick.b;

  els.search.value = '';        // make sure both ingredients are visible
  renderShelf();
  flashShelf(pick.a);
  if (pick.b !== pick.a) flashShelf(pick.b);

  const layer = tierOf(pick.result);
  const where = layer === 'disaster' ? 'a disaster' : 'something at ' + layer;
  const pair = pick.a === pick.b
    ? `two <b>${esc(pick.a)}</b>`
    : `<b>${esc(pick.a)}</b> + <b>${esc(pick.b)}</b>`;
  toast(`<span class="t-dot" style="--c:${tierColor(pick.result)}"></span>
    <div><div class="t-kicker">hint · makes ${where}</div>
    <div class="t-name" style="--c:${tierColor(pick.result)}">${pair}</div></div>`, 'hint', 5200);
}

/* ---------- floaters / toasts / discovery card ---------- */
function floater(x, y, text) {
  const f = document.createElement('div');
  f.className = 'floater';
  f.textContent = text;
  f.style.left = x + 'px'; f.style.top = y + 'px';
  els.board.appendChild(f);
  setTimeout(() => f.remove(), 1400);
}

function toast(html, cls, ms) {
  const t = document.createElement('div');
  t.className = 'toast ' + (cls || '');
  t.innerHTML = html;
  els.toastStack.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 360);
  }, ms || 3200);
}
/* full-screen discovery announcement — stays up until the user clicks */
let pendingArchiveInst = null;
let overlayShownAt = 0; // the tap that opens the overlay also fires a click; ignore it

function totalDiscoverable() {
  let n = 0;
  for (const name in DB.elements) if (!DB.starting.includes(name)) n++;
  return n;
}

function renderElementOverlay(name, opts) {
  const meta = DB.elements[name] || {};
  const tier = tierOf(name);
  els.discoveryLayer.classList.remove('out');
  els.discoveryLayer.innerHTML = `
    <div class="dscrim"></div>
    <div class="dstage" style="--c:${tierColor(name)}">
      <div class="dring"></div><div class="dring r2"></div><div class="dring r3"></div>
      <div class="dcard${name === SUMMIT ? ' is-summit' : ''}" style="--c:${tierColor(name)}">
        <div class="dc-kicker">${opts.kicker}</div>
        <div class="dc-name">${esc(name)}</div>
        ${name === SUMMIT && opts.isNew ? '<div class="dc-summitline">You reached the top of the stack.</div>' : ''}
        <div class="dc-badges">
          <span class="dc-layer">${tier}</span>
          ${meta.standard ? `<span class="dc-std mono">${esc(meta.standard)}</span>` : ''}
          ${meta.milestone ? '<span class="dc-msbadge">milestone</span>' : ''}
        </div>
        ${meta.spec ? `<div class="dc-spec mono">${esc(meta.spec)}</div>` : ''}
        <div class="dc-desc">${meta.discovery || ''}</div>
        ${Array.isArray(meta.examples) && meta.examples.length ? `
        <div class="dc-examples">
          <div class="dc-ex-label">for instance</div>
          ${meta.examples.map((x) => `<div class="dc-ex">${esc(x)}</div>`).join('')}
        </div>` : ''}
        ${opts.deadNotice || ''}
        <div class="dc-divider"></div>
        <div class="dc-recipes">${opts.recipesHTML || ''}</div>
        <div class="dc-progress">discovery ${discoveryCount()} of ${totalDiscoverable()}</div>
      </div>
      <div class="dc-continue">click anywhere to continue</div>
    </div>`;
  els.discoveryLayer.classList.add('active');
  overlayShownAt = performance.now();
}

const recipeRow = (a, b, result) =>
  `<div class="dc-recipe mono"><b>${esc(a)}</b><span class="op">+</span><b>${esc(b)}</b><span class="op">→</span><span class="res">${esc(result)}</span></div>`;

function showDiscoveryCard(name, a, b, archiveInst) {
  const meta = DB.elements[name] || {};
  const tier = tierOf(name);
  const dead = isDeadEnd(name);
  pendingArchiveInst = archiveInst || null;
  renderElementOverlay(name, {
    isNew: true,
    kicker: name === SUMMIT ? 'the summit'
      : tier === 'disaster' ? 'disaster discovered'
      : meta.milestone ? 'milestone discovery' : 'new discovery',
    deadNotice: dead ? `<div class="dc-archived">Dead end — nothing combines with ${esc(name)}. Filed to the Archive.</div>` : '',
    recipesHTML: recipeRow(a, b, name),
  });
}

/* tap a board chip to read its full-screen entry */
function showInfoCard(name) {
  const meta = DB.elements[name] || {};
  const tier = tierOf(name);
  pendingArchiveInst = null;
  const kicker = DB.starting.includes(name) ? 'starting element'
    : tier === 'disaster' ? 'disaster' : meta.milestone ? 'milestone' : 'lab entry';
  let recipesHTML;
  if (DB.starting.includes(name)) {
    recipesHTML = '<div class="dc-recipe mono"><span class="op">one of the eight you started with</span></div>';
  } else {
    const recipes = DB.byResult.get(name) || [];
    recipesHTML = recipes.slice(0, 3).map(([a, b]) => recipeRow(a, b, name)).join('');
    if (recipes.length > 3) recipesHTML += `<div class="dc-more">+${recipes.length - 3} more recipe${recipes.length - 3 > 1 ? 's' : ''}</div>`;
  }
  renderElementOverlay(name, { isNew: false, kicker, recipesHTML });
}

function dismissCard() {
  if (!els.discoveryLayer.classList.contains('active')) return;
  els.discoveryLayer.classList.remove('active');
  els.discoveryLayer.classList.add('out');
  if (pendingArchiveInst) {
    const inst = pendingArchiveInst;
    pendingArchiveInst = null;
    if (state.board.includes(inst)) {
      removeInstance(inst, true);
      saveBoard();
      maybeShowHint();
    }
  }
  setTimeout(() => {
    els.discoveryLayer.textContent = '';
    els.discoveryLayer.classList.remove('out');
  }, 380);
}

/* ---------- Lab Notes ---------- */
function renderLabNotes() {
  const names = [...state.discovered].sort((a, b) => {
    const ta = TIER_ORDER.indexOf(tierOf(a));
    const tb = TIER_ORDER.indexOf(tierOf(b));
    return ta - tb || a.localeCompare(b);
  });
  els.labnotesBody.textContent = '';
  if (names.length === 0) {
    els.labnotesBody.innerHTML = '<div class="ln-empty">Nothing discovered yet.</div>';
    return;
  }
  let lastTier = null;
  for (const name of names) {
    const tier = tierOf(name);
    if (tier !== lastTier) {
      const h = document.createElement('div');
      h.className = 'ln-tier';
      h.textContent = tier === 'starting' ? 'starting elements' : tier;
      els.labnotesBody.appendChild(h);
      lastTier = tier;
    }
    const meta = DB.elements[name] || {};
    const item = document.createElement('div');
    item.className = 'ln-item';
    item.style.setProperty('--c', tierColor(name));
    item.innerHTML = `
      <div class="ln-row">
        <span class="ln-dot"></span>
        <span class="ln-name">${name}</span>
        ${meta.standard ? `<span class="ln-std mono">${meta.standard}</span>` : ''}
      </div>
      ${meta.discovery ? `<div class="ln-desc">${meta.discovery}</div>` : ''}
      ${meta.spec ? `<div class="ln-spec mono">${meta.spec}</div>` : ''}`;
    els.labnotesBody.appendChild(item);
  }
}
function openLab() {
  closeArchive();
  renderLabNotes();
  els.labnotes.hidden = false;
  els.drawerScrim.hidden = false;
  els.labBtn.setAttribute('aria-pressed', 'true');
}
function closeLab() {
  els.labnotes.hidden = true;
  if (els.archive.hidden) els.drawerScrim.hidden = true;
  els.labBtn.setAttribute('aria-pressed', 'false');
}

/* ---------- Archive (dead-end discoveries) ---------- */
function archivedNames() {
  return [...state.discovered].filter(isDeadEnd).sort((a, b) => {
    const ta = TIER_ORDER.indexOf(tierOf(a));
    const tb = TIER_ORDER.indexOf(tierOf(b));
    return ta - tb || a.localeCompare(b);
  });
}
function updateArchiveBtn() {
  const n = archivedNames().length;
  els.archiveBtn.textContent = n ? `Archive (${n})` : 'Archive';
}
function renderArchive() {
  const names = archivedNames();
  els.archiveBody.textContent = '';
  if (names.length === 0) {
    els.archiveBody.innerHTML = '<div class="ln-empty">No dead ends yet. They land here when a discovery combines with nothing further.</div>';
    return;
  }
  let lastTier = null;
  for (const name of names) {
    const tier = tierOf(name);
    if (tier !== lastTier) {
      const h = document.createElement('div');
      h.className = 'ln-tier';
      h.textContent = tier;
      els.archiveBody.appendChild(h);
      lastTier = tier;
    }
    const meta = DB.elements[name] || {};
    const item = document.createElement('div');
    item.className = 'ln-item';
    item.style.setProperty('--c', tierColor(name));
    item.innerHTML = `
      <div class="ln-row">
        <span class="ln-dot"></span>
        <span class="ln-name">${name}</span>
        ${meta.standard ? `<span class="ln-std mono">${meta.standard}</span>` : ''}
      </div>
      ${meta.discovery ? `<div class="ln-desc">${meta.discovery}</div>` : ''}
      ${meta.spec ? `<div class="ln-spec mono">${meta.spec}</div>` : ''}`;
    els.archiveBody.appendChild(item);
  }
}
function openArchive() {
  closeLab();
  renderArchive();
  els.archive.hidden = false;
  els.drawerScrim.hidden = false;
  els.archiveBtn.setAttribute('aria-pressed', 'true');
}
function closeArchive() {
  els.archive.hidden = true;
  if (els.labnotes.hidden) els.drawerScrim.hidden = true;
  els.archiveBtn.setAttribute('aria-pressed', 'false');
}

/* ---------- hover stats tooltip ---------- */
const tip = document.createElement('div');
tip.className = 'tip';
tip.setAttribute('hidden', '');
document.body.appendChild(tip);
let tipName = null;

function tipHTML(name) {
  const meta = DB.elements[name] || {};
  const tier = tierOf(name);
  const isStart = DB.starting.includes(name);
  const badge = meta.milestone ? '<span class="tip-badge">milestone</span>'
    : tier === 'disaster' ? '<span class="tip-badge">disaster</span>' : '';
  const recipes = DB.byResult.get(name) || [];
  let from;
  if (isStart) {
    from = 'a starting element';
  } else {
    const shown = recipes.slice(0, 3).map(([a, b]) => `<b>${esc(a)}</b> + <b>${esc(b)}</b>`).join('<br>');
    const extra = recipes.length > 3 ? `<div class="more">+${recipes.length - 3} more recipe${recipes.length - 3 > 1 ? 's' : ''}</div>` : '';
    from = shown + extra;
  }
  return `
    <div class="tip-row">
      <span class="tip-name">${esc(name)}</span>
      ${meta.standard ? `<span class="tip-std mono">${esc(meta.standard)}</span>` : ''}
      ${badge}
      <span class="tip-layer">${tier}</span>
    </div>
    ${meta.spec ? `<div class="tip-spec">${esc(meta.spec)}</div>` : ''}
    ${meta.discovery ? `<div class="tip-desc">${esc(meta.discovery)}</div>` : ''}
    <div class="tip-from">${from}</div>`;
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function showTip(name, chip) {
  if (tipName === name && !tip.hidden) { positionTip(chip); return; }
  tipName = name;
  tip.style.setProperty('--c', tierColor(name));
  tip.innerHTML = tipHTML(name);
  tip.hidden = false;
  positionTip(chip);
  requestAnimationFrame(() => tip.classList.add('show'));
}
function positionTip(chip) {
  const r = chip.getBoundingClientRect();
  const tw = tip.offsetWidth, th = tip.offsetHeight, gap = 10, pad = 8;
  let left = r.left + r.width / 2 - tw / 2;
  left = Math.max(pad, Math.min(window.innerWidth - tw - pad, left));
  let top = r.top - th - gap;                 // prefer above
  if (top < pad) top = r.bottom + gap;        // else below
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}
function hideTip() {
  tipName = null;
  tip.classList.remove('show');
  tip.hidden = true;
}

let tipTimer = null, pendingName = null;
function scheduleTip(name, chip) {
  if (tip.classList.contains('show') && tipName === name) return; // already showing it
  if (pendingName === name) return;                               // already queued for it
  clearTimeout(tipTimer);
  pendingName = name;
  // wait before first appearance; once one is up, switch between chips faster
  const delay = tip.classList.contains('show') ? 120 : 420;
  tipTimer = setTimeout(() => { pendingName = null; showTip(name, chip); }, delay);
}
function cancelTip() { clearTimeout(tipTimer); pendingName = null; }

function setupTooltip() {
  document.addEventListener('mouseover', (e) => {
    const chip = e.target.closest && e.target.closest('.chip[data-name]');
    if (!chip || chip.classList.contains('dragging')) return;
    scheduleTip(chip.dataset.name, chip);
  });
  document.addEventListener('mouseout', (e) => {
    const chip = e.target.closest && e.target.closest('.chip[data-name]');
    if (!chip) return;
    const to = e.relatedTarget;
    if (to && to.closest && to.closest('.chip[data-name]') === chip) return;
    cancelTip(); hideTip();
  });
  // never let the tip linger or fire over a drag or scroll
  document.addEventListener('pointerdown', () => { cancelTip(); hideTip(); }, true);
  els.shelfList.addEventListener('scroll', () => { cancelTip(); hideTip(); }, { passive: true });
  window.addEventListener('blur', () => { cancelTip(); hideTip(); });
}

/* ---------- persistence ---------- */
function saveDiscovered() {
  try { localStorage.setItem(STORE.discovered, JSON.stringify([...state.discovered])); } catch (_) {}
}
function saveBoard() {
  try {
    const b = state.board.map((i) => ({ name: i.name, x: Math.round(i.x), y: Math.round(i.y) }));
    localStorage.setItem(STORE.board, JSON.stringify(b));
  } catch (_) {}
}
function loadState() {
  let disc = null, board = null;
  try { disc = JSON.parse(localStorage.getItem(STORE.discovered) || 'null'); } catch (_) {}
  try { board = JSON.parse(localStorage.getItem(STORE.board) || 'null'); } catch (_) {}

  state.discovered = new Set(DB.starting);
  if (Array.isArray(disc)) for (const n of disc) if (DB.elements[n]) state.discovered.add(n);

  renderShelf();
  if (Array.isArray(board)) {
    for (const it of board) {
      if (DB.elements[it.name] && state.discovered.has(it.name) && !isDeadEnd(it.name)) {
        addInstance(it.name, it.x, it.y, null);
      }
    }
  }
  maybeShowHint();
  updateCounter();
}

function resetAll() {
  for (const inst of [...state.board]) inst.el.remove();
  state.board = [];
  try { localStorage.removeItem(STORE.discovered); localStorage.removeItem(STORE.board); } catch (_) {}
  state.discovered = new Set(DB.starting);
  renderShelf();
  renderLabNotes();
  updateCounter();
  maybeShowHint();
}

/* ---------- landing / entry ---------- */
const ENTERED_KEY = 'pc.entered.v1';
let entering = false;

function enterGame() {
  if (entering || els.landing.classList.contains('gone')) return;
  entering = true;
  const firstTime = !safeGet(ENTERED_KEY);
  try { localStorage.setItem(ENTERED_KEY, '1'); } catch (_) {}

  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { closeLanding(firstTime); return; }

  // play Sandy Lerner + Leonard Bosack -> Cisco every time you enter
  els.landingContent.classList.add('exit');
  els.founderStage.hidden = false;
  let finished = false;
  const finish = () => { if (finished) return; finished = true; clearTimeout(t); closeLanding(true); };
  const t = setTimeout(finish, 8400);
  // allow tap-to-skip, but not from the same click that started us
  setTimeout(() => els.landing.addEventListener('click', finish, { once: true }), 900);
}

function closeLanding(firstTime) {
  els.landing.classList.add('gone');
  setTimeout(() => { els.landing.hidden = true; }, 650);
  // first-timers start with a Cisco already on the board
  if (firstTime && state.board.length === 0) {
    const r = boardRect();
    addInstance('Cisco', r.width / 2, r.height / 2, 'reveal');
    saveBoard();
  }
}
function safeGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }

/* ---------- wire up ---------- */
function wireUI() {
  els.enterBtn.addEventListener('click', enterGame);
  els.search.addEventListener('input', renderShelf);
  els.hintBtn.addEventListener('click', hintNext);
  els.labBtn.addEventListener('click', () => (els.labnotes.hidden ? openLab() : closeLab()));
  els.labClose.addEventListener('click', closeLab);
  els.archiveBtn.addEventListener('click', () => (els.archive.hidden ? openArchive() : closeArchive()));
  els.archiveClose.addEventListener('click', closeArchive);
  els.drawerScrim.addEventListener('click', () => { closeLab(); closeArchive(); });
  els.discoveryLayer.addEventListener('click', () => {
    if (performance.now() - overlayShownAt < 300) return;
    dismissCard();
  });

  els.resetBtn.addEventListener('click', () => { els.confirmScrim.hidden = false; });
  els.confirmCancel.addEventListener('click', () => { els.confirmScrim.hidden = true; });
  els.confirmScrim.addEventListener('click', (e) => { if (e.target === els.confirmScrim) els.confirmScrim.hidden = true; });
  els.confirmReset.addEventListener('click', () => { els.confirmScrim.hidden = true; resetAll(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLab(); closeArchive(); els.confirmScrim.hidden = true; dismissCard(); }
  });

  // keep instances inside the board on resize
  window.addEventListener('resize', () => { for (const inst of state.board) clampInstance(inst); });
}

/* ---------- boot ---------- */
(async function boot() {
  try {
    await loadData();
    wireUI();
    setupTooltip();
    loadState();
  } catch (err) {
    document.getElementById('boardHint').innerHTML =
      `<p class="hint-title">Couldn't start the game.</p><p class="hint-sub">${err.message}</p>`;
    console.error(err);
  }
})();
