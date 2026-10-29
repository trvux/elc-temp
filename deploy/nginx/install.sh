#!/usr/bin/env bash
# Install the crawl-budget allowlist + URL normalization on the VPS nginx. Run from elc-temp/:
#   scp deploy/nginx/elc-live.conf deploy/nginx/elc-redirects.conf deploy/nginx/elc-normalize.conf vps-elc:/tmp/
#   ssh vps-elc 'bash -s' < deploy/nginx/install.sh
#
# Idempotent. Backs up the site file, patches it, `nginx -t`, reloads only on success,
# otherwise restores everything. Rollback later:
#   cp /root/nginx-backup-*/site.orig /etc/nginx/sites-enabled/dienmayelc.com.vn && nginx -t && nginx -s reload
#
# Canonical form: https://dienmayelc.com.vn/path (apex, https, no trailing slash), reached in ONE hop:
#   http(s)://www/x/  -> https://dienmayelc.com.vn/x      (301)
#   http://apex/x/    -> https://dienmayelc.com.vn/x      (301)
#   https://apex/x/   -> https://dienmayelc.com.vn/x      (301, only for live paths; dead ones are 410)
set -euo pipefail
SITE=/etc/nginx/sites-enabled/dienmayelc.com.vn
BK=/root/nginx-backup-$(date +%Y%m%d%H%M)
mkdir -p "$BK"
cp -a "$SITE" "$BK/site.orig"
cp -a /etc/nginx/conf.d "$BK/conf.d.orig"

python3 - "$SITE" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
APEX = "https://dienmayelc.com.vn"

# --- 443 server: allowlist (first install) ---
if "elc_live" not in s:
    s = s.replace("    client_max_body_size 10m;\n", "    client_max_body_size 10m;\n", 1)
    s = s.replace(
        "    location / {\n",
        "    location / {\n"
        "        # Crawl-budget allowlist: anything not live is 410 here, never reaches Next/DB\n"
        "        if ($elc_redir) { return 308 $elc_redir; }\n"
        "        if ($elc_live = 0) { return 410; }\n\n", 1)

# --- 443 server: www + trailing slash in one hop ---
old_www = "    if ($host = www.dienmayelc.com.vn) { return 301 https://dienmayelc.com.vn$request_uri; }\n"
new_block = (
    "    # Canonical host/slash: one hop to https://dienmayelc.com.vn/path (no www, no trailing slash)\n"
    "    if ($host = www.dienmayelc.com.vn) { return 301 " + APEX + "$elc_noslash$is_args$args; }\n"
    "    if ($elc_slash) { return 301 " + APEX + "$elc_slash$is_args$args; }\n")
if "$elc_slash" not in s:
    if old_www in s:
        s = s.replace(old_www, new_block, 1)
    else:
        s = s.replace("    client_max_body_size 10m;\n", "    client_max_body_size 10m;\n\n" + new_block, 1)

# --- port 80 server: http(s)/www -> canonical in one hop ---
old80 = ("    if ($host = www.dienmayelc.com.vn) {\n        return 301 https://$host$request_uri;\n"
         "    } # managed by Certbot\n\n"
         "    if ($host = dienmayelc.com.vn) {\n        return 301 https://$host$request_uri;\n"
         "    } # managed by Certbot\n")
new80 = "    return 301 " + APEX + "$elc_noslash$is_args$args;\n"
if old80 in s:
    s = s.replace(old80, new80, 1)
    s = s.replace("    return 404; # managed by Certbot\n", "", 1)

# --- hardening v2 (idempotent) ---
# 410 must not be cached 4h by Cloudflare/browsers (newly published slug would stay 410 after refresh)
if "no-store" not in s:
    s = s.replace("        if ($elc_live = 0) { return 410; }\n",
        "        # uppercase never exists in slugs (map exact-match is case-insensitive, so flag it explicitly)\n"
        "        if ($elc_upper) { add_header Cache-Control \"no-store\" always; return 410; }\n"
        "        if ($elc_live = 0) { add_header Cache-Control \"no-store\" always; return 410; }\n", 1)
# origin must not serve the site for arbitrary Host/SNI (IP hits, foreign domains pointed at the IP)
if "default_server" not in s:
    s += (
        "\n# Catch-all: unknown Host/SNI never reaches Next\n"
        "server {\n    listen 80 default_server;\n    listen [::]:80 default_server;\n    server_name _;\n    return 444;\n}\n"
        "server {\n    listen 443 ssl default_server;\n    listen [::]:443 ssl default_server;\n    server_name _;\n    ssl_reject_handshake on;\n}\n")
# Markdown 410 for agents (Accept: text/markdown): rewrite dead paths to Next's DB-free /agent-md/gone,
# and mark the bare nginx 410s as varying on Accept. Needs $elc_gone_md from elc-normalize.conf and the
# /agent-md/gone route deployed in the app BEFORE this runs.
if "elc_gone_md" not in s:
    s = s.replace("        if ($elc_redir) { return 308 $elc_redir; }\n",
        "        if ($elc_redir) { return 308 $elc_redir; }\n"
        "        # Agents asking for Markdown get a Markdown 410 body from Next (no DB), not nginx's HTML one\n"
        "        if ($elc_gone_md) { rewrite ^ /agent-md/gone break; }\n", 1)
if 'Vary "Accept"' not in s:
    s = s.replace('add_header Cache-Control "no-store" always; return 410;',
                  'add_header Cache-Control "no-store" always; add_header Vary "Accept" always; return 410;')
open(p, "w").write(s)
PY

cp /tmp/elc-redirects.conf /tmp/elc-normalize.conf /etc/nginx/conf.d/
# elc-live.conf is owned by the elc-nginx-live timer once it exists; never overwrite it with a stale snapshot
[ -f /etc/nginx/conf.d/elc-live.conf ] || cp /tmp/elc-live.conf /etc/nginx/conf.d/

rollback() {
  cp -a "$BK/site.orig" "$SITE"
  rm -f /etc/nginx/conf.d/elc-normalize.conf
  cp -a "$BK/conf.d.orig/." /etc/nginx/conf.d/
  nginx -t && nginx -s reload
}
if nginx -t 2>&1 | tail -1 | grep -q successful; then
  nginx -s reload
  sleep 1
  # post-reload health check with the real Host/SNI; roll back automatically if the site is not 200
  code=$(curl -sk -o /dev/null -w '%{http_code}' --resolve dienmayelc.com.vn:443:127.0.0.1 https://dienmayelc.com.vn/ || true)
  if [ "$code" != "200" ]; then echo "health check failed ($code), rolling back"; rollback; exit 1; fi
  echo "RELOADED (health $code). backup: $BK"
  # Markdown 410 needs the app's /agent-md/gone route; warn (don't roll back) if it is not live yet.
  gone=$(curl -sk -o /dev/null -w '%{http_code} %{content_type}' -H 'Accept: text/markdown' --resolve dienmayelc.com.vn:443:127.0.0.1 https://dienmayelc.com.vn/__elc-md-probe || true)
  case "$gone" in "410 text/markdown"*) echo "markdown 410 OK ($gone)";; *) echo "WARNING: markdown 410 probe returned '$gone' - deploy the app (app/agent-md/gone) first";; esac
else
  echo "nginx -t FAILED, restoring"
  cp -a "$BK/site.orig" "$SITE"
  rm -f /etc/nginx/conf.d/elc-normalize.conf
  cp -a "$BK/conf.d.orig/." /etc/nginx/conf.d/
  nginx -t
  exit 1
fi
