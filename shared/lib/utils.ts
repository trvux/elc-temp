import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Vai trò chữ trong app/globals.css (`@utility type-*`). Mỗi `type-*` đã mang
// cỡ + weight + line-height + tracking, nên nó xung đột hai chiều với
// text-<size>, font-<weight>, leading-*, tracking-*: cái đứng sau thắng.
// Khi thêm `@utility type-*` mới phải thêm tên vào đây (test sẽ bắt thiếu).
export const TYPE_ROLES = [
  "display", "headline", "title", "heading", "subhead",
  "body", "body-strong", "body-sm", "callout",
  "caption", "label", "tag", "legal",
  "price", "price-lg", "mono",
] as const

const twMerge = extendTailwindMerge<"type">({
  extend: {
    classGroups: {
      type: [{ type: [...TYPE_ROLES] }],
    },
    conflictingClassGroups: {
      type: ["font-size", "font-weight", "leading", "tracking"],
      "font-size": ["type"],
      "font-weight": ["type"],
      leading: ["type"],
      tracking: ["type"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(url: string) {
  return /^https?:\/\/\S+$/.test(url)
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) {
    return str
  }
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString()
    }
  } catch {
    return null
  }
  return null
}

// `duplicateContent` (an editor-only helper needing @tiptap/core's Editor
// type) intentionally does NOT live here — this file's `cn` is imported by
// nearly every component in the app, including every public page, so
// pulling @tiptap/core into it would ship tiptap's editing machinery to
// every public bundle. It lives in the admin-only rich-text-editor tree
// instead (tiptap-image-node-view.tsx).
