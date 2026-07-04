import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { CategoryRepository } from "@/modules/category/domain/repository";
import { Brand } from "@/modules/brand/domain";
import { ProjectRepository } from "@/modules/project/domain/repository";
import { NewsRepository } from "@/modules/news/domain/repository";
import {
  DashboardStats,
  DashboardActivityItem,
  DashboardCategoryDistributionItem,
  DashboardDistributionItem,
} from "../domain/types";

export interface DashboardRepositories {
  categoryRepo: CategoryRepository;
  projectRepo: ProjectRepository;
  newsRepo: NewsRepository;
}

/**
 * Tong hop thong ke toan bo he thong cho Dashboard.
 * Ham nay la use case duy nhat cua module, nhan cac repository qua DIP.
 * contactsCount/servicesCount/allBrands/pagesCount duoc truyen rieng vi cac module do
 * da migrate sang Go — xem modules/dashboard/presentation/actions.ts. products cung
 * da migrate sang Go nen goi truc tiep getProductsAction thay vi qua productRepo.
 */
export async function getDashboardStats(
  repos: DashboardRepositories,
  contactsCount: number,
  servicesCount: number,
  branchesCount: number,
  pagesCount: number,
  allBrands: Brand[]
): Promise<DashboardStats> {
  const {
    categoryRepo,
    projectRepo,
    newsRepo,
  } = repos;

  const [
    allProductsRes,
    categoriesCount,
    projectsCount,
    newsCount,
    recentProductsRes,
    recentProjects,
    recentNews,
    allCategories,
    featuredProjectsRaw,
  ] = await Promise.all([
    getProductsAction({}),
    categoryRepo.count(),
    projectRepo.count(),
    newsRepo.count(),
    getProductsAction({ limit: 5, sortBy: "newest" }),
    projectRepo.getAll({ limit: 5, orderBy: "createdAt", orderDirection: "desc" }),
    newsRepo.getAll({ limit: 5 }),
    categoryRepo.getAll(),
    projectRepo.getAll({ isFeatured: true }),
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
    },
    categoryDistribution,
    brandDistribution,
    featuredProducts,
    featuredProjects,
    recentActivities,
  };
}
