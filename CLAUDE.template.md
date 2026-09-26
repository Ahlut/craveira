# CLAUDE.md — {{PROJECT_NAME}}

Read this file at the start of every session. It is the project's index —
it points to the detailed docs instead of duplicating information.

> **Placeholders to fill before using this file** (find and replace all):
> `{{PROJECT_NAME}}` · `{{PRODUCT_SUMMARY}}` · `{{ROLES}}` · `{{ROUTES}}` ·
> `{{STACK}}` · `{{CODE_CONVENTIONS}}` · `{{TEST_STACK}}` ·
> `{{LINT_CMD}}` · `{{TEST_CMD}}` · `{{TYPECHECK_CMD}}` · `{{BUILD_CMD}}` ·
> `{{DEV_CMD}}` · `{{BACKLOG_DOC}}` (the project's single list of open items).
> Sections marked `<!-- ADAPT -->` ask for a decision, not just text to
> fill in — read the note before deleting or keeping them.

---

## The Product

{{PRODUCT_SUMMARY}}
Full context: `docs/product-context.md` <!-- ADAPT: create it if missing; it is the product/domain doc, not a process doc -->

**Roles**: {{ROLES}} <!-- ADAPT: delete this line and "Routes" if the project has no distinct roles -->
**Routes**: {{ROUTES}}

---

## Stack

{{STACK}}

<!--
Fictional example (kept as a comment to calibrate the level of detail, not as a default):
- Next.js (App Router) + TypeScript
- Radix UI + CSS Modules
- SWR for data fetching
- Prisma + PostgreSQL
- NextAuth (JWT in an httpOnly cookie)
- Jest + Testing Library (unit tests)
-->

---

## Code conventions

{{CODE_CONVENTIONS}}

<!--
Categories that proved worth separating in the source project — adapt, don't copy:
- Files and folders (naming convention, where each kind of file lives)
- Typing (e.g. "no `any`", generated DB types vs hand-written)
- UI framework patterns (e.g. "logic in hooks, never inline")
- Data-layer patterns (e.g. "always an explicit .select(), never select('*')")
- Critical operations (financial, irreversible) -> atomic layer in the backend
- Third-party UI primitives: never edit directly; if an exception is
  needed, record where and why (file + section + justification), so it
  doesn't repeat itself "by accident" in a future session.
-->

---

## Security

Full checklist: `docs/security-checklist.md`

Summary: <!-- ADAPT: 1-3 lines with the project's security invariants
(e.g. "RLS on everything", "frontend + backend validation", "no secrets in
public env vars", "atomic financial operations") -->

Supply chain (optional — see `ADOPTION.md` §7): if the project has a
dependency cooldown gate, describe the rule here and point to the script.

---

## Tests

Full conventions: `docs/test-conventions.md`

Summary: {{TEST_STACK}}. The pre-push hook runs `{{LINT_CMD}}` +
`{{TEST_CMD}}` automatically before every push.

---

## Duplicated areas of the project <!-- ADAPT -->

If the project has near-duplicate surfaces (per-role pages, themes,
multiple clients of the same API) instead of shared components/modules,
document the complete map here — not a sample. The source project's lesson:
a table with half the rows misses exactly the cases where the bugs appear,
because nobody knows that mirror exists until they forget it.

| Area | Mirror A | Mirror B | Mirror C |
|------|----------|----------|----------|
| _(fill in, or delete the section if there is no duplication)_ | | | |

If the project has no structural duplication, delete this section — don't
keep it empty as a permanent placeholder.

Pattern to follow when duplication exists: a single component/module
mounted in the mirrors, with the difference between them absorbed into a
prop/parameter instead of an `if (context === ...)` scattered around.
Incremental dedup, not a full rewrite in one go.

---

## Development flow

The base principle: **proportionality to risk**. Light process where a
mistake is cheap; rigorous process where it is expensive. The pre-push hook
(`{{LINT_CMD}}` + `{{TEST_CMD}}`) is the base safety net — it always runs
before any push, regardless of everything else.

```
0. Before any Edit/Write on code that goes to git, declare to the user:
   "TIER: X. Agents: Y. Local test: yes/no."
   That line is the gate — without it, write no code. It applies to EACH
   block of changes (not once per session). The user can push back
   immediately if the tier is wrong.
   This step is ENFORCED by the harness, not just requested: the PreToolUse
   hook `check-tier-declared` (see "Automatic hooks") blocks Edit/Write on
   code files without a valid BLOCK MARKER. When declaring the tier, also
   write the marker (visible in the terminal):
     echo "TIER: X. Agents: Y. Local test: yes/no." > .claude/tier-block
   The marker expires at commit (new block = redeclare + rewrite it).
1. Understand the request -> confirm if ambiguous
2. Read existing code before writing (never assume)
   2a. <!-- ADAPT: the "never invent access to a third-party-managed
       surface" rule — e.g. before writing queries that touch tables
       managed by the auth provider, grep the migrations directory for a
       similar pattern; never invent direct access to that provider's
       system tables. Swap for the real stack's equivalent. -->
2.5 If tier SECURITY/SCHEMA and there is a reported error: capture the
    exact code/message BEFORE patching (replace generic toast/log with the
    full error, reproduce, copy the output) — prevents patching the wrong
    hypothesis
3. Classify the tier (see table below)
4. If tier SCHEMA or FEATURE -> run Architect (see mechanism below)
5. Implement
5.5 If the change touches a file in the duplicated-areas map: check ALL
    the row's mirrors before the commit - does the change apply there? If
    yes, apply it; if not, state explicitly why in the summary.
    (Delete this step if the "Duplicated areas" section doesn't exist in
    the project.)
6. If tier LOGIC, SECURITY, DATA-MIGRATION, SCHEMA or FEATURE -> run QA
   (write tests)
6.5 For LOGIC+ tiers that change UI or a user flow: behavior check before
    the commit - run the app (`{{DEV_CMD}}`) and walk the changed flow.
    Unit tests do not replace this step. Deliberately light scope: only
    the changed flow, not full regression.
    ("Local test: yes/no" in the TIER preamble now means exactly this.)
7. If tier SECURITY, DATA-MIGRATION, SCHEMA or FEATURE -> run Security
   (see mechanism below)
8. Commit -> fast (no hook). Before git commit, re-read the TIER preamble
   declared in step 0 of this block — did the promised agents run? If not,
   stop and run them now.
   Run `{{TYPECHECK_CMD}}` if the project is typed. Require **zero** — a
   new error is a regression to fix, NEVER to mask with casts/any/ts-ignore.
   <!-- ADAPT: state here whether typecheck is an automatic gate
   (pre-push/CI). If it is not, say explicitly that it is manual
   discipline — don't let it be presumed. -->
9. Push -> pre-push runs `{{LINT_CMD}}` + `{{TEST_CMD}}` automatically. If
   it fails, the push is blocked.
```

### Change tiers

| Tier | What it is | Architect | QA | Security |
|------|-----------|-----------|-----|---------|
| **NON-CODE** | Doc analysis, reading, planning, brainstorming, questions, summaries | — | — | — |
| **DISPLAY** | Adding fields to read queries, UI copy, styles, formatting | — | — | — |
| **DEPS** | Patch/minor dependency bump that passes the cooldown gate (if any) | — | — | — |
| **LOGIC** | New mutation, new stateful component, new hook, new util | — | Yes | — |
| **SECURITY** | Authorization rule (RLS/policy/guard), privileged function, auth, payments/subscriptions | — | Yes | Yes |
| **DATA-MIGRATION** | Data UPDATE/backfill with no schema change | — | Yes | Yes |
| **SCHEMA** | New table, column, index, FK, migration | Yes | Yes | Yes |
| **FEATURE** | New feature crossing layers (schema + authorization + UI) | Yes | Yes | Yes |

_This table answers one question: **does this change need a reviewer, and
which one**. That is a question about risk. Which model does the work is a
different question, answered by the task's difficulty — see "Sizing the
model" below. This table used to carry a "Model" column that bound a model
to each role; that was a mistake, and the reason it was one is worth
reading before you copy the table anywhere._

<!-- ADAPT: if the project has no database of its own, no payments, or no
concept of "schema", remove/merge the tiers that don't apply (see
ADOPTION.md §1 for each tier's rationale). Don't leave dead tiers in the
table just because they came with the template — every dead row is a
question someone will ask with no answer. -->

**NON-CODE tasks invoke no agents.** Architect/QA/Security exist for
changes that go to git. Analyzing a document, reading code, making a plan
or answering a question needs no agents.

**Tie-break rules:**
- In doubt between LOGIC and SECURITY/SCHEMA → go up.
- In doubt between DISPLAY and LOGIC → keep LOGIC.
- DISPLAY that puts data in front of someone who could not see it before
  (a new field in a read query is still a new field a role can now read;
  same for a new column in an export or a new value in a log) → evaluate
  as SECURITY. "Read-only" describes the query, not the risk.
- FEATURE only if the change REALLY crosses schema + authorization + UI in
  a single unit of work.

**Before invoking an agent, the key question:** *Does this change go to
git?* If not → no agent. If yes → what is the minimum justifiable tier?

**DEPS tier — dependency bumps.** A dependency bump has its own automatic
security chain: cooldown gate (if any) + vulnerability audit + pre-push
(lint+test) + the CI build. For a patch/minor that passes that gate, those
controls ARE the security process — don't invoke Architect/QA/Security (a
Security agent reviews code diffs; in a lockfile diff there is nothing for
it to analyze). Mandatory check: run the suite and confirm the app starts.
**Escalate to SECURITY** if: a **major/breaking** bump, OR a bump of an
**auth/crypto/payments** lib, OR the bump requires piercing the
cooldown/allowlist — then the Security agent reviews the changelog +
breaking changes + new transitives.

**"Move fast" does not change the tier.** It changes implementation speed,
not the process.

**Token cost — the budget overlay (reading `docs/token-costs.md` is
mandatory).** This flow's agent fan-out is expensive when used at full
strength on every change. Summary rules (full R1-R7 in the doc): 1 recon
agent, not several in parallel + a Plan; the expensive model only where the
task's difficulty needs it, which is usually the adversarial review and
almost never the mechanical work; verify ONCE (agent OR orchestrator, never both);
context hygiene between work blocks (keep the conclusion, not the whole
report); a light lane for LOGIC/additive tiers; the FULL fan-out is
reserved for multi-layer FEATURE work with a real attack surface — it
scales with RISK, not with habit.

**Anti-skip rule (learned in a real incident):** in long sessions with
many phases, the temptation is to treat agents as overhead and "push on".
That is wrong. Before writing any code of tier >= LOGIC, stop and check:
*"Have I run the mandatory agents for this tier?"* If not → run them
before writing. Implementing and then asking Security for a review is not
the same as Security before implementing — Security can find problems that
change the design, not just the code.

### Sizing the model

**Risk decides whether a review happens. Difficulty decides which model
does the work.** Two questions, two different inputs. Collapsing them is
expensive in both directions, because a role does not have a difficulty —
tasks do, and the same role gets trivial ones and brutal ones:

| Task | Model bound to the role | Model sized to the task |
|------|-------------------------|-------------------------|
| Run the test suite | cheap — fine | cheap |
| Hunt a double-charge race condition | cheap, because "it's QA" — too weak | expensive |
| Rename a config key | expensive, because "it's the architect" — overpaid | cheap |
| Design the retry policy | expensive — fine | expensive |

So the caller sizes the model to the task in front of it, per invocation.
The `model:` in an agent's file is the fallback for when the caller does
not decide, not a rule about that role. Skills can carry the same
declaration (see "Skills"), and both are overridden per call.

Always use aliases (`opus`, `sonnet`, `haiku`), never pinned model IDs —
aliases track the newest version of the family automatically. What does not
change with the model is who may write. Reviewers don't.

**Precedence, when two rules seem to disagree:**
- The tier table names the mandatory agents. R5 in `docs/token-costs.md`
  (the light lane) is the one explicit exception: for LOGIC and small
  additive changes the orchestrator may do the Security pass and the
  migration inline and delegate only the UI — and says so in the TIER
  preamble ("Agents: none, Security inline"). A stated lane is a decision;
  silence is a skip.
- Timing. Architect and Security run BEFORE implementation, because they
  can change the design. QA runs AFTER, because it writes tests against
  real code. The anti-skip rule above is about the "before" agents — QA
  arriving once the code exists is the rule, not a skip.
- Bugfixes are the one place a test precedes the code ("Surgical TDD",
  below): the failing test is written first; QA's full pass still comes
  after the fix.

**The light lane, made explicit.** What R5 lets you dispense with — and
what it does not. Anything not listed here stays exactly as the tier
table says.

| Situation | Dispensable | Still mandatory | Only while |
|-----------|-------------|-----------------|------------|
| **LOGIC, isolated** — new hook, util, mutation or stateful component | Architect; Security as a separate agent | QA; a short inline spec in the TIER preamble; a Security pass done inline by the orchestrator and named in the preamble | The diff touches no authorization rule, privileged function, payment path or new data exposure. If it does → SECURITY, in full. |
| **Additive migration** — one column, index or constraint | Security as a separate agent; delegating the migration to an agent | Architect (the spec can be short, but it is still committed to `docs/specs/`); QA; Security pass inline by the orchestrator; rollback script; entry in the migrations state doc | Reversible (the column can be dropped), no backfill, no change to who can read or write what. A backfill → DATA-MIGRATION; a new policy or privileged function → SCHEMA/FEATURE, in full. |
| **FEATURE** crossing schema + authorization + UI | Nothing | Architect, Security before AND after, QA, persistent spec | — |

"Small" is measured by exposure of data, permissions, reversibility and
operational impact — never by line count. A 3-line change to an
authorization rule is SECURITY; a 300-line UI refactor that exposes no new
data is LOGIC.

---

## Agents

| Agent | Type | When to invoke | Context file |
|-------|------|---------------|--------------|
| Architect | Horizontal | Tier SCHEMA or FEATURE | `.claude/agents/architect.md` |
| Security | Horizontal | Tier SECURITY, DATA-MIGRATION, SCHEMA or FEATURE | `.claude/agents/security.md` |
| QA | Horizontal | Tier LOGIC, SECURITY, DATA-MIGRATION, SCHEMA or FEATURE | `.claude/agents/qa.md` |
| Product | Horizontal | Tier FEATURE — UX/PM decisions (routes, flows, separation of concepts) | `.claude/agents/product.md` |
| Frontend | Vertical | Components, pages, hooks, UX | `.claude/agents/frontend.md` |
| Backend | Vertical | Database, authorization, backend functions/services | `.claude/agents/backend.md` |

**Horizontal** = cross-cutting, apply to any area.
**Vertical** = specialists in one technical layer.

The agent files are **generic by design**: the project-specific context
(stack, auth model, UX principles, folder tree) lives in THIS file and the
docs it points to — every agent starts by reading them. That is why the
plugin path (shared read-only files) and the copy-paste path produce the
same result; enriching an agent = enriching CLAUDE.md, not editing the
agent file.

<!-- ADAPT: if the project doesn't have frontend/backend as separate
layers (e.g. a CLI, a lib), reduce the verticals to what actually exists —
don't keep agents without an area. -->

### Invocation mechanism (MANDATORY to follow)

The harness (Claude Code) loads the files in `.claude/agents/*.md`
automatically: each one becomes a named subagent type, with the role
defined by the file body and the frontmatter `description` guiding
delegation. Invoke the agent **by name** (`subagent_type: "security"`,
etc.) — do NOT copy the file's content into the prompt; that was the old
mechanism and it duplicates instructions the harness already applied. The
invocation prompt carries only what the file doesn't have: the concrete
task's code/context and the scope of what you want analyzed or produced.

Confirm the type shows up in the session's agent list before assuming it
loaded: a frontmatter with invalid YAML — the classic case is `: ` (colon
+ space) inside an unquoted `description` — makes the agent be ignored
SILENTLY. Descriptions containing `:` always go in quotes; that lesson
cost months of "installed" agents that never loaded in the source project.

**Model per agent**: the `model:` in each file's frontmatter is a
**fallback**, applied by the harness when the caller picks nothing. The
defaults ship expensive for Architect, Security and Product and cheaper for
QA, Frontend and Backend, because that is where the difficulty usually
sits — not because a role owns a model. Any call may override it (see
"Sizing the model"), and an agent file with no `model:` inherits.

**Tools per agent**: reviewers don't write. `security` and `architect`
have `tools: Read, Grep, Glob, Bash` in the frontmatter; `product` has
`Read, Grep, Glob`. An adversarial reviewer that can modify the code it is
reviewing stops being adversarial — it returns the finding/spec, and the
orchestrator applies it. (Honest note: `Bash` stays, because review needs
`git diff` and running checks — which technically still allows writing via
shell. The restriction is deliberate friction and a role signal, not a
sandbox.) QA, Frontend and Backend keep write access — implementing is
their job.

**Main thread:** the cheaper model for exploratory sessions or light
DISPLAY/LOGIC; the expensive model when implementing directly in
SECURITY/SCHEMA/FEATURE tiers without delegating to agents.

**Critical rule:** Architect and Security run BEFORE implementing/
committing. QA runs AFTER implementing (it writes the tests). Security and
QA can run in parallel once the code exists.

**Not optional.** If the tier requires the agent, the agent must run. An
existing plan does not replace the Architect — the plan is the Architect's
input, not its output.

### Persistent specs (SCHEMA/FEATURE tiers)

In **SCHEMA/FEATURE** tiers, the Architect's output does not stay in the
conversation: the agent returns the complete spec (it is read-only — see
"Tools per agent") and the orchestrator writes it to
`docs/specs/YYYY-MM-DD-<feature>.md` (decisions, schema, contracts,
acceptance criteria) and commits it **before** implementation. The spec is
the contract — the implementation references it and QA validates on 2
levels: conformance to the spec first, code quality second (not against
the code alone).

### Surgical TDD for bugfixes (LOGIC+ tiers)

Extension of rule 2.5: for any reported bug of tier **LOGIC or higher**,
the reproduction materializes as a **failing test** before the fix (when
testable in the suite; otherwise, document the manual reproduction in the
commit). The fix is only complete when the test passes. This is not
universal TDD — bugfixes only, where the local rationale (fixes with no
regression test found in audit) justifies the cost.

### Routines

Pattern for recurring maintenance: use the harness's scheduler/cron for
periodic checks (deps blocked in the cooldown, security pulse). Keep it
minimal — hooks and routines only on critical gates, not on everything.

**Loop design checklist** (apply to any new automation — hook, routine,
cron, autonomous workflow). Before creating it, declare the 4 pieces:

1. **Trigger** — what fires it (push, cron, event)
2. **Topology** — which command(s)/agent(s) it runs, and in what order
3. **Verifier** — what validates the result (tests, lint, build, review agent)
4. **Stop rule** — when it stops (success, N iterations, token budget)

Without an explicit verifier and stop rule, the loop doesn't get created.
The existing gates (pre-push, CI→deploy, the cooldown routine) already
follow this pattern. Autonomous loops that write code unsupervised
("ship while you sleep" style) are outside the framework: they conflict
with the tier gate, with direct pushes to the main branch, and with the
token-cost discipline.

---

## Skills

| Skill | Usage | What it does |
|-------|-------|--------------|
| `/security-check` | `/security-check` | Security analysis of the modified area (Security agent + git diff) |
| `/db-migration` | `/db-migration description` | Creates and validates a schema migration, and records it in the migrations-state doc |

<!-- ADAPT: `security-baseline` (full codebase audit) and `security-status`
(quick pulse, no agents) exist in the source project and follow the same
frontmatter pattern — replicate them when the project grows enough to
justify it. Don't copy them just because they existed there; every new
skill is one more file to keep in sync with the flow. -->

Skills live in `.claude/skills/<name>/SKILL.md` with frontmatter. Beyond
`name` and `description`, two fields decide *where* and *how* a skill runs,
and both are worth setting deliberately instead of by default:

- **`model:`** — an alias (`opus`, `sonnet`, `haiku`) or `inherit`. The
  skill runs on that model instead of the session's. Choose it by the
  difficulty of the work the skill does.
- **`context: fork`** (with `agent: <type>`, optionally `background:`) —
  the skill runs in a separate context as a subagent instead of loading its
  instructions into the main one. This is the mechanical form of "the
  reviewer did not write the code": a forked review arrives without the
  implementation's reasoning sitting in its context.

`/security-check` ships forked onto the Security agent, for exactly that
reason. `/db-migration` ships with `model: inherit` and stays in the main
loop, because writing a migration needs the project's context, not a clean
one.

Agents live in `.claude/agents/<name>.md`, also with frontmatter. Confirm
the harness in use loads skills from this folder before assuming `/name`
runs anything — a loose `.md` file outside the expected structure is not
discovered, silently. The two fields above need a recent Claude Code; where
the harness does not know them, the skill still runs, just inline and on
the session's model.

---

## Automatic hooks

| Hook | Event | Action |
|------|-------|--------|
| Pre-push | Before `git push` | Runs `{{LINT_CMD}}` + `{{TEST_CMD}}` — blocks on failure |
| check-tier-declared | PreToolUse on Edit\|Write (harness) | Blocks code edits without a "TIER:" declaration since the last commit — step 0 stops being just prose |

Pre-push config: `scripts/pre-push` (installed via the install script —
see `hooks/README.md` in the template). Tier-gate config:
`.claude/hooks/check-tier-declared.cjs` + a PreToolUse entry in
`.claude/settings.json` (see `hooks/README.md`). <!-- ADAPT: add here any
other harness hooks the project comes to use (e.g. an informational
SessionStart) -->

---

## Deploy flow (automatic) <!-- ADAPT -->

Describe here, without overclaiming, what really happens from commit to
production. The source project's most expensive mistake was a doc claiming
"3 barriers" when in practice there were 2 — always state **what blocks**
and **what does not block**, explicitly, and fix this section the day the
pipeline changes (don't let it go stale).

```
git commit  →  (instant, no hook)
git push    →  pre-push hook:   {{LINT_CMD}} + {{TEST_CMD}}
            →  CI:              <!-- describe the real jobs -->
```

### What actually blocks (and what doesn't)

**Actually blocks:** <!-- list: pre-push, CI gates that really fail the job -->

**Does NOT block:** <!-- list deliberately: typecheck if it isn't a gate,
E2E if the deploy doesn't depend on it, code-owner review if the flow is
direct pushes without PRs, dependency audit / supply-chain gate if they
don't exist (see ADOPTION.md §7 — absence gets declared, not omitted),
etc. An empty list here is suspicious — almost no pipeline blocks on
everything. -->

### Code review

<!-- ADAPT: when the Security agent runs (during development in the tiers
that require it) vs. what CI covers automatically vs. whether there is an
additional manual gate (human PR review). -->

---

## Reference documentation

| Doc | Contents |
|-----|----------|
| `docs/product-context.md` | Product, domain, flows <!-- ADAPT: the domain doc's real name --> |
| `{{BACKLOG_DOC}}` | **The only list that counts** — everything open; new items go HERE |
| `docs/security-checklist.md` | Security checklist (single source) |
| `docs/test-conventions.md` | Test conventions (single source) |
| `docs/design-system.md` | Visual source of truth — tokens, spacing, component rules (single source) <!-- ADAPT: only if the project has a UI; delete the row otherwise — see ADOPTION.md §5 --> |
| `docs/token-costs.md` | Agent cost containment rules (R1-R7) |

<!-- ADAPT: add here other single-source docs the project creates (design
system, orchestration manual, etc.) — the principle is one doc per topic,
with CLAUDE.md pointing instead of duplicating. -->

---

## Environment variables

```
<!-- ADAPT: list the real vars and whether they are public/secret -->
```

File: `.env.local` (or equivalent, in .gitignore, never committed)

---

## Useful commands

```bash
{{DEV_CMD}}          # development server
{{TEST_CMD}}         # tests
{{LINT_CMD}}         # lint
{{BUILD_CMD}}        # production build
{{TYPECHECK_CMD}}    # type checking (if applicable)
```
