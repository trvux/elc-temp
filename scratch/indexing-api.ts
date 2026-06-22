import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

const KEY_FILE = path.join(process.cwd(), "google-service-account.json");
const URLS_FILE = path.join(process.cwd(), "scratch/urls-to-index.txt");

async function indexUrls() {
  if (!fs.existsSync(KEY_FILE)) {
    console.error("Missing google-service-account.json file in root directory");
    return;
  }
  
  if (!fs.existsSync(URLS_FILE)) {
    console.error("Missing scratch/urls-to-index.txt file. Please create it and add one URL per line.");
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

  for (const url of urls) {
    try {
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: "URL_UPDATED",
        },
      });
      console.log(`Successfully submitted: ${url}. Response status: ${response.status}`);
    } catch (error) {
      const err = error as Error;
      console.error(`Failed to submit: ${url}. Error: ${err.message}`);
    }
    // Sleep 1 second to respect Google's API rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

indexUrls().catch(console.error);
