async function run() {
  const url = "https://dienmayelc.com.vn/san-pham/may-lanh-treo-tuong";
  console.log(`Fetching HTML from ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    const html = await res.text();
    
    // Count raw <h1> and <h1 tags
    const h1Matches = html.match(/<h1[^>]*>/gi) || [];
    console.log(`Found ${h1Matches.length} <h1> tags!`);
    h1Matches.forEach((match: string, i: number) => {
      // Find the content inside this h1
      const startIndex = html.indexOf(match);
      const endIndex = html.indexOf("</h1>", startIndex);
      const content = html.substring(startIndex, endIndex + 5);
      console.log(`H1 #${i + 1}: ${content}`);
    });
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

run();
