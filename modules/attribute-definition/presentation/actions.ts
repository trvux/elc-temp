"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  AttributeDefinition,
  AttributeDefinitionFilter,
  AttributeDataType,
  CreateAttributeDefinitionInput,
  UpdateAttributeDefinitionInput,
} from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoAttributeDefinitionResponse {
  id: string;
  category_id: string | null;
  code: string;
  name: string;
  group_label: string | null;
  data_type: string;
  unit: string | null;
  options: string[] | null;
  order_index: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoAttributeDefinition(row: GoAttributeDefinitionResponse): AttributeDefinition {
  return {
    id: row.id,
    categoryId: row.category_id,
    code: row.code,
    name: row.name,
    groupLabel: row.group_label,
    dataType: row.data_type as AttributeDataType,
    unit: row.unit,
    options: row.options ?? [],
    orderIndex: row.order_index,
    isRequired: row.is_required,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getAttributeDefinitionsAction(filter?: AttributeDefinitionFilter) {
  if (!GO_API_URL) {
    return { data: [] as AttributeDefinition[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.categoryId) params.set("category_id", filter.categoryId);
    if (filter?.includeGlobal) params.set("include_global", "true");
    if (filter?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/attribute-definitions?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách thuộc tính") };
    }

    const rows = (await res.json()) as GoAttributeDefinitionResponse[] | null;
    return { data: (rows ?? []).map(mapGoAttributeDefinition), error: null };
  } catch (error) {
    console.error("getAttributeDefinitionsAction error:", error);
    return { data: [], error: "Không thể tải danh sách thuộc tính" };
  }
}

export async function createAttributeDefinitionAction(input: CreateAttributeDefinitionInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/attribute-definitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo thuộc tính") };
    }

    const row = (await res.json()) as GoAttributeDefinitionResponse;
    revalidatePath("/admin/attribute-definitions");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoAttributeDefinition(row), error: null };
  } catch (error) {
    console.error("createAttributeDefinitionAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo thuộc tính",
    };
  }
}

export async function updateAttributeDefinitionAction(input: UpdateAttributeDefinitionInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/attribute-definitions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật thuộc tính") };
    }

    const row = (await res.json()) as GoAttributeDefinitionResponse;
    revalidatePath("/admin/attribute-definitions");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoAttributeDefinition(row), error: null };
  } catch (error) {
    console.error("updateAttributeDefinitionAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật thuộc tính",
    };
  }
}

export async function deleteAttributeDefinitionAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/attribute-definitions/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa thuộc tính") };
    }

    revalidatePath("/admin/attribute-definitions");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteAttributeDefinitionAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa thuộc tính",
    };
  }
}
