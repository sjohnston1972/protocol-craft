#!/usr/bin/env node
/*
 * parse.js — turn the canonical map (protocol_tree.md) into data/recipes.json.
 *
 * The map is the source of truth for STRUCTURE (which A + B makes which C).
 * The authored content layer (data/elements.json) supplies the per-node
 * display data: tier, discovery one-liner, and milestone flag. This script
 * merges the two and writes the table the game loads.
 *
 * Name rule: a result may be written with a trailing standards designation in
 * parentheses, e.g. "Ethernet (802.3)". The node IDENTITY is the bare name
 * ("Ethernet"); the parenthetical is kept as a `standard` label. Ingredients
 * are always written by their bare name, so the two sides reconcile.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TREE = path.join(ROOT, 'protocol_tree.md');
const ELEMENTS = path.join(ROOT, 'data', 'elements.json');
const SPECS = path.join(ROOT, 'data', 'specs.json');
const EXAMPLES = path.join(ROOT, 'data', 'examples.json');
const OUT = path.join(ROOT, 'public', 'data', 'recipes.json');

const STARTING = ['Electron', 'Copper', 'Glass', 'Air', 'Clock', 'Number', 'Rule', 'Cisco'];

// --- 1. Pull candidate recipe lines out of the fenced code blocks ----------
const text = fs.readFileSync(TREE, 'utf8');
const lines = text.split(/\r?\n/);

let inFence = false;
let section = null;
const rawRecipes = [];          // { line, section }
for (const line of lines) {
  const head = line.match(/^##\s+(\d+)\./);
  if (head) section = Number(head[1]);
  if (line.trim().startsWith('```')) { inFence = !inFence; continue; }
  if (!inFence) continue;
  if (!line.includes('→')) continue;     // must contain the arrow
  if (!line.includes(' + ')) continue;        // must contain a pair
  rawRecipes.push({ line, section });
}

// Map a map-section number to a tier. Disasters override by name (below).
function tierForSection(n) {
  if (n === 1 || n === 22) return 'concept';
  if ((n >= 2 && n <= 9) || n === 23) return 'L2';
  if (n === 19) return 'L2.5';
  if (n === 25) return 'L4';
  if (n === 26) return 'L5';
  if (n === 27) return 'L6';
  if (n >= 28) return 'L7';
  // 10-18, 20, 21 (L3 proper) and 24 (IPsec/VPN) — plus a safe default
  return 'L3';
}
const DISASTERS = new Set([
  'Broadcast Storm', 'Address Exhaustion', 'Routing Loop', 'ARP Spoofing',
  'MAC Flapping', 'Root Bridge Hijack', 'SYN Flood', 'Bufferbloat',
  'DNS Cache Poisoning', 'Amplification Attack',
]);

// --- 2. Normalise a token into { name, standard, gloss } ------------------
// The bit after 2+ spaces (the column-aligned note) becomes the inline gloss.
function splitName(raw) {
  const s = raw.split('◄')[0];                  // drop "◄── ..." markers
  const segs = s.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
  let name = segs[0] || '';
  let gloss = segs.slice(1).join(' ').trim();
  // A trailing "(...)" on the name is either a short standards designation
  // (a space-free token like "802.1Q") or an inline gloss (a phrase).
  let standard = null;
  const m = name.match(/^(.*?)\s+\(([^)]*)\)$/);
  if (m) {
    if (/\s/.test(m[2])) { gloss = gloss || m[2]; }   // a phrase -> it's a gloss
    else { standard = m[2]; }                          // a token  -> it's a standard
    name = m[1].trim();
  }
  gloss = gloss.replace(/^\((.*)\)$/, '$1').trim();   // unwrap a leading/trailing "(...)"
  return { name, standard, gloss: gloss || null };
}

// --- 3. Parse each line into a recipe -------------------------------------
const recipes = [];
const problems = [];
const inlineGloss = {};   // result name -> note lifted from the map line
for (const { line: raw, section } of rawRecipes) {
  const arrowAt = raw.indexOf('→');
  const lhs = raw.slice(0, arrowAt);
  const rhs = raw.slice(arrowAt + 1);
  const parts = lhs.split(' + ').map((p) => splitName(p).name).filter(Boolean);
  if (parts.length !== 2) {
    problems.push(`Could not read a clean A + B pair from: "${raw.trim()}"`);
    continue;
  }
  const result = splitName(rhs);
  if (!result.name) {
    problems.push(`Empty result in: "${raw.trim()}"`);
    continue;
  }
  recipes.push({ a: parts[0], b: parts[1], result: result.name, standard: result.standard, section });
  if (result.gloss && !inlineGloss[result.name]) inlineGloss[result.name] = result.gloss;
}

// First section in which a node is produced decides its tier.
const tierByNode = {};
for (const r of recipes) {
  if (tierByNode[r.result]) continue;
  tierByNode[r.result] = DISASTERS.has(r.result) ? 'disaster' : tierForSection(r.section);
}

// --- 4. Build the node inventory ------------------------------------------
const nodeSet = new Set(STARTING);
for (const r of recipes) { nodeSet.add(r.a); nodeSet.add(r.b); nodeSet.add(r.result); }
const nodes = [...nodeSet].sort((x, y) => x.localeCompare(y));

// --- 5. Merge authored metadata (tier / discovery / milestone) ------------
let authored = {};
let haveAuthored = false;
if (fs.existsSync(ELEMENTS)) {
  authored = JSON.parse(fs.readFileSync(ELEMENTS, 'utf8'));
  haveAuthored = true;
}

let specs = {};
if (fs.existsSync(SPECS)) specs = JSON.parse(fs.readFileSync(SPECS, 'utf8'));

let examples = {};
if (fs.existsSync(EXAMPLES)) examples = JSON.parse(fs.readFileSync(EXAMPLES, 'utf8'));

const standards = {};
for (const r of recipes) { if (r.standard) standards[r.result] = r.standard; }

const elements = {};
const missing = [];
for (const name of nodes) {
  const meta = authored[name] || {};
  if (haveAuthored && !meta.discovery && !inlineGloss[name]) missing.push(name);
  elements[name] = {
    tier: STARTING.includes(name) ? 'starting' : (tierByNode[name] || 'L3'),
    standard: meta.standard || standards[name] || null,
    spec: meta.spec || specs[name] || null,
    discovery: meta.discovery || inlineGloss[name] || null,
    examples: meta.examples || examples[name] || null,
    milestone: meta.milestone || false,
  };
}

// --- 6. Write output + report ---------------------------------------------
const out = {
  generatedFrom: 'protocol_tree.md',
  startingElements: STARTING,
  elements,
  recipes: recipes.map(({ a, b, result }) => ({ a, b, result })),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

console.log(`Parsed ${recipes.length} recipes across ${nodes.length} nodes.`);
if (problems.length) {
  console.log(`\nParse problems (${problems.length}):`);
  for (const p of problems) console.log('  - ' + p);
}
if (!haveAuthored) {
  console.log('\nNo data/elements.json yet — wrote node inventory with null metadata.');
  console.log('Node inventory:');
  for (const n of nodes) console.log('  ' + n);
} else if (missing.length) {
  console.log(`\nNodes missing tier/discovery in elements.json (${missing.length}):`);
  for (const n of missing) console.log('  - ' + n);
}
console.log(`\nWrote ${path.relative(ROOT, OUT)}`);

if (missing.length) {
  console.error(`\n✗ ${missing.length} node(s) are missing a discovery description — the build cannot ship half-finished content.`);
  process.exit(1);
}
