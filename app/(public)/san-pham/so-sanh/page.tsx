import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { getProductCompareAction } from "@/modules/catalog/presentation/actions";
import { AttributeValue, formatAttributeValue, resolveProductDisplayPrice } from "@/modules/catalog/domain";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { TypographyH1, TypographyH2 } from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";

export const metadata: Metadata = {
  title: "So sánh sản phẩm | Điện máy ELC",
  robots: { index: false }, // a comparison URL is a transient utility view, not content worth indexing
};

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam || "").split(",").map((id) => id.trim()).filter(Boolean);

  const { data: products, error } = await getProductCompareAction(ids);

  return (
    <main className="w-full bg-background min-h-screen">
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-350 mx-auto">
        <Breadcrumbs items={[{ label: "Sản phẩm", href: "/san-pham" }, { label: "So sánh sản phẩm", active: true }]} />
        <TypographyH1>So sánh sản phẩm</TypographyH1>

        {error || products.length < 2 ? (
          <p className="text-muted-foreground py-12 text-center">
            {error || "Cần chọn ít nhất 2 sản phẩm cùng danh mục để so sánh."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Sản phẩm</TableHead>
                  {products.map((product) => (
                    <TableHead key={product.id} className="min-w-56">
                      <Link href={`/san-pham/${product.slug}`} className="flex flex-col items-center gap-2 py-2 hover:opacity-80">
                        <div className="w-24 h-24 bg-white rounded-md overflow-hidden">
                          {primaryImageUrl(product.images) && (
                            <Image
                              src={primaryImageUrl(product.images)}
                              alt={product.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-center text-foreground line-clamp-2">
                          {product.name}
                        </span>
                        <span className="text-sm font-bold text-destructive">
                          <FormattedPrice price={resolveProductDisplayPrice(product)} />
                        </span>
                      </Link>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildComparisonRows(products).map((group) => (
                  <Fragment key={group.label ?? "__chung__"}>
                    {group.label && (
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={products.length + 1}>
                          <TypographyH2 className="text-sm font-semibold">{group.label}</TypographyH2>
                        </TableCell>
                      </TableRow>
                    )}
                    {group.rows.map((row) => {
                      const values = products.map((product) => {
                        const av = (product.attributeValues || []).find((v) => v.code === row.code);
                        return av ? formatAttributeValue(av) : "—";
                      });

                      // No "bigger number = highlighted" heuristic here: a
                      // higher spec isn't always the better one (e.g. more
                      // power draw is worse, more BTU is better), and we
                      // don't have per-attribute directionality data to make
                      // that call correctly — so every value renders plain.
                      return (
                        <TableRow key={row.code}>
                          <TableCell className="text-muted-foreground font-medium">{row.name}</TableCell>
                          {values.map((value, i) => (
                            <TableCell key={products[i].id} className="text-center">
                              {value}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </main>
  );
}

// Rows = the union of every attribute code across the selected products
// (sparse fill is normal — not every product has every spec), grouped by
// groupLabel and ordered by first appearance, same convention as the
// product detail page's own spec tab.
function buildComparisonRows(products: { attributeValues?: AttributeValue[] }[]) {
  const groups: { label: string | null; rows: { code: string; name: string }[] }[] = [];
  const seenCodes = new Set<string>();

  for (const product of products) {
    for (const av of product.attributeValues || []) {
      if (seenCodes.has(av.code)) continue;
      seenCodes.add(av.code);

      let group = groups.find((g) => g.label === (av.groupLabel ?? null));
      if (!group) {
        group = { label: av.groupLabel ?? null, rows: [] };
        groups.push(group);
      }
      group.rows.push({ code: av.code, name: av.name });
    }
  }

  return groups;
}
