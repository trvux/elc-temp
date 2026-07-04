"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../application/index";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../domain/index";
import { productRepo } from "../infrastructure/SupabaseProductRepository";
import { submitToIndexNow } from "@/shared/lib/indexnow";
import { submitToGoogleIndex } from "@/shared/lib/google-indexing";
import { google } from "googleapis";
import { createStaticClient } from "@/shared/lib/supabase/static";

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
    if (data?.isPublished && data?.slug) {
      const url = `https://dienmayelc.com.vn/san-pham/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow product create error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing product create error:", err));
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
    if (data?.isPublished && data?.slug) {
      const url = `https://dienmayelc.com.vn/san-pham/${data.slug}`;
      submitToIndexNow([url]).catch((err) => console.error("IndexNow product update error:", err));
      submitToGoogleIndex([url]).catch((err) => console.error("Google Indexing product update error:", err));
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
      submitToGoogleIndex([`https://dienmayelc.com.vn/san-pham/${product.slug}`], "URL_DELETED")
        .catch((err) => console.error("Google Indexing product delete error:", err));
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

export async function triggerGoogleIndexingAction() {
  try {
    const supabase = createStaticClient();
    const { data: products, error: dbError } = await supabase
      .from("products")
      .select("slug")
      .eq("is_published", true)
      .is("deleted_at", null);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!products || products.length === 0) {
      return { success: true, message: "No products found to index", successCount: 0, failCount: 0 };
    }

    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured in environment variables");
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });

    const indexing = google.indexing({
      version: "v3",
      auth: auth,
    });

    const BASE_URL = "https://dienmayelc.com.vn";
    const urls = products.map((p) => `${BASE_URL}/san-pham/${p.slug}`);

    let successCount = 0;
    let failCount = 0;
    let quotaExceeded = false;

    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      if (quotaExceeded) break;

      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(async (url) => {
        try {
          const response = await indexing.urlNotifications.publish({
            requestBody: {
              url,
              type: "URL_UPDATED",
            },
          });
          return { url, success: true, status: response.status || 200 };
        } catch (err) {
          const errorObj = err as { status?: number; message?: string };
          const status = errorObj.status || 500;
          const message = errorObj.message || "Unknown error";
          const isQuota =
            status === 429 ||
            message.includes("quotaExceeded") ||
            message.includes("Quota exceeded") ||
            message.includes("limitExceeded");

          return {
            url,
            success: false,
            status,
            error: message,
            isQuota,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        if (res.success) {
          successCount++;
        } else {
          failCount++;
          if (res.isQuota) {
            quotaExceeded = true;
          }
        }
      }

      if (i + batchSize < urls.length && !quotaExceeded) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return {
      success: true,
      successCount,
      failCount,
      quotaExceeded,
    };
  } catch (error) {
    console.error("triggerGoogleIndexingAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to run Google Indexing",
    };
  }
}
