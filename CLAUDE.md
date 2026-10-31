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

## Typography: tag and style are two independent axes

Text style comes from the `type-*` roles in `app/globals.css` (`type-display`, `type-headline`,
`type-title`, `type-heading`, `type-subhead`, `type-body`, `type-body-strong`, `type-body-sm`,
`type-callout`, `type-caption`, `type-label`, `type-tag`, `type-legal`, `type-price`, `type-price-lg`,
`type-mono`), the same scale as elc-v2. The HTML tag is chosen separately, by position in the page
outline (one `h1`; no skipped levels; a `ul > li` of links has no headings; an item that has content
under its title gets a heading whose level follows where it sits).

- Never use `text-xs/sm/base/lg/...` or the removed `Typography*` components in new code. One role per
  element; do not combine a `type-*` with `font-<weight>`/`leading-*`/`tracking-*` on the same element
  (`cn()` in `shared/lib/utils.ts` resolves such conflicts, but the later class silently wins).
- Adding a role means adding `@utility type-<name>` in `app/globals.css` AND the name to `TYPE_ROLES`
  in `shared/lib/utils.ts` (a test fails if they drift).
- `python3 scripts/typography-audit.py --check` must exit 0.
