---
name: db-migration
description: Creates, validates and documents a schema migration — writes the file in the migrations folder, produces the rollback script and records the migration in the migrations-state doc. Use in the SCHEMA or DATA-MIGRATION tiers.
model: inherit
---

Creates, validates and documents a schema migration.

## Arguments
- `$ARGUMENTS` — description of the migration (e.g. "add invoices table")

## Workflow

1. **Analyze**: understand what needs to change in the schema
2. **Check current state**: read the generated types/schema (if any) to
   understand the existing schema — don't assume
3. **Create the migration**: generate the file in the project's migrations
   folder, with a timestamp/version following the convention in use
4. **Always include**:
   - Active authorization (RLS or equivalent) for new tables
   - Authorization rules for every relevant role/profile
   - Constraints for critical fields (financial, mandatory)
   - Indexes for fields used in frequent queries
   - Explanatory comments in the SQL/DDL
5. **Rollback**: create the matching rollback script
6. **Update types**: regenerate the database's generated types, if the
   project has them. Not optional — a table applied but not regenerated
   into the types fails on the first query that uses it.
7. **Record**: add a line to the migrations-state doc
   (`docs/migrations-state.md` or equivalent) with state `to apply`

## Mandatory validations
- [ ] Authorization active on the table
- [ ] Rules for every relevant role/profile
- [ ] No `CASCADE` on production deletes without an explicit decision (prefer soft delete)
- [ ] Constraints for financial fields (>= 0, NOT NULL as applicable)
- [ ] Indexes for foreign keys and search fields

## How to apply <!-- ADAPT: describe the project's real mechanism -->

If the project has no automated schema deploys, apply manually and record
the evidence (output, date) in the migrations-state doc. **The step most
often forgotten is recording after applying** — without it, nobody knows
what is actually in production vs. only in the repository.

⚠️ If the database engine runs the whole script as one transaction, a
failure midway rolls back everything before it, even though it seemed to
run. Before creating new authorization rules, explicitly drop/replace any
earlier version with the same name (avoids an "already exists" aborting
the entire transaction).
