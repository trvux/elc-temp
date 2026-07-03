import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from 'dotenv';
import { createStaticClient } from '../shared/lib/supabase/static';

dotenv.config({ path: '.env.local' });

const KEY_FILE = path.join(process.cwd(), "service-account.json");
const URLS_FILE = path.join(process.cwd(), "scratch/product-urls-to-index.txt");

interface GError extends Error {
  status?: number;
}

async function run() {
  let urls: string[] = [];
  
  if (fs.existsSync(URLS_FILE) && fs.readFileSync(URLS_FILE, "utf-8").trim().length > 0) {
    console.log(`Reading existing URLs from ${URLS_FILE}...`);
    urls = fs
      .readFileSync(URLS_FILE, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.startsWith("http"));
  } else {
    console.log("Fetching all published products from Supabase...");
    const supabase = createStaticClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("slug")
      .eq("is_published", true)
      .is("deleted_at", null);

    if (error) {
      console.error("Failed to fetch products:", error);
      return;
    }

    if (!products || products.length === 0) {
      console.log("No published products found in database.");
      return;
    }

    const BASE_URL = "https://dienmayelc.com.vn";
    urls = products.map((p) => `${BASE_URL}/san-pham/${p.slug}`);
    console.log(`Generated ${urls.length} product URLs.`);
    
    fs.writeFileSync(URLS_FILE, urls.join("\n"), "utf-8");
    console.log(`Saved product URLs to ${URLS_FILE}`);
  }

  if (urls.length === 0) {
    console.log("No URLs remaining to index.");
    return;
  }

  // Load Google Credentials
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let credentials: Record<string, unknown> | undefined;

  if (serviceAccountJson) {
    try {
      credentials = JSON.parse(serviceAccountJson) as Record<string, unknown>;
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", e);
    }
  }

  const auth = new google.auth.GoogleAuth({
    ...(credentials ? { credentials } : { keyFile: KEY_FILE }),
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const indexing = google.indexing({
    version: "v3",
    auth: auth,
  });

  console.log(`Starting to submit ${urls.length} URLs to Google Indexing API...`);
  let successCount = 0;
  let failCount = 0;
  let quotaExceeded = false;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Submitting: ${url}`);

    try {
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: "URL_UPDATED",
        },
      });
      console.log(`Success: ${url}. Status: ${response.status}`);
      successCount++;
    } catch (error) {
      const err = error as GError;
      console.error(`Failed to submit: ${url}. Error: ${err.message}`);
      failCount++;

      if (err.status === 429 || err.message.includes("quotaExceeded") || err.message.includes("Quota exceeded")) {
        console.log("\nQuota limit reached (typically 200/day). Stopping submission.");
        quotaExceeded = true;
        const remainingUrls = urls.slice(i);
        fs.writeFileSync(URLS_FILE, remainingUrls.join("\n"), "utf-8");
        console.log(`Saved remaining ${remainingUrls.length} URLs to ${URLS_FILE} for next run.`);
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!quotaExceeded) {
    const remainingUrls = urls.slice(successCount + failCount);
    if (remainingUrls.length === 0) {
      fs.writeFileSync(URLS_FILE, "", "utf-8");
      console.log(`All URLs processed. Cleared ${URLS_FILE}.`);
    } else {
      fs.writeFileSync(URLS_FILE, remainingUrls.join("\n"), "utf-8");
    }
  }

  console.log("\n--- RUN COMPLETED ---");
  console.log(`Successfully submitted: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

run().catch(console.error);
