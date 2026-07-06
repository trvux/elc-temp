"use server";

import { getDashboardStats } from "../application/getDashboardStats";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { countInquiriesAction } from "@/modules/inquiry";
import { getTopViewedAction } from "@/modules/event";

const GO_API_URL = process.env.GO_API_URL;

export async function getDashboardStatsAction() {
  try {
    // contact/service/brand/branch/page/category modules da migrate sang Go — lay data
    // qua Go API thay vi contactRepo/serviceRepo/brandRepo/branchRepo/pageRepo/categoryRepo.
    const [
      { data: contacts },
      servicesCountRes,
      { data: brands },
      branchesCountRes,
      pagesCountRes,
      categoriesCountRes,
      { data: allCategories },
      { data: inquiriesCount },
      { data: topViewedProductsRaw },
    ] = await Promise.all([
      getContactsAction(),
      fetch(`${GO_API_URL}/services/count`, { cache: "no-store" }),
      getBrandsAction(),
      fetch(`${GO_API_URL}/branches/count`, { cache: "no-store" }),
      fetch(`${GO_API_URL}/pages/count`, { cache: "no-store" }),
      fetch(`${GO_API_URL}/categories/count`, { cache: "no-store" }),
      getCategoriesAction(),
      // Admin-gated (unlike the counts above) — inquiries are business data,
      // not public site content, so this goes through authHeaders().
      countInquiriesAction({ status: "new" }),
      getTopViewedAction("product"),
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
    const categoriesCount = categoriesCountRes.ok
      ? ((await categoriesCountRes.json()) as { count: number }).count
      : 0;

    const data = await getDashboardStats(
      contacts.length,
      servicesCount,
      branchesCount,
      pagesCount,
      brands,
      categoriesCount,
      allCategories,
      inquiriesCount ?? 0,
      topViewedProductsRaw
    );
    return { data, error: null };
  } catch (error) {
    console.error("getDashboardStatsAction error:", error);
    return { data: null, error: "Failed to fetch dashboard stats" };
  }
}
