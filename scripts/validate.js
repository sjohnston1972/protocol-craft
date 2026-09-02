#!/usr/bin/env node
/*
 * validate.js — fail loudly if the recipe table is not a sound crafting tree.
 *
 * Three checks, straight from the build spec:
 *   1. Reachability  — every node is craftable from the 8 starting elements.
 *   2. Pair-uniqueness — no unordered A+B pair maps to two different results.
 *   3. Completeness  — every node is the result of >=1 recipe (except starters).
 *
 * Exit code 0 = all pass; 1 = at least one failure.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'recipes.json'), 'utf8'));
const { startingElements: STARTING, recipes } = data;
const nodes = Object.keys(data.elements);

const fail = [];
const note = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) { fail.push(label); if (detail) detail.forEach((d) => console.log('        - ' + d)); }
};

// --- Check 0: every name used in a recipe is a known node -----------------
const known = new Set(nodes);
const unknownRefs = [];
for (const r of recipes) {
  for (const x of [r.a, r.b, r.result]) {
    if (!known.has(x)) unknownRefs.push(`${x}  (in ${r.a} + ${r.b} -> ${r.result})`);
  }
}
note('Every referenced name is a known node', unknownRefs.length === 0, [...new Set(unknownRefs)]);

// --- Check 1: reachability from the starting shelf ------------------------
const reachable = new Set(STARTING);
let grew = true;
while (grew) {
  grew = false;
  for (const r of recipes) {
    if (reachable.has(r.result)) continue;
    if (reachable.has(r.a) && reachable.has(r.b)) { reachable.add(r.result); grew = true; }
  }
}
const unreachable = nodes.filter((n) => !reachable.has(n));
note('Every node is reachable from the 8 starting elements', unreachable.length === 0, unreachable);

// also surface any individual recipe whose ingredients can never both exist
const deadRecipes = recipes
  .filter((r) => !reachable.has(r.a) || !reachable.has(r.b))
  .map((r) => `${r.a} + ${r.b} -> ${r.result}  (missing: ${[r.a, r.b].filter((x) => !reachable.has(x)).join(', ')})`);
note('Every recipe has reachable ingredients', deadRecipes.length === 0, deadRecipes);

// --- Check 2: pair-uniqueness (order-insensitive) -------------------------
const byPair = new Map();
for (const r of recipes) {
  const key = [r.a, r.b].sort((x, y) => x.localeCompare(y)).join('  +  ');
  if (!byPair.has(key)) byPair.set(key, new Set());
  byPair.get(key).add(r.result);
}
const clashes = [];
for (const [key, results] of byPair) {
  if (results.size > 1) clashes.push(`${key}  ->  ${[...results].join('  /  ')}`);
}
note('No A+B pair maps to two different results', clashes.length === 0, clashes);

// --- Check 3: completeness — every node is a result (except starters) -----
const produced = new Set(recipes.map((r) => r.result));
const orphans = nodes.filter((n) => !STARTING.includes(n) && !produced.has(n));
note('Every non-starting node is the result of a recipe', orphans.length === 0, orphans);

// --- Check 4: discovery text is free of authoring artifacts / stubs -------
// A map-section reference (e.g. "§12") leaking into player-facing text, or a
// discovery line that IS one of the known placeholder stubs verbatim (not
// merely containing the phrase — "cross-branch: ..." as a real explanatory
// note is fine; the bare stub "cross-branch" is not).
const MAP_ARTIFACT = /§\s*\d/;
const PLACEHOLDER_STUBS = new Set([
  'working on it',
  'answered',
  'their phone is ringing',
  'cross-branch',
]);
const contentIssues = [];
for (const n of nodes) {
  const d = data.elements[n] && data.elements[n].discovery;
  if (!d) continue;
  if (MAP_ARTIFACT.test(d)) contentIssues.push(`${n}  =>  "${d}"  (map-section artifact)`);
  else if (PLACEHOLDER_STUBS.has(d.trim().toLowerCase())) contentIssues.push(`${n}  =>  "${d}"  (placeholder stub)`);
}
note('No discovery text contains map artifacts or placeholder stubs', contentIssues.length === 0, contentIssues);

// --- Summary --------------------------------------------------------------
console.log('');
console.log(`Nodes: ${nodes.length}   Recipes: ${recipes.length}   Starting: ${STARTING.length}`);
if (fail.length) {
  console.log(`\n${fail.length} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nAll checks passed.');
