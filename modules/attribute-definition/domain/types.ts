// AttributeDefinition replaces the free-text spec label the admin used to
// hand-type per product (see modules/catalog's old ProductSpecsTab) —
// mirrors elc-go's internal/attribute/domain/types.go 1:1, and Shopify's
// Metafield Definition concept: an attribute is defined once and reused
// across every product in whichever category(ies) it's attached to
// (categoryIds), or globally when categoryIds is empty. Which categories a
// definition applies to is many-to-many relational data (see
// category_attribute_definitions), managed via attach/detach — not part of
// create/update.

export type AttributeDataType = "number" | "text" | "boolean" | "select" | "multiselect";

export interface AttributeDefinition {
  id: string;
  categoryIds: string[];
  code: string;
  name: string;
  // groupLabel sections the admin form / PDP display (e.g. "Dàn lạnh" /
  // "Dàn nóng" / null = chung).
  groupLabel?: string | null;
  dataType: AttributeDataType;
  unit?: string | null;
  // Only meaningful for dataType = "select" | "multiselect".
  options: string[];
  orderIndex: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// categoryIds is deliberately absent — attaching to a category is its own
// use case (see AttachAttributeDefinitionCategoriesInput), same "create,
// then relate" split as the Go backend.
export interface CreateAttributeDefinitionInput {
  code: string;
  name: string;
  groupLabel?: string | null;
  dataType: AttributeDataType;
  unit?: string | null;
  options?: string[];
  orderIndex?: number;
  isRequired?: boolean;
}

// code/dataType are immutable after creation (see the Go domain entity's
// Update method doc comment) — changing either would orphan existing
// product_attribute_values rows with a mismatched type/scope.
export interface UpdateAttributeDefinitionInput {
  id: string;
  name?: string;
  groupLabel?: string | null;
  unit?: string | null;
  options?: string[];
  orderIndex?: number;
  isRequired?: boolean;
}

export interface AttachAttributeDefinitionCategoriesInput {
  id: string;
  categoryIds: string[];
}

export interface AttributeDefinitionFilter {
  categoryId?: string;
  // IncludeGlobal also returns definitions attached to zero categories
  // (global, applies everywhere) alongside the categoryId filter's matches.
  includeGlobal?: boolean;
  includeDeleted?: boolean;
}
