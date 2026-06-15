import type { ResolvedProjectEntity } from "../infrastructure/resolveProjectPath";

export type { ResolvedProjectEntity };

/**
 * Tra cuu thuc the tu slug.
 * Ham ung dung chi biet ve kieu tra ve, khong phu thuoc truc tiep vao ha tang.
 * Caller truyen vao ham resolver cu the (tiep nhan tu lop ha tang).
 */
export const resolveProjectPath = (
  resolver: (slug: string) => Promise<ResolvedProjectEntity>,
  slug: string,
): Promise<ResolvedProjectEntity> => {
  return resolver(slug);
};
