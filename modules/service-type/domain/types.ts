import { CategoryNewWithGroup } from "@/modules/category-new/domain/types";

export interface ServiceType {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ServiceTypeWithCategories extends ServiceType {
  categories: CategoryNewWithGroup[];
}

export interface CreateServiceTypeInput {
  name: string;
  slug: string;
  image?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  categoryIds?: string[];
}

export interface UpdateServiceTypeInput {
  id: string;
  name?: string;
  slug?: string;
  image?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  categoryIds?: string[];
}
