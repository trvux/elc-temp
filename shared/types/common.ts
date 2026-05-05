export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
}

export type Theme = "light" | "dark" | "system";

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  external?: boolean;
}

export interface BreadcrumbItem {
  title: string;
  href: string;
  active?: boolean;
}
