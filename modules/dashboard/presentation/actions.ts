"use server";

import { getDashboardStats } from "../application/getDashboardStats";
import { newsRepo } from "@/modules/news/infrastructure";
import { pageRepo } from "@/modules/page/infrastructure";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { productRepo } from "@/modules/catalog/infrastructure";
import { categoryRepo } from "@/modules/category/infrastructure/categoryRepo";
import { brandRepo } from "@/modules/brand/infrastructure";
import { branchRepo } from "@/modules/branch/infrastructure";
import { projectRepo } from "@/modules/project/infrastructure";

const GO_API_URL = process.env.GO_API_URL;

export async function getDashboardStatsAction() {
  try {
    // contact/service modules da migrate sang Go — lay count qua Go API
    // thay vi contactRepo/serviceRepo.
    const [{ data: contacts }, servicesCountRes] = await Promise.all([
      getContactsAction(),
      fetch(`${GO_API_URL}/services/count`, { cache: "no-store" }),
    ]);
    const servicesCount = servicesCountRes.ok
      ? ((await servicesCountRes.json()) as { count: number }).count
      : 0;

    const data = await getDashboardStats(
      {
        productRepo,
        categoryRepo,
        brandRepo,
        projectRepo,
        newsRepo,
        pageRepo,
        branchRepo,
      },
      contacts.length,
      servicesCount
    );
    return { data, error: null };
  } catch (error) {
    console.error("getDashboardStatsAction error:", error);
    return { data: null, error: "Failed to fetch dashboard stats" };
  }
}
