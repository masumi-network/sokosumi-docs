/**
 * Next.js SSR expects either no `globalThis.localStorage` or a real Storage API.
 *
 * Node.js v25+ exposes experimental Web Storage by default. Without a valid
 * `--localstorage-file`, `localStorage` can exist with a broken surface
 * (`getItem` not a function), which breaks Next during SSR.
 *
 * This wrapper:
 * - strips `--localstorage-file` / `--webstorage` style flags from NODE_OPTIONS
 * - always passes `--no-experimental-webstorage` to the Next child (argv + NODE_OPTIONS)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const DISABLE_WEBSTORAGE = '--no-experimental-webstorage';

/** @param {string | undefined} raw */
function cleanNodeOptionsString(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '--localstorage-file') {
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) i += 1;
      continue;
    }
    if (t.startsWith('--localstorage-file=')) continue;
    if (t === '--webstorage' || t === '--experimental-webstorage') continue;
    if (t === DISABLE_WEBSTORAGE) continue;
    out.push(t);
  }
  return out.length ? out.join(' ') : undefined;
}

function removeBrokenGlobalLocalStorage() {
  try {
    const ls = globalThis.localStorage;
    if (ls != null && typeof ls.getItem !== 'function') {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  } catch {
    // ignore
  }
}

const cleanedRest = cleanNodeOptionsString(process.env.NODE_OPTIONS);
removeBrokenGlobalLocalStorage();

const childNodeOptions = cleanedRest
  ? `${DISABLE_WEBSTORAGE} ${cleanedRest}`
  : DISABLE_WEBSTORAGE;

const childEnv = { ...process.env, NODE_OPTIONS: childNodeOptions };

process.env.NODE_OPTIONS = childNodeOptions;
removeBrokenGlobalLocalStorage();

const forward = process.argv.slice(2);
if (forward[0] !== 'next' || forward.length < 2) {
  console.error(
    'Usage: node scripts/run-with-clean-node-options.mjs next <subcommand> [...args]',
  );
  process.exit(1);
}

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
if (!fs.existsSync(nextBin)) {
  console.error(`Next.js CLI not found at ${nextBin}`);
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [DISABLE_WEBSTORAGE, nextBin, ...forward.slice(1)],
  {
    cwd: root,
    stdio: 'inherit',
    env: childEnv,
  },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
