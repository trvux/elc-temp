"use server";

import { getDashboardStats } from "../application/getDashboardStats";
import { newsRepo } from "@/modules/news/infrastructure";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { productRepo } from "@/modules/catalog/infrastructure";
import { categoryRepo } from "@/modules/category/infrastructure/categoryRepo";
import { projectRepo } from "@/modules/project/infrastructure";

const GO_API_URL = process.env.GO_API_URL;

export async function getDashboardStatsAction() {
  try {
    // contact/service/brand/branch/page modules da migrate sang Go — lay data qua Go API
    // thay vi contactRepo/serviceRepo/brandRepo/branchRepo/pageRepo.
    const [
      { data: contacts },
      servicesCountRes,
      { data: brands },
      branchesCountRes,
      pagesCountRes,
    ] = await Promise.all([
      getContactsAction(),
      fetch(`${GO_API_URL}/services/count`, { cache: "no-store" }),
      getBrandsAction(),
      fetch(`${GO_API_URL}/branches/count`, { cache: "no-store" }),
      fetch(`${GO_API_URL}/pages/count`, { cache: "no-store" }),
    ]);

    const servicesCount = servicesCountRes.ok
      ? ((await servicesCountRes.json()) as { count: number }).count
      : 0;
    const branchesCount = branchesCountRes.ok
      ? ((await branchesCountRes.json()) as { count: number }).count
      : 0;
    const pagesCount = pagesCountRes.ok
      ? ((await pagesCountRes.json()) as { count: number }).count
      : 0;

    const data = await getDashboardStats(
      {
        productRepo,
        categoryRepo,
        projectRepo,
        newsRepo,
      },
      contacts.length,
      servicesCount,
      branchesCount,
      pagesCount,
      brands
    );
    return { data, error: null };
  } catch (error) {
    console.error("getDashboardStatsAction error:", error);
    return { data: null, error: "Failed to fetch dashboard stats" };
  }
}
