"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../application";
import { BrandFilter, CreateBrandInput, UpdateBrandInput } from "../domain";

export async function getBrandsAction(options?: BrandFilter) {
  try {
    const data = await getBrands(options);
    return { data, error: null };
  } catch (error) {
    console.error("getBrandsAction error:", error);
    return { data: [], error: "Không thể tải danh sách thương hiệu" };
  }
}

export async function getBrandByIdAction(id: string) {
  try {
    const data = await getBrandById(id);
    return { data, error: null };
  } catch (error) {
    console.error("getBrandByIdAction error:", error);
    return { data: null, error: "Không thể tải thông tin thương hiệu" };
  }
}

export async function createBrandAction(input: CreateBrandInput) {
  try {
    const data = await createBrand(input);
    revalidatePath("/admin/brands");
    revalidateTag("layout", { expire: 0 });
    return { data, error: null };
  } catch (error) {
    console.error("createBrandAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể tạo thương hiệu",
    };
  }
}

export async function updateBrandAction(input: UpdateBrandInput) {
  try {
    const data = await updateBrand(input);
    revalidatePath("/admin/brands");
    revalidateTag("layout", { expire: 0 });
    return { data, error: null };
  } catch (error) {
    console.error("updateBrandAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Không thể cập nhật thương hiệu",
    };
  }
}

export async function deleteBrandAction(id: string) {
  try {
    await deleteBrand(id);
    revalidatePath("/admin/brands");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteBrandAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa thương hiệu",
    };
  }
}

