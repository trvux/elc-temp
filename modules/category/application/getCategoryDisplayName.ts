export function getCategoryDisplayName(category: { name: string; parentId?: string | null }) {
  // We no longer use hardcoded IDs to avoid hydration issues and DB dependency.
  // The prefix logic should be handled by the data itself or a more robust check.
  return category.name;
}
