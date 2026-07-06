import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { Brand } from "@/modules/brand/domain";
import { getProjectsAction, countProjectsAction } from "@/modules/project/presentation/actions";
import { getNewsAction, countNewsAction } from "@/modules/news/presentation/actions";
import {
  DashboardStats,
  DashboardActivityItem,
  DashboardCategoryDistributionItem,
  DashboardDistributionItem,
} from "../domain/types";

/**
 * Tong hop thong ke toan bo he thong cho Dashboard.
 * contactsCount/servicesCount/allBrands/pagesCount/categoriesCount/allCategories duoc
 * truyen rieng vi cac module do da migrate sang Go — xem
 * modules/dashboard/presentation/actions.ts. products/project/news cung da migrate sang Go
 * nen goi truc tiep getProductsAction/getProjectsAction/getNewsAction thay vi qua
 * productRepo/projectRepo/newsRepo.
 */
export async function getDashboardStats(
  contactsCount: number,
  servicesCount: number,
  branchesCount: number,
  pagesCount: number,
  allBrands: Brand[],
  categoriesCount: number,
  allCategories: CategoryWithGroup[],
  inquiriesCount: number,
  topViewedProductsRaw: { entityId: string; count: number }[]
): Promise<DashboardStats> {
  const [
    allProductsRes,
    { data: projectsCount },
    { data: newsCount },
    recentProductsRes,
    { data: recentProjects },
    { data: recentNews },
    { data: featuredProjectsRaw },
  ] = await Promise.all([
    getProductsAction({}),
    countProjectsAction(),
    countNewsAction(),
    getProductsAction({ limit: 5, sortBy: "newest" }),
    getProjectsAction({ limit: 5, orderBy: "createdAt", orderDirection: "desc" }),
    getNewsAction({ limit: 5 }),
    getProjectsAction({ isFeatured: true }),
  ]);

  const productsCount = allProductsRes.totalCount;
  const allProducts = allProductsRes.data;
  const recentProducts = recentProductsRes.data;

  const brandsCount = allBrands.length;

  // Phan bo danh muc
  const categoryDistribution: DashboardCategoryDistributionItem[] = allCategories
    .map((cat) => {
      const count = allProducts.filter((p) => p.categoryId === cat.id).length;
      return {
        name: cat.name,
        count,
        level: (cat.groupId === null ? 1 : 2) as 1 | 2,
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  // Phan bo thuong hieu
  const brandDistribution: DashboardDistributionItem[] = allBrands
    .map((brand) => ({
      name: brand.name,
      count: allProducts.filter((p) => p.brandId === brand.id).length,
    }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);

  // San pham noi bat
  const featuredProducts: DashboardActivityItem[] = allProducts
    .filter((p) => p.isFeatured)
    .map((p) => ({
      id: p.id,
      title: p.name,
      type: "San pham" as const,
      date: p.createdAt,
    }));

  // Du an noi bat
  const featuredProjects: DashboardActivityItem[] = featuredProjectsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    type: "Du an" as const,
    date: p.createdAt,
  }));

  // Hoat dong gan day
  const recentActivities: DashboardActivityItem[] = [
    ...recentProducts.map((p) => ({
      id: p.id,
      title: p.name,
      type: "San pham" as const,
      date: p.createdAt,
    })),
    ...recentProjects.map((p) => ({
      id: p.id,
      title: p.title,
      type: "Du an" as const,
      date: p.createdAt,
    })),
    ...recentNews.map((n) => ({
      id: n.id,
      title: n.title,
      type: "Tin tuc" as const,
      date: n.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  // San pham duoc xem nhieu nhat — join view_item counts (modules/event)
  // against the already-fetched product list. An entityId that no longer
  // resolves (product deleted since the event was logged) is dropped
  // rather than shown with a blank name — the event table has no FK to
  // products by design (see elc-go internal/event), so this is expected.
  const topViewedProducts: DashboardDistributionItem[] = topViewedProductsRaw
    .map((row) => {
      const product = allProducts.find((p) => p.id === row.entityId);
      return product ? { name: product.name, count: row.count } : null;
    })
    .filter((item): item is DashboardDistributionItem => item !== null);

  return {
    counts: {
      products: productsCount,
      categories: categoriesCount,
      brands: brandsCount,
      projects: projectsCount,
      services: servicesCount,
      news: newsCount,
      pages: pagesCount,
      contacts: contactsCount,
      branches: branchesCount,
      inquiries: inquiriesCount,
    },
    categoryDistribution,
    brandDistribution,
    featuredProducts,
    featuredProjects,
    recentActivities,
    topViewedProducts,
  };
}
