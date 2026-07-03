import { MetadataRoute } from 'next';
import { createStaticClient } from '@/shared/lib/supabase/static';
import { DISTRICTS } from '@/shared/lib/districts';

export const revalidate = 3600; // Cache sitemap for 1 hour

const BASE_URL = 'https://dienmayelc.com.vn';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  // 1. Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .is('deleted_at', null);

  // 2. Fetch Brands
  const { data: brands } = await supabase
    .from('brands')
    .select('slug, updated_at')
    .is('deleted_at', null);

  // 3. Fetch Group Categories
  const { data: groupCategories } = await supabase
    .from('group_categories')
    .select('slug, updated_at')
    .is('deleted_at', null);

  // 4. Fetch Products (Flat URLs)
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  // 5. Fetch Services
  const { data: services } = await supabase
    .from('services')
    .select('slug, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  // 6. Fetch Static Pages
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  // 7. Fetch Projects
  const { data: projects } = await supabase
    .from('projects')
    .select('slug, updated_at, meta_title, meta_description')
    .eq('is_published', true)
    .is('deleted_at', null);

  // 8. Fetch Project Types
  const { data: projectTypes } = await supabase
    .from('project_type')
    .select('slug, updated_at, image, meta_title, meta_description')
    .is('deleted_at', null);

  // 9. Fetch News
  const { data: news } = await supabase
    .from('news')
    .select('slug, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  // 10. Fetch Branches
  const { data: branches } = await supabase
    .from('branches')
    .select('slug, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  // Static Routes
  const staticRoutes = [
    '',
    '/san-pham',
    '/dich-vu',
    '/du-an',
    '/tin-tuc',
    '/thong-tin',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));

  // Page Routes (from the database)
  const pageRoutes = (pages || [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${BASE_URL}/${p.slug}`,
      lastModified: new Date(p.updated_at || Date.now()),
    }));

  // Category Routes
  const categoryRoutes = (categories || [])
    .filter((cat) => cat.slug)
    .map((cat) => ({
      url: `${BASE_URL}/san-pham/${cat.slug}`,
      lastModified: new Date(cat.updated_at || Date.now()),
    }));

  // Brand Routes
  const brandRoutes = (brands || [])
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/san-pham/${b.slug}`,
      lastModified: new Date(b.updated_at || Date.now()),
    }));

  // Group Category Routes
  const groupRoutes = (groupCategories || [])
    .filter((g) => g.slug)
    .map((g) => ({
      url: `${BASE_URL}/san-pham/${g.slug}`,
      lastModified: new Date(g.updated_at || Date.now()),
    }));

  // Product Routes (Flat!)
  const productRoutes = (products || [])
    .filter((prod) => prod.slug)
    .map((prod) => ({
      url: `${BASE_URL}/san-pham/${prod.slug}`,
      lastModified: new Date(prod.updated_at || Date.now()),
    }));

  // Service Routes
  const serviceRoutes = (services || [])
    .filter((serv) => serv.slug)
    .map((serv) => ({
      url: `${BASE_URL}/dich-vu/${serv.slug}`,
      lastModified: new Date(serv.updated_at || Date.now()),
    }));

  // Project Routes
  const projectRoutes = (projects || [])
    .filter((proj) => proj.slug && proj.meta_title && proj.meta_description)
    .map((proj) => ({
      url: `${BASE_URL}/du-an/${proj.slug}`,
      lastModified: new Date(proj.updated_at || Date.now()),
    }));

  // Project Type Routes
  const projectTypeRoutes = (projectTypes || [])
    .filter((pt) => pt.slug && pt.meta_title && pt.meta_description)
    .map((pt) => ({
      url: `${BASE_URL}/du-an/${pt.slug}`,
      lastModified: new Date(pt.updated_at || Date.now()),
    }));

  // News Routes
  const newsRoutes = (news || [])
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${BASE_URL}/tin-tuc/${n.slug}`,
      lastModified: new Date(n.updated_at || Date.now()),
    }));

  // Branch Routes
  const branchRoutes = (branches || [])
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/thong-tin/${b.slug}`,
      lastModified: new Date(b.updated_at || Date.now()),
    }));

  // NOTE: Category/Brand/Group/Product/Service × District detail pages
  // (e.g. /san-pham/may-lanh/quan-1, /dich-vu/lap-dat/quan-1) are intentionally
  // excluded from the sitemap. They're marked `robots: noindex, follow` in
  // seo-utils.ts because their content is ~90% identical to the parent page
  // with only the district name swapped in — submitting thousands of those to
  // Google as indexable created a doorway-page pattern that was dragging down
  // the whole site's ranking. The pages still exist for users/internal links,
  // just not offered to Google as index candidates.

  // Service hub pages per district (/dich-vu/[district]) — kept indexable:
  // this is a genuine location landing page (all services + local FAQ), not a
  // near-duplicate of a single detail page.
  const serviceHubDistrictRoutes = DISTRICTS.map((dist) => ({
    url: `${BASE_URL}/dich-vu/${dist.slug}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...pageRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...groupRoutes,
    ...productRoutes,
    ...serviceRoutes,
    ...serviceHubDistrictRoutes,
    ...projectRoutes,
    ...projectTypeRoutes,
    ...newsRoutes,
    ...branchRoutes,
  ];
}
