// Kieu du lieu cho Dashboard Stats — day la output cua use case,
// khong phai entity co persistence.

export interface DashboardCounts {
  products: number;
  categories: number;
  brands: number;
  projects: number;
  services: number;
  news: number;
  pages: number;
  contacts: number;
  branches: number;
}

export interface DashboardDistributionItem {
  name: string;
  count: number;
}

export interface DashboardCategoryDistributionItem extends DashboardDistributionItem {
  level: 1 | 2;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  type: "San pham" | "Du an" | "Tin tuc";
  date: string;
}

export interface DashboardStats {
  counts: DashboardCounts;
  categoryDistribution: DashboardCategoryDistributionItem[];
  brandDistribution: DashboardDistributionItem[];
  featuredProducts: DashboardActivityItem[];
  featuredProjects: DashboardActivityItem[];
  recentActivities: DashboardActivityItem[];
}
