"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  Layers, 
  Tag, 
  Briefcase, 
  Wrench, 
  Newspaper, 
  FileText, 
  Phone, 
  MapPin 
} from "lucide-react";
import { getDashboardStatsAction } from "../actions";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";

export function DashboardOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await getDashboardStatsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const cards = [
    { label: "Sản phẩm", value: stats?.products, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Danh mục", value: stats?.categories, icon: Layers, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Thương hiệu", value: stats?.brands, icon: Tag, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Dự án", value: stats?.projects, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Dịch vụ", value: stats?.services, icon: Wrench, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Tin tức", value: stats?.news, icon: Newspaper, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Trang tĩnh", value: stats?.pages, icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Liên hệ", value: stats?.contacts, icon: Phone, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Chi nhánh", value: stats?.branches, icon: MapPin, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Tổng quan</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Chào mừng bạn quay lại hệ thống quản trị ELC ADMIN.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-6 border-none shadow-sm bg-muted/40 animate-pulse">
              <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-12" />
            </Card>
          ))
        ) : (
          cards.map((card) => (
            <Card key={card.label} className="p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 group bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon size={24} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-3xl font-bold mt-1 text-foreground">
                  {card.value ?? 0}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
         <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
            <h3 className="text-xl font-bold mb-4">Lối tắt nhanh</h3>
            <div className="grid grid-cols-2 gap-4">
               <a href="/admin/products" className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium flex items-center gap-3">
                  <Package size={18} className="text-blue-500" /> Quản lý sản phẩm
               </a>
               <a href="/admin/news" className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium flex items-center gap-3">
                  <Newspaper size={18} className="text-indigo-500" /> Đăng tin tức mới
               </a>
               <a href="/admin/projects" className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium flex items-center gap-3">
                  <Briefcase size={18} className="text-emerald-500" /> Dự án hoàn thành
               </a>
               <a href="/admin/contacts" className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium flex items-center gap-3">
                  <Phone size={18} className="text-rose-500" /> Cài đặt liên hệ
               </a>
            </div>
         </Card>
         
         <Card className="p-8 border-none shadow-sm bg-card/50 border border-border/40 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
               <Package size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Sẵn sàng bán hàng?</h3>
            <p className="text-muted-foreground text-sm max-w-[300px] mb-6">
               Hệ thống của bạn đang vận hành ổn định. Hãy tiếp tục cập nhật những sản phẩm mới nhất.
            </p>
            <Button variant="default" className="rounded-full px-8">
               Bắt đầu ngay
            </Button>
         </Card>
      </div>
    </div>
  );
}
