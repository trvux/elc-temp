#!/usr/bin/env bash
# Install the allowlist refresh timer on the VPS (runs live.py every 2 minutes).
#   scp scripts/nginx-live/live.py vps-elc:/tmp/live.py
#   ssh vps-elc 'bash -s' < deploy/nginx/install-timer.sh
#
# What it does each run: query the production DB for published slugs, rebuild
# /etc/nginx/conf.d/elc-live.conf, `nginx -t`, reload, canary-check the homepage.
# It refuses to apply a suspicious list (DB error, <300 urls, or <85% of the previous one)
# and restores the old file if the canary fails. Logs: journalctl -u elc-nginx-live
# Remove:  systemctl disable --now elc-nginx-live.timer && rm /etc/systemd/system/elc-nginx-live.*
set -euo pipefail
install -d /opt/elc/nginx-live
install -m 0755 /tmp/live.py /opt/elc/nginx-live/live.py

cat > /etc/systemd/system/elc-nginx-live.service <<'UNIT'
[Unit]
Description=Refresh nginx 410 allowlist from the ELC database
After=docker.service nginx.service

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /opt/elc/nginx-live/live.py --db --out /etc/nginx/conf.d/elc-live.conf --reload
TimeoutStartSec=120
UNIT

cat > /etc/systemd/system/elc-nginx-live.timer <<'UNIT'
[Unit]
Description=Refresh nginx 410 allowlist every 2 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=2min
AccuracySec=10s

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now elc-nginx-live.timer
systemctl start elc-nginx-live.service || true
sleep 2
systemctl list-timers elc-nginx-live.timer --no-pager | head -3
journalctl -u elc-nginx-live -n 5 --no-pager
