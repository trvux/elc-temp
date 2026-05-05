"use server";

import { newsRepo } from "@/modules/news/infrastructure";
import { serviceRepo } from "@/modules/service/infrastructure";
import { pageRepo } from "@/modules/page/infrastructure";
import { contactRepo } from "@/modules/contact/infrastructure";
import { productRepo } from "@/modules/catalog/infrastructure";
import { categoryRepo } from "@/modules/category/infrastructure";
import { brandRepo } from "@/modules/brand/infrastructure";
import { branchRepo } from "@/modules/branch/infrastructure";
import { projectRepo } from "@/modules/project/infrastructure";

export async function getDashboardStatsAction() {
  try {
    const [
      products,
      categories,
      brands,
      projects,
      services,
      news,
      pages,
      contacts,
      branches
    ] = await Promise.all([
      productRepo.count(),
      categoryRepo.count(),
      brandRepo.count(),
      projectRepo.count(),
      serviceRepo.count(),
      newsRepo.count(),
      pageRepo.count(),
      contactRepo.count(),
      branchRepo.count()
    ]);

    return {
      data: {
        products,
        categories,
        brands,
        projects,
        services,
        news,
        pages,
        contacts,
        branches
      },
      error: null
    };
  } catch (error) {
    console.error("getDashboardStatsAction error:", error);
    return { data: null, error: "Failed to fetch dashboard stats" };
  }
}
