import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import sitemap from '../app/sitemap';
import { DISTRICTS } from '../shared/lib/districts';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  console.log('Generating sitemap...');
  try {
    const allUrls = await sitemap();
    console.log(`Generated ${allUrls.length} total URLs from sitemap.`);

    const districtSlugs = DISTRICTS.map(d => d.slug);

    // Filter function: check if URL contains any district slug as a path segment
    const isDistrictUrl = (urlStr: string): boolean => {
      try {
        const url = new URL(urlStr);
        const pathSegments = url.pathname.split('/').map(s => s.trim().toLowerCase());
        return pathSegments.some(segment => districtSlugs.includes(segment));
      } catch (e) {
        return false;
      }
    };

    // Filter URLs: keep only those that do NOT contain a district slug
    const primaryUrls = allUrls
      .map(u => u.url)
      .filter(url => !isDistrictUrl(url));

    console.log(`Filtered out district-specific pages. Remaining primary URLs: ${primaryUrls.length}`);

    // Let's breakdown the primary URLs
    const patterns = {
      root: primaryUrls.filter(url => url === 'https://dienmayelc.com.vn'),
      staticRoutes: primaryUrls.filter(url => ['/san-pham', '/dich-vu', '/du-an', '/tin-tuc', '/thong-tin'].some(r => url.endsWith(r))),
      flatPage: primaryUrls.filter(url => !url.includes('/san-pham/') && !url.includes('/dich-vu/') && !url.includes('/du-an/') && !url.includes('/tin-tuc/') && !url.includes('/thong-tin/') && url !== 'https://dienmayelc.com.vn'),
      productCatalog: primaryUrls.filter(url => url.includes('/san-pham/')),
      services: primaryUrls.filter(url => url.includes('/dich-vu/')),
      projects: primaryUrls.filter(url => url.includes('/du-an/')),
      news: primaryUrls.filter(url => url.includes('/tin-tuc/')),
      branches: primaryUrls.filter(url => url.includes('/thong-tin/')),
    };

    console.log('\n--- PRIMARY URL BREAKDOWN ---');
    console.log(`Root: ${patterns.root.length}`);
    console.log(`Static routes: ${patterns.staticRoutes.length}`);
    console.log(`Flat Pages (e.g. policies): ${patterns.flatPage.length}`);
    console.log(`Products/Categories/Brands: ${patterns.productCatalog.length}`);
    console.log(`Services: ${patterns.services.length}`);
    console.log(`Projects: ${patterns.projects.length}`);
    console.log(`News: ${patterns.news.length}`);
    console.log(`Branches: ${patterns.branches.length}`);

    // Save primary URLs to file
    const outputPath = path.join(process.cwd(), 'scratch/urls-to-index.txt');
    fs.writeFileSync(outputPath, primaryUrls.join('\n'), 'utf-8');
    console.log(`\nSuccessfully saved ${primaryUrls.length} primary URLs to ${outputPath}`);

  } catch (error) {
    console.error('Error generating primary URLs:', error);
  }
}

run();
