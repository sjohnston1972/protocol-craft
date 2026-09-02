#!/usr/bin/env node
'use strict';
/*
 * Escaping regression guard for public/app.js (issue #17).
 *
 * This does NOT just unit-test esc() in isolation — that alone would pass
 * whether or not the render sites actually call it. Instead it loads the
 * real public/app.js into a sandboxed fake-DOM context and exercises the
 * real renderElementOverlay() / renderLabNotes() / renderArchive()
 * functions with a planted element whose fields contain HTML metacharacters,
 * then inspects the actual innerHTML those functions produced. If any
 * render site regresses to interpolating a field without esc(), this fails.
 *
 * Also verifies the real, live SDP discovery line (which contains a raw
 * '&') renders as a literal '&' — single-escaped, not double-escaped, not
 * broken markup.
 *
 * Run: node scripts/test-esc.js
 * Exits non-zero on any failure.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const APP_JS = path.join(ROOT, 'public', 'app.js');
const RECIPES_JSON = path.join(ROOT, 'public', 'data', 'recipes.json');

let failures = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}`);
    if (detail) console.log(`        ${detail}`);
  }
}

/* ---------- minimal fake DOM ---------- */
function makeElement() {
  const el = {
    _innerHTML: '',
    _textContent: '',
    className: '',
    hidden: false,
    children: [],
    style: { setProperty() {} },
    dataset: {},
    classList: {
      _set: new Set(),
      add(...cls) { cls.forEach((c) => this._set.add(c)); },
      remove(...cls) { cls.forEach((c) => this._set.delete(c)); },
      contains(c) { return this._set.has(c); },
      toggle(c) { if (this._set.has(c)) this._set.delete(c); else this._set.add(c); },
    },
    appendChild(child) { el.children.push(child); return child; },
    setAttribute(name, val) { el['attr_' + name] = val; },
    getAttribute(name) { return el['attr_' + name]; },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return makeElement(); },
    querySelectorAll() { return []; },
    scrollIntoView() {},
    getBoundingClientRect() { return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }; },
    remove() {},
    focus() {},
    offsetWidth: 0,
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._innerHTML; },
    set(v) { el._innerHTML = v; el.children = []; },
  });
  Object.defineProperty(el, 'textContent', {
    get() { return el._textContent; },
    set(v) { el._textContent = v; },
  });
  return el;
}

const elementsById = Object.create(null);
const fakeDocument = {
  body: makeElement(),
  getElementById(id) {
    if (!elementsById[id]) elementsById[id] = makeElement();
    return elementsById[id];
  },
  createElement() { return makeElement(); },
};

const sandbox = {
  document: fakeDocument,
  window: { CSS: null },
  performance: { now: () => Date.now() },
  console,
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
  },
  requestAnimationFrame() { return 0; },
  navigator: {},
  setTimeout,
  clearTimeout,
};
vm.createContext(sandbox);

const fullAppSrc = fs.readFileSync(APP_JS, 'utf8');
// Drop the trailing `(async function boot() {...})();` IIFE — it fetches
// live data and wires up DOM event listeners we don't need or want to
// stub out here. Everything we test (esc, renderElementOverlay,
// renderLabNotes, renderArchive) is defined well before it.
const bootMarker = '/* ---------- boot ---------- */';
const bootIdx = fullAppSrc.indexOf(bootMarker);
if (bootIdx === -1) {
  console.error(`Could not find boot marker ${JSON.stringify(bootMarker)} in public/app.js — app.js structure changed, update scripts/test-esc.js.`);
  process.exit(2);
}
const appSrc = fullAppSrc.slice(0, bootIdx);
const exportShim = `
;globalThis.__t = { esc, DB, state, els, renderElementOverlay, renderLabNotes, renderArchive };
`;
new vm.Script(appSrc + exportShim, { filename: 'public/app.js' }).runInContext(sandbox);

const T = sandbox.__t;
if (!T || typeof T.esc !== 'function') {
  console.error('Could not load public/app.js into the test sandbox (esc() not found).');
  process.exit(2);
}

