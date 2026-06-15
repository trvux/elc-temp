"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  createBrand,
  getBrands,
} from "../../brand";
import { brandRepo } from "../../brand/infrastructure/brandRepo";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../application/index";
import {
  CreateBrandInput,
} from "../../brand";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../domain/index";
import { productRepo } from "../infrastructure/SupabaseProductRepository";

export async function getBrandsAction() {
  try {
    const data = await getBrands(brandRepo);
    return { data, error: null };
  } catch (error) {
    console.error("getBrandsAction error:", error);
    return { data: [], error: "Failed to fetch brands" };
  }
}

export async function createBrandAction(input: CreateBrandInput) {
  try {
    const data = await createBrand(brandRepo, input);
    revalidatePath("/admin/brands");
    return { data, error: null };
  } catch (error) {
    console.error("createBrandAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create brand",
    };
  }
}

export async function getProductsAction(options?: {
  categoryId?: string;
  brandId?: string;
  isPublished?: boolean;
}) {
  try {
    const data = await getProducts(productRepo, options);
    return { data, error: null };
  } catch (error) {
    console.error("getProductsAction error:", error);
    return { data: [], error: "Failed to fetch products" };
  }
}

export async function createProductAction(input: CreateProductInput) {
  try {
    const data = await createProduct(productRepo, input);
    revalidatePath("/admin/products");
    revalidatePath("/san-pham", "layout");
    revalidatePath("/", "layout");
    revalidateTag("products-list", { expire: 0 });
    if (data?.slug) {
      revalidateTag(`slug:${data.slug}`, { expire: 0 });
    }
    return { data, error: null };
  } catch (error) {
    console.error("createProductAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProductAction(input: UpdateProductInput) {
  try {
    const data = await updateProduct(productRepo, input);
    revalidatePath("/admin/products");
    revalidatePath("/san-pham", "layout");
    revalidatePath("/", "layout");
    revalidateTag("products-list", { expire: 0 });
    if (data?.slug) {
      revalidateTag(`slug:${data.slug}`, { expire: 0 });
    }
    return { data, error: null };
  } catch (error) {
    console.error("updateProductAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const product = await productRepo.getById(id);
    await deleteProduct(productRepo, id);
    revalidatePath("/admin/products");
    revalidatePath("/san-pham", "layout");
    revalidatePath("/", "layout");
    revalidateTag("products-list", { expire: 0 });
    if (product?.slug) {
      revalidateTag(`slug:${product.slug}`, { expire: 0 });
    }
    return { data: true, error: null };
  } catch (error) {
    console.error("deleteProductAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}
