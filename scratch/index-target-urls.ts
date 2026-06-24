import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const KEY_FILE = path.join(process.cwd(), "service-account.json");

const TARGET_URLS = [
  "https://dienmayelc.com.vn",
  "https://dienmayelc.com.vn/san-pham/may-lanh",
  "https://dienmayelc.com.vn/san-pham/may-lanh-treo-tuong",
  "https://dienmayelc.com.vn/san-pham/may-lanh-ap-tran",
  "https://dienmayelc.com.vn/san-pham/may-lanh-tu-dung",
  "https://dienmayelc.com.vn/san-pham/may-lanh-am-tran-da-huong-thoi",
  "https://dienmayelc.com.vn/san-pham/may-lanh-giau-tran-noi-ong-gio"
];

async function indexUrls() {
  if (!fs.existsSync(KEY_FILE)) {
    console.error(`Missing service-account.json file in root directory: ${KEY_FILE}`);
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

  console.log(`Submitting ${TARGET_URLS.length} target URLs to Google Indexing API...`);

  for (let i = 0; i < TARGET_URLS.length; i++) {
    const url = TARGET_URLS[i];
    console.log(`[${i + 1}/${TARGET_URLS.length}] Submitting: ${url}`);
    
    try {
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: "URL_UPDATED",
        },
      });
      console.log(`Success: ${url}. Response status: ${response.status}`);
    } catch (error) {
      const err = error as Error;
      console.error(`Failed to submit: ${url}. Error: ${err.message}`);
    }
    
    // Sleep 500ms to respect rate limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("Indexing submissions completed.");
}

indexUrls().catch(console.error);
