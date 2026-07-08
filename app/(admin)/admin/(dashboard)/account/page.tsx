import { redirect } from "next/navigation";

import { getCurrentUser } from "@/modules/auth/server";
import { authRepo } from "@/modules/auth/infrastructure/authRepo";

import AccountForm from "./account-form";

export default async function AccountPage() {
  const user = await getCurrentUser(authRepo);
  if (!user) redirect("/admin/login");

  return <AccountForm user={user} />;
}
