import {
  groupCategoriesByGroup,
  type CategoryRef,
  type GroupCategoryRef,
} from "@/shared/lib/group-categories";

interface NavLinkItem {
  label: string;
  href: string;
}

interface NavColumn {
  heading: string;
  /** First column of a panel is rendered large (apple.com style). */
  big?: boolean;
  links: NavLinkItem[];
}

export interface NavGroup {
  label: string;
  href: string;
  /** No columns -> plain link, no flyout. */
  columns?: NavColumn[];
}

export interface BrandNavRef {
  id: string;
  name: string;
  slug: string;
  isFeatured?: boolean;
  orderIndex?: number;
}

export interface NamedSlugRef {
  id: string;
  name: string;
  slug: string;
}

export interface ServiceNavRef {
  id: string;
  name: string;
  href: string;
}

interface BuildNavInput {
  groupCategories: GroupCategoryRef[];
  categoriesList: CategoryRef[];
  brands: BrandNavRef[];
  /** Unused while the Dịch vụ menu entry is hidden; kept so callers still compile. */
  services?: ServiceNavRef[];
  projectTypes: NamedSlugRef[];
}

const FEATURED_BRANDS_CAP = 8;

// Product groups all have orderIndex 0 in the DB, so the order is decided
// here: main business first. Unknown/new groups keep DB order after these.
const GROUP_ORDER = ["may-lanh", "cap-khi-tuoi-thu-hoi-nhiet", "may-loc-nuoc", "nha-thong-minh"];

// Project types have no parent in the DB, so the grouping is by slug here.
// A type not listed falls into "Khác" instead of disappearing.
const PROJECT_GROUPS: { heading: string; slugs: string[] }[] = [
  { heading: "Nhà ở", slugs: ["biet-thu", "nha-pho", "chung-cu", "can-ho-dich-vu"] },
  {
    heading: "Thương mại",
    slugs: ["van-phong", "nha-hang-trung-tam-tiec-cuoi", "co-so-kinh-doanh", "showroom", "vui-choi-giai-tri"],
  },
  { heading: "Công cộng", slugs: ["y-te", "co-so-giao-duc", "tru-so-co-quan"] },
  { heading: "Công nghiệp", slugs: ["cong-trinh-cong-nghiep"] },
];

// Same shape as apple.com's flyouts: one big column of same-level short
// names ("what we sell"), then small columns that narrow it down.
export function buildNavGroups({
  groupCategories,
  categoriesList,
  brands,
  projectTypes,
}: BuildNavInput): NavGroup[] {
  const rank = (slug: string) => {
    const i = GROUP_ORDER.indexOf(slug);
    return i === -1 ? GROUP_ORDER.length : i;
  };
  const orderedGroups = groupCategoriesByGroup(groupCategories, categoriesList)
    .slice()
    .sort((a, b) => rank(a.group.slug) - rank(b.group.slug));

  const productColumns: NavColumn[] = [];
  if (orderedGroups.length > 0) {
    productColumns.push({
      heading: "Khám phá",
      big: true,
      links: [
        { label: "Tất cả sản phẩm", href: "/san-pham" },
        ...orderedGroups.map(({ group }) => ({ label: group.name, href: `/san-pham/${group.slug}` })),
      ],
    });
    const main = orderedGroups[0];
    if (main.categories.length > 0) {
      productColumns.push({
        heading: main.group.name,
        links: main.categories.map((c) => ({ label: c.name, href: `/san-pham/${c.slug}` })),
      });
    }
  }

  const featured = brands.filter((b) => b.isFeatured);
  const brandList = (featured.length > 0 ? featured : brands)
    .slice()
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .slice(0, FEATURED_BRANDS_CAP);
  if (brandList.length > 0) {
    productColumns.push({
      heading: "Thương hiệu",
      links: brandList.map((b) => ({ label: b.name, href: `/san-pham/${b.slug}` })),
    });
  }

  const typeBySlug = new Map(projectTypes.map((t) => [t.slug, t]));
  const grouped = new Set(PROJECT_GROUPS.flatMap((g) => g.slugs));
  const toLink = (t: NamedSlugRef) => ({ label: t.name, href: `/du-an/${t.slug}` });
  const projectColumns: NavColumn[] = [];
  for (const g of PROJECT_GROUPS) {
    const links = g.slugs.flatMap((slug) => {
      const t = typeBySlug.get(slug);
      return t ? [toLink(t)] : [];
    });
    if (links.length > 0) projectColumns.push({ heading: g.heading, links });
  }
  const others = projectTypes.filter((t) => !grouped.has(t.slug)).map(toLink);
  if (others.length > 0) projectColumns.push({ heading: "Khác", links: others });
  // First group is the big column; the hub link closes the row like
  // "Compare Mac" does on apple.com.
  if (projectColumns.length > 0) projectColumns[0].big = true;
  projectColumns.push({ heading: "Xem thêm", links: [{ label: "Tất cả dự án", href: "/du-an" }] });

  return [
    {
      label: "Sản phẩm",
      href: "/san-pham",
      columns: productColumns.length > 0 ? productColumns : undefined,
    },
    {
      label: "Dự án",
      href: "/du-an",
      columns: projectTypes.length > 0 ? projectColumns : undefined,
    },
    { label: "Tin tức", href: "/tin-tuc" },
    { label: "Giới thiệu", href: "/thong-tin" },
  ];
}
