export type RedirectSource = "manual" | "auto" | "import";

export interface Redirect {
  id: string;
  fromPath: string;
  toPath: string;
  isActive: boolean;
  source: RedirectSource;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedirectList {
  items: Redirect[];
  total: number;
}

export interface RedirectQuery {
  q?: string;
  source?: RedirectSource;
  limit?: number;
  offset?: number;
}

export interface CreateRedirectInput {
  fromPath: string;
  toPath: string;
  note?: string;
}

export interface UpdateRedirectInput {
  id: string;
  toPath?: string;
  note?: string;
  isActive?: boolean;
}

export const SOURCE_LABEL: Record<RedirectSource, string> = {
  manual: "Thủ công",
  auto: "Tự động (đổi slug)",
  import: "Nhập từ cấu hình cũ",
};
