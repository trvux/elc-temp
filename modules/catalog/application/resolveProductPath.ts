import type { ResolvedEntity } from "../infrastructure/resolveProductPath";

export type { ResolvedEntity };

/**
 * Tra cuu thuc the tu slug.
 * Ham ung dung chi biet ve kieu tra ve, khong phu thuoc truc tiep vao ha tang.
 * Caller truyen vao ham resolver cu the (tiep nhan tu lop ha tang).
 */
export const resolveProductPath = (
  resolver: (slug: string) => Promise<ResolvedEntity>,
  slug: string,
): Promise<ResolvedEntity> => {
  return resolver(slug);
};
