import { NextResponse, connection } from 'next/server';
import { getProductsAction } from '@/modules/catalog/presentation/actions';
import { PRODUCT_STATUS } from '@/modules/catalog/domain';
import { toSitemapLastmod } from '@/shared/lib/sitemap-lastmod';
import { BASE_URL } from '@/shared/lib/seo-schema';

export async function GET() {
  await connection();

  const { data: products } = await getProductsAction({ status: PRODUCT_STATUS.PUBLISHED });

  const productRoutes = products
    .filter((prod) => prod.slug)
    .map((prod) => ({
      url: `${BASE_URL}/san-pham/${prod.slug}`,
      lastmod: prod.updatedAt,
    }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${productRoutes.map(r => `
  <url>
    <loc>${r.url}</loc>
    <lastmod>${toSitemapLastmod(r.lastmod)}</lastmod>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
