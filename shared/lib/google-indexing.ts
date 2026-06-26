import { google } from "googleapis";

export async function submitToGoogleIndex(
  urls: string[],
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<void> {
  if (urls.length === 0) return;

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn("GOOGLE_SERVICE_ACCOUNT_JSON not set, skipping Google Indexing");
    return;
  }

  let credentials: object;
  try {
    credentials = JSON.parse(serviceAccountJson);
  } catch {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const authClient = await auth.getClient();
  const indexing = google.indexing({ version: "v3", auth: authClient });

  const results = await Promise.allSettled(
    urls.map((url) =>
      indexing.urlNotifications.publish({ requestBody: { url, type } })
    )
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`Google Indexing failed for ${urls[i]}:`, result.reason?.message);
    }
  });
}
