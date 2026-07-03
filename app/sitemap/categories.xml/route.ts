import { NextResponse } from 'next/server';
import { createStaticClient } from '@/shared/lib/supabase/static';


export async function GET() {
  const BASE_URL = 'https://dienmayelc.com.vn';
  const supabase = createStaticClient();

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
    }));

  const brandRoutes = (brands || [])
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/san-pham/${b.slug}`,
    }));

  const groupRoutes = (groupCategories || [])
    .filter((g) => g.slug)
    .map((g) => ({
      url: `${BASE_URL}/san-pham/${g.slug}`,
    }));

  const allRoutes = [
    ...groupRoutes,
    ...categoryRoutes,
    ...brandRoutes,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(r => `
  <url>
    <loc>${r.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
