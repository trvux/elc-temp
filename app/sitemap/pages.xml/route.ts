import { NextResponse, connection } from 'next/server';
import { getPagesAction } from '@/modules/page/presentation/actions';
import { getServicesAction } from '@/modules/service/presentation/actions';
import { getBranchesAction } from '@/modules/branch/presentation/actions';
import { toSitemapLastmod } from '@/shared/lib/sitemap-lastmod';
import { BASE_URL } from '@/shared/lib/seo-schema';

export async function GET() {
  await connection();

  const [{ data: pages }, { data: services }, { data: branches }] = await Promise.all([
    getPagesAction({ isPublished: true }),
    getServicesAction({ isPublished: true }),
    getBranchesAction({ isPublished: true }),
  ]);

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

  const allRoutes = [
    ...staticRoutes,
    ...pageRoutes,
    ...serviceRoutes,
    ...branchRoutes,
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
