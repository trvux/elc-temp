export function toSitemapLastmod(updatedAt: string | undefined | null): string {
  const date = updatedAt ? new Date(updatedAt) : null;
  return date && !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
}