/* ---------- 1. esc() unit assertions ---------- */
console.log('esc() unit assertions:');
check(
  "esc('<&\">') maps every metacharacter to its entity",
  T.esc('<&"' + '>') === '&lt;&amp;&quot;&gt;',
  `got: ${JSON.stringify(T.esc('<&"' + '>'))}`
);
check(
  'esc() is a no-op on plain ASCII text',
  T.esc('plain text, no metacharacters here') === 'plain text, no metacharacters here'
);
check(
  "esc('a & b') single-escapes the ampersand ('&amp;', not '&amp;amp;')",
  T.esc('a & b') === 'a &amp; b',
  `got: ${JSON.stringify(T.esc('a & b'))}`
);

/* ---------- 2. the live SDP '&' case ---------- */
console.log("\nLive SDP '&' case:");
const recipesData = JSON.parse(fs.readFileSync(RECIPES_JSON, 'utf8'));
const sdp = recipesData.elements && recipesData.elements.SDP;
if (!sdp) {
  console.log('  SKIP  SDP element not found in public/data/recipes.json (run `npm run build` first)');
} else {
  const raw = sdp.discovery;
  const escaped = T.esc(raw);
  check(
    "SDP discovery contains a raw '&' in the source data",
    raw.includes('&') && !raw.includes('&amp;'),
    `raw: ${JSON.stringify(raw)}`
  );
  check(
    "esc(SDP discovery) renders '&' as a literal ampersand (single-escaped, not '&amp;amp;')",
    escaped === raw.replace(/&/g, '&amp;') && !escaped.includes('&amp;amp;'),
    `escaped: ${JSON.stringify(escaped)}`
  );
}

/* ---------- 3. render-path regression guard (the real test) ---------- */
console.log('\nRender-path guard (overlay / Lab Notes / Archive):');

const NAME = 'TEST<Name>&"X';
const DISCO = 'disco <b>DISCO_MARK</b> & "quote"';
const SPEC = 'spec <i>SPEC_MARK</i> & "quote"';
const STD = 'std <u>STD_MARK</u> & "quote"';

const RAW_MARKERS = ['<b>DISCO_MARK</b>', '<i>SPEC_MARK</i>', '<u>STD_MARK</u>', '<Name>'];

T.DB.elements[NAME] = { discovery: DISCO, spec: SPEC, standard: STD, examples: [] };
T.DB.starting.length = 0;
T.DB.ingredients.clear();
T.state.discovered.clear();
T.state.discovered.add(NAME);

function assertNoRawMarkers(label, html) {
  const leaked = RAW_MARKERS.filter((m) => html.includes(m));
  check(`${label}: no unescaped markup leaked into innerHTML`, leaked.length === 0,
    leaked.length ? `leaked raw fragment(s): ${JSON.stringify(leaked)}\n        html: ${html}` : undefined);
  check(`${label}: escaped discovery text is present`, html.includes(T.esc(DISCO)));
  check(`${label}: escaped spec text is present`, html.includes(T.esc(SPEC)));
  check(`${label}: escaped standard text is present`, html.includes(T.esc(STD)));
  check(`${label}: escaped name is present`, html.includes(T.esc(NAME)));
}

// discovery overlay
T.renderElementOverlay(NAME, { kicker: 'test', isNew: true, recipesHTML: '' });
assertNoRawMarkers('overlay', T.els.discoveryLayer.innerHTML);

// Lab Notes
T.renderLabNotes();
const lnItem = T.els.labnotesBody.children[T.els.labnotesBody.children.length - 1];
assertNoRawMarkers('Lab Notes item', lnItem.innerHTML);

// Archive (element with no ingredients is a dead end -> shows up here)
T.renderArchive();
const arItem = T.els.archiveBody.children[T.els.archiveBody.children.length - 1];
assertNoRawMarkers('Archive item', arItem.innerHTML);

/* ---------- summary ---------- */
console.log('');
if (failures > 0) {
  console.error(`${failures} check(s) FAILED.`);
  process.exit(1);
} else {
  console.log('All checks passed.');
}
