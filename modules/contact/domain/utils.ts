import { Contact } from "./types";

export const getContactHref = (type: string, value: string) => {
  if (!value) return "";
  const cleanValue = value.replace(/\s/g, "");
  if (value.startsWith("http")) return value;

  switch (type) {
    case "phone":
      return `tel:${cleanValue}`;
    case "email":
      return `mailto:${value}`;
    case "zalo":
      return `https://zalo.me/${cleanValue}`;
    case "messenger":
      return `https://m.me/${value}`;
    case "facebook":
      return `https://facebook.com/${value}`;
    default:
      return value;
  }
};

interface ContactDatabaseRow {
  id: string;
  type: string;
  label: string | null;
  value: string;
  is_active: boolean | null;
  order_index: number | null;
}

export const mapContactRowToDomain = (row: ContactDatabaseRow): Contact => {
  const href = getContactHref(row.type, row.value);
  const isExternal = !href.startsWith("tel:") && !href.startsWith("mailto:");
  
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    value: row.value,
    isActive: row.is_active ?? true,
    orderIndex: row.order_index || 0,
    href,
    isExternal,
  };
};

const DEFAULT_ORDER = ["phone", "zalo", "messenger", "facebook", "email"];

export const getDisplayContacts = (
  contacts: Contact[],
  options?: { include?: string[]; exclude?: string[] }
) => {
  let result = contacts.filter((c) => c.isActive);

  if (options?.include && options.include.length > 0) {
    result = result.filter((c) => options.include!.includes(c.type));
    // Sắp xếp theo thứ tự trong mảng include
    return [...result].sort((a, b) => {
      return options.include!.indexOf(a.type) - options.include!.indexOf(b.type);
    });
  }

  if (options?.exclude && options.exclude.length > 0) {
    result = result.filter((c) => !options.exclude!.includes(c.type));
  }

  // Sắp xếp theo DEFAULT_ORDER, nếu không có trong list thì dùng orderIndex
  return [...result].sort((a, b) => {
    const indexA = DEFAULT_ORDER.indexOf(a.type);
    const indexB = DEFAULT_ORDER.indexOf(b.type);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.orderIndex - b.orderIndex;
  });
};
