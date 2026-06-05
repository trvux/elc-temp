import { ServiceGroup } from "@/modules/service-group/domain/types";
import { CategoryNewWithGroup } from "@/modules/category-new/domain/types";
import { Database } from "@/database.types";

export interface Service {
  id: string;
  title: string;
  slug: string;
  groupId: string | null;
  categoryId: string | null;
  originalPrice: number | null;
  salePrice: number | null;
  discountPercent: number | null;
  priceDisplayText: string | null;
  labels: string[] | null;
  description: string | null;
  content: Database["public"]["Tables"]["services"]["Row"]["content"]; // Json
  image: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ServiceWithRelations extends Service {
  group: ServiceGroup | null;
  category: CategoryNewWithGroup | null;
}

export interface CreateServiceInput {
  title: string;
  slug: string;
  groupId?: string | null;
  categoryId?: string | null;
  originalPrice?: number | null;
  salePrice?: number | null;
  discountPercent?: number | null;
  priceDisplayText?: string | null;
  labels?: string[] | null;
  description?: string | null;
  content?: Database["public"]["Tables"]["services"]["Row"]["content"];
  image?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  isPublished?: boolean;
  orderIndex?: number;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  id: string;
}

export interface ServiceFilter {
  groupId?: string;
  categoryId?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  search?: string;
  includeDeleted?: boolean;
}
