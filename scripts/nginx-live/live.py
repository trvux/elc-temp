#!/usr/bin/env python3
"""Build the nginx $elc_live allowlist (everything else -> 410 at nginx).

Source of truth: production DB (slug of every non-deleted, published row).
  VPS   : python3 live.py --db --out /etc/nginx/conf.d/elc-live.conf --reload
  local : python3 live.py --csv alltables.csv --out deploy/nginx/elc-live.conf

Safety (a bad allowlist = mass 410 of live pages, which Google acts on fast):
  - DB error, < MIN_URLS rows, or < MIN_RATIO of the previous count -> keep old file, exit 1
  - with --reload: write, `nginx -t`, only then reload; failure restores the old file

Redirects (optional): with --redirects-out, the same run also rebuilds the $elc_redir map from the
`redirects` table (managed in /admin/redirects, filled automatically when a slug changes), so a redirect
saved in the admin is live within one timer tick, no deploy. A row is skipped (and logged) when its source
is a live page (it would hide the page), its target is not live (it would redirect into a 410), or it loops.
Chains are flattened to the final target. Both files are written, tested and reloaded together.
"""
import argparse, csv, io, json, re, subprocess, sys, time
from pathlib import Path

PREFIX = {
    'brands': '/san-pham/', 'categories': '/san-pham/', 'group_categories': '/san-pham/',
    'hp_pages': '/san-pham/', 'products': '/san-pham/', 'news': '/tin-tuc/',
    'projects': '/du-an/', 'project_type': '/du-an/', 'services': '/dich-vu/',
    'pages': '/', 'branches': '/thong-tin/',
}
PUBLISHED = {'news', 'projects', 'services', 'pages', 'branches'}
STATIC = ['/', '/san-pham', '/dich-vu', '/du-an', '/tin-tuc', '/thong-tin',
          '/form', '/magic-link', '/login', '/login/verify']
# Real routes only (app/api/*). Scanners probing /api/.env etc. must not reach Next.
INFRA = [
    '"~^/_next/" 1;', '"~^/admin(/|$)" 1;',
    '"~^/api/(contact-click|link-preview|product-feed|products|recently-viewed)(/[^/]+)?$" 1;',
    '"~^/(images|logo|brands|fonts)/" 1;', '"~^/\\.well-known/" 1;',
    '"~^/(opengraph|twitter)-image" 1;',
    '"/robots.txt" 1;', '"/favicon.ico" 1;', '"/icon.svg" 1;', '"/apple-icon.svg" 1;',
    '"/llms.txt" 1;', '"/llms-full.txt" 1;', '"/sitemap.xml" 1;',
    '"~^/sitemap/(categories|pages|posts|products)\\.xml$" 1;',
    '"~^/[0-9a-f]{32}\\.txt$" 1;',
]
MIN_URLS, MIN_RATIO = 300, 0.85


def sql():
    parts = []
    for t in PREFIX:
        w = 'deleted_at is null'
        if t in PUBLISHED:
            w += ' and is_published is not false'
        if t == 'products':
            w += " and status = 'published'"
        parts.append(f"select '{t}', slug from {t} where {w}")
    return ' union all '.join(parts)


def rows_from_db():
    cmd = ['docker', 'exec', '-i', 'elc-postgres', 'sh', '-c',
           'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "copy (%s) to stdout with csv"' % sql()]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if r.returncode:
        sys.exit('db query failed: ' + r.stderr.strip())
    return [(a, b) for a, b in csv.reader(io.StringIO(r.stdout))]


def rows_from_csv(p):
    return [(r['t'], r['slug']) for r in csv.DictReader(open(p))
            if not r['del'] and r['t'] in PREFIX and (r['t'] not in PUBLISHED or r['pub'] != 'false')
            and (r['t'] != 'products' or r['st'] == 'published')]


def esc(s):
    return s.replace('\\', '\\\\').replace('"', '\\"')


def redirects_from_db():
    cmd = ['docker', 'exec', '-i', 'elc-postgres', 'sh', '-c',
           'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c '
           '"copy (select from_path, to_path from redirects where is_active order by from_path) to stdout with csv"']
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if r.returncode:
        sys.exit('redirects query failed: ' + r.stderr.strip())
    return [(a, b) for a, b in csv.reader(io.StringIO(r.stdout))]


def redirects_from_csv(p):
    return [(r['from_path'], r['to_path']) for r in csv.DictReader(open(p))]


def build_redirects(rows, live, max_hops=10):
    """Return ({source: final_target}, [(source, reason)]) after dropping unsafe rows."""
    live = set(live)
    table, skipped = {}, []
    for a, b in rows:
        a = a.rstrip('/') or '/'
        b = b if b.startswith('http') else (b.rstrip('/') or '/')
        if a in live:
            skipped.append((a, 'source is a live page'))
            continue
        table[a] = b

    def final(p):
        seen = set()
        for _ in range(max_hops):
            if p in seen:
                return None
            seen.add(p)
            nxt = table.get(p)
            if nxt is None:
                return p
            p = nxt
        return None

    out = {}
    for a, b in sorted(table.items()):
        f = final(b)
        if f is None:
            skipped.append((a, 'redirect loop'))
        elif not f.startswith('http') and f not in live:
            skipped.append((a, 'target is not live'))
        else:
            out[a] = f
    return out, skipped


