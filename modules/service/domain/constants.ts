export const SERVICE_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
} as const;

export type ServiceStatus = typeof SERVICE_STATUS[keyof typeof SERVICE_STATUS];
