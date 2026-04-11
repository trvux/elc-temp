import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import Fuse from "fuse.js";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ProductPagination } from "@/components/user/product-pagination";
import { ProductSearch } from "@/components/user/product-search";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Strip Vietnamese diacritics → "Máy lạnh Inverter" → "may lanh inverter"
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

// Split normalized string into individual tokens (strip all non-alphanumeric)
// "may lanh 1hp – inverter" → ["may", "lanh", "1hp", "inverter"]
// Fuse.js indexes each token separately → no distance penalty for end-of-string words
function tokenize(str: string): string[] {
  return normalize(str)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

// Strip Telex IME artifacts from a single normalized word before fuzzy matching.
// Vietnamese Telex encodes tone marks as trailing letters and vowel modifiers as 'w':
//   "tuongwf" = t+u+o+ow(=ươ)+ng+f(=huyền) → intended "tường" → normalized token "tuong"
//   "chieuf"  = chieu + f(=huyền)           → intended "chiều" → normalized token "chieu"
// Rules applied (only when word contains a vowel — SKU/numeric codes are left untouched):
//   1. Strip terminal f / j / x  (huyền / nặng / ngã tones — never end real product words)
//   2. Replace <vowel>w → <vowel>  (Telex vowel modifier: ow→ơ, aw→ă, uw→ư)
// Not stripping s / r / z to avoid breaking real words like "inverter", "specs".
function cleanTelex(word: string): string {
  if (!/[aeiou]/.test(word)) return word;
  return word.replace(/[fjx]$/, "").replace(/([aeiou])w/g, "$1");
}

// Flatten specs JSON into a single searchable string of values + units.
// Excludes labels to keep noise low — only the numbers and units matter for spec search.
// e.g. [{ items: [{ value: "9000", unit: "BTU" }] }] → "9000 BTU"
function flattenSpecs(specs: unknown): string {
  if (!Array.isArray(specs)) return "";
  return (specs as any[])
    .flatMap((s) => {
      if (Array.isArray(s.items)) {
        return s.items.flatMap((i: any) => [i.value ?? "", i.unit ?? ""]);
      }
      return [s.value ?? ""];
    })
    .join(" ");
}

// Split a single query token on digit↔letter boundaries so combined inputs work:
//   "9000btu"  → ["9000", "btu"]
//   "242mm"    → ["242",  "mm"]
//   "1hp"      → ["1",    "hp"]
//   "daikin"   → ["daikin"]       (no boundary)
// Applied after cleanTelex so the query tokenizer mirrors how specs are indexed.
function splitDigitLetter(token: string): string[] {
  return token.split(/(?<=\d)(?=[a-z])|(?<=[a-z])(?=\d)/);
}

// Effective price: use sale_price when available, otherwise original_price
function effectivePrice(p: {
  sale_price: number | null;
  original_price: number;
}): number {
  return p.sale_price ?? p.original_price;
}

// Highlight words in `text` that match any queryToken.
// Splits on whitespace, normalizes each word, checks start-with or exact match.
// Fuzzy typo matches are returned by Fuse but not highlighted (acceptable UX).
function HighlightedText({
  text,
  queryTokens,
}: {
  text: string;
  queryTokens: string[];
}) {
  if (!queryTokens.length) return <>{text}</>;

  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) => {
        if (!part.trim()) return <span key={i}>{part}</span>;
        const wordTokens = tokenize(part);
        const isMatch = wordTokens.some((wt) =>
          queryTokens.some(
            (qt) => wt === qt || wt.startsWith(qt) || qt.startsWith(wt),
          ),
        );
        return isMatch ? (
          <mark
            key={i}
            className="bg-primary/15 text-primary not-italic  px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

export default async function ProductsHub({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const categorySlug =
    typeof params.category === "string" ? params.category : "";
  // Price params stored in raw VND, UI shows in triệu (÷ 1_000_000)
  const minPrice =
    typeof params.minPrice === "string" && params.minPrice
      ? Number(params.minPrice)
      : null;
  const maxPrice =
    typeof params.maxPrice === "string" && params.maxPrice
      ? Number(params.maxPrice)
      : null;
  const currentPage = Number(params.page) || 1;
  const pageSize = 12;

  const supabase = await createClient();

  // Fetch categories for filter UI + slug → id resolution
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("type", "product");

  const allCategories = categories || [];

  // Resolve categorySlug → affected IDs (parent includes all children)
  let categoryIds: string[] = [];
  if (categorySlug) {
    const matched = allCategories.find((c) => c.slug === categorySlug);
    if (matched) {
      categoryIds = [matched.id];
      const children = allCategories.filter((c) => c.parent_id === matched.id);
      categoryIds.push(...children.map((c) => c.id));
    }
  }

  // Computed once at page level — used for both Fuse search and keyword highlighting
  const queryTokens = q
    ? normalize(q)
        .split(/\s+/)
        .map(cleanTelex)
        .flatMap(splitDigitLetter)
        .filter((t) => t.length >= 2)
    : [];

  let products: any[] = [];
  let totalCount = 0;
  let totalPages = 0;

  if (q) {
    // ── FUZZY PATH ──────────────────────────────────────────────────────────
    // Fetch all published products — include specs for spec-based search
    let fetchQuery = supabase
      .from("products")
      .select(
        "id, name, sku, slug, specs, category_id, images, original_price, sale_price, discount_percent, order_index, categories(name, slug)",
      )
      .eq("is_published", true);

    if (categoryIds.length > 0) {
      fetchQuery = fetchQuery.in("category_id", categoryIds);
    }

    const { data: allProducts } = await fetchQuery.order("order_index");
    const pool = allProducts || [];

    // Index each field as individual tokens so Fuse matches per-word, not
    // against the full string — fixes distance penalty for end-of-string words.
    // specs has lower weight: name/sku matches take priority over spec matches.
    const fuse = new Fuse(pool, {
      keys: [
        { name: "name", getFn: (p) => tokenize(p.name ?? ""), weight: 0.65 },
        { name: "sku", getFn: (p) => tokenize(p.sku ?? ""), weight: 0.25 },
        {
          name: "specs",
          getFn: (p) => tokenize(flattenSpecs(p.specs)),
          weight: 0.1,
        },
      ],
      threshold: 0.35,
      minMatchCharLength: 2,
      includeScore: true,
    });

    let matched: typeof pool;

    if (queryTokens.length === 0) {
      matched = [];
    } else if (queryTokens.length === 1) {
      matched = fuse.search(queryTokens[0]).map((r) => r.item);
    } else {
      // Run Fuse once per query token, intersect result sets (AND semantics)
      const resultSets = queryTokens.map(
        (token) => new Set(fuse.search(token).map((r) => r.item.id)),
      );
      matched = pool.filter((p) => resultSets.every((set) => set.has(p.id)));
    }

    // Apply price filter on effective price (sale_price ?? original_price)
    if (minPrice !== null) {
      matched = matched.filter((p) => effectivePrice(p) >= minPrice);
    }
    if (maxPrice !== null) {
      matched = matched.filter((p) => effectivePrice(p) <= maxPrice);
    }

    totalCount = matched.length;
    totalPages = Math.ceil(totalCount / pageSize);
    products = matched.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );
  } else {
    // ── NORMAL PATH ─────────────────────────────────────────────────────────
    let dbQuery = supabase
      .from("products")
      .select("*, categories(name, slug)", { count: "exact" })
      .eq("is_published", true);

    if (categoryIds.length > 0) {
      dbQuery = dbQuery.in("category_id", categoryIds);
    }

    // Price filter: effective price = sale_price when not null, else original_price
    // Uses OR to handle both cases at the DB level
    if (minPrice !== null && maxPrice !== null) {
      dbQuery = dbQuery.or(
        `and(sale_price.gte.${minPrice},sale_price.lte.${maxPrice}),` +
          `and(sale_price.is.null,original_price.gte.${minPrice},original_price.lte.${maxPrice})`,
      );
    } else if (minPrice !== null) {
      dbQuery = dbQuery.or(
        `sale_price.gte.${minPrice},` +
          `and(sale_price.is.null,original_price.gte.${minPrice})`,
      );
    } else if (maxPrice !== null) {
      dbQuery = dbQuery.or(
        `sale_price.lte.${maxPrice},` +
          `and(sale_price.is.null,original_price.lte.${maxPrice})`,
      );
    }

    const { data: allProducts, count } = await dbQuery
      .order("order_index")
      .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    products = allProducts || [];
    totalCount = count || 0;
    totalPages = Math.ceil(totalCount / pageSize);
  }

  const isSearchActive =
    !!q || !!categorySlug || minPrice !== null || maxPrice !== null;

  return (
    <main className="w-full pt-24 pb-24">
      <div className="mx-auto w-full px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <header className="py-16 flex flex-col items-center text-center gap-3">
          <h1 className="font-newsreader text-4xl md:text-5xl lg:text-6xl italic leading-tight">
            Giải pháp thông minh
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-medium">
            {isSearchActive
              ? `${totalCount} kết quả tìm kiếm`
              : `${totalCount} giải pháp chuyên nghiệp`}
          </p>
        </header>

        {/* Search + Filter */}
        <div className="mb-10">
          <Suspense fallback={null}>
            <ProductSearch categories={allCategories} />
          </Suspense>
        </div>

        {/* Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/san-pham/${product.categories?.slug ? product.categories.slug + "/" : ""}${product.slug}`}
                className="group flex flex-col"
              >
                {/* Ảnh */}
                <div className="w-full overflow-hidden bg-background rounded-lg">
                  <AspectRatio ratio={4 / 3}>
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain p-3 transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        priority={index === 0}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs tracking-widest uppercase">
                        Chưa có ảnh
                      </div>
                    )}
                  </AspectRatio>
                </div>

                {/* Info */}
                <div className="mt-4 flex flex-col gap-1.5">
                  <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:underline underline-offset-4">
                    <HighlightedText
                      text={product.name}
                      queryTokens={queryTokens}
                    />
                  </h3>
                  {product.sku && (
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      <HighlightedText
                        text={product.sku}
                        queryTokens={queryTokens}
                      />
                    </span>
                  )}
                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className="text-base md:text-lg font-bold tracking-tight">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.sale_price || product.original_price)}
                    </span>
                    {product.discount_percent > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-md text-muted-foreground line-through">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(product.original_price)}
                        </span>
                        <span className="text-xs font-bold bg-foreground text-background px-1.5 py-0.5 rounded-sm">
                          -{product.discount_percent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-muted-foreground/60 italic text-sm">
              {isSearchActive
                ? "Không tìm thấy sản phẩm phù hợp."
                : "Hiện chưa có sản phẩm nào."}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-16">
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchQuery={q || undefined}
              categorySlug={categorySlug || undefined}
              minPrice={minPrice ?? undefined}
              maxPrice={maxPrice ?? undefined}
            />
          </div>
        )}
      </div>
    </main>
  );
}
