export interface SystemPage {
  id: string;
  name: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSystemPageInput {
  id: string;
  metaTitle: string | null;
  metaDescription: string | null;
}
