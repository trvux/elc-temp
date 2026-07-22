import type { Metadata } from "next";

import { getProductCompareAction } from "@/modules/catalog/presentation/actions";
import { ComparisonTable } from "@/modules/catalog/presentation/components/ComparisonTable";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { TypographyH1 } from "@/shared/components/ui/typography";

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
          <ComparisonTable products={products} />
        )}
      </div>
    </main>
  );
}
