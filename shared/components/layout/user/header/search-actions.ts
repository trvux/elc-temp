"use server";

import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import { getNewsAction } from "@/modules/news/presentation/actions";
import Fuse from "fuse.js";
import { getQueryTokens, tokenize } from "@/shared/lib/search-utils";
import { cacheLife, cacheTag } from "next/cache";
import { primaryImageUrl } from "@/shared/lib/image-asset";

async function getCachedProjects() {
  "use cache";
  cacheLife("minutes");
  cacheTag("projects-search");
  const { data } = await getProjectsAction({ isPublished: true });
  return data;
}

async function getCachedServices() {
  "use cache";
  cacheLife("minutes");
  cacheTag("services-search");
  const { data } = await getServicesAction({ isPublished: true });
  return data;
}

export interface SearchSuggestionItem {
  id: string;
  title: string;
  type: "project" | "service";
  slug: string;
  category?: string;
  image?: string | null;
  price?: string | null;
  sku?: string | null;
}

export interface DefaultSearchItem {
  id: string;
  title: string;
  type: "project_type" | "service_item" | "news_item";
  slug: string;
}

export async function getDefaultSearchItemsAction(): Promise<{
  projectTypes: DefaultSearchItem[];
  services: DefaultSearchItem[];
  news: DefaultSearchItem[];
}> {
  try {
    const [projTypesRes, servicesRes, newsRes] = await Promise.all([
      getProjectTypesAction(),
      getServicesAction({ isPublished: true }),
      getNewsAction({ isPublished: true, limit: 8, sortBy: "created_at", sortOrder: "desc" }),
    ]);

    const projectTypes = [...projTypesRes.data]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8)
      .map((pt) => ({
        id: pt.id,
        title: pt.name,
        type: "project_type" as const,
        slug: pt.slug,
      }));

    const services = [...servicesRes.data]
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 8)
      .map((s) => ({
        id: s.id,
        title: s.title,
        type: "service_item" as const,
        slug: s.slug,
      }));

    const news = newsRes.data.map((n) => ({
      id: n.id,
      title: n.title,
      type: "news_item" as const,
      slug: n.slug,
    }));

    return {
      projectTypes,
      services,
      news,
    };
  } catch (error) {
    console.error("Failed to fetch default search items:", error);
    return {
      projectTypes: [],
      services: [],
      news: [],
    };
  }
}

export async function getAutocompleteSuggestionsAction(query: string): Promise<SearchSuggestionItem[]> {
  if (!query || query.trim().length < 2) return [];
  const queryTokens = getQueryTokens(query);
  if (queryTokens.length === 0) return [];

  try {
    // Parallelize caching data fetch from database
    const [allProjects, allServices] = await Promise.all([
      getCachedProjects(),
      getCachedServices(),
    ]);

    // 1. Process matching projects
    const fuseProjects = new Fuse(allProjects, {
      keys: [
        { name: "title", getFn: (p) => tokenize(p.title ?? ""), weight: 0.8 },
        { name: "category", getFn: (p) => tokenize(p.projectType?.name ?? ""), weight: 0.2 },
      ],
      threshold: 0.1,
      minMatchCharLength: 1,
    });

    let searchedProjects = allProjects;
    if (queryTokens.length === 1) {
      searchedProjects = fuseProjects.search(queryTokens[0]).map((r) => r.item);
    } else {
      const resultSets = queryTokens.map(
        (token) => new Set(fuseProjects.search(token).map((r) => r.item.id)),
      );
      searchedProjects = allProjects.filter((p) =>
        resultSets.every((set) => set.has(p.id)),
      );
    }

    const matchedProjects = searchedProjects.map((p) => ({
      id: p.id,
      title: p.title,
      type: "project" as const,
      slug: p.slug,
      category: p.projectType?.name || "Dự án",
      image: primaryImageUrl(p.images) || null,
      price: null,
    }));

    // 2. Process matching services

    const fuseServices = new Fuse(allServices, {
      keys: [
        { name: "title", getFn: (p) => tokenize(p.title ?? ""), weight: 0.8 },
        { name: "category", getFn: (p) => tokenize(p.group?.name ?? ""), weight: 0.2 },
      ],
      threshold: 0.1,
      minMatchCharLength: 1,
    });

    let searchedServices = allServices;
    if (queryTokens.length === 1) {
      searchedServices = fuseServices.search(queryTokens[0]).map((r) => r.item);
    } else {
      const resultSets = queryTokens.map(
        (token) => new Set(fuseServices.search(token).map((r) => r.item.id)),
      );
      searchedServices = allServices.filter((s) =>
        resultSets.every((set) => set.has(s.id)),
      );
    }

    const matchedServices = searchedServices.map((s) => {
      const currentPrice = s.salePrice || s.originalPrice || 0;
      const priceStr = s.priceDisplayText || (currentPrice > 0 ? `${currentPrice.toLocaleString("vi-VN")}đ` : "Liên hệ");
      return {
        id: s.id,
        title: s.title,
        type: "service" as const,
        slug: s.slug,
        category: s.group?.name || "Dịch vụ",
        image: primaryImageUrl(s.images) || null,
        price: priceStr,
      };
    });

    return [...matchedProjects, ...matchedServices];
  } catch (error) {
    console.error("Failed to fetch autocomplete suggestions:", error);
    return [];
  }
}
