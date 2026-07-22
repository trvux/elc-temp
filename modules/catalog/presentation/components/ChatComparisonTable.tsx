import Image from "next/image";
import Link from "next/link";

import {
  formatAttributeValue,
  resolveProductDisplayPrice,
  type ProductWithRelations,
} from "@/modules/catalog/domain";
import {
  applicableCriteria,
  type CriterionRanking,
} from "@/modules/catalog/presentation/components/comparison-criteria";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import { Badge } from "@/shared/components/ui/badge";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { cn } from "@/shared/lib/utils";

// Chat-specific comparison view — deliberately NOT the same component as
// the standalone /san-pham/so-sanh page's ComparisonTable. That page's
// table is a full spec sheet built to fill a whole desktop page; dropped
// as-is into the chat's ~700px-wide column (the first version of this
// feature did exactly that) it read as an unreadable wall of ~20 mostly-
// identical rows, most columns cut off requiring horizontal scroll just to
// see one more product, and — a real contrast bug, not just a density
// one — every value cell inherited near-invisible text color against the
// panel's black backdrop, since the shared TableCell sets no explicit
// color (shared/components/ui/table.tsx). Same class of bug already fixed
// twice elsewhere in ProductChatFinder.tsx (BubbleContent, InputGroupInput)
// by pinning color explicitly instead of trusting inheritance — fixed the
// same way here.
//
// The redesign: (1) only rows where the products actually *differ* —
// a spec every product shares doesn't help anyone decide, it's just
// noise to scroll past; (2) a compact header card per product (thumbnail
// + name + price) instead of the full-page version's larger one; (3) the
// spec-name column stays pinned while product columns scroll, so a value
// is never seen disconnected from what it's a value *of*; (4) a link out
// to the full so-sanh page for whoever wants the complete spec sheet
// anyway; (5) suggestion chips offering the handful of criteria
// (applicableCriteria — price, energy efficiency, power draw) that
// actually have an objective "better" direction, so "which one's better?"
// gets answered per concrete criterion (see ProductChatFinder's "rank"
// turn) instead of either a fabricated overall winner or no answer at all.
export function ChatComparisonTable({
  products,
  onPick,
}: {
  products: ProductWithRelations[];
  onPick: (prompt: string) => void;
}) {
  const rows = buildDiffRows(products);
  const criteria = applicableCriteria(products);
  const compareUrl = `/san-pham/so-sanh?ids=${products.map((p) => p.id).join(",")}`;

  return (
    <div className="flex w-full flex-col gap-1 rounded-lg border border-white/10 bg-neutral-900">
      <div className="overflow-x-auto rounded-t-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {/* Sticky first column shares the wrapper's own bg-neutral-900
                  (opaque, not a translucent white/N overlay) so it can sit
                  on top of the scrolling product columns with no visible
                  seam where it overlaps them. */}
              <th className="sticky left-0 z-10 w-24 shrink-0 bg-neutral-900 p-2 text-left align-bottom text-xs font-medium text-muted-foreground">
                So sánh
              </th>
              {products.map((product) => {
                const imageUrl = primaryImageUrl(product.images);
                return (
                  <th key={product.id} className="w-28 min-w-28 p-2 align-top font-normal">
                    <Link
                      href={`/san-pham/${product.slug}`}
                      prefetch={false}
                      className="flex flex-col items-center gap-1 text-center hover:opacity-80"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-white">
                        {imageUrl && (
                          <Image
                            src={imageUrl}
                            alt={product.images[0]?.alt || product.name}
                            fill
                            sizes="56px"
                            className="object-contain p-1"
                          />
                        )}
                      </div>
                      <span className="line-clamp-2 text-xs leading-snug font-semibold text-foreground">
                        {product.name}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        <FormattedPrice price={resolveProductDisplayPrice(product)} />
                      </span>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={products.length + 1} className="p-3 text-center text-xs text-muted-foreground">
                  Các sản phẩm này gần như giống hệt nhau về thông số.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.code} className="border-b border-white/5 last:border-0">
                  <td className="sticky left-0 z-10 bg-neutral-900 p-2 align-top text-xs text-muted-foreground">
                    {row.name}
                  </td>
                  {row.values.map((value, i) => (
                    <td key={products[i].id} className="p-2 text-center align-top text-xs font-medium text-foreground">
                      {value}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {criteria.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-2 pb-1">
          {criteria.map((criterion) => (
            <Badge
              key={criterion.key}
              asChild
              variant="secondary"
              className="h-auto cursor-pointer px-2.5 py-1 text-xs"
            >
              <button type="button" onClick={() => onPick(criterion.question)}>
                {criterion.question}
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Link
        href={compareUrl}
        prefetch={false}
        className="self-start px-2 pb-2 text-xs text-primary underline-offset-2 hover:underline"
      >
        Xem đầy đủ thông số kỹ thuật →
      </Link>
    </div>
  );
}

// Answers a criterion follow-up ("loại nào rẻ nhất?") picked either from
// ChatComparisonTable's own suggestion chips or typed free-hand and caught
// by matchCriterionFollowUp — see ProductChatFinder's "rank" turn kind.
// Ordered best-first (rankByCriterion); the #1 spot gets a filled badge,
// everyone else a plain rank number, since — unlike the diff table above —
// this is exactly the one place a "winner" is legitimate to call out: the
// criterion itself was picked by the shopper, and its direction
// (higher/lower is better) is objective fact, not a judgment this
// component is making on its own.
export function CriterionRankingAnswer({ ranking }: { ranking: CriterionRanking }) {
  const { criterion, ranked } = ranking;

  return (
    <div className="flex w-fit max-w-full flex-col gap-2 rounded-lg border border-white/10 bg-neutral-900 p-3">
      <span className="text-xs font-medium text-muted-foreground">
        Xếp hạng theo {criterion.label.toLowerCase()}
      </span>
      <div className="flex flex-col gap-1">
        {ranked.map(({ product, formatted }, index) => (
          <Link
            key={product.id}
            href={`/san-pham/${product.slug}`}
            prefetch={false}
            className="group flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-white/5"
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                index === 0 ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span className="line-clamp-1 flex-1 text-xs text-foreground/90">{product.name}</span>
            <span className="shrink-0 text-xs font-semibold text-foreground">{formatted}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Rows = the union of every attribute code across the compared products
// (same sparse-fill convention as the full page's buildComparisonRows),
// but filtered down to only the ones whose formatted value isn't
// identical across every product — the entire point of this redesign (see
// doc comment above).
function buildDiffRows(products: ProductWithRelations[]) {
  const seenCodes = new Set<string>();
  const rows: { code: string; name: string; values: string[] }[] = [];

  for (const product of products) {
    for (const av of product.attributeValues || []) {
      if (seenCodes.has(av.code)) continue;
      seenCodes.add(av.code);

      const values = products.map((p) => {
        const match = (p.attributeValues || []).find((v) => v.code === av.code);
        return match ? formatAttributeValue(match) : "—";
      });
      if (values.every((v) => v === values[0])) continue;

      rows.push({ code: av.code, name: av.name, values });
    }
  }

  return rows;
}
