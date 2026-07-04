import { ProductRepository } from "@/modules/catalog/domain/repository";
import { CategoryRepository } from "@/modules/category/domain/repository";
import { Brand } from "@/modules/brand/domain";
import { ProjectRepository } from "@/modules/project/domain/repository";
import { NewsRepository } from "@/modules/news/domain/repository";
import { PageRepository } from "@/modules/page/domain/repository";
import { BranchRepository } from "@/modules/branch/domain/repository";
import {
  DashboardStats,
  DashboardActivityItem,
  DashboardCategoryDistributionItem,
  DashboardDistributionItem,
} from "../domain/types";

export interface DashboardRepositories {
  productRepo: ProductRepository;
  categoryRepo: CategoryRepository;
  projectRepo: ProjectRepository;
  newsRepo: NewsRepository;
  pageRepo: PageRepository;
  branchRepo: BranchRepository;
}

/**
 * Tong hop thong ke toan bo he thong cho Dashboard.
 * Ham nay la use case duy nhat cua module, nhan cac repository qua DIP.
 * contactsCount/servicesCount/allBrands duoc truyen rieng vi cac module do
 * da migrate sang Go — xem modules/dashboard/presentation/actions.ts.
 */
export async function getDashboardStats(
  repos: DashboardRepositories,
  contactsCount: number,
  servicesCount: number,
  allBrands: Brand[]
): Promise<DashboardStats> {
  const {
    productRepo,
    categoryRepo,
    projectRepo,
    newsRepo,
    pageRepo,
    branchRepo,
  } = repos;

  const [
    productsCount,
    categoriesCount,
    projectsCount,
    newsCount,
    pagesCount,
    branchesCount,
    recentProducts,
    recentProjects,
    recentNews,
    allCategories,
    allProducts,
    featuredProjectsRaw,
  ] = await Promise.all([
    productRepo.count(),
    categoryRepo.count(),
    projectRepo.count(),
    newsRepo.count(),
    pageRepo.count(),
    branchRepo.count(),
    productRepo.getAll({ limit: 5, sortBy: "newest" }),
    projectRepo.getAll({ limit: 5, orderBy: "createdAt", orderDirection: "desc" }),
    newsRepo.getAll({ limit: 5 }),
    categoryRepo.getAll(),
    productRepo.getAll(),
    projectRepo.getAll({ isFeatured: true }),
  ]);

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
