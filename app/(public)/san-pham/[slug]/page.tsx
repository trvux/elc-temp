import type { Metadata } from "next";
import { resolveProductPathFromDb, ResolvedEntity } from "@/modules/catalog/presentation/resolveProductPath";
import { PRODUCT_STATUS, ProductWithRelations } from "@/modules/catalog/domain";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { excerptFromRichText } from "@/shared/lib/rich-text";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SITE_NAME = "Điện máy ELC";

function metadataForEntity(entity: ResolvedEntity, slug: string): Metadata {
  const pageUrl = `${BASE_URL}/san-pham/${slug}`;
  const alternates = { canonical: pageUrl };

  if (!entity) return {};

  if (entity.type === "product") {
    const product = entity.data;
    // Archived products 404 (see the page component below) — no metadata
    // to build, the not-found boundary owns the response from here.
    if (product.status === PRODUCT_STATUS.ARCHIVED) return {};

    const title = product.metaTitle || product.name;
    // Fall back to an excerpt of the product's own body copy rather than
    // leaving the description empty — most products never get a hand-written
    // metaDescription filled in by admin.
    const description = product.metaDescription || excerptFromRichText(product.description);
    const image = primaryImageUrl(product.images);
    return {
      title,
      description,
      alternates,
      openGraph: {
        type: "website",
        title,
        description,
        url: pageUrl,
        images: image ? [{ url: image }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  }

  // group/category/brand — same listing-page metadata shape
  const data = entity.data;
  const title = data.metaTitle || data.name;
  // Same fallback as the product page above: most categories/groups/brands
  // never get a hand-written metaDescription, so fall back to an excerpt
  // of the page's own body copy (heroContent in ProductListModule) rather
  // than shipping an empty <meta description> — was the case for e.g.
  // "Nhà thông minh" until this fix.
  const description = data.metaDescription || excerptFromRichText(data.content);
  const image = entity.type === "brand" ? entity.data.logoUrl : entity.data.imageUrl;
  // Hidden category/group: kept reachable at its URL (e.g. linked from a
  // product's breadcrumb) but not meant to be found/promoted via search —
  // same intent as is_hidden already hiding it from listing sub-nav.
  const isHidden = (entity.type === "category" || entity.type === "group") && entity.data.isHidden;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates,
    ...(isHidden ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      url: pageUrl,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

// A brand/category/group with zero published products right now (e.g. a
// brand admin added before stocking any of its products) is a thin, empty
// results page that would otherwise still ship a full title/description —
// happy to rank and draw a click, then show "Không tìm thấy sản phẩm nào."
// Checked live (not an admin flag like category/group's isHidden, which
// brand doesn't even have) so it self-corrects the moment products are
// added, no admin toggle to remember.
async function hasPublishedProducts(entity: ResolvedEntity): Promise<boolean> {
  if (!entity || entity.type === "product") return true;

  let categoryIds: string[] | undefined;
  let brandIds: string[] | undefined;
  let attributeTokens: Record<string, string[]> | undefined;

  if (entity.type === "brand") {
    brandIds = [entity.data.id];
  } else if (entity.type === "category") {
    categoryIds = [entity.data.id];
  } else if (entity.type === "group") {
    const allCategories = await getCategoriesAction().then(unwrapActionResult);
    categoryIds = allCategories.filter((c) => c.groupId === entity.data.id && !c.isHidden).map((c) => c.id);
  } else if (entity.type === "hp_page") {
    if (entity.data.attributeCode) {
      attributeTokens = { [entity.data.attributeCode]: entity.data.attributeValues };
    }
    if (entity.data.categoryIds.length > 0) categoryIds = entity.data.categoryIds;
    if (entity.data.brandIds.length > 0) brandIds = entity.data.brandIds;
  }

  const { totalCount } = await getProductsAction({
    categoryIds,
    brandIds,
    attributeTokens,
    status: PRODUCT_STATUS.PUBLISHED,
    limit: 1,
  });
  return totalCount > 0;
}

// Filter/search/sort query params make this a distinct view of the same
// listing — canonicalize back to the clean URL + noindex (still follow, so
// crawl budget isn't wasted on the near-infinite filter-combination space)
// per Google's own faceted-navigation guidance, and the decision already
// locked in elc_new_product_model_decided_2026_07_17.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const hasFilterParams = Object.keys(sp).some(
    (key) => key === "search" || key === "min_price" || key === "max_price" || key === "sort_by" || key === "brand_ids" || key.startsWith("attr_"),
  );
  if (hasFilterParams) {
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: `${BASE_URL}/san-pham/${slug}` },
    };
  }

  const resolved = await resolveProductPathFromDb(slug);
  const metadata = metadataForEntity(resolved, slug);

  if (resolved && resolved.type !== "product" && !(await hasPublishedProducts(resolved))) {
    return { ...metadata, robots: { index: false, follow: true } };
  }

  return metadata;
}

export default async function FlatSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const resolved = await resolveProductPathFromDb(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "product") {
    const product = resolved.data as ProductWithRelations;
    // Discontinued: keep the URL, don't render it live forever (matches
    // the "unpublish stays 200 forever" bug fixed for production — see
    // Phần A of the SEO audit). No soft-404 redirect to a shared page —
    // 404 stays at this exact URL.
    if (product.status === PRODUCT_STATUS.ARCHIVED) {
      notFound();
    }
    return <ProductDetailModule product={product} />;
  }

  // If group, category, or brand, render ProductListModule
  return <ProductListModule entity={resolved} searchParams={sp} />;
}
