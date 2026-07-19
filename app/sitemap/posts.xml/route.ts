import { NextResponse, connection } from 'next/server';
import { getNewsAction } from '@/modules/news/presentation/actions';
import { getProjectsAction } from '@/modules/project/presentation/actions';
import { getProjectTypesAction } from '@/modules/project-type/presentation/actions';
import { toSitemapLastmod } from '@/shared/lib/sitemap-lastmod';
import { BASE_URL } from '@/shared/lib/seo-schema';

export async function GET() {
  await connection();

  const [{ data: news }, { data: projects }, { data: projectTypes }] = await Promise.all([
    getNewsAction({ isPublished: true }),
    getProjectsAction({ isPublished: true }),
    getProjectTypesAction(),
  ]);

  const newsRoutes = news
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${BASE_URL}/tin-tuc/${n.slug}`,
      lastmod: n.updatedAt,
    }));

  const projectRoutes = projects
    .filter((proj) => proj.slug)
    .map((proj) => ({
      url: `${BASE_URL}/du-an/${proj.slug}`,
      lastmod: proj.updatedAt,
    }));

  const projectTypeRoutes = projectTypes
    .filter((pt) => pt.slug)
    .map((pt) => ({
      url: `${BASE_URL}/du-an/${pt.slug}`,
      lastmod: pt.updatedAt,
    }));

  const allRoutes = [
    ...newsRoutes,
    ...projectRoutes,
    ...projectTypeRoutes,
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
