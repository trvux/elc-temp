"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Service, CreateServiceInput, UpdateServiceInput, ServiceFilter, ServiceWithRelations, ImageAsset } from "../domain/types";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";
import { submitToIndexNow } from "@/shared/lib/indexnow";
import { warmCache } from "@/shared/lib/cache-warm";
import { getServiceGroupsAction } from "@/modules/service-group/presentation/actions";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

const GO_API_URL = process.env.GO_API_URL;

interface GoRefResponse {
  id: string;
  name: string;
}

interface GoServiceResponse {
  id: string;
  title: string;
  slug: string;
  group_id: string | null;
  category_id: string | null;
  original_price: number | null;
  sale_price: number | null;
  discount_percent: number | null;
  price_display_text: string | null;
  labels: string[] | null;
  description: string | null;
  content: unknown;
  images: ImageAsset[];
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  group: GoRefResponse | null;
  category: GoRefResponse | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoService(row: GoServiceResponse): ServiceWithRelations {
  const service: Service = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    groupId: row.group_id,
    categoryId: row.category_id,
    originalPrice: row.original_price,
    salePrice: row.sale_price,
    discountPercent: row.discount_percent,
    priceDisplayText: row.price_display_text,
    labels: row.labels,
    description: row.description,
    content: row.content as Service["content"],
    images: row.images || [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isFeatured: row.is_featured,
    isPublished: row.is_published,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };

  return {
    ...service,
    group: row.group ? { ...emptyServiceGroupShape(), id: row.group.id, name: row.group.name } : null,
    category: row.category ? { ...emptyCategoryShape(), id: row.category.id, name: row.category.name } : null,
  };
}

// Go only joins {id, name} for group/category (the only fields any component
// reads — see docs/service.md). The rest of these nested shapes are unused
// filler so TypeScript's structural types are satisfied without lying about
// data we don't actually have.
function emptyServiceGroupShape() {
  return {
    slug: "", imageUrl: null, metaTitle: null, metaDescription: null,
    isFeatured: false, isHidden: false, orderIndex: 0, categoryIds: null,
    createdAt: "", updatedAt: "", deletedAt: null,
  };
}

function emptyCategoryShape() {
  return {
    slug: "", groupId: null, imageUrl: null, metaTitle: null, metaDescription: null,
    isFeatured: false, isHidden: false, orderIndex: 0, createdAt: "", updatedAt: "", deletedAt: null,
    group: null,
  };
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || `Go API error (${res.status})`;
  } catch {
    return `Go API error (${res.status})`;
  }
}

function buildFilterParams(options?: ServiceFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (options?.groupId) params.set("group_id", options.groupId);
  if (options?.categoryId) params.set("category_id", options.categoryId);
  if (options?.isFeatured !== undefined) params.set("is_featured", String(options.isFeatured));
  if (options?.isPublished !== undefined) params.set("is_published", String(options.isPublished));
  if (options?.search) params.set("search", options.search);
  if (options?.includeDeleted) params.set("include_deleted", "true");
  return params;
}

export async function getServicesAction(options?: ServiceFilter) {
  if (!GO_API_URL) {
    return { data: [] as ServiceWithRelations[], error: null };
  }
  try {
    const params = buildFilterParams(options);
    const res = await fetch(`${GO_API_URL}/services?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoServiceResponse[] | null;
    return { data: (rows ?? []).map(mapGoService), error: null };
  } catch (error) {
    console.error("getServicesAction error:", error);
    return { data: [], error: "Failed to fetch services" };
  }
}

export async function createServiceAction(input: CreateServiceInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoServiceResponse;
    const data = mapGoService(row);

    revalidateTag("services-list", { expire: 0 });
    if (data.slug) {
      revalidateTag(`service-slug:${data.slug}`, { expire: 0 });
    }
    revalidatePath("/dich-vu", "layout");
    revalidatePath("/admin/services");
    if (data.isPublished && data.slug) {
      const url = `${BASE_URL}/dich-vu/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow service create error:", err));
      warmCache([url]);
    }
    return { data, error: null };
  } catch (error) {
    console.error("createServiceAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create service",
    };
  }
}

