import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const KEY_FILE = path.join(process.cwd(), "service-account.json");
const URLS_FILE = path.join(process.cwd(), "scratch/urls-to-index.txt");

interface GError extends Error {
  status?: number;
}

async function indexUrls() {
  if (!fs.existsSync(KEY_FILE)) {
    console.error(`Missing service-account.json file in root directory: ${KEY_FILE}`);
    return;
  }
  
  if (!fs.existsSync(URLS_FILE)) {
    console.error(`Missing urls file: ${URLS_FILE}. Please run generate-urls.ts first.`);
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const authClient = await auth.getClient();
  const indexing = google.indexing({
    version: "v3",
    auth: authClient,
  });

  const urls = fs
    .readFileSync(URLS_FILE, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.startsWith("http"));

  console.log(`Found ${urls.length} URLs to submit.`);

  let successCount = 0;
  let failCount = 0;

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
      console.log(`Success: ${url}. Response status: ${response.status}`);
      successCount++;
    } catch (error) {
      const err = error as GError;
      console.error(`Failed to submit: ${url}. Error: ${err.message}`);
      failCount++;

      // If we hit the quota limit (429 or quotaExceeded), stop execution immediately
      if (err.status === 429 || err.message.includes("quotaExceeded") || err.message.includes("Quota exceeded")) {
        console.log("\nQuota limit reached or too many requests. Stopping indexing process.");
        
        // Remove submitted URLs from urls-to-index.txt so we can resume later
        const remainingUrls = urls.slice(i);
        fs.writeFileSync(URLS_FILE, remainingUrls.join("\n"), "utf-8");
        console.log(`Saved remaining ${remainingUrls.length} URLs back to urls-to-index.txt for the next run.`);
        break;
      }
    }
    
    // Sleep 500ms to respect rate limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n--- INDEXING RUN COMPLETED ---");
  console.log(`Successfully submitted: ${successCount}`);
  console.log(`Failed to submit: ${failCount}`);
}

indexUrls().catch(console.error);

