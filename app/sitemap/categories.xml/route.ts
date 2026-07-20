import { NextResponse, connection } from 'next/server';
import { getCategoriesAction } from '@/modules/category/presentation/actions';
import { getBrandsAction } from '@/modules/brand/presentation/actions';
import { getGroupsAction } from '@/modules/group/presentation/actions';
import { toSitemapLastmod } from '@/shared/lib/sitemap-lastmod';
import { BASE_URL } from '@/shared/lib/seo-schema';

export async function GET() {
  await connection();

  const [{ data: categories }, { data: brands }, { data: groupCategories }] = await Promise.all([
    getCategoriesAction(),
    getBrandsAction(),
    getGroupsAction(),
  ]);

  const categoryRoutes = categories
    .filter((cat) => cat.slug && !cat.isHidden)
    .map((cat) => ({
      url: `${BASE_URL}/san-pham/${cat.slug}`,
      lastmod: cat.updatedAt,
    }));

  const brandRoutes = brands
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/san-pham/${b.slug}`,
      lastmod: b.updatedAt,
    }));

  const groupRoutes = groupCategories
    .filter((g) => g.slug && !g.isHidden)
    .map((g) => ({
      url: `${BASE_URL}/san-pham/${g.slug}`,
      lastmod: g.updatedAt,
    }));

  const allRoutes = [
    ...groupRoutes,
    ...categoryRoutes,
    ...brandRoutes,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(r => {
    const lastmod = toSitemapLastmod(r.lastmod);
    return `
  <url>
    <loc>${r.url}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
  }).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
