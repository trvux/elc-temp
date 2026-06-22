import * as fs from "fs";
import * as path from "path";

const GSC_DIR = "/Users/tranvux/Downloads/gg_404";
const OUTPUT_SITEMAP = path.join(process.cwd(), "public/sitemap-migration.xml");

function shouldIncludeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "dienmayelc.com.vn") return false;
    
    const pathname = parsed.pathname.toLowerCase();
    
    // Exclude admin, system, and asset paths
    const excludePatterns = [
      "/admin/",
      "/api/",
      "/wp-admin/",
      "/wp-includes/",
      "/wp-content/",
      "/wp-json/",
      "/xmlrpc.php",
      "/cdn-cgi/",
    ];
    
    const isExcluded = excludePatterns.some(pattern => pathname.includes(pattern));
    return !isExcluded;
  } catch {
    return false;
  }
}

async function parseCsvFiles() {
  if (!fs.existsSync(GSC_DIR)) {
    console.error(`GSC Directory not found: ${GSC_DIR}`);
    return;
  }

  const urlSet = new Set<string>();

  // Helper to search directories recursively for CSV files named "Bảng.csv" or similar
  function scanDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith(".csv")) {
        parseCsv(fullPath);
      }
    }
  }

  function parseCsv(filePath: string) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    
    let urlColIndex = -1;
    
    if (lines.length === 0) return;
    
    // Find URL column header
    const headers = lines[0].split(",");
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].trim().replace(/^"|"$/g, "");
      if (h.toUpperCase() === "URL") {
        urlColIndex = i;
        break;
      }
    }

    if (urlColIndex === -1) {
      return;
    }

    // Read rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple split by comma, respecting quotes
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      cols.push(current.trim().replace(/^"|"$/g, ""));

      if (cols.length > urlColIndex) {
        const rawUrl = cols[urlColIndex];
        if (rawUrl.startsWith("http")) {
          urlSet.add(rawUrl);
        }
      }
    }
  }

  scanDir(GSC_DIR);

  const allUrls = Array.from(urlSet);
  console.log(`Extracted ${allUrls.length} unique URLs from GSC CSVs.`);

  // Filter for migration URLs
  const oldUrls = allUrls.filter(shouldIncludeUrl);
  console.log(`Filtered down to ${oldUrls.length} migration URLs.`);

  if (oldUrls.length === 0) {
    console.warn("No migration URLs were matched.");
    return;
  }

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of oldUrls) {
    xml += "  <url>\n";
    xml += `    <loc>${escapeXml(url)}</loc>\n`;
    xml += "    <changefreq>daily</changefreq>\n";
    xml += "    <priority>0.6</priority>\n";
    xml += "  </url>\n";
  }

  xml += "</urlset>\n";

  fs.writeFileSync(OUTPUT_SITEMAP, xml, "utf-8");
  console.log(`Generated migration sitemap with ${oldUrls.length} URLs at: public/sitemap-migration.xml`);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

parseCsvFiles().catch(console.error);
