import { NextResponse, connection } from 'next/server';
import { getPagesAction } from '@/modules/page/presentation/actions';
import { getServicesAction } from '@/modules/service/presentation/actions';
import { getBranchesAction } from '@/modules/branch/presentation/actions';
import { DISTRICTS } from '@/shared/lib/districts';
import { toSitemapLastmod } from '@/shared/lib/sitemap-lastmod';
import { BASE_URL } from '@/shared/lib/seo-schema';

export async function GET() {
  await connection();

  const [{ data: allPages }, { data: services }, { data: branches }] = await Promise.all([
    getPagesAction(),
    getServicesAction({ isPublished: true }),
    getBranchesAction({ isPublished: true }),
  ]);

  const pages = allPages.filter((p) => p.isPublished);

  const staticRoutes = [
    '',
    '/san-pham',
    '/dich-vu',
    '/du-an',
    '/tin-tuc',
    '/thong-tin',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastmod: undefined as string | undefined,
  }));

  const pageRoutes = pages
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${BASE_URL}/${p.slug}`,
      lastmod: p.updatedAt,
    }));

  const serviceRoutes = services
    .filter((serv) => serv.slug)
    .map((serv) => ({
      url: `${BASE_URL}/dich-vu/${serv.slug}`,
      lastmod: serv.updatedAt,
    }));

  const branchRoutes = branches
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/thong-tin/${b.slug}`,
      lastmod: b.updatedAt,
    }));

  const serviceHubDistrictRoutes = DISTRICTS.map((dist) => ({
    url: `${BASE_URL}/dich-vu/${dist.slug}`,
    lastmod: undefined as string | undefined,
  }));

  // serviceLocationRoutes (`/dich-vu/[slug]/[location]`) intentionally excluded —
  // these are noindex,follow doorway-style pages, see docs/SITEMAP.md §4.
  // Submitting noindex URLs in a sitemap wastes crawl budget on pages Google
  // is explicitly told not to index.

  const allRoutes = [
    ...staticRoutes,
    ...pageRoutes,
    ...serviceRoutes,
    ...branchRoutes,
    ...serviceHubDistrictRoutes,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(r => `
  <url>
    <loc>${r.url}</loc>${r.lastmod ? `
    <lastmod>${toSitemapLastmod(r.lastmod)}</lastmod>` : ''}
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
