import { MetadataRoute } from 'next';
import { createStaticClient } from '@/shared/lib/supabase/static';
import { DISTRICTS } from '@/shared/lib/districts';

export const revalidate = 3600; // Cache sitemap for 1 hour

const BASE_URL = 'https://dienmayelc.com.vn';

export async function generateSitemaps() {
  return [
    { id: 'pages' },
    { id: 'products' },
    { id: 'categories' },
    { id: 'posts' },
  ];
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const sitemapId = await props.id;
  const supabase = createStaticClient();

  if (sitemapId === 'pages') {
    const { data: pages } = await supabase
      .from('pages')
      .select('slug')
      .eq('is_published', true)
      .is('deleted_at', null);

    const { data: services } = await supabase
      .from('services')
      .select('slug')
      .eq('is_published', true)
      .is('deleted_at', null);

    const { data: branches } = await supabase
      .from('branches')
      .select('slug')
      .eq('is_published', true)
      .is('deleted_at', null);

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

    const pageRoutes = (pages || [])
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/${p.slug}`,
        lastModified: new Date(),
      }));

    const serviceRoutes = (services || [])
      .filter((serv) => serv.slug)
      .map((serv) => ({
        url: `${BASE_URL}/dich-vu/${serv.slug}`,
        lastModified: new Date(),
      }));

    const branchRoutes = (branches || [])
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${BASE_URL}/thong-tin/${b.slug}`,
        lastModified: new Date(),
      }));

    const serviceHubDistrictRoutes = DISTRICTS.map((dist) => ({
      url: `${BASE_URL}/dich-vu/${dist.slug}`,
      lastModified: new Date(),
    }));

    return [
      ...staticRoutes,
      ...pageRoutes,
      ...serviceRoutes,
      ...branchRoutes,
      ...serviceHubDistrictRoutes,
    ];
  }

  if (sitemapId === 'products') {
    const { data: products } = await supabase
      .from('products')
      .select('slug')
      .eq('is_published', true)
      .is('deleted_at', null);

    const productRoutes = (products || [])
      .filter((prod) => prod.slug)
      .map((prod) => ({
        url: `${BASE_URL}/san-pham/${prod.slug}`,
        lastModified: new Date(),
      }));

    return productRoutes;
  }

  if (sitemapId === 'categories') {
    const { data: categories } = await supabase
      .from('categories')
      .select('slug')
      .is('deleted_at', null);

    const { data: brands } = await supabase
      .from('brands')
      .select('slug')
      .is('deleted_at', null);

    const { data: groupCategories } = await supabase
      .from('group_categories')
      .select('slug')
      .is('deleted_at', null);

    const categoryRoutes = (categories || [])
      .filter((cat) => cat.slug)
      .map((cat) => ({
        url: `${BASE_URL}/san-pham/${cat.slug}`,
        lastModified: new Date(),
      }));

    const brandRoutes = (brands || [])
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${BASE_URL}/san-pham/${b.slug}`,
        lastModified: new Date(),
      }));

    const groupRoutes = (groupCategories || [])
      .filter((g) => g.slug)
      .map((g) => ({
        url: `${BASE_URL}/san-pham/${g.slug}`,
        lastModified: new Date(),
      }));

    return [
      ...groupRoutes,
      ...categoryRoutes,
      ...brandRoutes,
    ];
  }

  if (sitemapId === 'posts') {
    const { data: news } = await supabase
      .from('news')
      .select('slug')
      .eq('is_published', true)
      .is('deleted_at', null);

    const { data: projects } = await supabase
      .from('projects')
      .select('slug, meta_title, meta_description')
      .eq('is_published', true)
      .is('deleted_at', null);

    const { data: projectTypes } = await supabase
      .from('project_type')
      .select('slug, meta_title, meta_description')
      .is('deleted_at', null);

    const newsRoutes = (news || [])
      .filter((n) => n.slug)
      .map((n) => ({
        url: `${BASE_URL}/tin-tuc/${n.slug}`,
        lastModified: new Date(),
      }));

    const projectRoutes = (projects || [])
      .filter((proj) => proj.slug && proj.meta_title && proj.meta_description)
      .map((proj) => ({
        url: `${BASE_URL}/du-an/${proj.slug}`,
        lastModified: new Date(),
      }));

    const projectTypeRoutes = (projectTypes || [])
      .filter((pt) => pt.slug && pt.meta_title && pt.meta_description)
      .map((pt) => ({
        url: `${BASE_URL}/du-an/${pt.slug}`,
        lastModified: new Date(),
      }));

    return [
      ...newsRoutes,
      ...projectRoutes,
      ...projectTypeRoutes,
    ];
  }

  return [];
}
