import { redirect } from "next/navigation";

import { getCurrentUser } from "@/modules/auth/server";
import { authRepo } from "@/modules/auth/infrastructure/authRepo";
import { ProductForm } from "@/modules/catalog";

export default async function NewProductPage() {
  const user = await getCurrentUser(authRepo);
  if (!user) redirect("/admin/login");

  return <ProductForm mode="create" currentUserRole={user.role} />;
}
