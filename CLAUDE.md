# elc-temp

## Keep RFC/doc status current when finishing the work it describes

When a `docs/*.md` planning/RFC doc is fully or partially implemented, update
that file's `Status` field in the **same commit/PR** that finishes the work —
don't leave it saying "Draft" / "đang thực hiện" after the work is done. Stale
status on a planning doc is itself clutter: it misleads whoever (human or AI)
reads it next into re-investigating or re-doing work that's already finished.
This was a recurring source of repo cruft (found 2026-09-01:
`docs/rfc-fe-dead-code-cleanup.md` said "đang thực hiện" while groups A/D/E
had already shipped and merged to `main`).
