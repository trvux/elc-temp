import Image from "next/image";
import Link from "next/link";

import {
  AttributeValue,
  formatAttributeValue,
  resolveProductDisplayPrice,
  type ProductWithRelations,
} from "@/modules/catalog/domain";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { primaryImageUrl } from "@/shared/lib/image-asset";

// Extracted out of the standalone /san-pham/so-sanh page so a fix/change
// to how comparisons render lives in one place.
export function ComparisonTable({ products }: { products: ProductWithRelations[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table aria-label="So sánh thông số kỹ thuật các sản phẩm đã chọn">
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-48 type-label">Sản phẩm</TableHead>
            {products.map((product) => (
              <TableHead key={product.id} scope="col" className="min-w-56">
                <Link href={`/san-pham/${product.slug}`} className="flex flex-col items-center gap-2 py-2 hover:opacity-80">
                  <div className="w-24 h-24 bg-white rounded-md overflow-hidden">
                    {primaryImageUrl(product.images) && (
                      <Image
                        src={primaryImageUrl(product.images)}
                        alt=""
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <span className="type-label text-center text-foreground line-clamp-2">
                    {product.name}
                  </span>
                  <span className="type-label text-destructive">
                    <FormattedPrice price={resolveProductDisplayPrice(product)} />
                  </span>
                </Link>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
          {buildComparisonRows(products).map((group) => (
            <TableBody key={group.label ?? "__chung__"}>
              {group.label && (
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead scope="rowgroup" colSpan={products.length + 1} className="type-label">
                    {group.label}
                  </TableHead>
                </TableRow>
              )}
              {group.rows.map((row) => {
                const values = products.map((product) => {
                  const av = (product.attributeValues || []).find((v) => v.code === row.code);
                  return av ? formatAttributeValue(av) : null;
                });

                // No "bigger number = highlighted" heuristic here: a
                // higher spec isn't always the better one (e.g. more
                // power draw is worse, more BTU is better), and we
                // don't have per-attribute directionality data to make
                // that call correctly — so every value renders plain.
                return (
                  <TableRow key={row.code}>
                    <TableHead scope="row" className="type-caption text-muted-foreground">{row.name}</TableHead>
                    {values.map((value, i) => (
                      <TableCell key={products[i].id} className="text-center">
                        {value ?? (
                          <span role="img" aria-label="Không có thông tin">
                            —
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          ))}
      </Table>
    </div>
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
