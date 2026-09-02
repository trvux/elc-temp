import { getCurrentUser } from "@/modules/auth/server";
import { authRepo } from "@/modules/auth/infrastructure/authRepo";
import { redirect } from "next/navigation";
import AdminSidebar from "@/shared/components/organisms/layout/admin/sidebar";
import AdminBreadcrumb from "@/shared/components/organisms/layout/admin/breadcrumb";
import { Separator } from "@/shared/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminIconProvider } from "@/shared/providers/admin-icon-provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const user = await getCurrentUser(authRepo);

  if (!user) redirect("/login");
  // "member" is the public role (anyone who signs in via Google/magic link)
  // — admin-panel access is always a deliberate promotion by an existing
  // admin (see modules/admin-users), never automatic. Gated here once for
  // the whole dashboard tree instead of per-page.
  if (user.role === "member") redirect("/");

  return (
    <AdminIconProvider>
      <SidebarProvider>
        <AdminSidebar
          user={{
            // username is empty for any account created via Google/magic
            // link, including a staff account promoted straight from a
            // member — see account-form.tsx's same fallback.
            name: user.name || user.username || user.email,
            email: user.email,
            avatar: user.avatarUrl,
            role: user.role,
          }}
        />
        <SidebarInset className="min-w-0 flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="flex-1">
               <AdminBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-hidden min-w-0 w-full">
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminIconProvider>
  );
}
