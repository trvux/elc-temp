"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  EmailIcon,
  FacebookIcon,
  MessengerIcon,
  PhoneIcon,
  ZaloIcon,
} from "@/shared/components/ui/social-icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { createClient } from "@/shared/lib/supabase/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BarChart3, Eye, MousePointerClick, Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface TrackingEvent {
  id: string;
  created_at: string;
  event_name: string;
  event_category: string;
  event_label: string;
  page_path: string;
  metadata: any;
}

export default function AnalyticsPage() {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [stats, setStats] = useState({
    totalClicks: 0,
    conversions: 0,
    pageViews: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch initial data
    const fetchInitialData = async () => {
      // Sử dụng as any để bypass lỗi type do bảng mới chưa có trong database.types
      const { data, error } = await (supabase as any)
        .from("tracking_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setEvents(data);
        calculateStats(data);
      }
    };

    fetchInitialData();

    // 2. Subscribe to realtime changes
    const channel = (supabase as any)
      .channel("tracking_events_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracking_events",
        },
        (payload: any) => {
          const newEvent = payload.new as TrackingEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
          updateStatsOnNewEvent(newEvent);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateStats = (data: TrackingEvent[]) => {
    const totalClicks = data.filter((e) =>
      e.event_name.includes("click"),
    ).length;
    const conversions = data.filter(
      (e) => e.event_category === "conversion",
    ).length;
    const pageViews = data.filter((e) => e.event_name === "page_view").length;
    setStats({ totalClicks, conversions, pageViews });
  };

  const updateStatsOnNewEvent = (event: TrackingEvent) => {
    setStats((prev) => ({
      totalClicks: event.event_name.includes("click")
        ? prev.totalClicks + 1
        : prev.totalClicks,
      conversions:
        event.event_category === "conversion"
          ? prev.conversions + 1
          : prev.conversions,
      pageViews:
        event.event_name === "page_view" ? prev.pageViews + 1 : prev.pageViews,
    }));
  };

  const getEventIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("phone")) return <PhoneIcon size={16} />;
    if (l.includes("zalo")) return <ZaloIcon size={16} />;
    if (l.includes("messenger")) return <MessengerIcon size={16} />;
    if (l.includes("email")) return <EmailIcon size={16} />;
    if (l.includes("facebook")) return <FacebookIcon size={16} />;
    return <MousePointerClick className="size-4" />;
  };

  const topPages = Object.entries(
    events
      .filter((e) => e.event_name === "page_view")
      .reduce((acc: Record<string, number>, curr) => {
        acc[curr.page_path] = (acc[curr.page_path] || 0) + 1;
        return acc;
      }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topSearches = Object.entries(
    events
      .filter((e) => e.event_name === "search")
      .reduce((acc: Record<string, number>, curr) => {
        const query = curr.metadata?.query || curr.event_label;
        if (query) acc[query] = (acc[query] || 0) + 1;
        return acc;
      }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Phân tích điểm rơi: Trang nào có view cao nhưng conversion thấp
  const pagePerformance = Object.entries(
    events.reduce(
      (acc: Record<string, { views: number; convs: number }>, curr) => {
        const path = curr.page_path;
        if (!acc[path]) acc[path] = { views: 0, convs: 0 };
        if (curr.event_name === "page_view") acc[path].views++;
        if (curr.event_category === "conversion") acc[path].convs++;
        return acc;
      },
      {},
    ),
  )
    .map(([path, data]) => ({
      path,
      ...data,
      rate: data.views > 0 ? (data.convs / data.views) * 100 : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Phân tích Real-time
        </h1>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <Zap className="size-3 fill-yellow-400 text-yellow-400" />
          Đang cập nhật trực tiếp
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng lượt Click
            </CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Trong 50 hành động gần nhất
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lượt chuyển đổi
            </CardTitle>
            <BarChart3 className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.conversions}
            </div>
            <p className="text-xs text-muted-foreground">
              Khách bấm gọi/nhắn tin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xem trang</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pageViews}</div>
            <p className="text-xs text-muted-foreground">Lượt tải trang</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="size-4" />
              Top Từ khóa tìm kiếm
            </CardTitle>
            <CardDescription>Keyword khách tìm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSearches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có lượt tìm kiếm nào
                </p>
              ) : (
                topSearches.map(([query, count]) => (
                  <div
                    key={query}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <span className="text-sm font-medium">{query}</span>
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-600 border-orange-200"
                    >
                      {count} lần
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="size-4" />
              Phân tích điểm rơi (Hiệu quả trang)
            </CardTitle>
            <CardDescription>Tỷ lệ khách gọi trên mỗi trang</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pagePerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có dữ liệu
                </p>
              ) : (
                pagePerformance.map((item) => (
                  <div
                    key={item.path}
                    className="flex flex-col gap-1 border-b pb-2 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate max-w-[200px] font-medium">
                        {item.path}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {item.rate.toFixed(1)}% hiệu quả
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{item.views} view</span>
                      <span>•</span>
                      <span>{item.convs} click gọi</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sự kiện mới nhất</CardTitle>
          <CardDescription>
            Danh sách các hành động thực tế của khách hàng trên website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Chi tiết</TableHead>
                <TableHead>Trang</TableHead>
                <TableHead>Chiến dịch</TableHead>
                <TableHead>Loại</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Đang chờ dữ liệu...
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="animate-in fade-in slide-in-from-left-2 duration-500"
                  >
                    <TableCell className="font-medium">
                      {format(new Date(event.created_at), "HH:mm:ss", {
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {event.event_name === "page_view" ? (
                          <Eye className="size-4 opacity-50" />
                        ) : (
                          getEventIcon(event.event_label)
                        )}
                        <span className="capitalize">
                          {event.event_name === "page_view" ? "Xem trang" : 
                           event.event_name === "search" ? "Tìm kiếm" :
                           event.event_name.includes("click") ? "Click liên hệ" :
                           event.event_name.replace("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {event.event_label || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground italic text-xs">
                      {event.page_path}
                    </TableCell>
                    <TableCell>
                      {event.metadata?.utm_campaign ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-50 text-blue-600 border-blue-200"
                        >
                          {event.metadata.utm_campaign}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          Tự nhiên
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.event_category === "conversion"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {event.event_category === "conversion" ? "Chuyển đổi" :
                         event.event_category === "engagement" ? "Tương tác" :
                         event.event_category === "navigation" ? "Điều hướng" :
                         event.event_category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
