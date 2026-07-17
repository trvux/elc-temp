import { resolveProductPathFromDb } from "@/modules/catalog/presentation/resolveProductPath";
import { ProductWithRelations } from "@/modules/catalog/domain";
import { ProductDetailModule } from "@/modules/catalog/presentation/components/public/ProductDetailModule";
import { ProductListModule } from "@/modules/catalog/presentation/components/public/ProductListModule";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function FlatSlugPage({ params }: Props) {
  const { slug } = await params;

  const resolved = await resolveProductPathFromDb(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "product") {
    return (
      <ProductDetailModule product={resolved.data as ProductWithRelations} />
    );
  }

  // If group, category, or brand, render ProductListModule
  return <ProductListModule entity={resolved} />;
}
