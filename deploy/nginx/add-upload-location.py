#!/usr/bin/env python3
"""Adds the nginx location for customer file uploads to the live site config.

The site-wide client_max_body_size stays 10m. Customer drawings and photos go up to 15 MB each
(elc-go internal/inquiry/domain/attachment.go), so POST /api/inquiries/files alone gets 17m, which
is the file plus multipart overhead. proxy_request_buffering is off so a 15 MB body streams to Next
instead of being written to nginx's temp directory first.

Idempotent: does nothing when the location is already there. Usage: add-upload-location.py <site-file>
"""
import sys

BLOCK = """    # Customer drawings and photos: 15 MB each plus multipart overhead. Streamed, not buffered.
    location = /api/inquiries/files {
        client_max_body_size 17m;
        proxy_request_buffering off;
        proxy_pass http://localhost:3000;
        proxy_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

"""
ANCHOR = "    location / {\n"


def patch(text: str) -> str:
    if "location = /api/inquiries/files" in text:
        return text
    # The 443 server is the one with the allowlist; the first "location /" is its.
    if text.count(ANCHOR) != 1:
        raise SystemExit(f"expected exactly one '{ANCHOR.strip()}' in the site file, found {text.count(ANCHOR)}")
    return text.replace(ANCHOR, BLOCK + ANCHOR, 1)


if __name__ == "__main__":
    path = sys.argv[1]
    original = open(path).read()
    patched = patch(original)
    if patched == original:
        print("already present")
    else:
        open(path, "w").write(patched)
        print("added")
