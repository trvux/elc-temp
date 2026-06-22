import * as fs from "fs";
import * as path from "path";

const URLS_FILE = path.join(process.cwd(), "scratch/urls-to-redirect.txt");
const SITEMAP_FILE = path.join(process.cwd(), "public/sitemap-migration.xml");

async function generateMigrationSitemap() {
  if (!fs.existsSync(URLS_FILE)) {
    console.error("Missing file: scratch/urls-to-redirect.txt");
    console.log("Please create scratch/urls-to-redirect.txt and paste your old WordPress URLs (one per line).");
    return;
  }

  const urls = fs
    .readFileSync(URLS_FILE, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && (line.startsWith("http://") || line.startsWith("https://")));

  if (urls.length === 0) {
    console.error("No valid URLs found in scratch/urls-to-redirect.txt");
    return;
  }

  console.log(`Processing ${urls.length} URLs for migration sitemap...`);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of urls) {
    xml += "  <url>\n";
    xml += `    <loc>${escapeXml(url)}</loc>\n`;
    xml += "    <changefreq>daily</changefreq>\n";
    xml += "    <priority>0.6</priority>\n";
    xml += "  </url>\n";
  }

  xml += "</urlset>\n";

  fs.writeFileSync(SITEMAP_FILE, xml, "utf-8");
  console.log(`Successfully generated migration sitemap at: public/sitemap-migration.xml`);
  console.log(`You can now deploy this and submit it to Google Search Console as: sitemap-migration.xml`);
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

generateMigrationSitemap().catch(console.error);
