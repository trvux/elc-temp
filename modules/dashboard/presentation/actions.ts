"use server";

import { newsRepo } from "@/modules/news/infrastructure";
import { serviceRepo } from "@/modules/service/infrastructure/serviceRepo";
import { pageRepo } from "@/modules/page/infrastructure";
import { contactRepo } from "@/modules/contact/infrastructure";
import { productRepo } from "@/modules/catalog/infrastructure";
import { categoryRepo } from "@/modules/category/infrastructure/categoryRepo";
import { brandRepo } from "@/modules/brand/infrastructure";
import { branchRepo } from "@/modules/branch/infrastructure";
import { projectRepo } from "@/modules/project/infrastructure";

export async function getDashboardStatsAction() {
  try {
    const [
      productsCount,
      categoriesCount,
      brandsCount,
      projectsCount,
      servicesCount,
      newsCount,
      pagesCount,
      contactsCount,
      branchesCount,
      recentProducts,
      recentProjects,
      recentNews,
      allCategories,
      allProducts
    ] = await Promise.all([
      productRepo.count(),
      categoryRepo.count(),
      brandRepo.count(),
      projectRepo.count(),
      serviceRepo.count(),
      newsRepo.count(),
      pageRepo.count(),
      contactRepo.count(),
      branchRepo.count(),
      productRepo.getAll({ limit: 5, sortBy: "newest" }),
      projectRepo.getAll({ limit: 5, orderBy: "createdAt", orderDirection: "desc" }),
      newsRepo.getAll({ limit: 5 }),
      categoryRepo.getAll(),
      productRepo.getAll()
    ]);

    // Calculate category distribution (showing all categories level 1 & 2 that have products)
    const categoryDistribution = allCategories
      .map(cat => {
        const count = allProducts.filter(p => p.categoryId === cat.id).length;
        return { 
          name: cat.name, 
          count,
          level: cat.groupId === null ? 1 : 2 
        };
      })
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);

    // Calculate brand distribution
    const brandDistribution = brandsCount > 0 ? await (async () => {
      const brands = await brandRepo.getAll();
      return brands.map(brand => {
        const count = allProducts.filter(p => p.brandId === brand.id).length;
        return { name: brand.name, count };
      })
      .filter(b => b.count > 0)
      .sort((a, b) => b.count - a.count);
    })() : [];

    // Featured items separated
    const featuredProducts = allProducts
      .filter(p => p.isFeatured)
      .map(p => ({ id: p.id, title: p.name, type: "Sản phẩm" as const, date: p.createdAt }));
      
    const featuredProjects = (await projectRepo.getAll({ isFeatured: true }))
      .map(p => ({ id: p.id, title: p.title, type: "Dự án" as const, date: p.createdAt }));

    // Recent items consolidated
    const recentActivities = [
      ...recentProducts.map(p => ({ id: p.id, title: p.name, type: "Sản phẩm" as const, date: p.createdAt })),
      ...recentProjects.map(p => ({ id: p.id, title: p.title, type: "Dự án" as const, date: p.createdAt })),
      ...recentNews.map(n => ({ id: n.id, title: n.title, type: "Tin tức" as const, date: n.createdAt }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    return {
      data: {
        counts: {
          products: productsCount,
          categories: categoriesCount,
          brands: brandsCount,
          projects: projectsCount,
          services: servicesCount,
          news: newsCount,
          pages: pagesCount,
          contacts: contactsCount,
          branches: branchesCount
        },
        categoryDistribution,
        brandDistribution,
        featuredProducts,
        featuredProjects,
        recentActivities
      },
      error: null
    };
  } catch (error) {
    console.error("getDashboardStatsAction error:", error);
    return { data: null, error: "Failed to fetch dashboard stats" };
  }
}
