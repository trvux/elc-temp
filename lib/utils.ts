import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatPrice(price: number | null | undefined): string {
  if (!price || price <= 0) {
    return "Liên hệ";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractTitleFromHtml(content: any): string {
  if (!content) return "";

  // Handle Tiptap JSON Object
  if (typeof content === "object") {
    const nodes = content.content || [];
    // Tìm node đầu tiên là heading level 1
    const h1Node = nodes.find(
      (node: any) => node.type === "heading" && node.attrs?.level === 1,
    );
    if (h1Node && h1Node.content) {
      return h1Node.content.map((n: any) => n.text).join("").trim();
    }
    // Fallback: Lấy đoạn văn bản đầu tiên có nội dung
    const firstTextNode = nodes.find((node: any) => node.content && node.content.length > 0);
    if (firstTextNode) {
      return firstTextNode.content.map((n: any) => n.text).join("").trim();
    }
    return "";
  }

  // Handle Legacy HTML String
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
