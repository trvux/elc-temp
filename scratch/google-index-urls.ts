import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const KEY_FILE = path.join(process.cwd(), 'google-service-account.json');

async function indexUrls(urls: string[], type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
    if (!fs.existsSync(KEY_FILE)) {
        console.error("❌ ERROR: File 'google-service-account.json' not found!");
        console.log("💡 Please follow the steps to create a Service Account and download the JSON key.");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const client = await auth.getClient();
    const indexing = google.indexing({
        version: 'v3',
        auth: client as any,
    });

    console.log(`🚀 Sending ${urls.length} URLs to Google Indexing API...`);

    for (const url of urls) {
        try {
            const response = await indexing.urlNotifications.publish({
                requestBody: {
                    url: url,
                    type: type,
                },
            });
            console.log(`✅ Success: ${url} (Status: ${response.statusText})`);
        } catch (error: any) {
            console.error(`❌ Failed: ${url} - ${error.message}`);
        }
    }
}

// Example usage: 
// To run this manually: npx tsx scratch/google-index-urls.ts https://dienmayelc.com.vn/san-pham/example
const manualUrls = process.argv.slice(2);
if (manualUrls.length > 0) {
    indexUrls(manualUrls);
} else {
    console.log("💡 Usage: npx tsx scratch/google-index-urls.ts <URL1> <URL2> ...");
}

export { indexUrls };
