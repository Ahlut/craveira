---
name: security-check
description: Security analysis of recent changes — a forked, read-only review of the git diff of the modified area. Use after implementing in the SECURITY, DATA-MIGRATION, SCHEMA or FEATURE tiers, before the commit.
context: fork
agent: security
---

A security review of the recently modified code, run in its own context.

The `context: fork` above is the point of this skill, not a detail. The
review runs as the Security agent in a context that never watched the
implementation being argued for, and that agent has no write tools. It
reports; the orchestrator applies. Running the same checklist inline, in
the context that just wrote the code, is a weaker thing wearing the same
name.

## Workflow

1. **Scope**: read `git diff` and `git diff --staged` to see what changed
2. **Analyze** the diff against the threats that actually apply to this
   project — authorization, privileged functions, money, auth, data exposure
3. **Checklist**: verify every item in `docs/security-checklist.md`
4. **Dependencies**: if deps were added or updated, run the project's
   package-manager vulnerability audit
5. **Hand back** in the format below. Do not fix anything: name the fix and
   let the orchestrator apply it. If the diff touches tables, authorization
   rules or privileged functions, say explicitly what the Backend agent
   should validate afterwards.

## Output

```
## Security Analysis — [area reviewed]

### Issues found
[CRITICAL/HIGH/MEDIUM/LOW] — Description
- File: path/to/file:line
- Risk: what can happen
- Fix: how to resolve it (or already fixed)

### Checks OK
- List of what is correct

### Recommendations
- Optional improvements
```
