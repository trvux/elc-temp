const urls = [
  "https://dienmayelc.com.vn",
  "https://dienmayelc.com.vn/san-pham",
  "https://dienmayelc.com.vn/san-pham/may-lanh-treo-tuong",
  "https://dienmayelc.com.vn/san-pham/may-lanh-treo-tuong-daikin-1hp-mot-chieu-inverter-ftkb25zvmv"
];

async function checkNoIndex() {
  for (const url of urls) {
    console.log(`\nChecking URL: ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        }
      });
      console.log(`Status: ${response.status}`);
      const text = await response.text();
      
      // Check for <meta name="robots" ...>
      const robotsMatch = text.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                          text.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);
      if (robotsMatch) {
        console.log(`Robots Meta tag: ${robotsMatch[0]}`);
      } else {
        console.log("No robots meta tag found.");
      }

      // Check for noindex in header
      const xRobots = response.headers.get("x-robots-tag");
      if (xRobots) {
        console.log(`X-Robots-Tag Header: ${xRobots}`);
      } else {
        console.log("No X-Robots-Tag header found.");
      }

      // Check canonical tag
      const canonicalMatch = text.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                             text.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
      if (canonicalMatch) {
        console.log(`Canonical tag: ${canonicalMatch[0]}`);
      } else {
        console.log("No canonical tag found.");
      }

    } catch (e: any) {
      console.error(`Error checking ${url}:`, e.message);
    }
  }
}

checkNoIndex();
