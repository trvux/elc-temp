"use server";

import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { projectRepo } from "@/modules/project/infrastructure/projectRepo";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { createStaticClient } from "@/shared/lib/supabase/static";
import Fuse from "fuse.js";
import { getQueryTokens, tokenize } from "@/shared/lib/search-utils";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products-search");
  // limit covers the full live catalog (196 products as of writing) with headroom.
  const { data } = await getProductsAction({ isPublished: true, limit: 1000 });
  return data;
}

async function getCachedProjects() {
  "use cache";
  cacheLife("minutes");
  cacheTag("projects-search");
  return projectRepo.getAll({ isPublished: true });
}

async function getCachedServices() {
  "use cache";
  cacheLife("minutes");
  cacheTag("services-search");
  const { data } = await getServicesAction({ isPublished: true });
  return data;
}

interface SpecSubItem {
  value?: string | number;
  unit?: string;
}

interface SpecItem {
  label?: string;
  value?: string | number | SpecSubItem[];
  unit?: string;
  items?: SpecSubItem[] | string[];
}

function flattenSpecs(specs: unknown): string {
  if (!Array.isArray(specs)) return "";
  return (specs as SpecItem[])
    .flatMap((s) => {
      const items = Array.isArray(s.items) ? s.items : (Array.isArray(s.value) ? s.value : null);
      if (items) {
        return (items as (SpecSubItem | string)[]).flatMap((i) => {
          if (typeof i === "object" && i !== null) {
            return [String(i.value ?? ""), String(i.unit ?? "")];
          }
          return [String(i ?? "")];
        });
      }
      return [String(s.value ?? "")];
    })
    .join(" ");
}


export interface SearchSuggestionItem {
  id: string;
  title: string;
  type: "product" | "project" | "service";
  slug: string;
  category?: string;
  image?: string | null;
  price?: string | null;
  sku?: string | null;
}

export interface DefaultSearchItem {
  id: string;
  title: string;
  type: "product_category" | "project_type" | "service_item" | "news_item";
  slug: string;
}

export async function getDefaultSearchItemsAction(): Promise<{
  productCategories: DefaultSearchItem[];
  projectTypes: DefaultSearchItem[];
  services: DefaultSearchItem[];
  news: DefaultSearchItem[];
}> {
  try {
    const supabase = createStaticClient();
    
    const [catsRes, projTypesRes, servicesRes, newsRes] = await Promise.all([
      supabase.from("categories").select("id, name, slug").is("deleted_at", null).order("name", { ascending: true }).limit(8),
      supabase.from("project_type").select("id, name, slug").is("deleted_at", null).order("name", { ascending: true }).limit(8),
      supabase.from("services").select("id, title, slug").eq("is_published", true).is("deleted_at", null).order("title", { ascending: true }).limit(8),
      supabase.from("news").select("id, title, slug").eq("is_published", true).is("deleted_at", null).order("created_at", { ascending: false }).limit(8),
    ]);

    const productCategories = (catsRes.data || []).map((c) => ({
      id: c.id,
      title: c.name,
      type: "product_category" as const,
      slug: c.slug,
    }));

    const projectTypes = (projTypesRes.data || []).map((pt) => ({
      id: pt.id,
      title: pt.name,
      type: "project_type" as const,
      slug: pt.slug,
    }));

    const services = (servicesRes.data || []).map((s) => ({
      id: s.id,
      title: s.title,
      type: "service_item" as const,
      slug: s.slug,
    }));

    const news = (newsRes.data || []).map((n) => ({
      id: n.id,
      title: n.title,
      type: "news_item" as const,
      slug: n.slug,
    }));

    return {
      productCategories,
      projectTypes,
      services,
      news,
    };
  } catch (error) {
    console.error("Failed to fetch default search items:", error);
    return {
      productCategories: [],
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
    const [allProducts, allProjects, allServices] = await Promise.all([
      getCachedProducts(),
      getCachedProjects(),
      getCachedServices(),
    ]);

    // 1. Process matching products
    const fuseProducts = new Fuse(allProducts, {
      keys: [
        { name: "name", getFn: (p) => tokenize(p.name ?? ""), weight: 0.55 },
        { name: "sku", getFn: (p) => tokenize(p.sku ?? ""), weight: 0.15 },
        { name: "brand", getFn: (p) => tokenize(p.brand?.name ?? ""), weight: 0.15 },
        { name: "category", getFn: (p) => tokenize(p.category?.name ?? ""), weight: 0.05 },
        { name: "specs", getFn: (p) => tokenize(flattenSpecs(p.specs)), weight: 0.1 },
      ],
      threshold: 0.1,
      minMatchCharLength: 1,
    });

    let searchedProducts = allProducts;
    if (queryTokens.length === 1) {
      searchedProducts = fuseProducts.search(queryTokens[0]).map((r) => r.item);
    } else {
      const resultSets = queryTokens.map((token) => {
        const matches = fuseProducts.search(token).map((r) => r.item.id);
        return new Set(matches);
      });
      searchedProducts = allProducts.filter((p) =>
        resultSets.every((set) => set.has(p.id)),
      );
    }

    const matchedProducts = searchedProducts.map((p) => {
      const currentPrice = p.salePrice || p.originalPrice || 0;
      const priceStr = currentPrice > 0 ? `${currentPrice.toLocaleString("vi-VN")}đ` : "Liên hệ";
      return {
        id: p.id,
        title: p.name,
        type: "product" as const,
        slug: p.slug,
        category: p.category?.name || "Sản phẩm",
        image: p.images?.[0] || null,
        price: priceStr,
        sku: p.sku || null,
      };
    });

    // 2. Process matching projects
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
      image: p.images?.[0] || null,
      price: null,
    }));

    // 3. Process matching services

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
        image: s.image || null,
        price: priceStr,
      };
    });

    return [...matchedProducts, ...matchedProjects, ...matchedServices];
  } catch (error) {
    console.error("Failed to fetch autocomplete suggestions:", error);
    return [];
  }
}
