import fetch from 'node-fetch';

async function testFetchRoute() {
  const testSlug = "lap-dat-he-thong-gio-tuoi-cho-can-ho-cao-cap-landmark-mr-son-quan-binh-thanh";
  const url = `http://localhost:3000/du-an/${testSlug}`;

  console.log(`Fetching local route: ${url}...`);

  try {
    const response = await fetch(url);
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log('HTML snippet of response:');
    console.log(text.slice(0, 1000));
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Fetch request failed:', errMsg);
  }
}

testFetchRoute();
