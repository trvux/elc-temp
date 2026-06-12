import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  // 1. Static Routes
  const staticRoutes = [
    '/',
    '/san-pham',
    '/dich-vu',
    '/du-an',
    '/tin-tuc',
    '/thong-tin' // We found that /thong-tin is the 2nd most visited page in GSC but missing from sitemap!
  ];

  // 2. Pages (/${slug})
  const { data: pages } = await supabase
    .from('pages')
    .select('slug')
    .eq('is_published', true)
    .is('deleted_at', null);
  const pageUrls = (pages || []).map(p => `/${p.slug}`);

  // 3. News (/tin-tuc/${slug})
  const { data: news } = await supabase
    .from('news')
    .select('slug')
    .eq('is_published', true)
    .is('deleted_at', null);
  const newsUrls = (news || []).map(n => `/tin-tuc/${n.slug}`);

  // 4. Branches (/co-so-ha-tang/${slug})
  const { data: branches } = await supabase
    .from('branches')
    .select('slug')
    .eq('is_published', true)
    .is('deleted_at', null);
  const branchUrls = (branches || []).map(b => `/co-so-ha-tang/${b.slug}`);

  // 5. Categories (/san-pham/${slug})
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .is('deleted_at', null);
  const categoryUrls = (categories || []).map(c => `/san-pham/${c.slug}`);

  // 6. Brands (/san-pham/${slug})
  const { data: brands } = await supabase
    .from('brands')
    .select('slug')
    .is('deleted_at', null);
  const brandUrls = (brands || []).map(b => `/san-pham/${b.slug}`);

  // 7. Services (/dich-vu/${slug})
  const { data: services } = await supabase
    .from('services')
    .select('slug')
    .eq('is_published', true)
    .is('deleted_at', null);
  const serviceUrls = (services || []).map(s => `/dich-vu/${s.slug}`);

  // 8. Projects (/du-an/${slug})
  const { data: projects } = await supabase
    .from('projects')
    .select('slug')
    .eq('is_published', true)
    .is('deleted_at', null);
  const projectUrls = (projects || []).map(p => `/du-an/${p.slug}`);

  // 9. Products (/san-pham/${slug})
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('is_published', true)
    .is('deleted_at', null);
  const productUrls = (products || []).map(p => `/san-pham/${p.slug}`);

  // 10. Category + Brand routes: (/san-pham/${category.slug}/${brand.slug})
  // Wait, let's see how categoryBrandRoutes is constructed in sitemap:
  // Is it /san-pham/${category.slug}/${brand.slug}?
  // Yes:
  // url: `${BASE_URL}/san-pham/${pair}` where pair is `${category.slug}/${brand.slug}`
  // But wait! Is this a valid route in the app?
  // Let's check: in app/(public)/san-pham/[slug]/page.tsx, it only handles ONE dynamic segment [slug]!
  // So /san-pham/dieu-hoa/daikin would have TWO segments (dieu-hoa and daikin), which Next.js will resolve to 404!
  // Unless there is another file or routing? We confirmed there is only [slug] folder under san-pham.
  // Wait, let's write down the statistics:
  console.log('--- ACTUAL ACTIVE DATABASE COUNTS ---');
  console.log(`Static Routes: ${staticRoutes.length}`);
  console.log(`Pages (/${pages?.length}): ${pageUrls.length}`);
  console.log(`News (/tin-tuc/${news?.length}): ${newsUrls.length}`);
  console.log(`Branches (/co-so-ha-tang/${branches?.length}): ${branchUrls.length}`);
  console.log(`Categories (/san-pham/${categories?.length}): ${categoryUrls.length}`);
  console.log(`Brands (/san-pham/${brands?.length}): ${brandUrls.length}`);
  console.log(`Services (/dich-vu/${services?.length}): ${serviceUrls.length}`);
  console.log(`Projects (/du-an/${projects?.length}): ${projectUrls.length}`);
  console.log(`Products (/san-pham/${products?.length}): ${productUrls.length}`);

  const totalPossibleUrls = 
    staticRoutes.length +
    pageUrls.length +
    newsUrls.length +
    branchUrls.length +
    categoryUrls.length +
    brandUrls.length +
    serviceUrls.length +
    projectUrls.length +
    productUrls.length;
  console.log(`Total active URLs that should be in sitemap (excluding invalid nested products/categories): ${totalPossibleUrls}`);
}

run();
