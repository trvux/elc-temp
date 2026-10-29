#!/usr/bin/env python3
"""Codemod: ad-hoc text-<size>/font-<weight>/leading/tracking class lists -> one type-* role.

  python3 scripts/typography-codemod.py --zone admin            # dry run (default): summary + manual list
  python3 scripts/typography-codemod.py --zone admin --diff 12  # also print 12 sample before/after strings
  python3 scripts/typography-codemod.py --zone admin --write    # apply (back up first: see --backup)

Works per class string (a "..." / '...' / `...` literal that contains a text-<size> token):
  size + weight  -> one role (table below); leading-* / tracking-* in that string are dropped
  size + font-mono -> type-mono
It never guesses: a string with a responsive/variant size or weight (md:text-lg, hover:font-bold),
an arbitrary size (text-[13px]), a `!` important modifier, or a template `${}` is left untouched and
listed as MANUAL. Residual standalone font-<weight>/leading-/tracking- tokens in a converted file are
also listed: with cn()'s two-way merge (shared/lib/utils.ts) a later font-weight REMOVES an earlier
type-* role, so those must be resolved by hand before shipping.

Mapping (weights collapse to 400 / 500 / 600; same scale as elc-v2, see docs/typography-strangler-plan.md):
  xs   : 400 legal         | 500,600 tag
  sm   : 400 body-sm       | 500 caption       | 600 label
  base : 400 body          | 500,600 body-strong
  lg,xl: 400 body          | 500,600 heading
  2xl  : 400 subhead       | 500,600 title
  3xl,4xl: headline        | 5xl+ : display
"""
import argparse, re, shutil, subprocess, sys, time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SIZE = re.compile(r'^text-(xs|sm|base|lg|xl|[2-9]xl)$')
WEIGHT = re.compile(r'^font-(light|normal|medium|semibold|bold|extrabold|\[\d+\])$')
LEAD_TRACK = re.compile(r'^(leading|tracking)-')
LITERAL = re.compile(r'"(?:[^"\\\n]|\\.)*"|\'(?:[^\'\\\n]|\\.)*\'|`(?:[^`\\]|\\.)*`')
HAS_SIZE = re.compile(r'(?<![\w-])(?:[\w-]+:)*!?text-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])(?![\w-])')


def weight_bucket(tok):
    if tok is None:
        return 400
    w = WEIGHT.match(tok).group(1)
    if w in ('light', 'normal'):
        return 400
    if w == 'medium':
        return 500
    if w.startswith('['):
        n = int(w.strip('[]'))
        return 400 if n < 450 else 500 if n < 550 else 600
    return 600


def role_for(size, w):
    if size == 'xs':
        return 'legal' if w == 400 else 'tag'
    if size == 'sm':
        return 'body-sm' if w == 400 else 'caption' if w == 500 else 'label'
    if size == 'base':
        return 'body' if w == 400 else 'body-strong'
    if size in ('lg', 'xl'):
        return 'body' if w == 400 else 'heading'
    if size == '2xl':
        return 'subhead' if w == 400 else 'title'
    if size in ('3xl', '4xl'):
        return 'headline'
    return 'display'


def convert(s):
    """Return (new_string, status). status: 'ok' | 'skip' (no size) | reason string for MANUAL."""
    body, q = s[1:-1], s[0]
    if not HAS_SIZE.search(body):
        return s, 'skip'
    if q == '`' and '${' in body:
        return s, 'template-expression'
    parts = re.split(r'(\s+)', body)
    toks = [(i, t) for i, t in enumerate(parts) if t and not t.isspace()]
    for _, t in toks:
        base = t.rsplit(':', 1)[-1].lstrip('!')
        prefixed = (':' in t and not t.startswith('[')) or t.startswith('!')
        if prefixed and (SIZE.match(base) or WEIGHT.match(base) or base.startswith('text-[')):
            return s, 'variant-or-important:' + t
        if t.startswith('text-['):
            return s, 'arbitrary-size:' + t
    sizes = [(i, t) for i, t in toks if SIZE.match(t)]
    if len(sizes) != 1:
        return s, 'multiple-or-no-size'
    wts = [(i, t) for i, t in toks if WEIGHT.match(t)]
    if len(wts) > 1:
        return s, 'multiple-weights'
    mono = [(i, t) for i, t in toks if t == 'font-mono']
    si, st = sizes[0]
    drop = {i for i, t in toks if LEAD_TRACK.match(t)}
    if mono:
        role, drop = 'mono', drop | {mono[0][0]} | {i for i, _ in wts}
    else:
        role = role_for(SIZE.match(st).group(1), weight_bucket(wts[0][1] if wts else None))
        drop |= {i for i, _ in wts}
    parts[si] = f'type-{role}'
    out = [p for i, p in enumerate(parts) if i not in drop]
    new = ''.join(out)
    new = re.sub(r'\s{2,}', ' ', new).strip()
    return f'{q}{new}{q}', 'ok'


def files_for(zone):
    out = subprocess.run([sys.executable, str(ROOT / 'scripts/typography-audit.py'), '--files', zone],
                         capture_output=True, text=True, cwd=ROOT).stdout
    return [l.split()[-1] for l in out.splitlines() if l.strip()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--zone', required=True)
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--diff', type=int, default=0)
    ap.add_argument('--backup', default=None, help='directory to copy originals to before --write')
    a = ap.parse_args()

    files = files_for(a.zone)
    mapped, manual, residual, samples = Counter(), [], [], []
    changed_files = 0
    backup = Path(a.backup) if a.backup else None
    for rel in files:
        p = ROOT / rel
        src = p.read_text()
        n_ok = 0

        def sub(m):
            nonlocal n_ok
            new, st = convert(m.group(0))
            if st == 'ok':
                n_ok += 1
                mapped[re.search(r'type-[\w-]+', new).group(0)] += 1
                if len(samples) < a.diff:
                    samples.append((rel, m.group(0)[:150], new[:150]))
                return new
            if st != 'skip':
                manual.append((rel, st, m.group(0)[:120]))
            return m.group(0)

        out = LITERAL.sub(sub, src)
        if n_ok:
            changed_files += 1
            left = re.findall(r'["\'`\s]((?:font-(?:light|normal|medium|semibold|bold|extrabold)|leading-[\w\[\]./]+|tracking-[\w\[\]./]+))(?=["\'`\s])', out)
            if left:
                residual.append((rel, sorted(set(left))))
            if a.write:
                if backup:
                    dst = backup / rel
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(p, dst)
                p.write_text(out)

    print(f"zone={a.zone} files scanned={len(files)} changed={changed_files} {'(WRITTEN)' if a.write else '(dry run)'}")
    print('strings converted per role:', dict(mapped.most_common()))
    print(f'MANUAL strings left untouched: {len(manual)}')
    for rel, why, txt in manual[:40]:
        print(f'  [{why[:34]}] {rel}: {txt}')
    print(f'files with residual font-weight/leading/tracking tokens after conversion: {len(residual)}')
    for rel, toks in residual[:40]:
        print(f'  {rel}: {" ".join(toks)}')
    for rel, before, after in samples:
        print(f'--- {rel}\n  - {before}\n  + {after}')


main()
