"use client";

import { logoutAction } from "@/modules/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import {
  Award,
  ChevronsUpDown,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Phone,
  Settings,
  ShieldCheck,
  Grid,
  List,
  Layers,
  Briefcase,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/group-categories", label: "Nhóm danh mục", icon: Grid },
  { href: "/admin/categories", label: "Danh mục", icon: List },
  { href: "/admin/project-types", label: "Loại hình công trình", icon: Layers },
  { href: "/admin/brands", label: "Thương hiệu", icon: Award },
  { href: "/admin/projects", label: "Dự án", icon: FolderKanban },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/service-groups", label: "Nhóm dịch vụ", icon: LayoutGrid },
  { href: "/admin/services", label: "Dịch vụ", icon: Briefcase },
  { href: "/admin/news", label: "Tin tức", icon: FileText },
  { href: "/admin/pages", label: "Trang tĩnh", icon: FileText },
  { href: "/admin/contacts", label: "Liên hệ", icon: Phone },
  { href: "/admin/branches", label: "Cơ sở hạ tầng", icon: MapPin },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
];

type UserInfo = { name: string; email: string; avatar: string };

function NavUser({ user }: { user: UserInfo }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  async function handleLogout() {
    const { success, error } = await logoutAction();
    if (success) {
      router.push("/admin/login");
      router.refresh();
    } else {
      console.error("Logout failed:", error);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 size-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default function AdminSidebar({ user }: { user: UserInfo }) {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-bold capitalize tracking-tight">
                    ELC ADMIN
                  </span>
                  <span className="truncate text-xs text-muted-foreground font-medium capitalize tracking-wider">
                    Hệ thống quản trị
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={pathname === item.href}
                  className="text-sm transition-all data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-medium active:scale-[0.98]"
                >
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
