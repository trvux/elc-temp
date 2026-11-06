import { ServiceGroup } from "@/modules/service-group/domain/types";
import type { ImageAsset } from "@/shared/lib/image-asset";
export type { ImageAsset };
import type { TitleAlign } from "@/shared/lib/title-align";
import type { ServiceLine } from "./line";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Service {
  id: string;
  title: string;
  titleAlign: TitleAlign;
  slug: string;
  groupId: string | null;
  labels: string[] | null;
  line: ServiceLine;
  briefPrompts: string[];
  description: string | null;
  content: Json;
  images: ImageAsset[];
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ServiceWithRelations extends Service {
  group: ServiceGroup | null;
}

export interface CreateServiceInput {
  title: string;
  titleAlign?: TitleAlign;
  slug: string;
  groupId?: string | null;
  labels?: string[] | null;
  line?: ServiceLine;
  briefPrompts?: string[];
  description?: string | null;
  content?: Json;
  images?: ImageAsset[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished?: boolean;
  orderIndex?: number;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  id: string;
}

export interface ServiceFilter {
  groupId?: string;
  isPublished?: boolean;
  search?: string;
  includeDeleted?: boolean;
}
