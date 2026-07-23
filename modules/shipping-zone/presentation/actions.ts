"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { DELIVERY_PROVINCE_COOKIE, DELIVERY_WARD_COOKIE } from "./delivery-cookie-name";
import { getSavedProvinceCode, getSavedWardCode } from "./delivery-cookie";
import {
  Province,
  Ward,
  ShippingZone,
  ShippingZoneFilter,
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
  ZoneLookupResult,
} from "../domain";
import { authHeaders, toSnakeCaseBody } from "@/shared/lib/go-api";

const GO_API_URL = process.env.GO_API_URL;

interface GoZoneResponse {
  id: string;
  name: string;
  fee_vnd: number;
  min_days: number;
  max_days: number;
  is_default: boolean;
  province_codes: string[];
  ward_codes: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoProvinceResponse {
  code: string;
  name: string;
}

interface GoWardResponse {
  code: string;
  name: string;
  province_code: string;
}

interface GoLookupResponse {
  zone_name: string;
  fee_vnd: number;
  min_days: number;
  max_days: number;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoZone(row: GoZoneResponse): ShippingZone {
  return {
    id: row.id,
    name: row.name,
    feeVnd: row.fee_vnd,
    minDays: row.min_days,
    maxDays: row.max_days,
    isDefault: row.is_default,
    provinceCodes: row.province_codes ?? [],
    wardCodes: row.ward_codes ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapGoProvince(row: GoProvinceResponse): Province {
  return { code: row.code, name: row.name };
}

function mapGoWard(row: GoWardResponse): Ward {
  return { code: row.code, name: row.name, provinceCode: row.province_code };
}

function mapGoLookup(row: GoLookupResponse): ZoneLookupResult {
  return {
    zoneName: row.zone_name,
    feeVnd: row.fee_vnd,
    minDays: row.min_days,
    maxDays: row.max_days,
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

export async function getShippingZonesAction(options?: ShippingZoneFilter) {
  if (!GO_API_URL) {
    return { data: [] as ShippingZone[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (options?.includeDeleted) params.set("include_deleted", "true");

    const res = await fetch(`${GO_API_URL}/shipping/zones?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách khu vực giao hàng") };
    }

    const rows = (await res.json()) as GoZoneResponse[] | null;
    return { data: (rows ?? []).map(mapGoZone), error: null };
  } catch (error) {
    console.error("getShippingZonesAction error:", error);
    return { data: [], error: "Không thể tải danh sách khu vực giao hàng" };
  }
}

export async function createShippingZoneAction(input: CreateShippingZoneInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/shipping/zones`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(input)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tạo khu vực giao hàng") };
    }

    const row = (await res.json()) as GoZoneResponse;
    revalidatePath("/admin/shipping-zones");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoZone(row), error: null };
  } catch (error) {
    console.error("createShippingZoneAction error:", error);
    return { data: null, error: error instanceof Error ? error.message : "Không thể tạo khu vực giao hàng" };
  }
}

export async function updateShippingZoneAction(input: UpdateShippingZoneInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const { id, ...rest } = input;
    const res = await fetch(`${GO_API_URL}/shipping/zones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(toSnakeCaseBody(rest)),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể cập nhật khu vực giao hàng") };
    }

    const row = (await res.json()) as GoZoneResponse;
    revalidatePath("/admin/shipping-zones");
    revalidateTag("layout", { expire: 0 });
    return { data: mapGoZone(row), error: null };
  } catch (error) {
    console.error("updateShippingZoneAction error:", error);
    return { data: null, error: error instanceof Error ? error.message : "Không thể cập nhật khu vực giao hàng" };
  }
}

export async function deleteShippingZoneAction(id: string) {
  if (!GO_API_URL) {
    return { success: false, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/shipping/zones/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (!res.ok) {
      return { success: false, error: await extractErrorMessage(res, "Không thể xóa khu vực giao hàng") };
    }

    revalidatePath("/admin/shipping-zones");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteShippingZoneAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Không thể xóa khu vực giao hàng" };
  }
}

export async function getProvincesAction() {
  if (!GO_API_URL) {
    return { data: [] as Province[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/shipping/provinces`, { cache: "force-cache", next: { revalidate: 3600 } });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách tỉnh/thành") };
    }

    const rows = (await res.json()) as GoProvinceResponse[] | null;
    return { data: (rows ?? []).map(mapGoProvince), error: null };
  } catch (error) {
    console.error("getProvincesAction error:", error);
    return { data: [], error: "Không thể tải danh sách tỉnh/thành" };
  }
}

export async function getWardsAction(provinceCode: string) {
  if (!GO_API_URL || !provinceCode) {
    return { data: [] as Ward[], error: null };
  }
  try {
    const res = await fetch(
      `${GO_API_URL}/shipping/wards?${new URLSearchParams({ province: provinceCode }).toString()}`,
      { cache: "force-cache", next: { revalidate: 3600 } },
    );
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải danh sách phường/xã") };
    }

    const rows = (await res.json()) as GoWardResponse[] | null;
    return { data: (rows ?? []).map(mapGoWard), error: null };
  } catch (error) {
    console.error("getWardsAction error:", error);
    return { data: [], error: "Không thể tải danh sách phường/xã" };
  }
}

// lookupShippingZoneAction resolves fee/delivery-time for a customer's
// province + ward (phường/xã — the real bottom tier of the address
// hierarchy), used by the public product-page widget.
export async function lookupShippingZoneAction(provinceCode: string, wardCode?: string) {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const params = new URLSearchParams({ province: provinceCode });
    if (wardCode) params.set("ward", wardCode);

    const res = await fetch(`${GO_API_URL}/shipping/zones/lookup?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể tra cứu phí giao hàng") };
    }

    const row = (await res.json()) as GoLookupResponse;
    return { data: mapGoLookup(row), error: null };
  } catch (error) {
    console.error("lookupShippingZoneAction error:", error);
    return { data: null, error: "Không thể tra cứu phí giao hàng" };
  }
}

// getDefaultShippingZoneAction returns the site-wide default zone — used as
// the static value embedded in product-page JSON-LD (not tied to any live
// customer address selection).
export async function getDefaultShippingZoneAction() {
  if (!GO_API_URL) {
    return { data: null, error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/shipping/zones/default`, { cache: "no-store" });
    if (!res.ok) {
      return { data: null, error: null };
    }

    const row = (await res.json()) as GoLookupResponse;
    return { data: mapGoLookup(row), error: null };
  } catch (error) {
    console.error("getDefaultShippingZoneAction error:", error);
    return { data: null, error: null };
  }
}

// setDeliveryProvinceAction remembers a visitor's chosen province + ward
// (from LocationPickerDialog) so ProductGrid/ProductCard can show real
// fee/time site-wide instead of falling back to the nationwide default zone
// every time. ~180 days, not httpOnly — nothing sensitive, and no
// client-side read is needed since Server Components read it directly via
// cookies(). wardCode is optional (a zone can be province-wide).
const DELIVERY_PROVINCE_MAX_AGE = 180 * 24 * 60 * 60;

export async function setDeliveryProvinceAction(provinceCode: string, wardCode?: string) {
  const store = await cookies();
  store.set(DELIVERY_PROVINCE_COOKIE, provinceCode, {
    maxAge: DELIVERY_PROVINCE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  if (wardCode) {
    store.set(DELIVERY_WARD_COOKIE, wardCode, {
      maxAge: DELIVERY_PROVINCE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  } else {
    store.delete(DELIVERY_WARD_COOKIE);
  }
}

// getPersonalizedShippingZoneAction is the one-call helper every product
// grid's Server Component parent should use (ProductListModule,
// ProductDetailModule's related-products section, the /san-pham hub page):
// the visitor's saved province+ward if they've set one, else the
// nationwide default zone. Deliberately NOT what JSON-LD uses — that stays
// on the plain, unpersonalized getDefaultShippingZoneAction (see
// ProductDetailModule.tsx).
export async function getPersonalizedShippingZoneAction() {
  const savedProvinceCode = await getSavedProvinceCode();
  if (!savedProvinceCode) return getDefaultShippingZoneAction();
  const savedWardCode = await getSavedWardCode();
  return lookupShippingZoneAction(savedProvinceCode, savedWardCode || undefined);
}
