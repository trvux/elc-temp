"use client";

import { Card } from "@/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/shared/components/ui/chart";
import type { ChartConfig } from "@/shared/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  ChatCircleText,
  FileText,
  Stack,
  MapPin,
  Newspaper,
  Package,
  Phone,
  Tag,
  Wrench,
  TrendUp,
} from "@phosphor-icons/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { getDashboardStatsAction } from "../actions";

// ─── Colour palette ──────────────────────────────────────────────────────────
// Using CSS variables defined by shadcn theme so they automatically flip
// between light / dark mode.
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Returns a gradient of opacity so the ranking is immediately legible.
function getRankColor(index: number, total: number): string {
  const opacity = Math.max(0.35, 1 - (index / Math.max(total - 1, 1)) * 0.65);
  return `hsl(var(--chart-1) / ${opacity})`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  accent?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent = false }: StatCardProps) {
  return (
    <Card
      className={`p-4 flex flex-col gap-2 shadow-sm ${
        accent
          ? "border-orange-400/60 bg-orange-50/50 dark:bg-orange-950/20"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-xs font-bold uppercase tracking-widest ${
            accent ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
          }`}
        >
          {label}
        </p>
        <Icon
          size={14}
          className={accent ? "text-orange-500" : "text-muted-foreground/70"}
        />
      </div>
      <p
        className={`text-2xl font-bold tracking-tight ${
          accent ? "text-orange-600 dark:text-orange-400" : ""
        }`}
      >
        {value ?? 0}
      </p>
    </Card>
  );
}

// ─── Activity type badge colours ─────────────────────────────────────────────
const TYPE_BADGE: Record<string, string> = {
  "San pham": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Du an": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "Tin tuc": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const TYPE_LABEL: Record<string, string> = {
  "San pham": "Sản phẩm",
  "Du an": "Dự án",
  "Tin tuc": "Tin tức",
};

