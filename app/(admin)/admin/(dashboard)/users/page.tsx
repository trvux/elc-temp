import { redirect } from "next/navigation";

import { getCurrentUser } from "@/modules/auth/server";
import { authRepo } from "@/modules/auth/infrastructure/authRepo";
import { UsersManagement } from "@/modules/admin-users";

export default async function UsersPage() {
  const user = await getCurrentUser(authRepo);
  if (!user) redirect("/login");
  if (user.role === "user") redirect("/admin");

  return <UsersManagement currentUserId={user.id} />;
}
