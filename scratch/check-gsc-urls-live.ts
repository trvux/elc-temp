import * as fs from "fs";
import * as path from "path";

const GSC_DIRS = [
  "/Users/tranvux/Downloads/gg_404",
  "/Users/tranvux/Downloads/16thangtruoc"
];

const OUTPUT_JSON = path.join(process.cwd(), "scratch/live-url-status.json");

interface UrlInfo {
  url: string;
  sourceFile: string;
}

interface CheckResult {
  url: string;
  status: number | string;
  responseTimeMs: number;
  redirectUrl?: string;
  error?: string;
}

function scanCsvFiles(dir: string, urlSet: Map<string, UrlInfo>) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanCsvFiles(fullPath, urlSet);
    } else if (file.endsWith(".csv")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      if (lines.length === 0) continue;

      const headers = lines[0].split(",");
      let urlColIndex = -1;
      for (let i = 0; i < headers.length; i++) {
        const h = headers[i].trim().replace(/^"|"$/g, "").toLowerCase();
        const cleanHeader = h.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (cleanHeader.includes("url") || cleanHeader.normalize("NFC").includes("trang")) {
          urlColIndex = i;
          break;
        }
      }

      if (urlColIndex !== -1) {
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(",");
          if (cols.length > urlColIndex) {
            const rawUrl = cols[urlColIndex].trim().replace(/^"|"$/g, "");
            if (rawUrl.startsWith("http")) {
              try {
                const parsed = new URL(rawUrl);
                if (parsed.hostname === "dienmayelc.com.vn") {
                  urlSet.set(rawUrl, { url: rawUrl, sourceFile: path.basename(fullPath) });
                }
              } catch {}
            }
          }
        }
      }
    }
  }
}

async function checkUrl(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 6000);
    
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
      }
    });
    
    clearTimeout(id);
    const duration = Date.now() - start;
    const redirectUrl = response.headers.get("location") || undefined;
    
    return {
      url,
      status: response.status,
      responseTimeMs: duration,
      redirectUrl
    };
  } catch (err: unknown) {
    const duration = Date.now() - start;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      url,
      status: "ERROR",
      responseTimeMs: duration,
      error: errorMessage
    };
  }
}

async function runCheck() {
  const urlMap = new Map<string, UrlInfo>();
  for (const dir of GSC_DIRS) {
    scanCsvFiles(dir, urlMap);
  }

  const uniqueUrls = Array.from(urlMap.values());
  console.log(`Found ${uniqueUrls.length} unique URLs to check.`);

  if (uniqueUrls.length === 0) {
    console.log("No URLs found to check.");
    return;
  }

  // Check all unique URLs.
  const urlsToTest = uniqueUrls;
  const results: CheckResult[] = [];
  const concurrency = 10;
  
  console.log(`Starting check for ${urlsToTest.length} URLs with concurrency ${concurrency}...`);
  
  for (let i = 0; i < urlsToTest.length; i += concurrency) {
    const chunk = urlsToTest.slice(i, i + concurrency);
    const promises = chunk.map(info => checkUrl(info.url));
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
    console.log(`Checked ${results.length}/${urlsToTest.length} URLs...`);
  }

  // Calculate statistics
  const statusCounts: Record<string, number> = {};
  let total200ResponseTime = 0;
  let count200 = 0;
  let totalResponseTime = 0;

  for (const r of results) {
    const statusStr = String(r.status);
    statusCounts[statusStr] = (statusCounts[statusStr] || 0) + 1;
    totalResponseTime += r.responseTimeMs;
    
    if (r.status === 200) {
      total200ResponseTime += r.responseTimeMs;
      count200++;
    }
  }

  const avgResponseTimeAll = totalResponseTime / results.length;
  const avgResponseTime200 = count200 > 0 ? total200ResponseTime / count200 : 0;

  const summary = {
    totalChecked: results.length,
    statusCounts,
    averageResponseTimeMs: {
      all: Math.round(avgResponseTimeAll),
      status200: Math.round(avgResponseTime200)
    }
  };

  console.log("\n=== SUMMARY OF LIVE URL CHECK ===");
  console.log(`Total URLs Checked: ${summary.totalChecked}`);
  console.log("Status Code Distribution:");
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  - Status ${status}: ${count} (${((count / results.length) * 100).toFixed(2)}%)`);
  }
  console.log(`Average Response Time (All): ${summary.averageResponseTimeMs.all} ms`);
  console.log(`Average Response Time (200 OK): ${summary.averageResponseTimeMs.status200} ms`);

  // Save detailed results to JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ summary, results }, null, 2), "utf-8");
  console.log(`Saved detailed results to: ${OUTPUT_JSON}`);
}

runCheck().catch(console.error);
