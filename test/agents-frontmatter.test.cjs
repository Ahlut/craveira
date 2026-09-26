// Frontmatter checks for agents/*.md and skills/*/SKILL.md.
// No dependencies. Run: node test/agents-frontmatter.test.cjs
//
// An unquoted `description` containing ": " is invalid YAML, and the harness
// then ignores the agent silently — the file looks installed and never
// loads. This is not a YAML parser; it catches the known way that fails.
//
// `model` is deliberately NOT required: the model follows the task, and the
// frontmatter value is only the fallback when the caller picks nothing. It
// is validated when present. A skill that declares `context: fork` must also
// name the `agent:` it forks onto, or the fork has no role to run as.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
let failed = 0;

function fail(msg) { failed++; console.log('FAIL ' + msg); }
function ok(msg) { console.log('ok   ' + msg); }

function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1].split(/\r?\n/) : null;
}

function checkFile(file, requiredKeys) {
  const rel = path.relative(ROOT, file);
  const lines = frontmatter(file);
  if (!lines) return fail(`${rel}: no frontmatter block`);

  const keys = new Map();
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    keys.set(key, value);
    const quoted = /^(".*"|'.*')$/.test(value.trim());
    if (!quoted && value.includes(': ')) {
      fail(`${rel}: "${key}" contains ": " and is not quoted — invalid YAML, the harness will ignore this file silently`);
    }
  }
  for (const k of requiredKeys) {
    if (!keys.has(k) || !keys.get(k).trim()) fail(`${rel}: missing frontmatter key "${k}"`);
  }
  if (keys.has('model') && !/^(opus|sonnet|haiku|inherit)$/.test(keys.get('model').trim())) {
    fail(`${rel}: model must be an alias (opus/sonnet/haiku) or inherit, got "${keys.get('model')}"`);
  }
  if (keys.has('context')) {
    if (keys.get('context').trim() !== 'fork') {
      fail(`${rel}: the only supported context is "fork", got "${keys.get('context')}"`);
    } else if (!keys.has('agent') || !keys.get('agent').trim()) {
      fail(`${rel}: "context: fork" needs an "agent:" to fork onto`);
    } else {
      const agentFile = path.join(ROOT, 'agents', keys.get('agent').trim() + '.md');
      if (!fs.existsSync(agentFile)) {
        fail(`${rel}: forks onto "${keys.get('agent').trim()}", which has no file in agents/`);
      }
    }
  }
  ok(rel);
}

for (const f of fs.readdirSync(path.join(ROOT, 'agents')).filter((f) => f.endsWith('.md'))) {
  checkFile(path.join(ROOT, 'agents', f), ['name', 'description']);
}
for (const d of fs.readdirSync(path.join(ROOT, 'skills'))) {
  const f = path.join(ROOT, 'skills', d, 'SKILL.md');
  if (fs.existsSync(f)) checkFile(f, ['name', 'description']);
}

console.log(failed ? `\n${failed} problem(s)` : '\nall frontmatter checks passed');
process.exit(failed ? 1 : 0);
