import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import sitemap from '../app/sitemap';

async function run() {
  console.log('Generating sitemap...');
  try {
    const urls = await sitemap();
    console.log(`Generated ${urls.length} URLs in current sitemap.ts`);
    console.log('Sample URLs (first 20):');
    console.log(urls.slice(0, 20).map(u => u.url));
    console.log('\nSample URLs (last 20):');
    console.log(urls.slice(-20).map(u => u.url));

    // Analyze counts per type of URL
    const patterns = {
      rootAndStatic: urls.filter(u => u.url === 'https://dienmayelc.com.vn' || ['/san-pham', '/dich-vu', '/du-an', '/tin-tuc'].some(r => u.url.endsWith(r))),
      flatPage: urls.filter(u => !u.url.includes('/san-pham/') && !u.url.includes('/dich-vu/') && !u.url.includes('/du-an/') && !u.url.includes('/tin-tuc/') && u.url !== 'https://dienmayelc.com.vn'),
      flatCategory: urls.filter(u => u.url.match(/san-pham\/[^\/]+$/)),
      nestedCategoryBrand: urls.filter(u => u.url.match(/san-pham\/[^\/]+\/[^\/]+$/)),
      nestedProduct: urls.filter(u => u.url.match(/san-pham\/[^\/]+\/[^\/]+\/[^\/]+$/)),
      serviceDetail: urls.filter(u => u.url.includes('/dich-vu/')),
      projectDetail: urls.filter(u => u.url.includes('/du-an/')),
      newsDetail: urls.filter(u => u.url.includes('/tin-tuc/')),
    };

    console.log('\n--- CURRENT SITEMAP BREAKDOWN ---');
    console.log(`Root & Static routes: ${patterns.rootAndStatic.length}`);
    console.log(`Flat Pages (/${'slug'}): ${patterns.flatPage.length}`);
    console.log(`Flat Categories (/san-pham/${'category'}): ${patterns.flatCategory.length}`);
    console.log(`Nested Category + Brand (/san-pham/${'cat'}/${'brand'}): ${patterns.nestedCategoryBrand.length}`);
    console.log(`Nested Products (/san-pham/${'cat'}/${'brand'}/${'prod'}): ${patterns.nestedProduct.length}`);
    console.log(`Services: ${patterns.serviceDetail.length}`);
    console.log(`Projects: ${patterns.projectDetail.length}`);
    console.log(`News: ${patterns.newsDetail.length}`);

    // Check for 404/invalid URLs (urls that contain more than 1 segment under /san-pham/)
    console.log('\n--- MISMATCH CHECK ---');
    console.log(`Invalid Nested Product URLs in sitemap: ${patterns.nestedProduct.length} (these cause 404 since route is /san-pham/[slug])`);
    console.log(`Invalid Nested Category+Brand URLs in sitemap: ${patterns.nestedCategoryBrand.length} (these cause 404 since route is /san-pham/[slug])`);

    // Print all nested category brand URLs
    console.log('\nNested Category + Brand examples:');
    console.log(patterns.nestedCategoryBrand.map(u => u.url));
  } catch (e) {
    console.error('Error generating sitemap:', e);
  }
}

run();