// ─── Main component ───────────────────────────────────────────────────────────

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

  // ── Category chart (top 10, horizontal bar) ─────────────────────────────
  const categoryData = (data?.categoryDistribution ?? [])
    .slice(0, 10)
    .map((item, i, arr) => ({
      ...item,
      fill: getRankColor(i, arr.length),
    }));

  // ── Brand donut ──────────────────────────────────────────────────────────
  const brandRaw = data?.brandDistribution ?? [];
  const TOP_N_BRANDS = 5;
  const topBrands = brandRaw.slice(0, TOP_N_BRANDS);
  const otherBrandCount = brandRaw
    .slice(TOP_N_BRANDS)
    .reduce((acc, b) => acc + b.count, 0);
  const brandData = [
    ...topBrands.map((b, i) => ({
      ...b,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })),
    ...(otherBrandCount > 0
      ? [{ name: "Khác", count: otherBrandCount, fill: "var(--muted)" }]
      : []),
  ];
  const brandTotal = brandRaw.reduce((acc, b) => acc + b.count, 0);

  // ── Top viewed bar chart ─────────────────────────────────────────────────
  const topViewedData = (data?.topViewedProducts ?? [])
    .slice(0, 5)
    .map((item, i, arr) => ({
      ...item,
      fill: getRankColor(i, arr.length),
    }));

  // ── Content mix donut ────────────────────────────────────────────────────
  const contentMixData = [
    { name: "Sản phẩm", count: stats?.products ?? 0, fill: CHART_COLORS[0] },
    { name: "Dự án", count: stats?.projects ?? 0, fill: CHART_COLORS[2] },
    { name: "Tin tức", count: stats?.news ?? 0, fill: CHART_COLORS[3] },
  ].filter((d) => d.count > 0);
  const contentTotal = contentMixData.reduce((a, d) => a + d.count, 0);

  // ── Misc lists ───────────────────────────────────────────────────────────
  const featuredProducts = data?.featuredProducts ?? [];
  const featuredProjects = data?.featuredProjects ?? [];
  const recentActivities = data?.recentActivities ?? [];

  // ── Chart configs ────────────────────────────────────────────────────────
  const categoryChartConfig: ChartConfig = {
    count: { label: "Sản phẩm" },
  };

  const brandChartConfig: ChartConfig = Object.fromEntries(
    brandData.map((b) => [b.name, { label: b.name, color: b.fill }])
  );

  const topViewedChartConfig: ChartConfig = {
    count: { label: "Lượt xem" },
  };

  const contentMixConfig: ChartConfig = Object.fromEntries(
    contentMixData.map((d) => [d.name, { label: d.name, color: d.fill }])
  );

  // ── Secondary stat cards ─────────────────────────────────────────────────
  const secondaryCards = [
    { label: "Sản phẩm", value: stats?.products, icon: Package },
    { label: "Danh mục", value: stats?.categories, icon: Stack },
    { label: "Thương hiệu", value: stats?.brands, icon: Tag },
    { label: "Dự án", value: stats?.projects, icon: Briefcase },
    { label: "Dịch vụ", value: stats?.services, icon: Wrench },
    { label: "Tin tức", value: stats?.news, icon: Newspaper },
    { label: "Trang tĩnh", value: stats?.pages, icon: FileText },
    { label: "Liên hệ", value: stats?.contacts, icon: Phone },
    { label: "Cơ sở hạ tầng", value: stats?.branches, icon: MapPin },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground mt-1">
          Dashboard dành cho admin quản lí
        </p>
      </div>

      {/* ── Section 1: KPI hero + secondary stats ───────────────────────── */}
      <div className="space-y-3">
        {/* Inquiry alert card — full width, stands out */}
        {isLoading ? null : (
          <Card className="p-5 border-orange-400/60 bg-orange-50/50 dark:bg-orange-950/20 flex items-center gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
              <ChatCircleText size={22} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                Yêu cầu tư vấn mới
              </p>
              <p className="text-3xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {stats?.inquiries ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Yêu cầu chưa xử lý — cần phản hồi sớm
              </p>
            </div>
            <TrendUp size={28} className="text-orange-300 shrink-0 hidden md:block" />
          </Card>
        )}

        {/* Secondary stat grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {isLoading
            ? null
            : secondaryCards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                />
              ))}
        </div>
      </div>

      {/* ── Section 2: Category bar + Brand donut ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Category bar — takes 3 / 5 columns */}
        <Card className="lg:col-span-3 p-6 flex flex-col">
          <div className="mb-5">
            <h3 className="text-base font-bold">Top 10 danh mục nhiều sản phẩm nhất</h3>
            <p className="text-sm text-muted-foreground">
              Phân bổ sản phẩm theo danh mục, màu đậm = xếp hạng cao hơn.
            </p>
          </div>
          <div className="flex-1 min-h-80">
            {isLoading ? null : categoryData.length > 0 ? (
              <ChartContainer config={categoryChartConfig} className="h-full w-full">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ left: 0, right: 48, top: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    fontSize={11}
                    className="fill-muted-foreground"
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-cat-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="right"
                      className="fill-foreground text-xs font-semibold"
                      formatter={(v: string | number | boolean | null | undefined) => {
                        if (typeof v === "number") {
                          return v.toLocaleString();
                        }
                        return v?.toString() ?? "";
                      }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                Không có dữ liệu phân bổ.
              </div>
            )}
          </div>
        </Card>

        {/* Brand donut — takes 2 / 5 columns */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="mb-5">
            <h3 className="text-base font-bold">Phân bổ thương hiệu</h3>
            <p className="text-sm text-muted-foreground">
              Tỉ lệ sản phẩm theo từng thương hiệu (top 5).
            </p>
          </div>
          <div className="flex-1 min-h-70 flex flex-col items-center justify-center">
            {isLoading ? null : brandData.length > 0 ? (
              <ChartContainer config={brandChartConfig} className="h-65 w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value, name) => (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{String(name)}</span>
                            <span className="font-mono font-semibold">
                              {Number(value).toLocaleString()}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              ({brandTotal > 0 ? ((Number(value) / brandTotal) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={brandData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-brand-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                Không có dữ liệu thương hiệu.
              </div>
            )}
            {!isLoading && brandTotal > 0 && (
              <p className="text-xs text-muted-foreground text-center -mt-1">
                Tổng{" "}
                <span className="font-semibold text-foreground">
                  {brandTotal.toLocaleString()}
                </span>{" "}
                sản phẩm có thương hiệu
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* ── Section 3: Top viewed products ──────────────────────────────── */}
      <Card className="p-6 flex flex-col">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold">Top 5 sản phẩm được xem nhiều nhất</h3>
            <p className="text-sm text-muted-foreground">
              30 ngày gần nhất — dựa trên lượt xem trang chi tiết sản phẩm.
            </p>
          </div>
        </div>
        <div className="h-50 w-full">
          {isLoading ? null : topViewedData.length > 0 ? (
            <ChartContainer config={topViewedChartConfig} className="h-full w-full">
              <BarChart
                data={topViewedData}
                layout="vertical"
                margin={{ left: 0, right: 64, top: 4, bottom: 4 }}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={150}
                  fontSize={11}
                  className="fill-muted-foreground"
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                  {topViewedData.map((entry, index) => (
                    <Cell key={`cell-view-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="right"
                    className="fill-foreground text-xs font-semibold"
                    formatter={(v: string | number | boolean | null | undefined) => {
                      if (typeof v === "number") {
                        return `${v.toLocaleString()} lượt${v === topViewedData[0]?.count ? " 🔥" : ""}`;
                      }
                      return v?.toString() ?? "";
                    }}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
              Chưa có dữ liệu lượt xem.
            </div>
          )}
        </div>
      </Card>

      {/* ── Section 4: Content mix + Featured lists ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content mix donut */}
        <Card className="p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold">Tỉ lệ nội dung</h3>
            <p className="text-sm text-muted-foreground">
              Phân bổ giữa sản phẩm, dự án và tin tức.
            </p>
          </div>
          <div className="flex-1 min-h-55">
            {isLoading ? null : contentMixData.length > 0 ? (
              <ChartContainer config={contentMixConfig} className="h-55 w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value, name) => (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{String(name)}</span>
                            <span className="font-mono font-semibold">
                              {Number(value).toLocaleString()}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              ({contentTotal > 0 ? ((Number(value) / contentTotal) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={contentMixData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius="48%"
                    outerRadius="72%"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {contentMixData.map((entry, index) => (
                      <Cell key={`cell-content-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                Chưa có dữ liệu.
              </div>
            )}
          </div>
        </Card>

        {/* Featured products */}
        <Card className="p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold">Sản phẩm nổi bật</h3>
            <p className="text-sm text-muted-foreground">
              Đang được hiển thị nổi bật trên website.
            </p>
          </div>
          <div className="space-y-0 flex-1">
            {isLoading ? null : featuredProducts.length > 0 ? (
              featuredProducts.map((item, i) => (
                <div
                  key={item.id + i}
                  className="flex items-center gap-3 py-2.5 border-b border-muted/50 last:border-0"
                >
                  <span className="text-xs font-bold text-muted-foreground/60 w-4 tabular-nums shrink-0">
                    {i + 1}
                  </span>
                  <p className="font-medium text-sm leading-tight line-clamp-1 flex-1">
                    {item.title}
                  </p>
                  <span className="text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded shrink-0">
                    SP
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground italic text-xs">
                Không có sản phẩm nổi bật.
              </div>
            )}
          </div>
        </Card>

        {/* Featured projects */}
        <Card className="p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold">Dự án nổi bật</h3>
            <p className="text-sm text-muted-foreground">
              Các dự án tiêu biểu của công ty.
            </p>
          </div>
          <div className="space-y-0 flex-1">
            {isLoading ? null : featuredProjects.length > 0 ? (
              featuredProjects.map((item, i) => (
                <div
                  key={item.id + i}
                  className="flex items-center gap-3 py-2.5 border-b border-muted/50 last:border-0"
                >
                  <span className="text-xs font-bold text-muted-foreground/60 w-4 tabular-nums shrink-0">
                    {i + 1}
                  </span>
                  <p className="font-medium text-sm leading-tight line-clamp-1 flex-1">
                    {item.title}
                  </p>
                  <span className="text-xs font-bold uppercase tracking-wide bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 rounded shrink-0">
                    DA
                  </span>
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

      {/* ── Section 5: Recent activities ─────────────────────────────────── */}
      <Card className="p-6 flex flex-col">
        <div className="mb-5">
          <h3 className="text-base font-bold">Hoạt động mới nhất</h3>
          <p className="text-sm text-muted-foreground">
            Tổng hợp các cập nhật gần đây từ toàn bộ hệ thống.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading ? null : recentActivities.length > 0 ? (
            recentActivities.map((activity, i) => {
              const badgeCls = TYPE_BADGE[activity.type] ?? "bg-muted text-muted-foreground";
              const label = TYPE_LABEL[activity.type] ?? activity.type;
              return (
                <div
                  key={activity.id + i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-muted/50 hover:border-muted transition-colors"
                >
                  <div className="mt-0.5 flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-sm leading-tight line-clamp-2">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badgeCls}`}
                      >
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 flex items-center justify-center h-40 text-muted-foreground italic text-sm">
              Chưa có hoạt động nào.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
