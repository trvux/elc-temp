import { NextResponse } from 'next/server';
import { getCategoriesAction } from '@/modules/category/presentation/actions';
import { getBrandsAction } from '@/modules/brand/presentation/actions';
import { getGroupsAction } from '@/modules/group/presentation/actions';

export async function GET() {
  const BASE_URL = 'https://dienmayelc.com.vn';

  const [{ data: categories }, { data: brands }, { data: groupCategories }] = await Promise.all([
    getCategoriesAction(),
    getBrandsAction(),
    getGroupsAction(),
  ]);

  const categoryRoutes = categories
    .filter((cat) => cat.slug)
    .map((cat) => ({
      url: `${BASE_URL}/san-pham/${cat.slug}`,
    }));

  const brandRoutes = brands
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/san-pham/${b.slug}`,
    }));

  const groupRoutes = groupCategories
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
