export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getPagesAction } from '@/modules/page/presentation/actions';
import { getServicesAction } from '@/modules/service/presentation/actions';
import { getBranchesAction } from '@/modules/branch/presentation/actions';
import { DISTRICTS } from '@/shared/lib/districts';


export async function GET() {
  const BASE_URL = 'https://dienmayelc.com.vn';

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
  }));

  const pageRoutes = pages
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${BASE_URL}/${p.slug}`,
    }));

  const serviceRoutes = services
    .filter((serv) => serv.slug)
    .map((serv) => ({
      url: `${BASE_URL}/dich-vu/${serv.slug}`,
    }));

  const branchRoutes = branches
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${BASE_URL}/thong-tin/${b.slug}`,
    }));

  const serviceHubDistrictRoutes = DISTRICTS.map((dist) => ({
    url: `${BASE_URL}/dich-vu/${dist.slug}`,
  }));

  const serviceLocationRoutes = services
    .filter((serv) => serv.slug)
    .flatMap((serv) =>
      DISTRICTS.map((dist) => ({
        url: `${BASE_URL}/dich-vu/${serv.slug}/${dist.slug}`,
      }))
    );

  const allRoutes = [
    ...staticRoutes,
    ...pageRoutes,
    ...serviceRoutes,
    ...branchRoutes,
    ...serviceHubDistrictRoutes,
    ...serviceLocationRoutes,
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
