import { Contact } from "./types";

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
