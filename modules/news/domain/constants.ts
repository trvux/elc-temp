export const NEWS_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
} as const;

export type NewsStatus = typeof NEWS_STATUS[keyof typeof NEWS_STATUS];
