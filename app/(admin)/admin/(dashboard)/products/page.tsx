import { redirect } from "next/navigation";

import { getCurrentUser } from "@/modules/auth/server";
import { authRepo } from "@/modules/auth/infrastructure/authRepo";
import { ProductManagement } from "@/modules/catalog";

export default async function ProductsPage() {
  const user = await getCurrentUser(authRepo);
  if (!user) redirect("/admin/login");

  return <ProductManagement currentUserRole={user.role} />;
}
