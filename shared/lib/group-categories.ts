// Shared "group -> its categories" shaping, used by both the footer's
// per-group product columns and the header's mega-menu — same input shape
// (groupCategories + categoriesList, already filtered !isHidden by
// getPublicLayoutData), same output shape, so both call sites stay in sync
// instead of each hand-rolling their own .map/.filter.

export interface GroupCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
  groupId?: string | null;
}

export interface GroupWithCategories<
  G extends GroupCategoryRef = GroupCategoryRef,
  C extends CategoryRef = CategoryRef,
> {
  group: G;
  categories: C[];
}

export function groupCategoriesByGroup<
  G extends GroupCategoryRef,
  C extends CategoryRef,
>(groupCategories: G[], categoriesList: C[]): GroupWithCategories<G, C>[] {
  return groupCategories.map((group) => ({
    group,
    categories: categoriesList.filter((cat) => cat.groupId === group.id),
  }));
}
