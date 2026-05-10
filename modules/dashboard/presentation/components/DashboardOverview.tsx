"use client";

import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  FileText,
  Layers,
  MapPin,
  Newspaper,
  Package,
  Phone,
  Star,
  Tag,
  Wrench,
} from "lucide-react";
import { getDashboardStatsAction } from "../actions";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/shared/components/ui/chart";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  CartesianGrid
} from "recharts";

export function DashboardOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await getDashboardStatsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const stats = data?.counts;
  const categoryData = data?.categoryDistribution || [];
  const brandData = data?.brandDistribution || [];
  const featuredProducts = data?.featuredProducts || [];
  const featuredProjects = data?.featuredProjects || [];
  const recentActivities = data?.recentActivities || [];

  const cards = [
    { label: "Sản phẩm", value: stats?.products, icon: Package },
    { label: "Danh mục", value: stats?.categories, icon: Layers },
    { label: "Thương hiệu", value: stats?.brands, icon: Tag },
    { label: "Dự án", value: stats?.projects, icon: Briefcase },
    { label: "Dịch vụ", value: stats?.services, icon: Wrench },
    { label: "Tin tức", value: stats?.news, icon: Newspaper },
    { label: "Trang tĩnh", value: stats?.pages, icon: FileText },
    { label: "Liên hệ", value: stats?.contacts, icon: Phone },
    { label: "Chi nhánh", value: stats?.branches, icon: MapPin },
  ];

  const chartConfig = {
    count: {
      label: "Số lượng",
      color: "var(--primary)",
    },
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground mt-1">
          Chào mừng bạn quay lại hệ thống quản trị ELC ADMIN.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-12" />
              </Card>
            ))
          : cards.map((card) => (
              <Card key={card.label} className="p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  <card.icon size={20} className="text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{card.value ?? 0}</p>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Sản phẩm theo danh mục</h3>
            <p className="text-sm text-muted-foreground">Phân bổ sản phẩm theo từng dòng (Cấp 1 & 2).</p>
          </div>
          <div className="h-[400px] w-full overflow-y-auto">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : categoryData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tickLine={false} 
                    axisLine={false}
                    width={120}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="count" 
                    fill="var(--color-count)" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Không có dữ liệu phân bổ.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Sản phẩm theo thương hiệu</h3>
            <p className="text-sm text-muted-foreground">Số lượng sản phẩm của từng thương hiệu.</p>
          </div>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : brandData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={brandData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tickLine={false} 
                    axisLine={false}
                    width={100}
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="count" 
                    fill="var(--color-count)" 
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Không có dữ liệu thương hiệu.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
              <Package size={20} className="fill-amber-500" />
              Sản phẩm nổi bật
            </h3>
            <p className="text-sm text-muted-foreground">Danh sách các sản phẩm đang được hiển thị nổi bật.</p>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((item, i) => (
                <div key={item.id + i} className="flex items-center justify-between text-sm pb-2 border-b border-muted/50 last:border-0 last:pb-0">
                  <p className="font-medium leading-tight line-clamp-1">{item.title}</p>
                  <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground italic text-xs">
                Không có sản phẩm nổi bật.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-blue-500 flex items-center gap-2">
              <Briefcase size={20} className="fill-blue-500" />
              Dự án nổi bật
            </h3>
            <p className="text-sm text-muted-foreground">Danh sách các dự án tiêu biểu của công ty.</p>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : featuredProjects.length > 0 ? (
              featuredProjects.map((item, i) => (
                <div key={item.id + i} className="flex items-center justify-between text-sm pb-2 border-b border-muted/50 last:border-0 last:pb-0">
                  <p className="font-medium leading-tight line-clamp-1">{item.title}</p>
                  <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground italic text-xs">
                Không có dự án nổi bật.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 flex flex-col">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-primary">Hoạt động mới nhất</h3>
          <p className="text-sm text-muted-foreground">Tổng hợp các cập nhật mới nhất từ toàn bộ hệ thống.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : recentActivities.length > 0 ? (
            recentActivities.map((activity, i) => (
              <div key={activity.id + i} className="flex items-start gap-3 text-sm pb-3 border-b border-muted/50 last:border-0 md:[&:nth-last-child(-n+2)]:border-0 lg:[&:nth-last-child(-n+3)]:border-0">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium leading-tight line-clamp-1">{activity.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="bg-muted px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">{activity.type}</span>
                    <span>{new Date(activity.date).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 flex items-center justify-center h-40 text-muted-foreground italic">
              Chưa có hoạt động nào.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
