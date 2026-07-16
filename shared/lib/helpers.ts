export function capitalize(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng -
    .replace(/-+/g, "-") // Gộp nhiều dấu - liên tiếp
    .replace(/^-+|-+$/g, ""); // Cắt dấu - ở đầu và cuối
}

export function sortByOrderIndex<T>(items: T[]): T[] {
    return [...items].sort((a: unknown, b: unknown) => {
      const recA = a as Record<string, unknown>;
      const recB = b as Record<string, unknown>;
      const orderA = recA.orderIndex ?? recA.order_index;
      const orderB = recB.orderIndex ?? recB.order_index;
      
      if (typeof orderA === 'number' && typeof orderB === 'number') {
        return orderA - orderB;
      }
  
      const textA = (recA.title || recA.name || "") as string;
      const textB = (recB.title || recB.name || "") as string;
      const matchA = typeof textA === 'string' ? textA.match(/^(\d+)/) : null;
      const matchB = typeof textB === 'string' ? textB.match(/^(\d+)/) : null;
      
      if (matchA && matchB) {
        return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
      }
      if (matchA) return -1;
      if (matchB) return 1;
      
      return 0;
    });
  }
  
