export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getNewsAction } from '@/modules/news/presentation/actions';
import { getProjectsAction } from '@/modules/project/presentation/actions';
import { getProjectTypesAction } from '@/modules/project-type/presentation/actions';


export async function GET() {
  const BASE_URL = 'https://dienmayelc.com.vn';

  const [{ data: news }, { data: projects }, { data: projectTypes }] = await Promise.all([
    getNewsAction({ isPublished: true }),
    getProjectsAction({ isPublished: true }),
    getProjectTypesAction(),
  ]);

  const newsRoutes = news
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${BASE_URL}/tin-tuc/${n.slug}`,
    }));

  const projectRoutes = projects
    .filter((proj) => proj.slug)
    .map((proj) => ({
      url: `${BASE_URL}/du-an/${proj.slug}`,
    }));

  const projectTypeRoutes = projectTypes
    .filter((pt) => pt.slug)
    .map((pt) => ({
      url: `${BASE_URL}/du-an/${pt.slug}`,
    }));

  const allRoutes = [
    ...newsRoutes,
    ...projectRoutes,
    ...projectTypeRoutes,
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