def render_redirects(table):
    L = ['# GENERATED by scripts/nginx-live/live.py from the redirects table - do not edit.',
         '# Manage redirects in the admin panel: /admin/redirects', 'map $uri $elc_redir {', '    default "";']
    for a, b in sorted(table.items()):
        for k in (a, a + '/'):
            L.append('    "%s" "%s";' % (esc(k), esc(b)))
    L += ['}', '']
    return '\n'.join(L)


def render(paths):
    L = ['# GENERATED by scripts/nginx-live/live.py - do not edit.',
         'map_hash_max_size 8192;', 'map_hash_bucket_size 256;', '',
         'map $uri $elc_live {', '    default 0;']
    for p in sorted(paths):
        for k in ([p] if p == '/' else [p, p + '/']):
            L.append('    "%s" 1;' % k.replace('\\', '\\\\').replace('"', '\\"'))
    L += ['    ' + x for x in INFRA] + ['}', '']
    # /x/ -> /x in ONE hop, only for live paths (dead ones go straight to 410, no extra hop)
    L += ['map $uri $elc_slash {', '    default "";']
    for p in sorted(paths - {'/'}):
        L.append('    "%s/" "%s";' % (p.replace('\\', '\\\\').replace('"', '\\"'), p.replace('\\', '\\\\').replace('"', '\\"')))
    L += ['}', '']
    return '\n'.join(L)


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--db', action='store_true')
    g.add_argument('--csv')
    ap.add_argument('--out', required=True)
    ap.add_argument('--redirects-out', help='also rebuild the $elc_redir map from the redirects table')
    ap.add_argument('--redirects-csv', help='local mode: CSV with from_path,to_path columns')
    ap.add_argument('--reload', action='store_true')
    a = ap.parse_args()
    rows = rows_from_db() if a.db else rows_from_csv(a.csv)
    paths = set(STATIC) | {PREFIX[t] + s for t, s in rows if s}
    out = Path(a.out)
    old = out.read_text() if out.exists() else None
    prev = len(re.findall(r'^    "/[^"]*" 1;$', old, re.M)) // 2 if old else 0
    if len(paths) < MIN_URLS or (prev and len(paths) < prev * MIN_RATIO):
        sys.exit(f'REFUSED: {len(paths)} urls (prev ~{prev}); keeping old allowlist')
    new = render(paths)

    targets = [(out, old, new)]   # (path, previous text, new text) for every file this run owns
    if a.redirects_out:
        rrows = redirects_from_db() if a.db else redirects_from_csv(a.redirects_csv)
        rout = Path(a.redirects_out)
        rold = rout.read_text() if rout.exists() else None
        rprev = len(re.findall(r'^    "/[^"]*" "[^"]*";$', rold, re.M)) // 2 if rold else 0
        # An empty result while the previous file had many rules means the query went wrong, not that
        # every redirect was deleted on purpose: keep the old file rather than 410 hundreds of old URLs.
        if not rrows and rprev > 50:
            sys.exit(f'REFUSED: 0 redirects in DB (prev ~{rprev}); keeping old redirect map')
        table, skipped = build_redirects(rrows, paths)
        for src, why in skipped:
            print(f'skipped redirect {src}: {why}', file=sys.stderr)
        targets.append((rout, rold, render_redirects(table)))

    changed = [(p, o, n) for p, o, n in targets if o != n]
    if not changed:
        print(f'unchanged ({len(paths)} urls)')
        return

    def restore():
        for p, o, _ in changed:
            if o is not None:
                p.write_text(o)
            else:
                p.unlink(missing_ok=True)

    for p, _, n in changed:
        p.write_text(n)
    if a.reload:
        t = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
        if t.returncode:
            restore()
            sys.exit('nginx -t failed, rolled back: ' + t.stderr.strip()[-300:])
        subprocess.run(['nginx', '-s', 'reload'], check=True)
        time.sleep(1)
        # canary: homepage must still be 200 through the real vhost, else restore the old files
        h = subprocess.run(['curl', '-sk', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '20',
                            '--resolve', 'dienmayelc.com.vn:443:127.0.0.1', 'https://dienmayelc.com.vn/'],
                           capture_output=True, text=True).stdout
        if h != '200':
            restore()
            subprocess.run(['nginx', '-s', 'reload'])
            sys.exit(f'canary failed (home={h}), restored previous files')
    else:
        Path(str(out) + '.json').write_text(json.dumps(sorted(paths)))
    msg = f'wrote {len(paths)} urls'
    if a.redirects_out and targets[1] in changed:
        msg += f' + {len(table)} redirects'
    print(msg + (' + reloaded' if a.reload else ''))


if __name__ == '__main__':
    main()
