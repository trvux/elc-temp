import type { ImageAsset } from "@/shared/lib/image-asset";
export type { ImageAsset };
import type { TitleAlign } from "@/shared/lib/title-align";
import type { ServiceLine } from "./line";
import type { BriefField } from "./brief-fields";
export type { BriefField };

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
  labels: string[] | null;
  line: ServiceLine;
  // Derived from briefFields (their labels): what the page block and the Zalo message list.
  briefPrompts: string[];
  // Typed fields of the brief. A service nobody has typed yet gets its old prompts as text fields.
  briefFields: BriefField[];
  // Product categories this service applies to (admin-edited).
  categoryIds: string[];
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

export type ServiceWithRelations = Service;

export interface CreateServiceInput {
  title: string;
  titleAlign?: TitleAlign;
  slug: string;
  labels?: string[] | null;
  line?: ServiceLine;
  briefPrompts?: string[];
  briefFields?: BriefField[];
  categoryIds?: string[];
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
  isPublished?: boolean;
  search?: string;
  includeDeleted?: boolean;
}
