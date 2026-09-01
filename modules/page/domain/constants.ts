export const ABOUT_BLOCK_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  FEATURE: "feature",
} as const;

export type AboutBlockType = typeof ABOUT_BLOCK_TYPES[keyof typeof ABOUT_BLOCK_TYPES];
