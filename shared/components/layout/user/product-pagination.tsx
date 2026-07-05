"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Suspense } from "react";

interface ProductPaginationProps {
  currentPage?: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

const linkBase =
  "min-w-9 h-9 px-3 inline-flex items-center justify-center text-sm rounded-md border transition-colors";

function ProductPaginationContent({
  totalPages,
  buildHref,
}: ProductPaginationProps) {
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1);

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
      className="flex items-center justify-center gap-1.5 pt-6 pb-2"
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

export function ProductPagination(props: ProductPaginationProps) {
  return (
    <Suspense fallback={null}>
      <ProductPaginationContent {...props} />
    </Suspense>
  );
}
