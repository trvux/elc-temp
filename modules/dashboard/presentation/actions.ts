"use server";

import { getDashboardStats } from "../application/getDashboardStats";
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
    const data = await getDashboardStats({
      productRepo,
      categoryRepo,
      brandRepo,
      projectRepo,
      serviceRepo,
      newsRepo,
      pageRepo,
      contactRepo,
      branchRepo,
    });
    return { data, error: null };
  } catch (error) {
    console.error("getDashboardStatsAction error:", error);
    return { data: null, error: "Failed to fetch dashboard stats" };
  }
}
