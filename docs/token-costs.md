# Orchestration token costs — containment rules

_Origin: written on a real production SaaS, after a multi-sprint feature
single-handedly exhausted a 5-hour session limit — 100% of the usage came
from "subagent-heavy" sessions, 88% above 150k of context. The tier
framework mandates agent fan-out, and that is expensive; the conclusion was
not to abandon the fan-out (it caught real security and data bugs), but to
scale it to each change's real risk instead of always applying the maximum.
Rules below exactly as validated on that project — they are stack-agnostic._

## Containment rules (overlay on the tier system)

**R1 — Recon: 1 agent, not several.** A single exploration agent per
feature with a wide scope, instead of several in parallel plus a planning
agent. A dedicated planning agent only when the design is genuinely
uncertain; otherwise the orchestrator designs inline from the recon.

**R2 — Model by difficulty, not by role.** The expensive model only where
the task is genuinely hard: the adversarial review, the design decision,
the race condition nobody can reproduce. Mechanical recon and mechanical
test-writing run on the cheapest model that does the job. Binding the model
to a role instead of a task overpays on the trivial work that role picks up
and underpowers the hard work that lands on a cheaper role — see "Sizing
the model" in `CLAUDE.md`. **Fewer agents** matters even more than
**cheaper agents**.

_Shortcut in Claude Code: the **Explore** subagent (read-only, cheap model,
returns the conclusion instead of file dumps) is literally the R1+R2
implementation for recon — use it instead of assembling the pattern from
scratch with a general-purpose agent._

**R3 — Verify ONCE.** Either the agent runs the suite and the orchestrator
trusts the number (targeted spot-check), or the orchestrator runs it once —
never both. Prefer TARGETED tests (only the relevant file) inside agents,
and the full suite only at the final gate before the push.

**R4 — Context hygiene between work blocks.** Compact or clear the context
between sequential sub-parts of a large feature. The orchestrator keeps the
CONCLUSION ("block X green, merged"), not each agent's entire report.

**R5 — Light lane by tier + change size.** Not every change needs the full
choreography:
- **LOGIC / isolated logic**: no Architect. A short inline spec + 1
  implementation agent + QA. Post-hoc Security inline if the diff is small.
- **Additive migration** (e.g. 1 column + constraints): Security **inline**
  by the orchestrator (who already knows the patterns) instead of a
  dedicated agent; migration written inline; 1 agent only for the
  UI/consumer.
- **Real multi-layer FEATURE with an attack surface** (schema +
  authorization rules + privileged endpoint): there, yes — full Architect +
  Security-pre + Security-post. That is where the fan-out pays for itself.
- Golden rule: **fan-out scales with risk, not with habit.**

**R6 — Don't parallelize fronts competing for the same ceiling.** Running
several expensive fronts at once (implementation + QA + another sub-part's
Architect + yet another's Security) drains the session faster than
serializing. Serializing also gives the human time to test what already
shipped, and spreads the cost over time instead of concentrating it.

**R7 — One single agent per front, resumed (not relaunched from scratch)
when it stops midway** — avoids reprocessing the entire context again.

## What NOT to change

The full fan-out on high-risk tiers (SECURITY/SCHEMA/FEATURE with new
writes, authorization rules, elevated privileges, money). Containment is
about **not spending FEATURE choreography on a LOGIC change**, not about
cutting review where it matters — adversarial review pays for itself
precisely in those cases.

---
_Cross-reference: `CLAUDE.md` (tier table), `ADOPTION.md` (what to decide
per project)._
