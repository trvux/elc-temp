// AttributeDefinition replaces the free-text spec label the admin used to
// hand-type per product (see modules/catalog's old ProductSpecsTab) —
// mirrors elc-go's internal/attribute/domain/types.go 1:1, and Shopify's
// Metafield Definition concept: an attribute is defined once (scoped to a
// category, or globally when categoryId is null) and reused across every
// product in that category, instead of admin free-typing a new label each
// time.

export type AttributeDataType = "number" | "text" | "boolean" | "select";

export interface AttributeDefinition {
  id: string;
  categoryId?: string | null;
  code: string;
  name: string;
  // groupLabel sections the admin form / PDP display (e.g. "Dàn lạnh" /
  // "Dàn nóng" / null = chung).
  groupLabel?: string | null;
  dataType: AttributeDataType;
  unit?: string | null;
  // Only meaningful for dataType = "select".
  options: string[];
  orderIndex: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAttributeDefinitionInput {
  categoryId?: string | null;
  code: string;
  name: string;
  groupLabel?: string | null;
  dataType: AttributeDataType;
  unit?: string | null;
  options?: string[];
  orderIndex?: number;
  isRequired?: boolean;
}

// categoryId/code/dataType are immutable after creation (see the Go domain
// entity's Update method doc comment) — changing either would orphan
// existing product_attribute_values rows with a mismatched type/scope.
export interface UpdateAttributeDefinitionInput {
  id: string;
  name?: string;
  groupLabel?: string | null;
  unit?: string | null;
  options?: string[];
  orderIndex?: number;
  isRequired?: boolean;
}

export interface AttributeDefinitionFilter {
  categoryId?: string;
  // IncludeGlobal also returns categoryId-null (universal) definitions
  // alongside the categoryId filter's matches.
  includeGlobal?: boolean;
  includeDeleted?: boolean;
}
