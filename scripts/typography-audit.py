#!/usr/bin/env python3
"""Typography migration meter (strangler fig). Read-only, no deps.

  python3 scripts/typography-audit.py            # human table
  python3 scripts/typography-audit.py --json     # machine readable (for baselines)
  python3 scripts/typography-audit.py --files public   # list files still to migrate in a zone
  python3 scripts/typography-audit.py --check    # ratchet: exit 1 if a migrated file regressed

Counts, per zone, the "old way" (Typography* components, ad-hoc text-size / font-weight
utilities) vs the "new way" (type-* utilities). Progress = old numbers going to 0.
"""
import json, re, sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ['app', 'modules', 'shared']
SKIP = ('shared/components/ui/typography.tsx',)  # the thing being replaced

ADMIN = re.compile(r'app/\(admin\)|layout/admin|/form/|Management|Columns|columns\.tsx|Form\.tsx|FAQManager|'
                   r'modules/(dashboard|admin-users|metrics|attribute-definition|shipping-zone)/')
AUTH = re.compile(r'app/\(auth\)|layout/auth|modules/auth/')
PUBLIC = re.compile(r'app/\((public|auth|fullscreen)\)|layout/user|layout/auth|organisms/(sections|link-preview)|/public/|'
                    r'modules/(inquiry|auth|faq|review|hp-page|page)/|app/not-found|'
                    r'catalog/presentation/components/(ProductCard|ComparisonTable|FormattedPrice)|'
                    r'(BranchCard|CardService|ProjectCard)\.tsx|providers/')


def zone(rel):
    if rel.startswith('shared/components/ui/') or rel.startswith('shared/components/molecules/'):
        return 'shared-ui'
    if AUTH.search(rel):
        return 'auth'
    if ADMIN.search(rel):
        return 'admin'
    if PUBLIC.search(rel):
        return 'public'
    return 'unclassified'


PATTERNS = {
    'typography_component': re.compile(r'<Typography(?:H1|H2|H3|H4|P|Lead|Large|Small|Muted|Blockquote|List|InlineCode)\b|<TypographyTable\b'),
    'raw_heading_tag': re.compile(r'<h[1-6][\s>]'),
    'text_size_util': re.compile(r'(?<![\w-])(?:(?:sm|md|lg|xl|2xl):)?text-(?:xs|sm|base|lg|xl|[2-9]xl|\[\d[\w.%]*\])(?![\w-])'),
    'font_weight_util': re.compile(r'(?<![\w-])(?:(?:sm|md|lg|xl):)?font-(?:light|normal|medium|semibold|bold|extrabold|\[\d+\])\b'),
    'leading_tracking_util': re.compile(r'(?<![\w-])(?:leading|tracking)-[\w\[\].]+'),
    'type_utility': re.compile(r'(?<![\w-])type-(?:display|headline|title|heading|subhead|body-strong|body-sm|body|callout|caption|label|tag|price-lg|price|legal|mono)\b'),
}


MIGRATED = ROOT / 'scripts' / 'typography-migrated.txt'
# What a migrated file must not contain any more (comments/blank lines allowed in the list file).
# What a file under the ratchet must not contain: the old component and ad-hoc font sizes.
# Standalone font-<weight> / leading / tracking are allowed (inline emphasis next to a type-* role).
FORBIDDEN = ('typography_component', 'text_size_util')


def check(per_file):
    """Ratchet: every path/glob listed in typography-migrated.txt must be free of the old way."""
    import fnmatch
    lines = [l.strip() for l in MIGRATED.read_text().splitlines() if l.strip() and not l.startswith('#')] \
        if MIGRATED.exists() else []
    pats = [l for l in lines if not l.startswith('!')]
    skips = [l[1:] for l in lines if l.startswith('!')]
    bad, matched = [], set()
    for rel, d in per_file.items():
        if any(fnmatch.fnmatch(rel, sk) for sk in skips):
            continue
        for pat in pats:
            if fnmatch.fnmatch(rel, pat):
                matched.add(pat)
                hits = {k: d[k] for k in FORBIDDEN if d.get(k)}
                if hits:
                    bad.append((rel, hits))
                break
    for pat in pats:
        if pat not in matched:
            print(f'WARN: pattern matches no file: {pat}')
    for rel, hits in sorted(bad):
        print(f'REGRESSION {rel}: {hits}')
    print(f'{len(pats)} patterns, {len(bad)} regressed files')
    return 1 if bad else 0


def main():
    per_zone = defaultdict(lambda: defaultdict(int))
    per_file = defaultdict(dict)
    for base in SRC:
        for f in (ROOT / base).rglob('*.tsx'):
            rel = f.relative_to(ROOT).as_posix()
            if rel in SKIP or '/node_modules/' in rel:
                continue
            text = f.read_text(errors='ignore')
            z = zone(rel)
            per_zone[z]['files'] += 1
            old = 0
            for k, rx in PATTERNS.items():
                n = len(rx.findall(text))
                per_zone[z][k] += n
                if k != 'type_utility':
                    old += n if k in ('typography_component', 'text_size_util') else 0
                if n:
                    per_file[rel][k] = n
            if old:
                per_zone[z]['files_to_migrate'] += 1
                per_file[rel]['_zone'] = z
            else:
                per_file[rel].setdefault('_zone', z)

    if '--check' in sys.argv:
        sys.exit(check(per_file))
    if '--json' in sys.argv:
        print(json.dumps({z: dict(v) for z, v in per_zone.items()}, indent=2, sort_keys=True))
        return
    if '--files' in sys.argv:
        want = sys.argv[sys.argv.index('--files') + 1]
        rows = [(r, d) for r, d in per_file.items()
                if d.get('_zone') == want and (d.get('typography_component') or d.get('text_size_util'))]
        for r, d in sorted(rows, key=lambda x: -(x[1].get('typography_component', 0) + x[1].get('text_size_util', 0))):
            print(f"{d.get('typography_component', 0):3d} comp  {d.get('text_size_util', 0):3d} text-*  {r}")
        return

    cols = ['files', 'files_to_migrate', 'typography_component', 'raw_heading_tag', 'text_size_util',
            'font_weight_util', 'leading_tracking_util', 'type_utility']
    print(f"{'zone':<13}" + ''.join(f'{c[:14]:>15}' for c in cols))
    tot = defaultdict(int)
    for z in sorted(per_zone):
        print(f'{z:<13}' + ''.join(f'{per_zone[z][c]:>15}' for c in cols))
        for c in cols:
            tot[c] += per_zone[z][c]
    print(f"{'TOTAL':<13}" + ''.join(f'{tot[c]:>15}' for c in cols))


main()
