// Revalidation (revalidateTag/revalidatePath) only invalidates — the next
// hit after that is still a cold cache miss that pays the full render cost
// again (the "20s đầu chậm" symptom, see docs/SEO-REDESIGN.md #10). Firing a
// background GET right after revalidation forces Next.js to regenerate and
// re-populate the cache immediately, so the next real visitor (or Googlebot)
// gets a warm response instead of triggering the slow path themselves.
export function warmCache(urls: string[]): void {
  for (const url of urls) {
    fetch(url, { cache: "no-store" }).catch((err) => {
      console.error(`Cache warm failed for ${url}:`, err);
    });
  }
}
