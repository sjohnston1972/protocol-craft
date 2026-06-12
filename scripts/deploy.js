#!/usr/bin/env node
/* Deploy to Cloudflare Workers. Loads credentials from .env (so they never
   sit on the command line), regenerates + validates the data, then runs
   `wrangler deploy`. Usage: npm run deploy */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

// 1. load .env into the environment
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}
if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error('✗ Missing CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID (expected in .env).');
  process.exit(1);
}

// 2. rebuild + validate data before shipping
const node = process.execPath;
for (const s of ['parse.js', 'validate.js']) {
  const r = spawnSync(node, [path.join(ROOT, 'scripts', s)], { stdio: 'inherit' });
  if (r.status !== 0) { console.error(`✗ ${s} failed — not deploying.`); process.exit(1); }
}

// 3. deploy
const r = spawnSync('npx', ['--yes', 'wrangler', 'deploy'], {
  stdio: 'inherit', shell: true, cwd: ROOT, env: process.env,
});
process.exit(r.status == null ? 1 : r.status);
