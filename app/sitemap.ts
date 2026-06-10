import { MetadataRoute } from 'next';
import { createStaticClient } from '@/shared/lib/supabase/static';

const BASE_URL = 'https://dienmayelc.com.vn';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  // 1. Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .is('deleted_at', null);

  // 2. Fetch Products with their category and brand slug for the URL
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at, category:categories(slug), brand:brands(slug)')
    .eq('is_published', true)
    .is('deleted_at', null);

  // 3. Fetch Services
  const { data: services } = await supabase
    .from('services')
    .select('slug, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  // 4. Fetch Static Pages
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  // 5. Fetch Projects
  const { data: projects } = await supabase
    .from('projects')
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
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  // Page Routes (from the database)
  const pageRoutes = (pages || []).map((p) => ({
    url: `${BASE_URL}/${p.slug}`,
    lastModified: new Date(p.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Category Routes (Only Product type categories go under /san-pham/)
  const categoryRoutes = (categories || [])
    .map((cat) => ({
      url: `${BASE_URL}/san-pham/${cat.slug}`,
      lastModified: new Date(cat.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  interface SitemapProduct {
    slug: string;
    updated_at: string | null;
    category: { slug: string } | null;
    brand: { slug: string } | null;
  }

  // Product Routes
  const productRoutes = ((products as unknown as SitemapProduct[]) || [])
    .filter((prod) => prod.slug && prod.category?.slug && prod.brand?.slug)
    .map((prod) => ({
      url: `${BASE_URL}/san-pham/${prod.category!.slug}/${prod.brand!.slug}/${prod.slug}`,
      lastModified: new Date(prod.updated_at || Date.now()),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

  // Category + Brand Routes
  const categoryBrandRoutes = Array.from(
    new Set(
      ((products as unknown as SitemapProduct[]) || [])
        .filter((p) => p.category?.slug && p.brand?.slug)
        .map((p) => `${p.category!.slug}/${p.brand!.slug}`)
    )
  ).map((pair) => ({
    url: `${BASE_URL}/san-pham/${pair}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Service Routes
  const serviceRoutes = (services || []).map((serv) => ({
    url: `${BASE_URL}/dich-vu/${serv.slug}`,
    lastModified: new Date(serv.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Project Routes
  const projectRoutes = (projects || []).map((proj) => ({
    url: `${BASE_URL}/du-an/${proj.slug}`,
    lastModified: new Date(proj.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...pageRoutes,
    ...categoryRoutes,
    ...categoryBrandRoutes,
    ...productRoutes,
    ...serviceRoutes,
    ...projectRoutes,
  ];
}
