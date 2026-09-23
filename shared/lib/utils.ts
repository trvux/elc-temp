import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
