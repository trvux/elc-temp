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
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Page Routes (from the database)
  const pageRoutes = (pages || [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${BASE_URL}/${p.slug}`,
      lastModified: new Date(p.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Category Routes
  const categoryRoutes = (categories || [])
    .filter((cat) => cat.slug)
    .map((cat) => ({
      url: `${BASE_URL}/san-pham/${cat.slug}`,
      lastModified: new Date(cat.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Brand Routes
  const brandRoutes = (brands || [])
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/san-pham/${b.slug}`,
      lastModified: new Date(b.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Group Category Routes
  const groupRoutes = (groupCategories || [])
    .filter((g) => g.slug)
    .map((g) => ({
      url: `${BASE_URL}/san-pham/${g.slug}`,
      lastModified: new Date(g.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Product Routes (Flat!)
  const productRoutes = (products || [])
    .filter((prod) => prod.slug)
    .map((prod) => ({
      url: `${BASE_URL}/san-pham/${prod.slug}`,
      lastModified: new Date(prod.updated_at || Date.now()),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

  // Service Routes
  const serviceRoutes = (services || [])
    .filter((serv) => serv.slug)
    .map((serv) => ({
      url: `${BASE_URL}/dich-vu/${serv.slug}`,
      lastModified: new Date(serv.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Project Routes
  const projectRoutes = (projects || [])
    .filter((proj) => proj.slug && proj.meta_title && proj.meta_description)
    .map((proj) => ({
      url: `${BASE_URL}/du-an/${proj.slug}`,
      lastModified: new Date(proj.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Project Type Routes
  const projectTypeRoutes = (projectTypes || [])
    .filter((pt) => pt.slug && pt.meta_title && pt.meta_description)
    .map((pt) => ({
      url: `${BASE_URL}/du-an/${pt.slug}`,
      lastModified: new Date(pt.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // News Routes
  const newsRoutes = (news || [])
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${BASE_URL}/tin-tuc/${n.slug}`,
      lastModified: new Date(n.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Branch Routes
  const branchRoutes = (branches || [])
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/thong-tin/${b.slug}`,
      lastModified: new Date(b.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  // Category + District
  const categoryDistrictRoutes = (categories || [])
    .filter((cat) => cat.slug)
    .flatMap((cat) =>
      DISTRICTS.map((dist) => ({
        url: `${BASE_URL}/san-pham/${cat.slug}/${dist.slug}`,
        lastModified: new Date(cat.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    );

  // Brand + District
  const brandDistrictRoutes = (brands || [])
    .filter((b) => b.slug)
    .flatMap((b) =>
      DISTRICTS.map((dist) => ({
        url: `${BASE_URL}/san-pham/${b.slug}/${dist.slug}`,
        lastModified: new Date(b.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    );

  // Group Category + District
  const groupDistrictRoutes = (groupCategories || [])
    .filter((g) => g.slug)
    .flatMap((g) =>
      DISTRICTS.map((dist) => ({
        url: `${BASE_URL}/san-pham/${g.slug}/${dist.slug}`,
        lastModified: new Date(g.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    );

  // Product + District (local SEO pages)
  const productDistrictRoutes = (products || [])
    .filter((prod) => prod.slug)
    .flatMap((prod) =>
      DISTRICTS.map((dist) => ({
        url: `${BASE_URL}/san-pham/${prod.slug}/${dist.slug}`,
        lastModified: new Date(prod.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.65,
      }))
    );

  // Service + District
  const serviceDistrictRoutes = (services || [])
    .filter((serv) => serv.slug)
    .flatMap((serv) =>
      DISTRICTS.map((dist) => ({
        url: `${BASE_URL}/dich-vu/${serv.slug}/${dist.slug}`,
        lastModified: new Date(serv.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    );

  return [
    ...staticRoutes,
    ...pageRoutes,
    ...categoryRoutes,
    ...categoryDistrictRoutes,
    ...brandRoutes,
    ...brandDistrictRoutes,
    ...groupRoutes,
    ...groupDistrictRoutes,
    ...productRoutes,
    ...productDistrictRoutes,
    ...serviceRoutes,
    ...serviceDistrictRoutes,
    ...projectRoutes,
    ...projectTypeRoutes,
    ...newsRoutes,
    ...branchRoutes,
  ];
}
