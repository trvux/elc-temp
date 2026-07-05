import { NextRequest, NextResponse } from "next/server";
import { getProductBySlugAction, getProductsAction } from "@/modules/catalog/presentation/actions";
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

interface IndexResult {
  url: string;
  success: boolean;
  status?: number;
  error?: string;
  isQuota?: boolean;
}

async function handleIndexing(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret") || request.headers.get("x-indexing-secret");

    // Authorization check
    const expectedSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.INDEXING_SECRET;
    const isDev = process.env.NODE_ENV === "development";

    if (expectedSecret && secret !== expectedSecret && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get parameters
    const slug = searchParams.get("slug");
    const limit = parseInt(searchParams.get("limit") || "200", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 1. Fetch published products
    let products: { slug: string }[];
    if (slug) {
      const { data } = await getProductBySlugAction(slug);
      products = data ? [{ slug: data.slug }] : [];
    } else {
      const { data, error } = await getProductsAction({ isPublished: true, limit, offset });
      if (error) {
        console.error("Database error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products from database" }, { status: 500 });
      }
      products = data.map((p) => ({ slug: p.slug }));
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ message: "No products found to index", count: 0 });
    }

    // 2. Load Google Credentials
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    let credentials: Record<string, unknown> | undefined;

    if (serviceAccountJson) {
      try {
        credentials = JSON.parse(serviceAccountJson) as Record<string, unknown>;
      } catch (err) {
        console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", err);
      }
    }

    if (!credentials) {
      const keyFilePath = path.join(process.cwd(), "service-account.json");
      if (fs.existsSync(keyFilePath)) {
        try {
          credentials = JSON.parse(fs.readFileSync(keyFilePath, "utf-8")) as Record<string, unknown>;
        } catch (err) {
          console.error("Failed to parse service-account.json:", err);
        }
      }
    }

    if (!credentials) {
      return NextResponse.json(
        { error: "Google Service Account credentials not configured in environment variables or filesystem" },
        { status: 500 }
      );
    }

    // 3. Initialize Google Indexing API
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

    const results: IndexResult[] = [];
    let successCount = 0;
    let failCount = 0;
    let quotaExceeded = false;

    // Process in batches of 5 to avoid API rate limit and timeout
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
        results.push(res);
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < urls.length && !quotaExceeded) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({
      message: quotaExceeded ? "Quota limit exceeded" : "Google indexing submission completed",
      successCount,
      failCount,
      totalRequested: products.length,
      quotaExceeded,
      results,
    });
  } catch (error) {
    const errObj = error as Error;
    console.error("Error in indexing handler:", errObj);
    return NextResponse.json({ error: errObj.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleIndexing(request);
}

export async function POST(request: NextRequest) {
  return handleIndexing(request);
}
