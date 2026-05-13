import { readFileSync } from 'fs';

async function auditSitemap() {
  const content = readFileSync('/Users/tranvux/.gemini/antigravity/brain/89bdfa4b-2fc7-4fae-8f6c-4b6b2466429f/.system_generated/steps/4234/content.md', 'utf-8');
  const urls = content.match(/<loc>(.*?)<\/loc>/g)?.map(val => val.replace(/<\/?loc>/g, '')) || [];

  console.log(`--- Starting Audit for ${urls.length} URLs ---`);
  
  const results = {
    total: urls.length,
    ok: 0,
    errors: [] as { url: string; status: number | string }[]
  };

  // Check in batches of 20 to avoid overwhelming the server
  const batchSize = 20;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(batch.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
        if (response.ok) {
          results.ok++;
        } else {
          results.errors.push({ url, status: response.status });
        }
      } catch (error: any) {
        // If HEAD fails, try GET once just in case (some servers block HEAD)
        try {
          const retry = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
          if (retry.ok) {
            results.ok++;
          } else {
            results.errors.push({ url, status: retry.status });
          }
        } catch (retryError: any) {
          results.errors.push({ url, status: retryError.message });
        }
      }
    }));
    process.stdout.write(`Progress: ${Math.min(i + batchSize, urls.length)}/${urls.length}\r`);
  }

  console.log('\n\n--- Audit Results ---');
  console.log(`Total URLs: ${results.total}`);
  console.log(`Live (200 OK): ${results.ok}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nBroken URLs:');
    results.errors.forEach(err => {
      console.log(`- [${err.status}] ${err.url}`);
    });
  } else {
    console.log('\n✅ All URLs are LIVE and return 200 OK!');
  }
}

auditSitemap();
