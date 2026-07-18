import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/modules/auth/server";
import { authRepo } from "@/modules/auth/infrastructure/authRepo";
import { ProductForm, getProductByIdAction } from "@/modules/catalog";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(authRepo);
  if (!user) redirect("/admin/login");

  const { id } = await params;
  const { data: product } = await getProductByIdAction(id);
  if (!product) notFound();

  return <ProductForm mode="edit" product={product} currentUserRole={user.role} />;
}
