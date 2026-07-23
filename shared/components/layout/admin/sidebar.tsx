"use client";

import { useQuery } from "@tanstack/react-query";
import { logoutAction } from "@/modules/auth";
import { countInquiriesAction } from "@/modules/inquiry";
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { Medal, CaretUpDown, FileText, Kanban, Gauge, SignOut, MapPin, Package, Phone, ChatCircleText, Gear, ShieldCheck, GridFour, List, Stack, Briefcase, SquaresFour, Newspaper, Globe, UsersThree, MagnifyingGlass, PenNib, TagSimple, UserCircle, Sliders, Notepad, Star, Robot, Truck, Fan } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItemDef = { href: string; label: string; icon: typeof Gauge };

const dashboardItem: NavItemDef = { href: "/admin", label: "Tổng quan", icon: Gauge };

// Grouped by domain rather than one flat list — a flat 20-item menu made it
// hard for staff to locate related screens (e.g. "Nhóm dịch vụ"/"Dịch vụ"
// scattered among unrelated items). Group boundaries mirror how the data
// itself relates (catalog taxonomy, project/service delivery, customer
// touchpoints, content, system-level config).
const navGroups: { label: string; items: NavItemDef[] }[] = [
  {
    label: "Danh mục sản phẩm",
    items: [
      { href: "/admin/group-categories", label: "Nhóm danh mục", icon: GridFour },
      { href: "/admin/categories", label: "Danh mục", icon: List },
      { href: "/admin/project-types", label: "Loại hình công trình", icon: Stack },
      { href: "/admin/brands", label: "Thương hiệu", icon: Medal },
      { href: "/admin/hp-pages", label: "Trang công suất (HP)", icon: Fan },
      { href: "/admin/product-lines", label: "Dòng sản phẩm", icon: TagSimple },
      { href: "/admin/attribute-definitions", label: "Thuộc tính sản phẩm", icon: Sliders },
      { href: "/admin/products", label: "Sản phẩm", icon: Package },
      { href: "/admin/catalog-page", label: "Trang Tất cả sản phẩm", icon: Notepad },
    ],
  },
  {
    label: "Dự án & Dịch vụ",
    items: [
      { href: "/admin/projects", label: "Dự án", icon: Kanban },
      { href: "/admin/service-groups", label: "Nhóm dịch vụ", icon: SquaresFour },
      { href: "/admin/services", label: "Dịch vụ", icon: Briefcase },
    ],
  },
  {
    label: "Khách hàng",
    items: [
      { href: "/admin/inquiries", label: "Yêu cầu tư vấn", icon: ChatCircleText },
      { href: "/admin/reviews", label: "Đánh giá sản phẩm", icon: Star },
      { href: "/admin/contacts", label: "Liên hệ", icon: Phone },
      { href: "/admin/chat-logs", label: "Lịch sử Chat AI", icon: Robot },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { href: "/admin/news", label: "Tin tức", icon: Newspaper },
      { href: "/admin/authors", label: "Tác giả", icon: PenNib },
      { href: "/admin/tags", label: "Thẻ (Tags)", icon: TagSimple },
      { href: "/admin/pages", label: "Trang tĩnh", icon: FileText },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/branches", label: "Chi nhánh", icon: MapPin },
      { href: "/admin/shipping-zones", label: "Khu vực giao hàng", icon: Truck },
      { href: "/admin/system-pages", label: "SEO Trang hệ thống", icon: Globe },
      { href: "/admin/seo-audit", label: "Kiểm tra SEO", icon: MagnifyingGlass },
      { href: "/admin/settings", label: "Cài đặt", icon: Gear },
    ],
  },
];

// Only shown to admin/super_admin — a plain "user" role account can't reach
// its underlying page anyway (server-side redirect + Go API 403), but
// hiding the link avoids a dead-end click for them. Lives in "Hệ thống"
// alongside the other admin-facing config screens.
const usersNavItem: NavItemDef = { href: "/admin/users", label: "Quản lý người dùng", icon: UsersThree };

function NavItemRow({
  item,
  pathname,
  newInquiriesCount,
}: {
  item: NavItemDef;
  pathname: string;
  newInquiriesCount?: number;
}) {
  return (
    <SidebarMenuItem>
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
      {item.href === "/admin/inquiries" && !!newInquiriesCount && (
        <SidebarMenuBadge className="bg-primary text-primary-foreground">
          {newInquiriesCount}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

type UserInfo = { name: string; email: string; avatar: string; role: string };

function NavUser({ user }: { user: UserInfo }) {
  const { isMobile } = useSidebar();

  async function handleLogout() {
    // logoutAction redirects to /admin/login itself on success (server-side,
    // same pattern as loginAction) — no client-side router.push/refresh
    // needed, and doing so was racing with the admin layout's own redirect
    // once it noticed the session cookie was gone.
    const result = await logoutAction();
    if (result?.error) {
      console.error("Logout failed:", result.error);
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
              <CaretUpDown className="ml-auto size-4" />
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
            <DropdownMenuItem asChild>
              <Link href="/admin/account">
                <UserCircle className="mr-2 size-4" />
                Tài khoản của tôi
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <SignOut className="mr-2 size-4" />
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
  const groups =
    user.role === "user"
      ? navGroups
      : navGroups.map((group, index) =>
          index === navGroups.length - 1
            ? { ...group, items: [...group.items, usersNavItem] }
            : group,
        );

  // Polls rather than pushing — no websocket/SSE infra exists yet for this.
  // 60s is frequent enough to notice a new lead without hammering the API.
  const { data: newInquiriesCount } = useQuery({
    queryKey: ["inquiries-new-count"],
    queryFn: async () => {
      const { data } = await countInquiriesAction({ status: "new" });
      return data;
    },
    refetchInterval: 60_000,
  });

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
          <SidebarMenu>
            <NavItemRow item={dashboardItem} pathname={pathname} />
          </SidebarMenu>
        </SidebarGroup>

        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItemRow
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  newInquiriesCount={newInquiriesCount}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