export async function updateServiceAction(input: UpdateServiceInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res) };
    }

    const row = (await res.json()) as GoServiceResponse;
    const data = mapGoService(row);

    revalidateTag("services-list", { expire: 0 });
    if (data.slug) {
      revalidateTag(`service-slug:${data.slug}`, { expire: 0 });
    }
    revalidatePath("/dich-vu", "layout");
    revalidatePath("/admin/services");
    if (data.isPublished && data.slug) {
      const url = `${BASE_URL}/dich-vu/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow service update error:", err));
      warmCache([url]);
    }
    return { data, error: null };
  } catch (error) {
    console.error("updateServiceAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update service",
    };
  }
}

export async function getServiceBySlugAction(slug: string): Promise<ServiceWithRelations | null> {
  if (!GO_API_URL) {
    return null;
  }
  const res = await fetch(`${GO_API_URL}/services/slug/${slug}`, { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  const row = (await res.json()) as GoServiceResponse;
  return mapGoService(row);
}

export interface AdjacentService {
  title: string;
  slug: string;
}

export interface AdjacentServices {
  prev: AdjacentService | null;
  next: AdjacentService | null;
}

// Mirrors the old modules/service/application/index.ts getAdjacentServices —
// prefer siblings in the same group, fall back to the full published list if
// the group has fewer than 2 services, sort featured-first then by order.
export async function getAdjacentServicesAction(
  service: Pick<ServiceWithRelations, "id" | "groupId">
): Promise<AdjacentServices> {
  let { data: siblings } = await getServicesAction({
    isPublished: true,
    groupId: service.groupId || undefined,
  });

  if (siblings.length < 2) {
    ({ data: siblings } = await getServicesAction({ isPublished: true }));
  }

  const sorted = [...siblings].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.orderIndex - b.orderIndex;
  });

  const currentIndex = sorted.findIndex((s) => s.id === service.id);
  if (currentIndex === -1 || sorted.length < 2) {
    return { prev: null, next: null };
  }

  const toItem = (s: ServiceWithRelations): AdjacentService => ({
    title: s.title,
    slug: s.slug || "",
  });

  return {
    prev: currentIndex > 0 ? toItem(sorted[currentIndex - 1]) : null,
    next: currentIndex < sorted.length - 1 ? toItem(sorted[currentIndex + 1]) : null,
  };
}

export interface GroupedServices {
  name: string;
  orderIndex: number;
  items: ServiceWithRelations[];
  createdAt: string;
}

// Mirrors the old modules/service/application/index.ts getPublishedServicesGrouped,
// but composes two already-Go-backed Server Actions instead of two repos.
export async function getPublishedServicesGroupedAction(): Promise<GroupedServices[]> {
  const [servicesResult, groupsResult] = await Promise.all([
    getServicesAction({ isPublished: true }),
    getServiceGroupsAction(),
  ]);
  const allServices = unwrapActionResult(servicesResult);
  const allGroups = unwrapActionResult(groupsResult);

  const groupsMap = new Map<
    string,
    { name: string; orderIndex: number; items: ServiceWithRelations[]; createdAt: string }
  >();

  allGroups.forEach((group) => {
    groupsMap.set(group.id, {
      name: group.name,
      orderIndex: group.orderIndex,
      items: [],
      createdAt: group.createdAt,
    });
  });

  const hasUngroupedServices = allServices.some((s) => !s.groupId);
  if (hasUngroupedServices && !groupsMap.has("khac")) {
    groupsMap.set("khac", {
      name: "Khác",
      orderIndex: 9999,
      items: [],
      createdAt: new Date().toISOString(),
    });
  }

  allServices.forEach((service) => {
    const groupId = service.groupId || "khac";
    if (groupsMap.has(groupId)) {
      groupsMap.get(groupId)!.items.push(service);
    } else {
      const groupName = service.group?.name || "Khác";
      const groupOrder = 9999;
      groupsMap.set(groupId, {
        name: groupName,
        orderIndex: groupOrder,
        items: [service],
        createdAt: new Date().toISOString(),
      });
    }
  });

  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export async function deleteServiceAction(id: string) {
  if (!GO_API_URL) {
    return { error: "GO_API_URL is not configured" };
  }
  try {
    const getRes = await fetch(`${GO_API_URL}/services/${id}`, { cache: "no-store" });
    const slug = getRes.ok ? ((await getRes.json()) as GoServiceResponse).slug : null;

    const res = await fetch(`${GO_API_URL}/services/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { error: await extractErrorMessage(res) };
    }

    revalidateTag("services-list", { expire: 0 });
    if (slug) {
      revalidateTag(`service-slug:${slug}`, { expire: 0 });
    }
    revalidatePath("/dich-vu", "layout");
    revalidatePath("/admin/services");
    return { error: null };
  } catch (error) {
    console.error("deleteServiceAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete service",
    };
  }
}
