import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

const linkBase =
  "min-w-9 h-9 px-3 inline-flex items-center justify-center text-sm rounded-md border transition-colors";

/**
 * Real crawlable pagination — every page is a plain `<Link href>`, so search/AI
 * crawlers that don't execute JS can reach the full catalog regardless of size.
 * `InfiniteProductGrid` layers scroll-to-load on top of whichever page loaded, and
 * for a scrolling JS user it always loads the next batch before they'd ever reach
 * this nav — so it's `sr-only` by default (present for crawlers + screen readers,
 * invisible to sighted mouse/touch use) and only reveals if a keyboard user tabs
 * into it, same pattern as a skip-to-content link. Not `display:none` / removed
 * from the DOM — it's a real, always-present navigational aid, just visually quiet.
 */
export function ProductPagination({
  currentPage,
  totalPages,
  buildHref,
}: ProductPaginationProps) {
  if (totalPages <= 1) return null;

  const pageSet = new Set<number>([1, totalPages]);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= totalPages) pageSet.add(p);
  }
  const pages = Array.from(pageSet).sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  let prevPage = 0;
  for (const p of pages) {
    if (prevPage && p - prevPage > 1) items.push("ellipsis");
    items.push(p);
    prevPage = p;
  }

  return (
    <nav
      aria-label="Phân trang sản phẩm"
      className="sr-only focus-within:not-sr-only flex items-center justify-center gap-1.5 pt-6 focus-within:pb-2"
    >
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        tabIndex={currentPage <= 1 ? -1 : undefined}
        prefetch={false}
        className={cn(
          linkBase,
          currentPage <= 1
            ? "pointer-events-none opacity-40 border-border/40 text-muted-foreground"
            : "border-border/60 hover:bg-accent text-foreground",
        )}
      >
        Trước
      </Link>

      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-current={item === currentPage ? "page" : undefined}
            prefetch={false}
            className={cn(
              linkBase,
              item === currentPage
                ? "border-foreground bg-foreground text-background font-medium"
                : "border-border/60 hover:bg-accent text-foreground",
            )}
          >
            {item}
          </Link>
        ),
      )}

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        tabIndex={currentPage >= totalPages ? -1 : undefined}
        prefetch={false}
        className={cn(
          linkBase,
          currentPage >= totalPages
            ? "pointer-events-none opacity-40 border-border/40 text-muted-foreground"
            : "border-border/60 hover:bg-accent text-foreground",
        )}
      >
        Sau
      </Link>
    </nav>
  );
}
