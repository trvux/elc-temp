export const CATEGORY_TYPES = {
    PRODUCT: "product",
    PROJECT: "project",
} as const;

export type CategoryType = keyof typeof CATEGORY_TYPES;

