#!/usr/bin/env python3
"""Turn the old hand-built nginx map (elc-redirects.conf) into SQL that loads it into the redirects table.

  python3 import_legacy_redirects.py /etc/nginx/conf.d/elc-redirects.conf > import.sql
  docker exec -i elc-postgres psql -U elc -d elc -v ON_ERROR_STOP=1 < import.sql

The old file lists every rule twice (with and without a trailing slash); only the slashless form is kept,
live.py re-emits both. Rows are marked source='import'. Safe to run again: existing rows are left alone.
"""
import re
import sys

PAIR = re.compile(r'^\s*"([^"]*)"\s+"([^"]*)";\s*$')


def parse(text):
    """Return {source: target} from the map body, slash variants merged. Lines that are not exact pairs are ignored."""
    pairs = {}
    for line in text.splitlines():
        m = PAIR.match(line)
        if not m:
            continue
        src, dst = m.group(1), m.group(2)
        src = src.rstrip('/') or '/'
        dst = dst if dst.startswith('http') else (dst.rstrip('/') or '/')
        if src == '/' or src == dst:
            continue
        pairs.setdefault(src, dst)
    return pairs


def q(s):
    return '$q$' + s + '$q$'


def to_sql(pairs):
    out = ['\\set ON_ERROR_STOP on', 'BEGIN;']
    for src, dst in sorted(pairs.items()):
        out.append(
            f"INSERT INTO redirects (from_path, to_path, source, note) VALUES ({q(src)}, {q(dst)}, 'import', "
            f"'Chuyển từ elc-redirects.conf') ON CONFLICT (from_path) DO NOTHING;")
    out.append('COMMIT;')
    return '\n'.join(out) + '\n'


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    pairs = parse(open(sys.argv[1], encoding='utf8').read())
    sys.stdout.write(to_sql(pairs))
    print(f'-- {len(pairs)} redirects', file=sys.stderr)
