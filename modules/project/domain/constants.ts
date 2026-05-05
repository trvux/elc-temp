export const PROJECT_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];
