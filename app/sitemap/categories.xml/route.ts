import { NextResponse, connection } from 'next/server';
import { getCategoriesAction } from '@/modules/category/presentation/actions';
import { getBrandsAction } from '@/modules/brand/presentation/actions';
import { getGroupsAction } from '@/modules/group/presentation/actions';
import { getHpPagesAction } from '@/modules/hp-page/presentation/actions';
import { getProductsAction } from '@/modules/catalog/presentation/actions';
import { PRODUCT_STATUS } from '@/modules/catalog/domain';
import { toSitemapLastmod } from '@/shared/lib/sitemap-lastmod';
import { BASE_URL } from '@/shared/lib/seo-schema';

export async function GET() {
  await connection();

  const [{ data: categories }, { data: brands }, { data: groupCategories }, { data: hpPages }] = await Promise.all([
    getCategoriesAction(),
    getBrandsAction(),
    getGroupsAction(),
    getHpPagesAction(),
  ]);

  const categoryRoutes = categories
    .filter((cat) => cat.slug && !cat.isHidden)
    .map((cat) => ({
      url: `${BASE_URL}/san-pham/${cat.slug}`,
      lastmod: cat.updatedAt,
    }));

  // Brand and hp_page pages go noindex on-page the moment they have zero
  // published products (see hasPublishedProducts in san-pham/[slug]/page.tsx)
  // — listing a noindex URL in the sitemap just burns crawl budget on a page
  // Google won't index anyway, so mirror that same live check here rather
  // than sitemapping every brand/hp_page unconditionally.
  const brandsWithProducts = await Promise.all(
    brands
      .filter((b) => b.slug)
      .map(async (b) => {
        const { totalCount } = await getProductsAction({ brandIds: [b.id], status: PRODUCT_STATUS.PUBLISHED, limit: 1 });
        return { brand: b, hasProducts: totalCount > 0 };
      }),
  );
  const brandRoutes = brandsWithProducts
    .filter(({ hasProducts }) => hasProducts)
    .map(({ brand: b }) => ({
      url: `${BASE_URL}/san-pham/${b.slug}`,
      lastmod: b.updatedAt,
    }));

  const groupRoutes = groupCategories
    .filter((g) => g.slug && !g.isHidden)
    .map((g) => ({
      url: `${BASE_URL}/san-pham/${g.slug}`,
      lastmod: g.updatedAt,
    }));

  const hpPagesWithProducts = await Promise.all(
    hpPages
      .filter((p) => p.slug)
      .map(async (p) => {
        const attributeTokens = p.attributeCode ? { [p.attributeCode]: p.attributeValues } : undefined;
        const { totalCount } = await getProductsAction({
          categoryIds: p.categoryIds.length > 0 ? p.categoryIds : undefined,
          brandIds: p.brandIds.length > 0 ? p.brandIds : undefined,
          attributeTokens,
          status: PRODUCT_STATUS.PUBLISHED,
          limit: 1,
        });
        return { hpPage: p, hasProducts: totalCount > 0 };
      }),
  );
  const hpPageRoutes = hpPagesWithProducts
    .filter(({ hasProducts }) => hasProducts)
    .map(({ hpPage: p }) => ({
      url: `${BASE_URL}/san-pham/${p.slug}`,
      lastmod: p.updatedAt,
    }));

  const allRoutes = [
    ...groupRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...hpPageRoutes,
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
