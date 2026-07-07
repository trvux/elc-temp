import { BASE_URL } from "@/shared/lib/seo-schema";

export async function submitToIndexNow(urls: string[]): Promise<boolean> {
  const host = new URL(BASE_URL).host;
  const key = "5526e838bca84144ad7c1a84f3eb7d82";
  const keyLocation = `https://${host}/${key}.txt`;

  if (urls.length === 0) return false;

  try {
    const response = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList: urls,
      }),
    });

    if (response.ok) {
      console.log(`Successfully submitted ${urls.length} URLs to IndexNow:`, urls);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`IndexNow submission failed: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error("Error submitting to IndexNow:", error);
    return false;
  }
}
