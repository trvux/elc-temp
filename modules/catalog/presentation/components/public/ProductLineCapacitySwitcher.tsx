import Link from "next/link";
import {
  ProductWithRelations,
  formatPrice,
  resolveDefaultVariant,
  resolveProductDisplayPrice,
} from "@/modules/catalog/domain";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { Button } from "@/shared/components/ui/button";
import { TypographySmall } from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";

// mpnPrefix strips the leading digits+trailing suffix off an MPN (e.g.
// "FTKB25ZVMV" -> "FTKB") — used to tell apart sibling model families that
// share the same product_line (tier) but aren't actually the same physical
// unit at a different capacity (e.g. Daikin's FTKB "một chiều" tier and
// FTHB "hai chiều" tier are both tagged product_line=FTKB by mpn-prefix
// matching, but must not be shown interchangeably here).
function mpnPrefix(mpn: string): string {
  return mpn.replace(/[0-9].*$/, "");
}

function extractCapacityLabel(name: string): string {
  const match = name.match(/(\d+(\.\d+)?)\s*HP/i);
  return match ? `${match[1]}HP` : name;
}

// Mirrors the "1HP / 1.5HP / 2HP / 2.5HP" cross-links Daikin's own
// e-commerce site uses (shop.daikin.com.vn) — each capacity is a genuinely
// separate Product (own slug/mpn/price), not a variant, so switching
// capacity means navigating to a different product page entirely. Powered
// by the existing product_line grouping (see modules/product-line) — no new
// data needed, every product already has product_line_id assigned by mpn
// prefix.
export async function ProductLineCapacitySwitcher({ product }: { product: ProductWithRelations }) {
  if (!product.productLineId) return null;

  const { data: siblings } = await getProductsAction({
    productLineId: product.productLineId,
    isPublished: true,
    limit: 30,
  });

  const currentVariant = resolveDefaultVariant(product);
  const currentPrefix = currentVariant ? mpnPrefix(currentVariant.mpn) : null;
  if (!currentPrefix) return null;

  const sameFamily = siblings
    .filter((p) => {
      const v = resolveDefaultVariant(p);
      return v && mpnPrefix(v.mpn) === currentPrefix;
    })
    .sort((a, b) => resolveProductDisplayPrice(a) - resolveProductDisplayPrice(b));

  if (sameFamily.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <TypographySmall className="text-muted-foreground">Chọn công suất khác</TypographySmall>
      <div className="flex flex-wrap gap-2">
        {sameFamily.map((p) => {
          const isCurrent = p.id === product.id;
          return (
            <Button
              key={p.id}
              asChild
              type="button"
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              className={cn("h-auto flex-col items-start gap-0.5 py-1.5 px-3")}
            >
              <Link href={`/san-pham/${p.slug}`} prefetch={false}>
                <span className="font-semibold">{extractCapacityLabel(p.name)}</span>
                <span className="text-xs font-normal opacity-80">
                  {formatPrice(resolveProductDisplayPrice(p))}
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
