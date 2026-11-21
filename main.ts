// Leonida Legend — hand-in program for the gta6-trophy-guide-01 bounty.
//
// The guide itself is the static web app in app/ (open app/index.html in any
// browser; it runs fully offline). This program's only job is the hand-in:
// copy app/ and screenshots/ into the output directory and write the
// dossier the judges read, using the kit's vendored library so the bytes
// match the scorer's own rebuild exactly.
//
// Run it the way the grader does, or locally with an output override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps, mirrored so a bad hand-in fails here first with a clear
// message instead of at the scorer: at most 4 screenshots of 256 KiB, and
// app/ within 993 entries and 48 MiB.
const GATE = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoDir, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoDir, 'screenshots'))) {
  copyTree(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'));
}

const dossier = buildDossier(outputDir, GATE);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

const shots = existsSync(join(outputDir, 'screenshots'))
  ? readdirSync(join(outputDir, 'screenshots')).filter((name) => !name.startsWith('.'))
  : [];
if (shots.length < 3) {
  console.warn(`warning: only ${shots.length} screenshot(s) handed in — the gate wants 3 or 4`);
}
console.log(`handed in: app/ + ${shots.length} screenshot(s) + dossier.json (${dossier.length} bytes)`);
