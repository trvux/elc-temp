import { readFileSync } from 'fs';

async function auditSitemap() {
  const content = readFileSync('/Users/tranvux/.gemini/antigravity/brain/89bdfa4b-2fc7-4fae-8f6c-4b6b2466429f/.system_generated/steps/4487/content.md', 'utf-8');
  const urls = content.match(/<loc>(.*?)<\/loc>/g)?.map(val => val.replace(/<\/?loc>/g, '')) || [];

  console.log(`--- Starting Final Audit for ${urls.length} URLs ---`);
  
  const results = {
    total: urls.length,
    ok: 0,
    errors: [] as { url: string; status: number | string }[]
  };

  const batchSize = 25; // Increased batch size for faster live check
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(batch.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
        if (response.ok) {
          results.ok++;
        } else {
          // If HEAD fails (some servers block it), try GET
          const retry = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
          if (retry.ok) {
            results.ok++;
          } else {
            results.errors.push({ url, status: retry.status });
          }
        }
      } catch (error: any) {
        results.errors.push({ url, status: error.message });
      }
    }));
    process.stdout.write(`Progress: ${Math.min(i + batchSize, urls.length)}/${urls.length}\r`);
  }

  console.log('\n\n--- Final Audit Results ---');
  console.log(`Total URLs: ${results.total}`);
  console.log(`Live (200 OK): ${results.ok}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nBroken URLs Found:');
    results.errors.forEach(err => {
      console.log(`- [${err.status}] ${err.url}`);
    });
  } else {
    console.log('\n✅ ALL ${results.total} URLS ARE LIVE AND 200 OK! DEPLOYMENT SUCCESSFUL! 🚀');
  }
}

auditSitemap();
