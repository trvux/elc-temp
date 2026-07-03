# Indexing Instructions and Workflow

This file provides context and instructions for AI agents to continue the bulk indexing process for dienmayelc.com.vn.

## Context

Google Indexing API has been configured for the website `https://dienmayelc.com.vn` using a service account.
- Service Account Key: Saved at `service-account.json` in the root directory.
- Primary URLs to Index: Saved at `scratch/urls-to-index.txt`. (Filtered to exclude district combinations to avoid doorway page penalties).
- Daily Indexing Limit: ~200 URLs per day (imposed by Google API).

## Agent Instructions for 'indexing url tiep theo di'

When the user asks to continue indexing, perform the following steps:

1. **Verify Files Exist**:
   - Check that `service-account.json` is in the root directory.
   - Check that `scratch/urls-to-index.txt` contains URLs to index.

2. **Execute Indexing Script**:
   - Run the command:
     ```bash
     npx tsx scratch/indexing-api.ts
     ```
   - This script submits URLs from `scratch/urls-to-index.txt` one by one with a 500ms delay.
   - If the script hits the daily quota (returns status 429 or quota limit errors), it will automatically stop and rewrite the remaining URLs back to `scratch/urls-to-index.txt`.

3. **Monitor and Report**:
   - Monitor the script logs.
   - Once completed or stopped due to quota limits, report the success count, failure count, and state of remaining URLs to the user.

## Instructions for Re-generating URLs (If sitemap changes)

If the website sitemap has changed and you need to rebuild the list of primary URLs:
1. Run the generation script:
   ```bash
   npx tsx scratch/generate-urls.ts
   ```
2. This will re-fetch the online sitemap, filter out district-specific pages, and output a fresh list to `scratch/urls-to-index.txt`.
   WARNING: Running this script will completely overwrite `scratch/urls-to-index.txt` and reset any current indexing progress. Do NOT run this unless you intend to restart the indexing from scratch.

## Run History and Current Status

Last updated: 2026-07-03
- Total URLs in sitemap initially: 416
- Run on 2026-06-25: Successfully submitted 204 URLs. Stopped at URL index 205 due to daily quota limit.
- Run on 2026-06-26: Successfully submitted 206 URLs. Stopped at URL index 207 due to daily quota limit.
- Run on 2026-06-29: Regenerated URL list (sitemap updated after SEO fixes — canonical tags, title location). Successfully submitted 205 URLs. Stopped at URL index 206 due to daily quota limit.
- Run on 2026-06-30 (run 1): Successfully submitted 205 URLs. Stopped at URL index 206 due to daily quota limit.
- Run on 2026-06-30 (run 2): Successfully submitted 203 URLs. Stopped at URL index 204 due to daily quota limit.
- Run on 2026-07-03: Regenerated product-only URL list (213 URLs). Successfully submitted 206 URLs. Stopped at URL index 207 due to daily quota limit.
- Remaining URLs in `scratch/urls-to-index.txt` to index on next run: 7

## TODO
- [ ] Run indexing tomorrow (2026-07-04): `npx tsx scratch/indexing-api.ts` — 7 URLs remaining.

