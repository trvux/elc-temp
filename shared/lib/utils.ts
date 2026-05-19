import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function roundPrice(price: number | null | undefined): number {
  if (!price || price <= 0) return 0;
  return Math.round(price / 1000) * 1000;
}

export function formatPrice(price: number | null | undefined): string {
  if (!price || price <= 0) {
    return "Liên hệ";
  }

  const rounded = roundPrice(price);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(rounded);
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

export function extractTitleFromHtml(content: unknown): string {
  if (!content) return "";

  // Handle Tiptap JSON Object
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    const nodes = (obj.content as unknown[]) || [];
    
    // Tìm node đầu tiên là heading level 1 (mặc định level 1 khi thiếu level hoặc attrs)
    const h1Node = nodes.find((node) => {
      if (typeof node !== "object" || node === null) return false;
      const n = node as Record<string, unknown>;
      const attrs = n.attrs as Record<string, unknown> | undefined;
      const level = attrs && attrs.level !== undefined ? Number(attrs.level) : 1;
      return n.type === "heading" && level === 1;
    }) as Record<string, unknown> | undefined;

    if (h1Node && Array.isArray(h1Node.content)) {
      return h1Node.content
        .map((n) => {
          if (typeof n === "object" && n !== null && "text" in n) {
            return String((n as Record<string, unknown>).text);
          }
          return "";
        })
        .join("")
        .trim();
    }

    // Fallback: Lấy đoạn văn bản đầu tiên có nội dung
    const firstTextNode = nodes.find((node) => {
      if (typeof node !== "object" || node === null) return false;
      const n = node as Record<string, unknown>;
      return Array.isArray(n.content) && n.content.length > 0;
    }) as Record<string, unknown> | undefined;

    if (firstTextNode && Array.isArray(firstTextNode.content)) {
      return firstTextNode.content
        .map((n) => {
          if (typeof n === "object" && n !== null && "text" in n) {
            return String((n as Record<string, unknown>).text);
          }
          return "";
        })
        .join("")
        .trim();
    }
    return "";
  }

  // Handle Legacy HTML String
  if (typeof content !== "string") return "";
  if (typeof window === "undefined") return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");

  const h1 = doc.querySelector("h1");
  if (h1 && h1.textContent?.trim()) {
    return h1.textContent.trim();
  }

  const text = doc.body.textContent || "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines[0] || "";
}
