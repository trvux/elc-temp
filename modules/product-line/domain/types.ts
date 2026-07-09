// "Dòng sản phẩm" — e.g. Daikin's FTF/FTKB/FTKF/FTKY/FTKZ tiers. Mirrors
// elc-go's internal/product/domain/variant.go ProductLine 1:1. Its own
// module (not folded into `catalog`) matching how Brand — a conceptually
// related lookup — is also its own top-level module here.

export interface ProductLine {
  id: string;
  brandId: string;
  categoryId?: string | null;
  code: string;
  name: string;
  tierRank: number;
  description?: string | null;
  // Real manufacturer MPN prefixes this line covers (e.g. ["FTF","FTC"]) —
  // a list, not a single delimited string like the old "FTF-FTC" code was.
  mpnPrefixes: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateProductLineInput {
  brandId: string;
  categoryId?: string | null;
  code: string;
  name: string;
  tierRank?: number;
  description?: string | null;
  mpnPrefixes?: string[];
}

export interface UpdateProductLineInput {
  id: string;
  categoryId?: string | null;
  name: string;
  tierRank?: number;
  description?: string | null;
  mpnPrefixes?: string[];
}

export interface ProductLineFilter {
  brandId?: string;
  includeDeleted?: boolean;
}
